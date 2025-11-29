const { createLogger } = require('./LoggingHelpers');
const { withRetry } = require('./ProductHelpers');
const { uploadJsonToS3 } = require('./S3Helpers');
const { crawl } = require('./Crawler');

const logger = createLogger('ReadabilityHelpers');

/**
 * Process and save readability results
 * @param {string} html - The HTML content to process
 * @param {string} url - The URL of the content
 * @param {string} readabilityUrl - The URL to save the results to
 */
const processAndSaveReadability = async (html, url, readabilityUrl) => {
  logger.info('Processing readability', { url });

  try {
    const readability = await withRetry(
      () => crawl(url.toString()),
      'process-readability'
    );

    if (!readability.textContent) {
      throw new Error("No text content extracted from article");
    }

    await uploadJsonToS3(readabilityUrl, readability);
    logger.info('Readability results saved', { 
      url,
      textLength: readability.textContent.length 
    });

    return readability;
  } catch (error) {
    logger.error('Error processing readability', error, { url });
    throw error;
  }
};

module.exports = {
  processAndSaveReadability
}; 