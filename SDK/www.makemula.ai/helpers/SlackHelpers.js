require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const { createLogger } = require('./LoggingHelpers');

const logger = createLogger('SlackHelpers');

// Initialize Slack client with token from environment
const slackClient = new WebClient(process.env.SLACK_TOKEN);

// Use test channel in development
const getChannel = (channel) => process.env.NODE_ENV === 'development' ? 'proj-mula-slackbot-test' : channel;

/**
 * Convert markdown text to Slack-compatible format
 * @param {string} text - The markdown text to convert
 * @returns {string} - Slack-compatible text
 */
function slackifyMarkdown(text) {
  // Remove leading/trailing whitespace
  let msg = text.trim();

  // Replace #/##/### headers with bold (Slack only supports *bold*)
  msg = msg.replace(/^###? (.*)$/gm, '*$1*');
  msg = msg.replace(/^# (.*)$/gm, '*$1*');

  // Replace double asterisks with single for bold (Slack prefers *bold*)
  msg = msg.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // Replace unordered list dashes with bullets for consistency
  msg = msg.replace(/^\s*[-•] /gm, '• ');

  // Remove excessive blank lines (max 2)
  msg = msg.replace(/\n{3,}/g, '\n\n');

  // Remove code block and blockquote markdown (Slack doesn't support)
  msg = msg.replace(/```[\s\S]*?```/g, '');
  msg = msg.replace(/^> ?/gm, '');

  return msg;
}

/**
 * Get user-friendly error message for Slack API errors
 * @param {string} errorCode - The Slack API error code
 * @returns {string} - User-friendly error message
 */
function getSlackErrorMessage(errorCode) {
  const errorMessages = {
    'invalid_blocks': 'Invalid blocks format in Slack message. This could be due to malformed markdown or content that exceeds Slack\'s limits.',
    'channel_not_found': 'Slack channel not found. Please verify the channel ID.',
    'not_in-channel': 'Bot is not a member of the specified channel.',
    'invalid_token': 'Invalid Slack token. Please verify the SLACK_TOKEN environment variable.',
    'missing_scope': 'Bot lacks required permissions for this action.'
  };
  
  return errorMessages[errorCode] || 'Failed to post to Slack';
}

/**
 * Send a message to a Slack channel
 * @param {string} channel - The channel to send the message to
 * @param {string} text - The message text
 * @param {Object} [blocks] - Optional Slack blocks for rich formatting
 * @param {boolean} [useMarkdown=false] - Whether to process text through slackifyMarkdown
 */
async function sendSlackMessage(channel, text, blocks = null, useMarkdown = false) {
  const targetChannel = getChannel(channel);
  const processedText = useMarkdown ? slackifyMarkdown(text) : text;
  
  logger.info('Sending Slack message', { 
    channel: targetChannel, 
    textLength: processedText.length,
    useMarkdown,
    hasBlocks: !!blocks
  });

  try {
    const message = {
      channel: targetChannel,
      text: processedText,
      ...(blocks && { blocks })
    };

    const result = await slackClient.chat.postMessage(message);
    
    logger.info('Slack message sent', { 
      channel: targetChannel,
      ts: result.ts,
      textLength: processedText.length
    });

    return result;
  } catch (error) {
    const errorMessage = getSlackErrorMessage(error.code || error.data?.error);
    const enhancedError = new Error(`${errorMessage} (Error: ${error.code || error.data?.error || error.message})`);
    
    logger.error('Error sending Slack message', enhancedError, { 
      channel: targetChannel,
      originalError: error.message,
      errorCode: error.code || error.data?.error
    });
    
    throw enhancedError;
  }
}

/**
 * Send a reply to an existing Slack message
 * @param {string} channel - The channel to send the reply to
 * @param {string} text - The message text
 * @param {string} threadTs - The timestamp of the message to reply to
 * @param {Object} [blocks] - Optional Slack blocks for rich formatting
 */
async function sendSlackReply(channel, text, threadTs, blocks = null) {
  const targetChannel = getChannel(channel);
  logger.info('Sending Slack reply', { channel: targetChannel, threadTs, textLength: text.length });

  try {
    const message = {
      channel: targetChannel,
      text,
      thread_ts: threadTs,
      ...(blocks && { blocks })
    };

    const result = await slackClient.chat.postMessage(message);
    
    logger.info('Slack reply sent', { 
      channel: targetChannel,
      threadTs,
      ts: result.ts,
      textLength: text.length
    });

    return result;
  } catch (error) {
    logger.error('Error sending Slack reply', error, { channel: targetChannel, threadTs });
    throw error;
  }
}

/**
 * Send an error notification to Slack
 * @param {Error} error - The error to report
 * @param {Object} context - Additional context about the error
 */
async function sendErrorNotification(error, context = {}) {
  logger.info('Sending error notification', { 
    errorMessage: error.message,
    context
  });

  try {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Error Alert',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:* ${error.message}`
        }
      }
    ];

    if (error.stack) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stack Trace:*\n\`\`\`${error.stack}\`\`\``
        }
      });
    }

    if (Object.keys(context).length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Context:*\n\`\`\`${JSON.stringify(context, null, 2)}\`\`\``
        }
      });
    }

    const result = await sendSlackMessage(
      process.env.SLACK_ERROR_CHANNEL,
      `Error Alert: ${error.message}`,
      blocks
    );

    logger.info('Error notification sent', { 
      channel: process.env.SLACK_ERROR_CHANNEL,
      ts: result.ts
    });

    return result;
  } catch (notificationError) {
    logger.error('Error sending error notification', notificationError, {
      originalError: error.message,
      context
    });
    throw notificationError;
  }
}

module.exports = {
  sendSlackMessage,
  sendSlackReply,
  sendErrorNotification,
  slackifyMarkdown,
  getSlackErrorMessage
}; 