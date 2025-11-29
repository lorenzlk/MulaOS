const { Page, Search } = require('../models');
const { createLogger } = require('../helpers/LoggingHelpers');
const logger = createLogger('ProductFeedbackWorker');

/**
 * Process product feedback job
 * @param {Object} data - The job data
 * @param {string|number} data.searchId
 * @param {string|number} data.pageId
 * @param {string} data.url
 * @param {string} data.feedback
 * @param {string} data.userId
 * @param {string} data.channelId
 * @param {string} data.messageTs
 */
async function processProductFeedback({ searchId, pageId, url, feedback, userId, channelId, messageTs }) {
  logger.info('Processing product feedback', { searchId, pageId, url, feedback, userId, channelId, messageTs });
  try {
    const page = await Page.findByPk(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    // 1. Save feedback
    await page.update({ keywordFeedback: feedback });

    // 2. Get current search instance and history
    let currentSearch = null;
    let searchHistory = [];
    if (page.searchId) {
      currentSearch = await Search.findByPk(page.searchId);
    }
    // Gather all searches for this page (by phrase, platform, etc.)
    searchHistory = await Search.findAll({
      where: { platform: currentSearch ? currentSearch.platform : 'amazon', phrase: currentSearch ? currentSearch.phrase : undefined },
      order: [['createdAt', 'ASC']]
    });

    // 3. Keep the searchId so orchestrateSearch knows this is feedback, not a new page
    // await page.update({ searchId: null });

    // 4. Start a new orchestrated search for the page
    const SearchOrchestrator = require('../helpers/SearchOrchestrator');
    const orchestrator = new SearchOrchestrator();
    
    // Get credentialId from the existing search
    const existingSearch = await Search.findByPk(searchId);
    if (!existingSearch || !existingSearch.credentialId) {
      throw new Error(`No credentialId found for search ${searchId}. Cannot proceed with feedback.`);
    }
    
    // Orchestrator should use feedback and avoid previous attempts
    await orchestrator.orchestrateSearch(pageId, existingSearch.credentialId, 'progressive');

    // 5. Send confirmation to Slack
//     const blocks = [
//       {
//         type: 'section',
//         text: {
//           type: 'mrkdwn',
//           text: `*Product feedback received and new search started!*
// URL: ${url}

// *Feedback:*
// ${feedback}

// The system will now attempt to find a better product set based on your feedback.`
//         }
//       },
//       {
//         type: 'context',
//         elements: [
//           {
//             type: 'mrkdwn',
//             text: `🔄 *Process restarted with feedback - products will be fetched automatically*`
//           }
//         ]
//       }
//     ];
//     await sendSlackReply(
//       channelId,
//       `Product feedback received and new search started: ${url}`,
//       messageTs,
//       blocks
//     );
    logger.info('Product feedback processing complete', { searchId, pageId, url });
  } catch (error) {
    logger.error('Error processing product feedback', error, { searchId, pageId, url });
    throw error;
  }
}

module.exports = {
  processProductFeedback
}; 