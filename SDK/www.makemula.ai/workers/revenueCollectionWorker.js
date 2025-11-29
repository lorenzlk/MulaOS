require('dotenv').config();
const Bull = require('bull');
const models = require('../models');
const { RevenueDataService } = require('../services/RevenueDataService');
const { ImpactRevenueCollector } = require('../helpers/collectors/ImpactRevenueCollector');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const revenueCollectionQueue = new Bull('revenueCollectionQueue', redisUrl);

const revenueDataService = new RevenueDataService(models);

/**
 * Revenue Collection Worker
 * Processes revenue data collection jobs with retry logic
 */

// Process revenue collection jobs
revenueCollectionQueue.process('collectRevenue', async (job) => {
  const { domain, platform, startDate, endDate, jobId } = job.data;
  
  const startTime = Date.now();
  
  console.log(`🚀 Processing revenue collection job: ${job.id}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   Platform: ${platform}`);
  console.log(`   Date Range: ${startDate} to ${endDate}`);
  
  try {
    // Update job status to running
    await models.RevenueCollectionJob.update(
      { status: 'running', startedAt: new Date() },
      { where: { id: jobId } }
    );

    // Get appropriate collector
    let collector;
    switch (platform) {
      case 'impact':
        collector = new ImpactRevenueCollector(domain, {});
        break;
      case 'amazon_associates':
        // TODO: Implement AmazonAssociatesRevenueCollector
        throw new Error('Amazon Associates collector not yet implemented');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Collect revenue data
    console.log(`📊 Collecting ${platform} revenue data for ${domain}...`);
    const events = await collector.collectRevenueData(new Date(startDate), new Date(endDate));

    console.log(`   Collected ${events.length} revenue events`);

    // Store events in database
    const { stored, skipped, errors } = await revenueDataService.storeRevenueEvents(events, jobId);
    
    console.log(`   Stored: ${stored}, Skipped: ${skipped}, Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} errors occurred while storing events`);
      errors.forEach(({ event, error }) => {
        console.warn(`   Error: ${error}`, event);
      });
    }

    // Update collection status
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    await revenueDataService.updateCollectionStatus(
      domain,
      platform,
      jobId,
      new Date(startDate),
      new Date(endDate),
      stored,
      durationSeconds
    );

    // Update job status to completed
    await models.RevenueCollectionJob.update(
      { 
        status: 'completed', 
        completedAt: new Date() 
      },
      { where: { id: jobId } }
    );

    console.log(`✅ Successfully collected ${stored} revenue events for ${domain} (${platform}) in ${durationSeconds}s`);

    return {
      success: true,
      eventCount: stored,
      skippedCount: skipped,
      errorCount: errors.length,
      durationSeconds
    };

  } catch (error) {
    console.error(`❌ Error collecting revenue data for ${domain} (${platform}):`, error);

    // Update job with error
    const jobRecord = await models.RevenueCollectionJob.findByPk(jobId);
    const retryCount = (jobRecord?.retryCount || 0) + 1;

    await models.RevenueCollectionJob.update(
      { 
        status: retryCount >= (jobRecord?.maxRetries || 3) ? 'failed' : 'pending',
        lastError: error.message,
        retryCount
      },
      { where: { id: jobId } }
    );

    // Retry if not exceeded max retries
    if (retryCount < (jobRecord?.maxRetries || 3)) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`🔄 Retrying in ${delay}ms (attempt ${retryCount}/${jobRecord?.maxRetries || 3})`);
      
      await revenueCollectionQueue.add('collectRevenue', job.data, {
        delay,
        attempts: 1 // This is a new job, not a retry of the same job
      });
    } else {
      console.error(`❌ Max retries exceeded for job ${jobId}`);
    }

    throw error;
  }
});

// Handle job completion
revenueCollectionQueue.on('completed', (job, result) => {
  console.log(`✅ Revenue collection job ${job.id} completed successfully`);
  console.log(`📊 Collected ${result.eventCount} events for ${job.data.domain}`);
});

// Handle job failures
revenueCollectionQueue.on('failed', (job, err) => {
  console.error(`❌ Revenue collection job ${job.id} failed:`, err.message);
});

// Export the queue for external use
module.exports = { revenueCollectionQueue };

