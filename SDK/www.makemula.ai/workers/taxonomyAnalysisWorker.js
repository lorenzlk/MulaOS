const { executeQuery } = require('../queries/utils/query-runner');
const { sendSlackMessage } = require('../helpers/SlackHelpers');
const { createLogger } = require('../helpers/LoggingHelpers');
const fs = require('fs').promises;
const path = require('path');

const logger = createLogger('TaxonomyAnalysisWorker');

/**
 * Parse CSV results from downloaded file
 * @param {string} csvPath - Path to the CSV file
 * @returns {Array} Parsed results array
 */
async function parseCSVResults(csvPath) {
  try {
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      results.push(row);
    }
    
    return results;
  } catch (error) {
    logger.error('Error parsing CSV results', error);
    return [];
  }
}

/**
 * Find and parse the latest taxonomy results CSV
 * @returns {Array} Parsed results array
 */
async function getLatestTaxonomyResults() {
  try {
    // Find the latest taxonomy results directory
    const resultsDir = path.join(__dirname, '..', 'data', 'athena-results', 'site-taxonomy-analysis');
    const latestDir = (await fs.readdir(resultsDir))
      .filter(dir => dir.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/))
      .sort()
      .pop();
    
    if (!latestDir) {
      throw new Error('No taxonomy results directory found');
    }
    
    // Find the CSV file in the directory
    const dirPath = path.join(resultsDir, latestDir);
    const files = await fs.readdir(dirPath);
    const csvFile = files.find(file => file.endsWith('.csv'));
    
    if (!csvFile) {
      throw new Error('No CSV file found in results directory');
    }
    
    const csvPath = path.join(dirPath, csvFile);
    logger.info('Parsing CSV results from', { csvPath });
    
    // Parse the CSV results
    return await parseCSVResults(csvPath);
  } catch (error) {
    logger.error('Error getting latest taxonomy results', error);
    throw error;
  }
}

/**
 * Format taxonomy results for Slack display
 * @param {Array} results - Raw query results from Athena
 * @param {string} domain - Target domain
 * @param {number} lookbackDays - Number of days analyzed
 * @returns {string} Formatted Slack message
 */
function formatTaxonomyResults(results, domain, lookbackDays) {
  if (!results || results.length === 0) {
    return `🏛️ *Site Taxonomy Analysis for ${domain} (${lookbackDays} days)*\n\n❌ No taxonomy data found for this domain in the specified time period.`;
  }

  // Separate URL paths, article sections, and article keywords
  const urlPaths = results.filter(r => r.taxonomy_type === 'url_path');
  const articleSections = results.filter(r => r.taxonomy_type === 'article_section');
  const articleKeywords = results.filter(r => r.taxonomy_type === 'article_keywords');

  let message = `🏛️ *Site Taxonomy Analysis for ${domain} (${lookbackDays} days)*\n\n`;

  // URL Path Structure
  if (urlPaths.length > 0) {
    message += `📁 *URL Path Structure:*\n`;
    
    // Group by hierarchy level for better organization
    // Convert to numbers in case they're strings from CSV
    const level1Paths = urlPaths.filter(p => parseInt(p.hierarchy_level) === 1);
    const level2Paths = urlPaths.filter(p => parseInt(p.hierarchy_level) === 2);
    const level3Paths = urlPaths.filter(p => parseInt(p.hierarchy_level) === 3);

    // Debug logging
    logger.info('URL path hierarchy levels', { 
      level1Count: level1Paths.length, 
      level2Count: level2Paths.length, 
      level3Count: level3Paths.length,
      totalUrlPaths: urlPaths.length
    });

    // If we have level 1 paths, use hierarchical display
    if (level1Paths.length > 0) {
      // Display level 1 paths
      level1Paths.slice(0, 10).forEach(path => {
        message += `• ${path.taxonomy_value} (${path.formatted_views} sessions)\n`;
        
        // Find and display related level 2 paths
        const relatedLevel2 = level2Paths.filter(p => 
          p.taxonomy_value.startsWith(path.taxonomy_value.replace('/', '').split('/')[0])
        );
        
        relatedLevel2.slice(0, 3).forEach(subPath => {
          message += `  └── ${subPath.taxonomy_value} (${subPath.formatted_views} sessions)\n`;
          
          // Find and display related level 3 paths
          const relatedLevel3 = level3Paths.filter(p => 
            p.taxonomy_value.startsWith(subPath.taxonomy_value.replace('/', '').split('/')[0])
          );
          
          relatedLevel3.slice(0, 2).forEach(detailPath => {
            message += `    └── ${detailPath.taxonomy_value} (${detailPath.formatted_views} sessions)\n`;
          });
        });
      });
    } else {
      // If no level 1 paths, display all paths in a flat list
      const allPaths = [...level2Paths, ...level3Paths].sort((a, b) => parseInt(b.total_views) - parseInt(a.total_views));
      
      // Fallback: if no paths found by hierarchy, display all URL paths
      if (allPaths.length === 0) {
        logger.warn('No paths found by hierarchy, displaying all URL paths', { urlPathsCount: urlPaths.length });
        urlPaths.slice(0, 20).forEach(path => {
          message += `• ${path.taxonomy_value} (${path.formatted_views} sessions)\n`;
        });
      } else {
        allPaths.slice(0, 20).forEach(path => {
          const indent = parseInt(path.hierarchy_level) === 3 ? '  ' : '';
          message += `${indent}• ${path.taxonomy_value} (${path.formatted_views} sessions)\n`;
        });
      }
    }
    
    message += '\n';
  }

  // Article Sections
  if (articleSections.length > 0) {
    message += `🏷️ *Content Categories (JSON-LD):*\n`;
    articleSections.forEach(section => {
      message += `• ${section.taxonomy_value} (${section.formatted_views} sessions)\n`;
    });
    message += '\n';
  }

  // Article Keywords
  if (articleKeywords.length > 0) {
    message += `🔖 *Popular Keywords:*\n`;
    articleKeywords.slice(0, 20).forEach(keyword => {
      message += `• ${keyword.taxonomy_value} (${keyword.formatted_views} sessions)\n`;
    });
    message += '\n';
  }

  // Targeting Opportunities
  const highReachPaths = urlPaths.filter(p => p.reach_category === 'High Reach').slice(0, 5);
  const highReachSections = articleSections.filter(s => s.reach_category === 'High Reach').slice(0, 3);
  const highReachKeywords = articleKeywords.filter(k => k.reach_category === 'High Reach').slice(0, 3);

  if (highReachPaths.length > 0 || highReachSections.length > 0 || highReachKeywords.length > 0) {
    message += `🎯 *Top Product Targeting Opportunities:*\n`;
    
    highReachPaths.forEach(path => {
      message += `• ${path.taxonomy_value} - High reach (${path.formatted_views} sessions)\n`;
    });
    
    highReachSections.forEach(section => {
      message += `• ${section.taxonomy_value} - High reach content category (${section.formatted_views} sessions)\n`;
    });
    
    highReachKeywords.forEach(keyword => {
      message += `• ${keyword.taxonomy_value} - High reach keyword (${keyword.formatted_views} sessions)\n`;
    });
  }

  // Add summary statistics
  const totalUrlPaths = urlPaths.length;
  const totalArticleSections = articleSections.length;
  const totalArticleKeywords = articleKeywords.length;
  const totalViews = results.reduce((sum, r) => sum + parseInt(r.total_views || 0), 0);

  let summaryText = `\n📊 *Summary:* ${totalUrlPaths} URL paths`;
  
  if (totalArticleSections > 0) {
    summaryText += `, ${totalArticleSections} content categories`;
  } else {
    summaryText += `, 0 content categories`;
  }
  
  if (totalArticleKeywords > 0) {
    summaryText += `, ${totalArticleKeywords} popular keywords`;
  } else {
    summaryText += `, 0 keywords`;
  }
  
  summaryText += `, ${totalViews.toLocaleString()} total sessions`;
  
  message += summaryText;

  return message;
}

/**
 * Process taxonomy analysis job
 * @param {Object} job - Bull job object
 * @returns {Promise<void>}
 */
async function processTaxonomyAnalysis(job) {
  const { domain, lookback_days, channelId } = job.data;
  
  logger.info('Starting taxonomy analysis', { domain, lookback_days, channelId });

  try {
    // Execute Athena query
    const queryMetadata = await executeQuery('site-taxonomy-analysis', {
      parameters: {
        domain: domain,
        days_back: lookback_days || 7
      }
    });

    logger.info('Taxonomy analysis query completed', { 
      domain, 
      lookback_days, 
      executionId: queryMetadata.executionId 
    });

    // Wait a moment for the file to be fully written
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Parse the downloaded CSV results
    const results = await getLatestTaxonomyResults();
    
    if (!results || results.length === 0) {
      throw new Error('No results found in downloaded CSV file');
    }

    logger.info('CSV results parsed successfully', { 
      domain, 
      lookback_days, 
      resultsCount: results.length 
    });

    // Format results for Slack
    const formattedResults = formatTaxonomyResults(results, domain, lookback_days);

    // Send results to Slack channel
    await sendSlackMessage(channelId, formattedResults, null, true);

    logger.info('Taxonomy analysis results sent to Slack', { 
      domain, 
      lookback_days, 
      channelId,
      messageLength: formattedResults.length
    });

  } catch (error) {
    logger.error('Error processing taxonomy analysis', error, { 
      domain, 
      lookback_days, 
      channelId 
    });

    // Send error message to Slack
    const errorMessage = `❌ *Taxonomy Analysis Failed*\n\nDomain: ${domain}\nLookback: ${lookback_days} days\nError: ${error.message}\n\nPlease try again or contact the development team.`;
    
    try {
      await sendSlackMessage(channelId, errorMessage);
    } catch (slackError) {
      logger.error('Failed to send error message to Slack', slackError);
    }
  }
}

module.exports = {
  processTaxonomyAnalysis
};