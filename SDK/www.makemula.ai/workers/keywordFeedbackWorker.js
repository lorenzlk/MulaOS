const { Page } = require('../models');
const { sendSlackReply } = require('../helpers/SlackHelpers');
const { getFile } = require('../helpers/S3Helpers');
const { generateKeywords } = require('../helpers/KeywordHelpers');
const { getPageURLs } = require('../helpers/URLHelpers');
const { createLogger } = require('../helpers/LoggingHelpers');
const logger = createLogger('KeywordFeedbackWorker');

/**
 * Process keyword feedback job
 * @param {Object} data - The job data
 * @param {string|number} data.pageId
 * @param {string} data.url
 * @param {string} data.feedback
 * @param {string} data.userId
 * @param {string} data.channelId
 * @param {string} data.messageTs
 */
async function processKeywordFeedback({ pageId, url, feedback, userId, channelId, messageTs }) {
  logger.info('Processing keyword feedback', { pageId, url, feedback, userId, channelId, messageTs });
  try {
    const page = await Page.findByPk(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }
    // Update page with feedback
    await page.update({
      keywordFeedback: feedback
    });
    // Get existing readability results instead of reprocessing
    const urls = await getPageURLs(page);
    const readabilityResponse = await fetch(urls.readabilityUrl);
    
    if (!readabilityResponse.ok) {
      throw new Error(`Readability results not found for page: ${pageId}`);
    }
    
    const readabilityResults = await readabilityResponse.json();
    const newProposedKeywords = await generateKeywords(
      readabilityResults.textContent,
      new URL(url).hostname,
      feedback,
      page.proposedKeywords
    );
    // Update page with new proposed keywords
    await page.update({
      proposedKeywords: newProposedKeywords,
      keywordStatus: 'pending'
    });
    // Send new keywords for review
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New Proposed Keywords for ${url}*\n\n*Previous Keywords:*\n${page.proposedKeywords}\n\n*Previous Feedback:*\n${feedback}\n\n*New Proposed Keywords:*\n${newProposedKeywords}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Approve Keywords',
              emoji: true
            },
            style: 'primary',
            action_id: 'approve_keywords',
            value: JSON.stringify({ pageId: page.id, url })
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Reject Keywords',
              emoji: true
            },
            style: 'danger',
            action_id: 'reject_keywords',
            value: JSON.stringify({ pageId: page.id, url })
          }
        ]
      }
    ];
    await sendSlackReply(
      channelId,
      `New keywords proposed based on feedback: ${url}`,
      messageTs,
      blocks
    );
    logger.info('Keyword feedback processing complete', { pageId, url });
  } catch (error) {
    logger.error('Error processing keyword feedback', error, { pageId, url });
    throw error;
  }
}

module.exports = {
  processKeywordFeedback
}; 