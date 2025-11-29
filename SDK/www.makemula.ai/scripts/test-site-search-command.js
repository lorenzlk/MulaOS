#!/usr/bin/env node

/**
 * Test script for /mula-site-search Slack command
 * Usage: node scripts/test-site-search-command.js <domain> [lookback_days]
 */

const { processSiteSearch } = require('../workers/siteSearchWorker');

async function testSiteSearchCommand() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node scripts/test-site-search-command.js <domain> [lookback_days]');
    console.log('Example: node scripts/test-site-search-command.js on3.com 7');
    process.exit(1);
  }
  
  const domain = args[0];
  const lookbackDays = parseInt(args[1]) || 7;
  
  console.log(`🔍 Testing site search command for ${domain} (${lookbackDays} days)`);
  
  // Mock response URL for testing
  const mockResponseUrl = 'https://hooks.slack.com/test';
  
  try {
    await processSiteSearch({
      domain,
      lookbackDays,
      responseUrl: mockResponseUrl
    });
    
    console.log('✅ Site search command test completed successfully');
  } catch (error) {
    console.error('❌ Site search command test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSiteSearchCommand();
