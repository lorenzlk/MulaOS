const { executeQuery } = require('../queries/utils/query-runner');
const { uploadJsonToS3 } = require('../helpers/S3Helpers');
const { sendSlackMessage } = require('../helpers/SlackHelpers');
const { crawlDOM } = require('../helpers/Crawler');
const { createLogger } = require('../helpers/LoggingHelpers');
const { upsertNextPageTargeting, generateSectionName, calculatePriority } = require('../helpers/NextPageTargetingHelpers');

const logger = createLogger('NextPageBuildWorker');

/**
 * Worker for building next-page recommendations
 * Processes next-page build jobs by querying Athena and crawling URLs
 */
class NextPageBuildWorker {
  constructor() {
    // No need for browser management - using Crawler.js methods
  }

  async init() {
    // No initialization needed - using Crawler.js methods
  }

  async cleanup() {
    // No cleanup needed - using Crawler.js methods
  }

  /**
   * Crawls a URL to extract Open Graph metadata using Crawler.js crawlDOM method
   * @param {string} url - URL to crawl
   * @returns {Object} - Extracted metadata {imageUrl, title, url, publishedTime}
   */
  async crawlUrl(url) {
    try {
      // Use the new crawlDOM method from Crawler.js
      const dom = await crawlDOM(url);
      
      // Extract Open Graph metadata from the DOM
      const getMetaContent = (property) => {
        const meta = dom.window.document.querySelector(`meta[property="${property}"]`) || 
                   dom.window.document.querySelector(`meta[name="${property}"]`);
        return meta ? meta.getAttribute('content') : null;
      };

      const metadata = {
        imageUrl: getMetaContent('og:image') || getMetaContent('twitter:image'),
        title: getMetaContent('og:title') || getMetaContent('twitter:title') || dom.window.document.title,
        url: url,
        publishedTime: getMetaContent('article:published_time')
      };
      
      // Validate extracted data
      if (!metadata.title) {
        throw new Error('Missing required title');
      }

      return metadata;
    } catch (error) {
      logger.error('Error crawling URL', error, { url });
      return null;
    }
  }


  /**
   * Processes a next-page build job
   * @param {Object} job - Job data
   */
  async processJob(job) {
    const { 
      domain, 
      targetingType, 
      targetingValue, 
      sectionName, 
      lookbackDays, 
      limit, 
      channelId, 
      channelName, 
      dryRun = false 
    } = job.data;
    
    try {
      logger.info('Processing next-page build', { domain, targetingType, targetingValue, sectionName, lookbackDays, limit });
      
      // Generate section name if not provided
      const section = sectionName || generateSectionName(targetingValue);
      logger.info('Using section name', { section, provided: !!sectionName });
      
      // Create or update NextPageTargeting database record
      // This is the source of truth - manifest builder will read from here
      const targetingRecord = await upsertNextPageTargeting(
        domain,
        targetingType,
        targetingValue,
        section,
        lookbackDays,
        limit,
        channelId,
        channelName
      );
      logger.info('Created/updated targeting record', { targetingId: targetingRecord.id, section });

      // Execute Athena query to get popular articles
      const queryResult = await executeQuery('next-page-recommendations', {
        parameters: {
          domain,
          days_back: lookbackDays,
          category_or_path: targetingValue,
          limit
        }
      });

      if (!queryResult.success) {
        throw new Error(`Query execution failed: ${queryResult.error}`);
      }

      // Read the CSV results
      const fs = require('fs').promises;
      const path = require('path');
      
      const timestamp = queryResult.outputLocation.split('/').slice(-2, -1)[0];
      const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', 'next-page-recommendations', timestamp, `${queryResult.queryExecutionId}.csv`);
      
      const csvContent = await fs.readFile(localFilePath, 'utf8');
      const pathnames = this.parseCSV(csvContent);

      if (pathnames.length === 0) {
        await sendSlackMessage(channelId, `❌ No popular articles found for ${domain} with criteria: ${targetingValue}`);
        return;
      }

      logger.info('Found popular articles, crawling for metadata', { count: pathnames.length });

      // Crawl URLs to extract metadata in parallel with concurrency limit
      const CONCURRENCY_LIMIT = 3; // Number of parallel crawls
      const nextPageItems = [];
      
      // Process URLs in batches to limit concurrency
      for (let i = 0; i < pathnames.length; i += CONCURRENCY_LIMIT) {
        const batch = pathnames.slice(i, i + CONCURRENCY_LIMIT);
        
        const batchPromises = batch.map(async (pathData) => {
          try {
            const fullUrl = `https://${domain}${pathData.pathname}`;
            const metadata = await this.crawlUrl(fullUrl);
            
            if (metadata && metadata.title) {
              return {
                imageUrl: metadata.imageUrl || null,
                title: metadata.title,
                url: fullUrl,
                publishedTime: metadata.publishedTime || null,
                viewCount: pathData.view_count || 0
              };
            }
            return null;
          } catch (error) {
            logger.error('Error crawling URL', error, { url: `https://${domain}${pathData.pathname}` });
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validItems = batchResults.filter(item => item !== null);
        nextPageItems.push(...validItems);
        
        logger.info('Completed batch of crawls', { 
          batchNumber: Math.floor(i / CONCURRENCY_LIMIT) + 1,
          totalBatches: Math.ceil(pathnames.length / CONCURRENCY_LIMIT),
          batchSize: batch.length,
          validItems: validItems.length,
          totalItemsSoFar: nextPageItems.length
        });
      }

      if (nextPageItems.length === 0) {
        await sendSlackMessage(channelId, `❌ No valid articles found after crawling for ${domain}`);
        return;
      }

      // Sort articles by date (most recent first) and then by popularity within each date group
      const sortedArticles = this.sortArticlesByDateAndPopularity(nextPageItems);
      
      logger.info('Sorted articles by date and popularity', {
        totalArticles: sortedArticles.length,
        articlesWithDate: sortedArticles.filter(a => a.publishedTime).length
      });

      // Create section-specific manifest
      const sectionManifest = {
        section: section,
        articles: sortedArticles,
        updatedAt: new Date().toISOString(),
        lookbackDays: lookbackDays,
        limit: limit
      };
      
      // Upload section manifest to {domain}/next-page/{section}/manifest.json
      const sectionManifestPath = `https://prod.makemula.ai/${domain}/next-page/${section}/manifest.json`;
      
      logger.info('Created section manifest', {
        domain,
        section,
        articleCount: nextPageItems.length,
        manifestPath: sectionManifestPath
      });
      
      // Upload section manifest (unless in dry-run mode)
      if (dryRun) {
        logger.info('DRY RUN: Would upload section manifest', { 
          sectionManifestPath, 
          manifestSize: JSON.stringify(sectionManifest).length,
          articleCount: nextPageItems.length
        });
        console.log(`🔍 [DRY RUN] Would upload section manifest to: ${sectionManifestPath}`);
        console.log(`🔍 [DRY RUN] Section: ${section}`);
        console.log(`🔍 [DRY RUN] Articles: ${nextPageItems.length}`);
        console.log(`🔍 [DRY RUN] Full manifest JSON:`);
        console.log(JSON.stringify(sectionManifest, null, 2));
        console.log(`🔍 [DRY RUN] End of manifest JSON\n`);
        console.log(`🔍 [DRY RUN] NOTE: Main manifest will be updated by manifest builder when it runs`);
      } else {
        try {
          await uploadJsonToS3(sectionManifestPath, sectionManifest);
          logger.info('Section manifest uploaded successfully', { sectionManifestPath });
        } catch (error) {
          throw new Error(`Failed to upload section manifest: ${error.message}`);
        }
      }

      // Send success message to Slack (skip in dry-run mode)
      if (!dryRun) {
        const message = `✅ Next-page section manifest built for ${domain}!\n\n` +
          `📊 Found ${nextPageItems.length} articles for section "${section}"\n` +
          `🎯 Targeting: ${targetingType} = "${targetingValue}"\n` +
          `🔗 Section manifest: ${sectionManifestPath}\n` +
          `💾 Database record: ID ${targetingRecord.id}\n\n` +
          `**Note**: Main manifest will be updated when manifest builder runs.\n\n` +
          `**Articles for "${section}":**\n` +
          nextPageItems.slice(0, 10).map((item, index) => 
            `${index + 1}. [${item.title}](${item.url})`
          ).join('\n') +
          (nextPageItems.length > 10 ? `\n... and ${nextPageItems.length - 10} more` : '');

        await sendSlackMessage(channelId, message);
      } else {
        console.log(`🔍 [DRY RUN] Would send Slack message to ${channelName} (${channelId})`);
      }

    } catch (error) {
      logger.error('Error processing next-page build job', error, { domain, targetingType, targetingValue, sectionName });
      await sendSlackMessage(channelId, `❌ Error building next-page recommendations: ${error.message}`);
    }
  }


  /**
   * Sorts articles by date (most recent first) and then by popularity within each date group
   * Groups articles by published date (date only, not time)
   * @param {Array} articles - Array of article objects with {publishedTime, viewCount, ...}
   * @returns {Array} - Sorted array of articles
   */
  sortArticlesByDateAndPopularity(articles) {
    // Helper to extract date string (YYYY-MM-DD) from publishedTime
    const getDateString = (publishedTime) => {
      if (!publishedTime) return null;
      try {
        const date = new Date(publishedTime);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
      } catch (error) {
        return null;
      }
    };

    // Group articles by date
    const articlesByDate = new Map();
    
    articles.forEach(article => {
      const dateString = getDateString(article.publishedTime);
      const key = dateString || 'no-date'; // Group articles without dates together
      
      if (!articlesByDate.has(key)) {
        articlesByDate.set(key, []);
      }
      articlesByDate.get(key).push(article);
    });

    // Sort each date group by popularity (viewCount descending)
    articlesByDate.forEach((groupArticles, dateKey) => {
      groupArticles.sort((a, b) => {
        const viewCountA = a.viewCount || 0;
        const viewCountB = b.viewCount || 0;
        return viewCountB - viewCountA; // Descending order (most popular first)
      });
    });

    // Get all date keys and sort them (most recent first)
    // Articles without dates go to the end
    const dateKeys = Array.from(articlesByDate.keys()).sort((a, b) => {
      if (a === 'no-date') return 1; // No-date articles go to end
      if (b === 'no-date') return -1;
      return b.localeCompare(a); // Descending date order (most recent first)
    });

    // Flatten sorted groups into final array
    const sortedArticles = [];
    dateKeys.forEach(dateKey => {
      sortedArticles.push(...articlesByDate.get(dateKey));
    });

    return sortedArticles;
  }

  /**
   * Parses CSV content and returns array of pathname objects
   * @param {string} csvContent - CSV content
   * @returns {Array} - Array of {pathname, view_count} objects
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const pathnames = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const [pathname, viewCount] = lines[i].split(',');
      if (pathname && pathname.trim()) {
        pathnames.push({
          pathname: pathname.trim().replace(/"/g, ''), // Remove quotes
          view_count: parseInt(viewCount) || 0
        });
      }
    }
    
    return pathnames;
  }
}

module.exports = NextPageBuildWorker;
