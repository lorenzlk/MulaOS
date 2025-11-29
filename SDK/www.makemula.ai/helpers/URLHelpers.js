const crypto = require('crypto');
const { createLogger } = require('./LoggingHelpers');

const logger = createLogger('URLHelpers');

const CDN_ROOT = process.env.NODE_ENV === 'development' ? 'http://localhost:3010/data' : 'https://cdn.makemula.ai';

async function createSHA256Hash(input) {
    // Encode the input string as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // Generate the SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert the hash to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
};

/**
 * Get all the URLs needed for processing a search
 * @param {Object} search - The search model reference
 */
async function getSearchURLs(search) {
  logger.info('Getting search URLs', { searchId: search.id });

  try {
    const s3PathRoot = `searches/${search.phraseID}`;
    const urlRoot = `${CDN_ROOT}/${s3PathRoot}`;

    const googleShoppingDescriptionsFileName = 'google_shopping_descriptions.json';
    const googleShoppingDescriptionsUrl = `${urlRoot}/${googleShoppingDescriptionsFileName}`;

    const amazonShoppingDescriptionsFileName = 'amazon_shopping_descriptions.json';
    const amazonShoppingDescriptionsUrl = `${urlRoot}/${amazonShoppingDescriptionsFileName}`;

    const googleShoppingResultsFileName = 'google_shopping.json';
    const googleShoppingResultsUrl = `${urlRoot}/${googleShoppingResultsFileName}`;

    const amazonAssociatesResultsFileName = 'amazon_associates.json';
    const amazonAssociatesResultsUrl = `${urlRoot}/${amazonAssociatesResultsFileName}`;

    const immersiveProductUrl = (productId) => `${CDN_ROOT}/products/${productId}/immersive.json`;

    const mulaRecommendationsFileName = 'results.json';
    const mulaRecommendationsUrl = `${urlRoot}/${mulaRecommendationsFileName}`;

    const tempRecommendationsFileName = 'temp-recommendations.json';
    const tempRecommendationsUrl = `${urlRoot}/${tempRecommendationsFileName}`;

    const urls = {
      s3PathRoot,
      googleShoppingDescriptionsUrl,
      amazonShoppingDescriptionsUrl,
      googleShoppingResultsUrl,
      amazonAssociatesResultsUrl,
      immersiveProductUrl,
      mulaRecommendationsUrl,
      tempRecommendationsUrl,
      cacheKey: `/${s3PathRoot}/*`
    };

    logger.info('Generated search URLs', { 
      searchId: search.id,
      urlCount: Object.keys(urls).length 
    });

    return urls;
  } catch (error) {
    logger.error('Error generating search URLs', error, { searchId: search.id });
    throw error;
  }
}

/**
 * Get all the URLs needed for processing an article
 * @param {Object} page - The page model reference
 */
async function getPageURLs(page) {
  logger.info('Getting page URLs', { pageId: page.id });

  try {
    const urlObj = new URL(page.url);
    const pageId = await createSHA256Hash(urlObj.pathname);
    
    // If the page has a searchId, use it for the S3 path, otherwise use the page path
    const s3PathRoot = page.searchId 
      ? `searches/${page.searchId}`
      : `${urlObj.hostname}/pages/${pageId}`;
      
    const urlRoot = `${CDN_ROOT}/${s3PathRoot}`;

    const readabilityFileName = 'readability.json';
    const readabilityUrl = `${urlRoot}/${readabilityFileName}`;

    const mulaRecommendationsFileName = 'index.json';
    const mulaRecommendationsUrl = `${urlRoot}/${mulaRecommendationsFileName}`;

    const tempRecommendationsFileName = 'temp-recommendations.json';
    const tempRecommendationsUrl = `${urlRoot}/${tempRecommendationsFileName}`;

    const googleShoppingDescriptionsFileName = 'google_shopping_descriptions.json';
    const googleShoppingDescriptionsUrl = `${urlRoot}/${googleShoppingDescriptionsFileName}`;

    const googleShoppingResultsFileName = 'google_shopping.json';
    const googleShoppingResultsUrl = `${urlRoot}/${googleShoppingResultsFileName}`;

    const amazonAssociatesResultsFileName = 'amazon_associates.json';
    const amazonAssociatesResultsUrl = `${urlRoot}/${amazonAssociatesResultsFileName}`;

    const qaResultsFilename = 'qa/index.json';
    const qaResultsUrl = `${urlRoot}/${qaResultsFilename}`;

    const keywordsFileName = 'keywords.json';
    const keywordsUrl = `${urlRoot}/${keywordsFileName}`;

    const immersiveProductUrl = (productId) => `${CDN_ROOT}/products/${productId}/immersive.json`;

    const urls = {
      s3PathRoot,
      readabilityUrl,
      mulaRecommendationsUrl,
      tempRecommendationsUrl,
      googleShoppingDescriptionsUrl,
      googleShoppingResultsUrl,
      amazonAssociatesResultsUrl,
      keywordsUrl,
      immersiveProductUrl,
      qaResultsUrl,
      cacheKey: `/${s3PathRoot}/*`
    };

    logger.info('Generated URLs', { 
      pageId: page.id,
      urlCount: Object.keys(urls).length 
    });

    return urls;
  } catch (error) {
    logger.error('Error generating URLs', error, { pageId: page.id });
    throw error;
  }
}

module.exports = {
  getPageURLs,
  getSearchURLs,
  createSHA256Hash
};
