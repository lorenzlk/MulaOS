//get the page readabilityjs
//ask the AI to give you search terms
//run serp search
//run AI description generation
//save results to s3
require('dotenv').config();

const { createLogger } = require('../helpers/LoggingHelpers');

const logger = createLogger('encore');

const { getPageURLs } = require('../helpers/URLHelpers');
const { processArticle, isArticleProcessed } = require('../helpers/ArticleHelpers');

/**
 * Creates an encore for a given page
 * @param {Object} page - The page model reference
 * @param {boolean} forceRefresh - Whether to force refresh the encore
 * @param {string} credentialId - The credential ID to use for search orchestration
 */
const createEncore = async (page, forceRefresh = false, credentialId = null) => {
  logger.info('Creating encore', { pageId: page.id, forceRefresh });

  try {
    // Get all the URLs we'll need
    const urls = await getPageURLs(page);

    // Check if article is already processed
    if (!forceRefresh && await isArticleProcessed(page.url, urls)) {
      console.log('Article already processed, skipping...');
      return;
    }

    // Process the article
    const results = await processArticle(page.url, urls, {
      credentialId
    });

    return results;
  } catch (error) {
    logger.error('Error creating encore', error, { pageId: page.id });
    throw error;
  }
};

module.exports = {
  createEncore
};