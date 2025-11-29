// workers/encoreWorker.js
const Bull = require('bull');
const { createEncore, createQA } = require('./services/encore');
const { checkSite } = require('./scripts/onboarding/index.js');
const { generateSlackMessage } = require('./openai/health-checks/index.js');
const { sendSlackMessage } = require('./helpers/SlackHelpers');
const { Page, Search } = require('./models');
const { createLogger } = require('./helpers/LoggingHelpers');
const config = require('./config');
const logger = createLogger('worker');

// Get Redis URL from environment variable or default to localhost
const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

// Connect to all queues
const encoreQueue = new Bull('encoreQueue', redisUrl);
const healthCheckQueue = new Bull('healthCheckQueue', redisUrl);
const searchQueue = new Bull('searchQueue', redisUrl);
const keywordFeedbackQueue = new Bull('keywordFeedbackQueue', redisUrl);
const performanceReportQueue = new Bull('performanceReportQueue', redisUrl);
const engagementReportQueue = new Bull('engagementReportQueue', redisUrl);
const siteSearchQueue = new Bull('siteSearchQueue', redisUrl);

// Process encore jobs
encoreQueue.process('encore', async (job) => {
  logger.info('Processing encore job', { data: job.data });
  const { pageId, forceRefresh, credentialId } = job.data;
  const page = await Page.findByPk(pageId);
  if(!page) {
    throw new Error(`Could not find page with ID: ${pageId}`);
  }
  const url = page.url;
  console.log(`Received encore job for url: ${url}, credentialId: ${credentialId}`);
  const u = new URL(url);
  try {
    await createEncore(page, forceRefresh, credentialId);
    console.log(`Successfully processed encore job for pageId: ${pageId}`);
  } catch (error) {
    console.error(`Failed to process encore job for pageId: ${pageId}`, error);
    throw error; // Re-throw error to retry the job later if configured
  }
});

// Process QA jobs
encoreQueue.process('qa', async (job) => {
  const { pageId, forceRefresh } = job.data;
  const page = await Page.findByPk(pageId);
  if(!page) {
    throw new Error(`Could not find page with ID: ${pageId}`);
  }
  const url = page.url;
  console.log(`Received qa job for url: ${url}`);
  const u = new URL(url);
  try {
    await createQA(u, forceRefresh, true);
    console.log(`Successfully processed qa job for pageId: ${pageId}`);
  } catch (error) {
    console.error(`Failed to process qa job for pageId: ${pageId}`, error);
    throw error; // Re-throw error to retry the job later if configured
  }
});

// Process health check jobs
healthCheckQueue.process('checkSite', async (job) => {
  const { url } = job.data;
  try {
    // Run the health check
    const result = await checkSite(url);
    
    // Generate a friendly Slack message
    const message = await generateSlackMessage(result);
    
    // Post the result to the channel
    await sendSlackMessage(
      job.data.channelId,
      `Health check results for ${url}`,
      [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }]
    );

  } catch (error) {
    console.error('Error processing health check:', error);
    // Send error to the channel
    await sendSlackMessage(
      job.data.channelId,
      `Error checking ${url}`,
      [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ Error checking health status for ${url}: ${error.message}`
        }
      }]
    );
  }
});

// Process search jobs - Updated to handle both pageId and searchId
searchQueue.process('search', async (job) => {
  const { pageId, searchId } = job.data;
  try {
    // Import search worker functionality
    const { processSearchQuery, processSearchById } = require('./workers/searchWorker');
    
    if (pageId) {
      // New format: process by pageId using orchestrator
      await processSearchQuery(job);
    } else if (searchId) {
      // Direct search processing (for site targeting)
      await processSearchById(searchId);
    } else {
      throw new Error('Neither pageId nor searchId provided');
    }
  } catch (error) {
    console.error('Error processing search:', error);
    
    if (pageId) {
      const page = await Page.findByPk(pageId);
      if (page) {
        await sendSlackMessage(
          process.env.SLACK_ERROR_CHANNEL,
          `Error processing search for page ${page.url}`,
          [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `❌ Error processing search: ${error.message}`
            }
          }]
        );
      }
    }
  }
});

// Process product feedback jobs
keywordFeedbackQueue.process('processProductFeedback', async (job) => {
  try {
    const { processProductFeedback } = require('./workers/productFeedbackWorker');
    await processProductFeedback(job.data);
  } catch (error) {
    console.error('Error processing product feedback:', error);
    // Optionally send error to Slack or log elsewhere
    throw error;
  }
});

// Process performance report jobs
performanceReportQueue.process('generateReport', async (job) => {
  try {
    const { processPerformanceReport } = require('./workers/performanceReportWorker');
    await processPerformanceReport(job);
  } catch (error) {
    console.error('Error processing performance report:', error);
    throw error;
  }
});

// Process engagement report jobs
engagementReportQueue.process('generateReport', async (job) => {
  try {
    const { generateEngagementReport } = require('./workers/engagementReportWorker');
    await generateEngagementReport(job);
  } catch (error) {
    console.error('Error processing engagement report:', error);
    throw error;
  }
});

// Process product performance report jobs
const productPerformanceQueue = new Bull('productPerformanceQueue', redisUrl);
productPerformanceQueue.process('generateReport', async (job) => {
  try {
    const { processProductPerformance } = require('./workers/productPerformanceWorker');
    const { daysBack = 1, domain = null, channelId, channelName } = job.data;
    
    // Temporarily override SLACK_REPORTS_CHANNEL if channelId is provided (for NLP requests)
    const originalChannel = process.env.SLACK_REPORTS_CHANNEL;
    if (channelId) {
      process.env.SLACK_REPORTS_CHANNEL = channelId;
    }
    
    await processProductPerformance(daysBack, domain);
    
    // Restore original channel
    if (channelId) {
      process.env.SLACK_REPORTS_CHANNEL = originalChannel;
    }
  } catch (error) {
    console.error('Error processing product performance report:', error);
    throw error;
  }
});

// Process subid report jobs
const subidReportQueue = new Bull('subidReportQueue', redisUrl);
subidReportQueue.process('generateSubidReport', async (job) => {
  const { daysBack, filterMula, channelId, channelName } = job.data;
  
  console.log('🚀 Starting subid report generation:', {
    daysBack,
    filterMula,
    channelId,
    channelName
  });

  try {
    if (!config.impact.username || !config.impact.password) {
      throw new Error('Missing Impact API credentials! Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    }

    const { SubidReportGenerator } = require('./helpers/SubidReportGenerator');
    const generator = new SubidReportGenerator();
    const report = await generator.generateSubidReport(daysBack, filterMula, true); // Add useExportApi parameter
    
    // Send to Slack
    await sendSlackMessage(channelId, report.text, report.blocks);
    
    console.log('✅ Subid report sent to Slack successfully');
    
  } catch (error) {
    console.error('💥 Subid report generation failed:', error.message);
    
    // Send error message to Slack
    const errorBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Subid Report Generation Failed*\n\nError: ${error.message}\n\nPlease check the logs for more details.`
        }
      }
    ];
    
    await sendSlackMessage(channelId, `❌ Subid report generation failed: ${error.message}`, errorBlocks);
    throw error;
  }
});

// Process A/B test report jobs
const abTestQueue = new Bull('abTestQueue', redisUrl);
abTestQueue.process('generateABTestReport', async (job) => {
  const { daysBack, experimentName, useCached, channelId, channelName } = job.data;
  
  console.log('🧪 Starting A/B test report generation:', {
    daysBack,
    experimentName,
    useCached,
    channelId,
    channelName
  });

  try {
    const { runSmartScrollABTestSlackReport } = require('./scripts/smartscroll-ab-test-slack-report.js');
    
    // Run the A/B test report and send to the channel where command was executed
    await runSmartScrollABTestSlackReport({
      days_back: daysBack,
      experiment_name: experimentName,
      use_cached: useCached,
      channel: channelName
    });
    
    console.log('✅ A/B test report sent to Slack successfully');
    
  } catch (error) {
    console.error('💥 A/B test report generation failed:', error.message);
    
    // Send error message to Slack
    const errorBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *A/B Test Report Generation Failed*\n\nError: ${error.message}\n\nPlease check the logs for more details.`
        }
      }
    ];
    
    await sendSlackMessage(channelId, `❌ A/B test report generation failed: ${error.message}`, errorBlocks);
    throw error;
  }
});

// Process taxonomy analysis jobs
const taxonomyAnalysisQueue = new Bull('taxonomyAnalysisQueue', redisUrl);
taxonomyAnalysisQueue.process('analyzeTaxonomy', async (job) => {
  const { domain, lookback_days, channelId, channelName } = job.data;
  
  console.log('🏛️ Starting taxonomy analysis:', {
    domain,
    lookback_days,
    channelId,
    channelName
  });

  try {
    const { processTaxonomyAnalysis } = require('./workers/taxonomyAnalysisWorker');
    await processTaxonomyAnalysis(job);
    
    console.log('✅ Taxonomy analysis completed and sent to Slack successfully');
    
  } catch (error) {
    console.error('💥 Taxonomy analysis failed:', error.message);
    
    // Send error message to Slack
    const errorBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Taxonomy Analysis Failed*\n\nDomain: ${domain}\nLookback: ${lookback_days} days\nError: ${error.message}\n\nPlease check the logs for more details.`
        }
      }
    ];
    
    await sendSlackMessage(channelId, `❌ Taxonomy analysis failed: ${error.message}`, errorBlocks);
    throw error;
  }
});

// Process click URLs report jobs
const clickUrlsQueue = new Bull('clickUrlsQueue', redisUrl);
clickUrlsQueue.process('generateClickUrlsReport', async (job) => {
  const { domain, lookbackDays, channelId, channelName } = job.data;
  
  console.log('📊 Starting click URLs report generation:', {
    domain,
    lookbackDays,
    channelId,
    channelName
  });

  try {
    const { generateClickUrlsReport } = require('./workers/clickUrlsWorker');
    await generateClickUrlsReport(job);
    
    console.log('✅ Click URLs report completed and sent to Slack successfully');
    
  } catch (error) {
    console.error('💥 Click URLs report failed:', error.message);
    
    // Send error message to Slack
    const errorBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Click URLs Report Failed*\n\nDomain: ${domain}\nLookback: ${lookbackDays} days\nError: ${error.message}\n\nPlease check the logs for more details.`
        }
      }
    ];
    
    await sendSlackMessage(channelId, `❌ Click URLs report failed: ${error.message}`, errorBlocks);
    throw error;
  }
});

// Process site search jobs
siteSearchQueue.process('site-search', async (job) => {
  const { processSiteSearch } = require('./workers/siteSearchWorker');
  const { domain, lookbackDays, channelId } = job.data;
  
  try {
    console.log(`Processing site search job for ${domain} (${lookbackDays} days)`);
    await processSiteSearch({ domain, lookbackDays, channelId });
    console.log(`Successfully processed site search job for ${domain}`);
  } catch (error) {
    console.error(`Failed to process site search job for ${domain}:`, error);
    throw error;
  }
});

// Process next-page build jobs
const nextPageBuildQueue = new Bull('nextPageBuildQueue', redisUrl);
const NextPageBuildWorker = require('./workers/nextPageBuildWorker');
const nextPageWorker = new NextPageBuildWorker();

// Initialize the worker
nextPageWorker.init().catch(console.error);

// Revenue Collection Worker - processes revenue data collection jobs
require('./workers/revenueCollectionWorker');

nextPageBuildQueue.process('buildNextPage', async (job) => {
  const { domain, lookbackDays, categoryOrPath, limit, channelId, channelName } = job.data;
  
  try {
    console.log(`Processing next-page build job for ${domain} (${lookbackDays} days, ${categoryOrPath})`);
    await nextPageWorker.processJob(job);
    console.log(`Successfully processed next-page build job for ${domain}`);
  } catch (error) {
    console.error(`Failed to process next-page build job for ${domain}:`, error);
    throw error;
  }
});

// Revenue Collection Queue (imported from worker, but need reference for error handling)
const { revenueCollectionQueue } = require('./workers/revenueCollectionWorker');

// Handle failed jobs for all queues
[encoreQueue, healthCheckQueue, searchQueue, keywordFeedbackQueue, performanceReportQueue, productPerformanceQueue, subidReportQueue, abTestQueue, taxonomyAnalysisQueue, clickUrlsQueue, siteSearchQueue, nextPageBuildQueue, revenueCollectionQueue].forEach(queue => {
  queue.on('failed', (job, error) => {
    console.error(`Job failed in ${queue.name}:`, job.id, error);
  });

  queue.on('completed', (job) => {
    console.log(`Job completed in ${queue.name}:`, job.id);
  });
});

// Revenue Collection Scheduler - runs periodically to check for scheduled collections
const { scheduleRevenueCollections } = require('./workers/scheduledRevenueCollection');

// Run scheduler every hour to check for collections that need to run
setInterval(() => {
  scheduleRevenueCollections().catch(error => {
    console.error('Error in revenue collection scheduler:', error);
  });
}, 60 * 60 * 1000); // Every hour

// Run scheduler once on startup
scheduleRevenueCollections().catch(error => {
  console.error('Error in initial revenue collection scheduler run:', error);
});

// Start listening for jobs
console.log('Worker is listening for jobs on all queues...');
console.log('Revenue collection scheduler running (checks every hour)...');
