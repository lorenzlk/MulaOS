const { uploadJsonToS3 } = require('./S3Helpers');
const { getPageURLs } = require('./URLHelpers');
const { processAndSaveReadability } = require('./ReadabilityHelpers');
const { createLogger } = require('./LoggingHelpers');
const { withRetry } = require('./ProductHelpers');
const { sendSlackMessage } = require('./SlackHelpers');
const { Page } = require('../models');
const Bull = require('bull');

// Create search queue
const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const searchQueue = new Bull('searchQueue', redisUrl);

const logger = createLogger('ArticleHelpers');

/**
 * Processes an article and generates all necessary data
 * @param {string} url - The URL of the article to process
 * @param {Object} urls - Object containing all the URLs for saving results
 * @param {Object} options - Additional options for processing
 * @param {string} options.credentialId - The credential ID to use for search orchestration
 */
const processArticle = async (url, urls, options = {}) => {
  const correlationId = logger.getCorrelationId();
  logger.info('Starting article processing', { url, correlationId });

  try {
    // Fetch the article HTML
    const response = await withRetry(
      () => fetch(url),
      'fetch-article',
      3
    );
    const html = await response.text();

    // Process readability and save to S3
    const readabilityResults = await processAndSaveReadability(html, url, urls.readabilityUrl);
    logger.info('Readability processing complete', { 
      url,
      correlationId,
      textLength: readabilityResults.textContent.length 
    });

    // Find page record
    let page = await Page.findOne({ where: { url: url.toString() } });
    if (!page) {
      throw new Error(`Page not found for url: ${url.toString()}`);
    }

    // Queue search worker to use new orchestrator
    await searchQueue.add('search', { pageId: page.id, credentialId: options.credentialId });

    logger.info('Article processing complete - queued for search orchestration', { 
      url, 
      pageId: page.id,
      correlationId
    });

    return {
      readabilityResults,
      pageId: page.id
    };
  } catch (error) {
    logger.error('Error processing article', error, { 
      url,
      correlationId 
    });
    throw error;
  }
};

/**
 * Checks if an article has already been processed
 * @param {string} url - The URL of the article to check
 * @param {Object} urls - Object containing all the URLs for checking
 */
const isArticleProcessed = async (url, urls) => {
  logger.info('Checking if article is processed', { url, urls });
  
  try {
    // Check if page exists and has been processed
    const page = await Page.findOne({ where: { url: url.toString() } });
    
    const isProcessed = page && page.searchStatus === 'completed';
    logger.info('Article processing status', { 
      url,
      isProcessed,
      searchStatus: page?.searchStatus
    });

    return isProcessed;
  } catch (error) {
    logger.error('Error checking article processing status', error, { url });
    return false;
  }
};

module.exports = {
  processArticle,
  isArticleProcessed,
}; 