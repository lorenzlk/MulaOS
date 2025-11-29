#!/usr/bin/env node

/**
 * Backfill Revenue Data
 * 
 * Manually trigger revenue collection for a specific date range.
 * Useful for backfilling historical data.
 * 
 * Usage:
 *   node scripts/backfill-revenue-data.js <domain> <platform> <startDate> <endDate>
 * 
 * Example:
 *   node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16
 * 
 * Or with date chunks (recommended for large ranges):
 *   node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16 --chunk-days 30
 */

require('dotenv').config();
const Bull = require('bull');
const models = require('../models');

// Create queue directly instead of importing from worker
// This avoids initializing the worker's models/connections in this script
const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const revenueCollectionQueue = new Bull('revenueCollectionQueue', redisUrl);

async function backfillRevenueData() {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.error('Usage: node scripts/backfill-revenue-data.js <domain> <platform> <startDate> <endDate> [--chunk-days <days>]');
        console.error('Example: node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16');
        console.error('Example with chunks: node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16 --chunk-days 30');
        process.exit(1);
    }

    const domain = args[0];
    const platform = args[1];
    const startDateStr = args[2];
    const endDateStr = args[3];
    
    // Check for chunk-days option
    const chunkDaysIndex = args.indexOf('--chunk-days');
    const chunkDays = chunkDaysIndex !== -1 && args[chunkDaysIndex + 1] 
        ? parseInt(args[chunkDaysIndex + 1], 10) 
        : null;

    // Validate platform
    if (!['impact', 'amazon_associates', 'other'].includes(platform)) {
        console.error(`❌ Invalid platform: ${platform}. Must be one of: impact, amazon_associates, other`);
        process.exit(1);
    }

    // Parse dates
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime())) {
        console.error(`❌ Invalid start date: ${startDateStr}. Use YYYY-MM-DD format.`);
        process.exit(1);
    }
    
    if (isNaN(endDate.getTime())) {
        console.error(`❌ Invalid end date: ${endDateStr}. Use YYYY-MM-DD format.`);
        process.exit(1);
    }

    if (startDate > endDate) {
        console.error(`❌ Start date must be before end date.`);
        process.exit(1);
    }

    console.log('🚀 Backfilling Revenue Data\n');
    console.log(`Domain: ${domain}`);
    console.log(`Platform: ${platform}`);
    console.log(`Date Range: ${startDateStr} to ${endDateStr}`);
    console.log(`Total Days: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))}`);
    if (chunkDays) {
        console.log(`Chunk Size: ${chunkDays} days`);
    }
    console.log('');

    try {
        let jobsCreated = 0;
        const jobs = [];

        if (chunkDays) {
            // Break into chunks
            console.log(`📦 Breaking date range into ${chunkDays}-day chunks...\n`);
            
            let currentStart = new Date(startDate);
            
            while (currentStart < endDate) {
                const currentEnd = new Date(currentStart);
                currentEnd.setDate(currentEnd.getDate() + chunkDays - 1);
                
                // Don't go past the end date
                if (currentEnd > endDate) {
                    currentEnd.setTime(endDate.getTime());
                }
                
                const chunkStartStr = currentStart.toISOString().split('T')[0];
                const chunkEndStr = currentEnd.toISOString().split('T')[0];
                
                console.log(`   Creating job for ${chunkStartStr} to ${chunkEndStr}...`);
                
                // Create job
                const job = await models.RevenueCollectionJob.create({
                    domain,
                    platform,
                    status: 'pending',
                    scheduledAt: new Date(),
                    maxRetries: 3,
                    config: {
                        startDate: chunkStartStr,
                        endDate: chunkEndStr,
                        backfill: true
                    }
                });

                // Queue the job
                await revenueCollectionQueue.add('collectRevenue', {
                    domain,
                    platform,
                    startDate: chunkStartStr,
                    endDate: chunkEndStr,
                    jobId: job.id
                });

                jobs.push({ jobId: job.id, startDate: chunkStartStr, endDate: chunkEndStr });
                jobsCreated++;

                // Move to next chunk
                currentStart = new Date(currentEnd);
                currentStart.setDate(currentStart.getDate() + 1);
            }
        } else {
            // Single job for entire range
            console.log('📋 Creating single collection job for entire date range...\n');
            
            const job = await models.RevenueCollectionJob.create({
                domain,
                platform,
                status: 'pending',
                scheduledAt: new Date(),
                maxRetries: 3,
                config: {
                    startDate: startDateStr,
                    endDate: endDateStr,
                    backfill: true
                }
            });

            // Queue the job
            await revenueCollectionQueue.add('collectRevenue', {
                domain,
                platform,
                startDate: startDateStr,
                endDate: endDateStr,
                jobId: job.id
            });

            jobs.push({ jobId: job.id, startDate: startDateStr, endDate: endDateStr });
            jobsCreated = 1;
        }

        console.log(`\n✅ Created ${jobsCreated} collection job(s):\n`);
        jobs.forEach((job, index) => {
            console.log(`   ${index + 1}. Job ID: ${job.jobId}`);
            console.log(`      Date Range: ${job.startDate} to ${job.endDate}`);
        });

        console.log(`\n💡 Next steps:`);
        console.log(`   1. Make sure the revenue collection worker is running:`);
        console.log(`      node workers/revenueCollectionWorker.js`);
        console.log(`   2. Or if using the main worker, it will process jobs automatically`);
        console.log(`   3. Monitor job status in the database:`);
        console.log(`      SELECT * FROM revenue_collection_jobs WHERE domain = '${domain}' ORDER BY id DESC;`);
        console.log(`\n✅ Jobs queued successfully!`);
        
        // Give a moment for jobs to be fully queued before closing Redis connection
        await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
        console.error(`\n❌ Error creating backfill jobs:`, error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Close Redis connection (but keep DB connection open for worker)
        // The worker process has its own connection pool, so closing here is safe
        await revenueCollectionQueue.close();
        // Note: We don't close the database connection here because
        // the worker process needs it to process the jobs we just queued.
        // The connection will close when the process exits naturally.
    }
}

// Run the backfill
if (require.main === module) {
    backfillRevenueData()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { backfillRevenueData };

