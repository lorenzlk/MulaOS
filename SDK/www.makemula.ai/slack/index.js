const { 
  sendSlackMessage: sendSlackMessageHelper, 
  slackifyMarkdown, 
  getSlackErrorMessage 
} = require('../helpers/SlackHelpers');

/**
 * @deprecated Use sendSlackMessage from helpers/SlackHelpers.js instead
 * This function is kept for backward compatibility
 */
async function sendSlackMessage(channel, text, blocks) {
  console.warn('⚠️  Deprecated: Use sendSlackMessage from helpers/SlackHelpers.js instead');
  
  try {
    // Use the consolidated helper with markdown processing enabled
    const result = await sendSlackMessageHelper(channel, text, blocks, true);
    console.log('✅ Message posted successfully:', result.ts);
    return result;
  } catch (error) {
    console.error('❌ Error posting to Slack:', error);
    throw error;
  }
}

module.exports = { slackifyMarkdown, sendSlackMessage }; 