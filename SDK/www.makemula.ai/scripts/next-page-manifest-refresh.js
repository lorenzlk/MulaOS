#!/usr/bin/env node

/**
 * Next Page Manifest Refresh Script
 * 
 * This script rebuilds next-page manifest files for all active publishers by:
 * 1. Finding all active domains from the SiteTargeting table
 * 2. Loading existing manifests to get all categories/paths
 * 3. Rebuilding each category using the NextPageBuildWorker
 * 4. Uploading fresh manifests with updated content
 * 
 * It should be run daily via cron to ensure manifest files are up-to-date with fresh content.
 * 
 * Usage:
 *   node next-page-manifest-refresh.js [options]
 *   npm run refresh-next-page-manifests [options]
 * 
 * Options:
 *   --dry-run, -d    Run in dry-run mode (default unless NODE_ENV=production)
 *                    Automatically saves manifest JSON to ./dry-run-manifests/ for inspection
 *   --force, -f      Force production mode even if NODE_ENV != production
 * 
 * Environment Variables:
 *   - NODE_ENV: Set to 'production' to enable production mode (uploads to S3)
 *   - AWS_ACCESS_KEY_ID: AWS credentials
 *   - AWS_SECRET_ACCESS_KEY: AWS credentials
 *   - DATABASE_URL: PostgreSQL connection string
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = (args.includes('--dry-run') || args.includes('-d') || process.env.NODE_ENV !== 'production') && !args.includes('--force') && !args.includes('-f');
const isForce = args.includes('--force') || args.includes('-f');
// In dry-run mode, always save JSON for inspection
const saveJson = isDryRun;

// Configure AWS
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

// Import models and workers
const { sequelize, SiteTargeting, NextPageTargeting } = require('../models');
const NextPageBuildWorker = require('../workers/nextPageBuildWorker');

// Configuration
const CDN_BASE_URL = 'https://cdn.makemula.ai';
const S3_BUCKET = 'prod.makemula.ai';
const CACHE_CONTROL = 'public, s-maxage=300, no-cache, must-revalidate, max-age=0';

/**
 * Get all active domains from the NextPageTargeting table
 */
async function getActiveDomains() {
    try {
        const targetingRecords = await NextPageTargeting.findAll({
            attributes: ['topLevelDomain'],
            where: {
                deletedAt: null // Only get non-deleted records
            },
            order: [['topLevelDomain', 'ASC']],
            group: ['topLevelDomain'] // Get unique domains
        });
        
        return targetingRecords.map(record => record.topLevelDomain);
    } catch (error) {
        console.error('Error fetching domains from NextPageTargeting:', error);
        throw error;
    }
}


/**
 * Rebuild next-page section manifests for a domain by processing all NextPageTargeting records
 */
async function refreshNextPageManifest(domain, saveJson = false) {
    try {
        console.log(`🔄 Rebuilding next-page section manifests for ${domain}...`);
        
        // Get all NextPageTargeting records for this domain
        const targetingRecords = await NextPageTargeting.findAll({
            where: {
                topLevelDomain: domain.toLowerCase(),
                deletedAt: null // Only get non-deleted records
            },
            order: [['sectionName', 'ASC']]
        });
        
        if (targetingRecords.length === 0) {
            console.log(`⏭️  No next-page targeting records found for ${domain}, skipping`);
            return { 
                success: true, 
                totalSections: 0,
                successfulSections: 0,
                failedSections: 0,
                results: [],
                skipped: true
            };
        }
        
        console.log(`📋 Found ${targetingRecords.length} targeting records: ${targetingRecords.map(r => r.sectionName).join(', ')}`);
        
        // Initialize the worker
        const worker = new NextPageBuildWorker();
        await worker.init();
        
        let successfulSections = 0;
        let failedSections = 0;
        const results = [];
        
        // Process each targeting record
        for (const record of targetingRecords) {
            try {
                console.log(`  🔄 Processing section: ${record.sectionName} (${record.targetingType} = "${record.targetingValue}")`);
                
                const jobData = {
                    domain: record.topLevelDomain,
                    targetingType: record.targetingType,
                    targetingValue: record.targetingValue,
                    sectionName: record.sectionName,
                    lookbackDays: record.lookbackDays,
                    limit: record.limit,
                    channelId: record.channelId,
                    channelName: record.channelName,
                    dryRun: isDryRun // Pass dry-run flag to worker
                };
                
                // Process the job (this will rebuild this section's manifest)
                await worker.processJob({ data: jobData });
                
                successfulSections++;
                results.push({ section: record.sectionName, status: 'success' });
                console.log(`  ✅ Successfully processed section: ${record.sectionName}`);
                
            } catch (error) {
                failedSections++;
                results.push({ section: record.sectionName, status: 'failed', error: error.message });
                console.error(`  ❌ Failed to process section ${record.sectionName}:`, error.message);
            }
            
            // Small delay between sections to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Cleanup worker
        await worker.cleanup();
        
        console.log(`✅ Completed rebuild for ${domain}: ${successfulSections} successful, ${failedSections} failed`);
        
        return { 
            success: failedSections === 0, // Success only if no sections failed
            totalSections: targetingRecords.length,
            successfulSections,
            failedSections,
            results
        };
        
    } catch (error) {
        console.error(`❌ Error rebuilding section manifests for ${domain}:`, error.message);
        return { success: false, reason: error.message };
    }
}

/**
 * Main function to refresh all manifests
 */
async function refreshAllManifests() {
    const startTime = Date.now();
    const mode = isDryRun ? 'DRY RUN' : 'PRODUCTION';
    console.log(`🚀 Starting next-page manifest refresh (${mode} mode)...\n`);
    
    if (isDryRun) {
        console.log('🔍 DRY RUN MODE: No changes will be written to S3');
        console.log('   Use --force or set NODE_ENV=production to enable production mode');
        console.log('   JSON manifests will be saved to ./dry-run-manifests/ for inspection\n');
    }
    
    try {
        // Create dry-run manifests directory for JSON inspection
        if (isDryRun) {
            const dryRunDir = path.join(__dirname, 'dry-run-manifests');
            try {
                await fs.mkdir(dryRunDir, { recursive: true });
                console.log(`📁 Created dry-run manifests directory: ${dryRunDir}\n`);
            } catch (error) {
                console.warn(`⚠️  Could not create dry-run directory: ${error.message}\n`);
            }
        }
        
        // Get all active domains from NextPageTargeting
        const domains = await getActiveDomains();
        console.log(`📋 Found ${domains.length} active domains from NextPageTargeting\n`);
        
        if (domains.length === 0) {
            console.log('⚠️  No domains found in database');
            return;
        }
        
        const results = {
            total: domains.length,
            successful: 0,
            failed: 0,
            skipped: 0,
            details: []
        };
        
        // Process each domain
        for (const domain of domains) {
            console.log(`\n📡 Processing ${domain}...`);
            
            // Refresh the manifest (this will skip if no manifest exists)
            const result = await refreshNextPageManifest(domain, saveJson);
            
            if (result.skipped) {
                results.skipped++;
                results.details.push({
                    domain,
                    status: 'skipped',
                    reason: 'No existing manifest found'
                });
            } else if (result.success) {
                results.successful++;
                results.details.push({
                    domain,
                    status: 'success',
                    totalRecommendations: result.totalRecommendations,
                    successfulCategories: result.successfulCategories,
                    failedCategories: result.failedCategories,
                    results: result.results
                });
            } else {
                results.failed++;
                results.details.push({
                    domain,
                    status: 'failed',
                    reason: result.reason,
                    successfulCategories: result.successfulCategories || 0,
                    failedCategories: result.failedCategories || 0
                });
            }
            
            // Small delay to avoid overwhelming the CDN
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Print summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n📊 Refresh Summary (${duration}s):`);
        console.log(`   Total domains: ${results.total}`);
        console.log(`   ✅ Successful: ${results.successful}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   ⏭️  Skipped: ${results.skipped}`);
        
        // Print detailed results
        if (results.details.length > 0) {
            console.log('\n📋 Detailed Results:');
            results.details.forEach(detail => {
                const status = detail.status === 'success' ? '✅' : 
                              detail.status === 'failed' ? '❌' : '⏭️';
                console.log(`   ${status} ${detail.domain}`);
                
                if (detail.status === 'success') {
                    console.log(`      📊 ${detail.totalSections} total sections`);
                    console.log(`      ✅ ${detail.successfulSections} sections rebuilt`);
                    if (detail.failedSections > 0) {
                        console.log(`      ⚠️  ${detail.failedSections} sections failed`);
                    }
                } else {
                    console.log(`      💬 ${detail.reason || 'Unknown error'}`);
                    if (detail.successfulSections > 0) {
                        console.log(`      ✅ ${detail.successfulSections} sections succeeded before failure`);
                    }
                    if (detail.failedSections > 0) {
                        console.log(`      ❌ ${detail.failedSections} sections failed`);
                    }
                }
            });
        }
        
        // Exit with error code if any failures
        if (results.failed > 0) {
            console.log(`\n⚠️  ${results.failed} manifest(s) failed to refresh`);
            process.exit(1);
        } else {
            console.log('\n🎉 All manifests refreshed successfully!');
        }
        
    } catch (error) {
        console.error('\n💥 Fatal error during manifest refresh:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await sequelize.close();
    }
}

// Run the script
if (require.main === module) {
    refreshAllManifests().catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = { refreshAllManifests, refreshNextPageManifest, getActiveDomains };
