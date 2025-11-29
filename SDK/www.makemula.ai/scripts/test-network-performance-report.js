#!/usr/bin/env node

/**
 * Test script for network-wide performance report functionality
 * 
 * This script tests the new network-wide aggregation feature for the
 * /mula-performance-report Slack command.
 */

require('dotenv').config();
const Bull = require('bull');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const performanceReportQueue = new Bull('performanceReportQueue', redisUrl);

async function testNetworkPerformanceReport() {
    console.log('🧪 Testing Network-Wide Performance Report Functionality...\n');
    
    try {
        // Test 1: Network-wide report with default lookback (7 days)
        console.log('📊 Test 1: Network-wide report (7 days)');
        await performanceReportQueue.add('generateReport', {
            domains: null,
            lookbackDays: 7,
            networkWide: true,
            channelId: 'test-channel',
            channelName: '#test-channel'
        });
        console.log('✅ Queued network-wide report with 7 days lookback\n');
        
        // Test 2: Network-wide report with custom lookback (14 days)
        console.log('📊 Test 2: Network-wide report (14 days)');
        await performanceReportQueue.add('generateReport', {
            domains: null,
            lookbackDays: 14,
            networkWide: true,
            channelId: 'test-channel',
            channelName: '#test-channel'
        });
        console.log('✅ Queued network-wide report with 14 days lookback\n');
        
        // Test 3: Regular domain-specific report (for comparison)
        console.log('📊 Test 3: Domain-specific report (brit.co, 7 days)');
        await performanceReportQueue.add('generateReport', {
            domains: ['brit.co'],
            lookbackDays: 7,
            networkWide: false,
            channelId: 'test-channel',
            channelName: '#test-channel'
        });
        console.log('✅ Queued domain-specific report for brit.co\n');
        
        // Test 4: All domains report (for comparison)
        console.log('📊 Test 4: All domains report (7 days)');
        await performanceReportQueue.add('generateReport', {
            domains: null,
            lookbackDays: 7,
            networkWide: false,
            channelId: 'test-channel',
            channelName: '#test-channel'
        });
        console.log('✅ Queued all domains report\n');
        
        console.log('🎉 All test jobs queued successfully!');
        console.log('\n📋 Test Summary:');
        console.log('• Network-wide aggregation (7 days)');
        console.log('• Network-wide aggregation (14 days)');
        console.log('• Domain-specific filtering (brit.co)');
        console.log('• All domains (no filtering)');
        console.log('\n💡 Check the worker logs to see how each report type is processed.');
        
    } catch (error) {
        console.error('❌ Error testing network performance report:', error);
        process.exit(1);
    } finally {
        // Close Redis connection
        await performanceReportQueue.close();
    }
}

// Allow running directly from command line
if (require.main === module) {
    testNetworkPerformanceReport()
        .then(() => {
            console.log('\n✅ Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testNetworkPerformanceReport }; 