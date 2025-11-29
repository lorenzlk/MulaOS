#!/usr/bin/env node

/**
 * Test script for performance report with revenue/RPM time series
 * 
 * This script directly calls processPerformanceReport to test revenue and RPM
 * time series functionality locally against production database.
 * 
 * Usage:
 *   node scripts/test-performance-report-revenue.js [domain] [lookbackDays] [channelId]
 * 
 * Example:
 *   node scripts/test-performance-report-revenue.js www.on3.com 7 C1234567890
 */

require('dotenv').config();
const { processPerformanceReport } = require('../workers/performanceReportWorker');

async function testPerformanceReportWithRevenue() {
    // Get arguments
    const domain = process.argv[2] || 'www.on3.com';
    const lookbackDays = parseInt(process.argv[3]) || 7;
    const channelId = process.argv[4] || process.env.SLACK_REPORTS_CHANNEL || '#test-channel';
    
    console.log('🧪 Testing Performance Report with Revenue/RPM Time Series\n');
    console.log(`Domain: ${domain}`);
    console.log(`Lookback Days: ${lookbackDays}`);
    console.log(`Slack Channel: ${channelId}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : '❌ Missing DATABASE_URL'}`);
    console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`AWS Credentials: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    
    // Validate required environment variables
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERROR: DATABASE_URL is required');
        console.error('   Set it in your .env file to point to production database');
        process.exit(1);
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('❌ ERROR: AWS credentials are required for Athena queries');
        console.error('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
        process.exit(1);
    }
    
    try {
        // Create a mock job object (same structure as Bull job)
        const mockJob = {
            data: {
                domains: [domain],
                lookbackDays: lookbackDays,
                networkWide: false,
                channelId: channelId,
                channelName: channelId
            }
        };
        
        console.log('🚀 Starting performance report generation...\n');
        
        // Call the worker directly
        await processPerformanceReport(mockJob);
        
        console.log('\n✅ Performance report generated successfully!');
        console.log('\n📊 Check the Slack channel for the report with revenue and RPM charts.');
        console.log('   If you want to inspect the data without sending to Slack,');
        console.log('   you can modify the script to log the data instead.');
        
    } catch (error) {
        console.error('\n❌ Error generating performance report:', error);
        console.error('\nStack trace:');
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testPerformanceReportWithRevenue()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { testPerformanceReportWithRevenue };

