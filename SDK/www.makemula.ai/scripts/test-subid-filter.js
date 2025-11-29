#!/usr/bin/env node

require('dotenv').config();
const { SubidReportGenerator } = require('../helpers/SubidReportGenerator');

/**
 * Test script for Subid Report Generation
 * Uses the robust SubidReportGenerator helper with configurable lookback windows
 */

async function testSubidReport(daysBack = 30, useExportApi = true) {
  console.log('🚀 Starting Subid Report Test\n');
  console.log(`📅 Using ${daysBack} days lookback window`);
  console.log(`🚀 Using Export API: ${useExportApi}\n`);
  
  if (!process.env.IMPACT_USERNAME || !process.env.IMPACT_PASSWORD) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    return;
  }

  const generator = new SubidReportGenerator();
  
  try {
    // Generate report with mula filter enabled
    const report = await generator.generateSubidReport(daysBack, true, useExportApi);
    
    // Display console-friendly version
    generator.displayConsoleReport(report, `Subid Report (${daysBack} days)`);
    
    console.log('\n✨ Subid report test completed!');
    return report;
  } catch (error) {
    console.error('\n💥 Subid report test failed:', error.message);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let daysBack = 30; // Default to 30 days
let useExportApi = true; // Default to using export API

if (args.length > 0) {
  const parsedDays = parseInt(args[0]);
  if (!isNaN(parsedDays) && parsedDays > 0) {
    daysBack = parsedDays;
  } else {
    console.log('⚠️  Invalid daysBack parameter. Using default value of 30 days.');
  }
}

if (args.length > 1) {
  if (args[1] === '--standard') {
    useExportApi = false;
  } else if (args[1] === '--export') {
    useExportApi = true;
  }
}

testSubidReport(daysBack, useExportApi)
  .then(() => {
    console.log('\n🎉 Subid report testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Subid report testing failed:', error.message);
    process.exit(1);
  }); 