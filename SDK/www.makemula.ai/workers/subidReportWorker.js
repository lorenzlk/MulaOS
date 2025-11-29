const Bull = require('bull');
const { sendSlackMessage } = require('../helpers/SlackHelpers');
const { SubidReportGenerator } = require('../helpers/SubidReportGenerator');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const subidReportQueue = new Bull('subidReportQueue', redisUrl);

/**
 * Subid Report Worker
 * Processes subid performance report requests from Slack commands
 * Now uses the robust SubidReportGenerator helper
 */

// Process jobs from the queue with explicit job type
subidReportQueue.process('generateSubidReport', async (job) => {
  try {
    console.log(`🚀 Processing subid report job: ${job.id}`);
    
    const { daysBack = 7, filterMula = false, useExportApi = false, channel, userId } = job.data;
    
    // Generate the report using the new helper
    const generator = new SubidReportGenerator();
    const report = await generator.generateSubidReport(daysBack, filterMula, useExportApi);
    
    // Send to Slack if channel is specified
    if (channel) {
      await sendSlackMessage(channel, report.text, report.blocks);
      console.log(`✅ Report sent to Slack channel: ${channel}`);
    }
    
    return {
      success: true,
      report: report,
      message: `Subid report generated successfully for ${daysBack} days`
    };
    
  } catch (error) {
    console.error('❌ Error processing subid report job:', error);
    throw error;
  }
});

// Also handle jobs without a specific type (for backward compatibility)
subidReportQueue.process(async (job) => {
  try {
    console.log(`🚀 Processing legacy subid report job: ${job.id}`);
    
    const { daysBack = 7, filterMula = false, useExportApi = false, channel, userId } = job.data;
    
    // Generate the report using the new helper
    const generator = new SubidReportGenerator();
    const report = await generator.generateSubidReport(daysBack, filterMula, useExportApi);
    
    // Send to Slack if channel is specified
    if (channel) {
      await sendSlackMessage(channel, report.text, report.blocks);
      console.log(`✅ Report sent to Slack channel: ${channel}`);
    }
    
    return {
      success: true,
      report: report,
      message: `Subid report generated successfully for ${daysBack} days`
    };
    
  } catch (error) {
    console.error('❌ Error processing legacy subid report job:', error);
    throw error;
  }
});

// Handle job completion
subidReportQueue.on('completed', (job, result) => {
  console.log(`✅ Subid report job ${job.id} completed successfully`);
  console.log(`📊 Report generated for ${job.data.daysBack || 7} days`);
});

// Handle job failures
subidReportQueue.on('failed', (job, err) => {
  console.error(`❌ Subid report job ${job.id} failed:`, err.message);
  
  // Optionally send error notification to Slack
  if (job.data.channel) {
    const errorMessage = `❌ Failed to generate subid report: ${err.message}`;
    sendSlackMessage(job.data.channel, errorMessage).catch(console.error);
  }
});

// Export the queue for external use
module.exports = { subidReportQueue }; 