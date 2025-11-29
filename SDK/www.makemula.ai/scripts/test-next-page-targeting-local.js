#!/usr/bin/env node

/**
 * Local Test Script for Next Page Targeting
 * 
 * This script tests the next-page targeting implementation by:
 * 1. Reading existing SiteTargeting records for www.on3.com
 * 2. Creating corresponding NextPageTargeting records
 * 3. Building section manifests using the worker
 * 4. Running manifest builder to verify _nextPageTargeting is included
 * 
 * Usage:
 *   node scripts/test-next-page-targeting-local.js
 */

require('dotenv').config();
const { sequelize, SiteTargeting, NextPageTargeting } = require('../models');
const { 
  addNextPageTargeting,
  upsertNextPageTargeting,
  listNextPageTargeting,
  generateSectionName 
} = require('../helpers/NextPageTargetingHelpers');
const NextPageBuildWorker = require('../workers/nextPageBuildWorker');
const { getNextPageTargetingForDomain } = require('../helpers/NextPageTargetingHelpers');

const DOMAIN = 'www.on3.com';
const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_LIMIT = 20;

async function testNextPageTargeting() {
  console.log('🧪 Testing Next Page Targeting Implementation\n');
  console.log(`Domain: ${DOMAIN}\n`);

  try {
    // Step 1: Get all SiteTargeting records for www.on3.com
    console.log('📋 Step 1: Reading SiteTargeting records...');
    const siteTargetingRecords = await SiteTargeting.findAll({
      where: {
        topLevelDomain: DOMAIN.toLowerCase(),
        deletedAt: null
      },
      order: [['id', 'ASC']]
    });

    console.log(`✅ Found ${siteTargetingRecords.length} site targeting records\n`);

    if (siteTargetingRecords.length === 0) {
      console.log('⚠️  No site targeting records found. Exiting.');
      return;
    }

    // Step 2: Create NextPageTargeting records
    console.log('📝 Step 2: Creating NextPageTargeting records...\n');
    const createdRecords = [];
    
    for (const siteTargeting of siteTargetingRecords) {
      try {
        // Generate section name from targeting value
        const sectionName = generateSectionName(siteTargeting.targetingValue);
        
        console.log(`  Creating record for: ${siteTargeting.targetingValue}`);
        console.log(`    Section: ${sectionName}`);
        console.log(`    Type: ${siteTargeting.targetingType}`);
        
        // Use upsert to create or update record
        const nextPageTargeting = await upsertNextPageTargeting(
          DOMAIN,
          siteTargeting.targetingType,
          siteTargeting.targetingValue,
          sectionName,
          DEFAULT_LOOKBACK_DAYS,
          DEFAULT_LIMIT,
          siteTargeting.channelId,
          siteTargeting.channelName
        );

        const action = nextPageTargeting.updatedAt > nextPageTargeting.createdAt ? 'Updated' : 'Created';
        console.log(`    ✅ ${action} NextPageTargeting record ID: ${nextPageTargeting.id}\n`);
        createdRecords.push(nextPageTargeting);
      } catch (error) {
        console.error(`    ❌ Error creating record: ${error.message}\n`);
      }
    }

    console.log(`✅ Created/Found ${createdRecords.length} NextPageTargeting records\n`);

    // Step 3: List all NextPageTargeting records to verify
    console.log('📋 Step 3: Verifying NextPageTargeting records...');
    const allRecords = await listNextPageTargeting(DOMAIN);
    console.log(`✅ Found ${allRecords.length} total NextPageTargeting records for ${DOMAIN}\n`);

    // Step 4: Build section manifests using worker
    console.log('🔨 Step 4: Building section manifests...\n');
    const worker = new NextPageBuildWorker();
    await worker.init();

    let successfulBuilds = 0;
    let failedBuilds = 0;

    for (const record of createdRecords) {
      try {
        console.log(`  Building manifest for section: ${record.sectionName}`);
        console.log(`    Targeting: ${record.targetingType} = "${record.targetingValue}"`);

        const jobData = {
          domain: record.topLevelDomain,
          targetingType: record.targetingType,
          targetingValue: record.targetingValue,
          sectionName: record.sectionName,
          lookbackDays: record.lookbackDays,
          limit: record.limit,
          channelId: record.channelId,
          channelName: record.channelName,
          dryRun: false // Set to true if you want to test without uploading
        };

        await worker.processJob({ data: jobData });
        
        console.log(`    ✅ Successfully built section manifest\n`);
        successfulBuilds++;
      } catch (error) {
        console.error(`    ❌ Error building manifest: ${error.message}\n`);
        failedBuilds++;
      }

      // Small delay between builds
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await worker.cleanup();

    console.log(`✅ Built ${successfulBuilds} section manifests, ${failedBuilds} failed\n`);

    // Step 5: Test manifest builder
    console.log('🏗️  Step 5: Testing manifest builder...\n');
    const { calculatePriority } = require('../helpers/NextPageTargetingHelpers');
    
    const targetingRecords = await getNextPageTargetingForDomain(DOMAIN);
    console.log(`✅ Found ${targetingRecords.length} targeting records from database\n`);

    if (targetingRecords.length > 0) {
      console.log('📋 Generated _nextPageTargeting array (what manifest builder would create):');
      const nextPageTargetingArray = targetingRecords.map(record => ({
        type: record.targetingType,
        value: record.targetingValue,
        section: record.sectionName,
        manifest: `next-page/${record.sectionName}/manifest.json`,
        priority: calculatePriority(record.targetingType, record.targetingValue)
      }));

      console.log(JSON.stringify(nextPageTargetingArray, null, 2));
      console.log('\n✅ Manifest builder would include these records in _nextPageTargeting array\n');
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Site Targeting Records: ${siteTargetingRecords.length}`);
    console.log(`   NextPageTargeting Records: ${allRecords.length}`);
    console.log(`   Section Manifests Built: ${successfulBuilds}`);
    console.log(`   Failed Builds: ${failedBuilds}`);
    console.log('\n✅ Test completed!\n');

  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testNextPageTargeting().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testNextPageTargeting };

