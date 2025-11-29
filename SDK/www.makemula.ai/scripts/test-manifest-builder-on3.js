#!/usr/bin/env node

/**
 * Test script to build manifest for www.on3.com and verify next-page targeting
 * 
 * Usage:
 *   node scripts/test-manifest-builder-on3.js
 */

require('dotenv').config();
const { sequelize } = require('../models');
const { getNextPageTargetingForDomain } = require('../helpers/NextPageTargetingHelpers');
const { calculatePriority } = require('../helpers/NextPageTargetingHelpers');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const DOMAIN = 'www.on3.com';
const fs = require('fs').promises;
const path = require('path');

// Function to check if a file exists (local filesystem in dev, S3 in production)
async function checkFileExists(filePath) {
    // In development, check local filesystem first
    if (process.env.NODE_ENV !== 'production') {
        const localPath = path.join(__dirname, '..', 'data', filePath);
        try {
            await fs.access(localPath);
            return true;
        } catch (error) {
            // File doesn't exist locally, fall through to check S3
        }
    }
    
    // Check S3 (or if local check failed in dev)
    try {
        const s3Params = {
            Bucket: 'prod.makemula.ai',
            Key: filePath
        };
        
        await s3.headObject(s3Params).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}

async function testManifestBuilder() {
    console.log('🧪 Testing Manifest Builder for www.on3.com\n');

    try {
        // Get next-page targeting records
        console.log('📋 Step 1: Fetching NextPageTargeting records...');
        const nextPageTargetingRecords = await getNextPageTargetingForDomain(DOMAIN);
        console.log(`✅ Found ${nextPageTargetingRecords.length} NextPageTargeting records\n`);

        if (nextPageTargetingRecords.length === 0) {
            console.log('⚠️  No next-page targeting records found. Exiting.');
            return;
        }

        // Check which section manifests exist
        console.log('📋 Step 2: Checking which section manifests exist...\n');
        const validNextPageTargeting = [];
        const missingManifests = [];

        for (const record of nextPageTargetingRecords) {
            const sectionManifestPath = `${DOMAIN}/next-page/${record.sectionName}/manifest.json`;
            const sectionManifestExists = await checkFileExists(sectionManifestPath);
            
            // Also show local path for clarity
            const localPath = path.join(__dirname, '..', 'data', sectionManifestPath);
            
            console.log(`  Section: ${record.sectionName}`);
            console.log(`    S3 Path: ${sectionManifestPath}`);
            console.log(`    Local Path: ${localPath}`);
            console.log(`    Exists: ${sectionManifestExists ? '✅ YES' : '❌ NO'}`);
            console.log(`    Targeting: ${record.targetingType} = "${record.targetingValue}"`);
            
            if (sectionManifestExists) {
                validNextPageTargeting.push({
                    type: record.targetingType,
                    value: record.targetingValue,
                    section: record.sectionName,
                    manifest: `next-page/${record.sectionName}/manifest.json`,
                    priority: calculatePriority(record.targetingType, record.targetingValue)
                });
                console.log(`    ✅ Will be included in _nextPageTargeting\n`);
            } else {
                missingManifests.push(record.sectionName);
                console.log(`    ⚠️  Will be SKIPPED (manifest file does not exist)\n`);
            }
        }

        // Show what would be in the manifest
        console.log('📋 Step 3: Generated _nextPageTargeting array:\n');
        if (validNextPageTargeting.length > 0) {
            console.log(JSON.stringify(validNextPageTargeting, null, 2));
            console.log(`\n✅ ${validNextPageTargeting.length} section(s) would be included in the manifest`);
        } else {
            console.log('[]');
            console.log(`\n⚠️  No sections would be included (all manifests are missing)`);
        }

        if (missingManifests.length > 0) {
            console.log(`\n⚠️  ${missingManifests.length} section(s) would be skipped due to missing manifests:`);
            missingManifests.forEach(section => {
                console.log(`   - ${section}`);
            });
        }

        // Summary
        console.log('\n📊 Summary:');
        console.log(`   Total NextPageTargeting Records: ${nextPageTargetingRecords.length}`);
        console.log(`   Valid Section Manifests: ${validNextPageTargeting.length}`);
        console.log(`   Missing Section Manifests: ${missingManifests.length}`);
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
    testManifestBuilder().catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testManifestBuilder };

