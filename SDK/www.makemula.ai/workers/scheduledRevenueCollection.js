require('dotenv').config();
const models = require('../models');
const { revenueCollectionQueue } = require('./revenueCollectionWorker');

/**
 * Scheduled Revenue Collection
 * 
 * Checks all active revenue collection statuses and schedules jobs as needed
 * based on collection cadence settings.
 * 
 * This should be run periodically (e.g., every hour) via a cron job or scheduler.
 */

/**
 * Check all active revenue collection statuses and schedule jobs as needed
 */
async function scheduleRevenueCollections() {
  console.log('🔍 Checking for scheduled revenue collections...');
  
  const statuses = await models.RevenueCollectionStatus.findAll({
    where: { is_active: true }
  });

  console.log(`   Found ${statuses.length} active collection statuses`);

  const now = new Date();
  let scheduledCount = 0;
  
  for (const status of statuses) {
    const lastCollection = status.last_successful_collection_at;
    const cadenceHours = status.collection_cadence_hours || 24;
    
    // Check if it's time to collect
    const shouldCollect = !lastCollection || 
      (now - lastCollection) >= (cadenceHours * 60 * 60 * 1000);

    if (shouldCollect) {
      // Determine date range to collect
      const endDate = new Date();
      const startDate = lastCollection 
        ? new Date(lastCollection) // Collect from last collection
        : new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // Default: last 7 days

      // Create collection job
      const job = await models.RevenueCollectionJob.create({
        domain: status.domain,
        platform: status.platform,
        status: 'pending',
        scheduledAt: now,
        maxRetries: 3,
        config: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      // Queue the job
      await revenueCollectionQueue.add('collectRevenue', {
        domain: status.domain,
        platform: status.platform,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        jobId: job.id
      });

      console.log(`   ✅ Scheduled collection for ${status.domain} (${status.platform})`);
      scheduledCount++;
    } else {
      const hoursSinceLastCollection = lastCollection 
        ? Math.floor((now - lastCollection) / (60 * 60 * 1000))
        : 0;
      const hoursUntilNext = cadenceHours - hoursSinceLastCollection;
      console.log(`   ⏸️  ${status.domain} (${status.platform}): Next collection in ${hoursUntilNext} hours`);
    }
  }

  console.log(`✅ Scheduled ${scheduledCount} revenue collection jobs`);
  return scheduledCount;
}

/**
 * Initialize collection status for a domain/platform if it doesn't exist
 * @param {String} domain - Domain name
 * @param {String} platform - Platform name
 * @param {Number} cadenceHours - Collection cadence in hours (default: 24)
 */
async function initializeCollectionStatus(domain, platform, cadenceHours = 24) {
  const [status, created] = await models.RevenueCollectionStatus.findOrCreate({
    where: { domain, platform },
    defaults: {
      domain,
      platform,
      collection_cadence_hours: cadenceHours,
      is_active: true
    }
  });

  if (created) {
    console.log(`✅ Initialized collection status for ${domain} (${platform})`);
  }

  return status;
}

// If running as a standalone script, run the scheduler
if (require.main === module) {
  scheduleRevenueCollections()
    .then((count) => {
      console.log(`\n🎉 Scheduled ${count} revenue collection jobs`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error scheduling revenue collections:', error);
      process.exit(1);
    });
}

module.exports = { scheduleRevenueCollections, initializeCollectionStatus };

