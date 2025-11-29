const Bull = require('bull');
const { checkSite } = require('../scripts/onboarding/index.js');
const { generateSlackMessage } = require('../openai/health-checks/index.js');
const { sendSlackMessage } = require('../helpers/SlackHelpers');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const healthCheckQueue = new Bull('healthCheckQueue', redisUrl);

// Process health check jobs
healthCheckQueue.process(async (job) => {
  const { domain, channelId, userId, responseUrl } = job.data;
  
  try {
    // Run the health check
    const result = await checkSite(domain);
    
    // Generate a friendly Slack message
    const message = await generateSlackMessage(result);
    
    // Post the result to the channel
    await sendSlackMessage(channelId, `Health check results for ${domain}`, [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }
    ]);

  } catch (error) {
    console.error('Error processing health check:', error);
    // Send error to the channel
    await sendSlackMessage(channelId, `Error checking ${domain}`, [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ Error checking health status for ${domain}: ${error.message}`
        }
      }
    ]);
  }
});

// Handle failed jobs
healthCheckQueue.on('failed', (job, error) => {
  console.error('Job failed:', job.id, error);
});

// Handle completed jobs
healthCheckQueue.on('completed', (job) => {
  console.log('Job completed:', job.id);
});

// Start the worker
console.log('Health check worker started'); 