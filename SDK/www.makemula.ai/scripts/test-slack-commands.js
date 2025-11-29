#!/usr/bin/env node

require('dotenv').config();
const Bull = require('bull');

/**
 * Test script for Slack commands
 * Tests both subid report and A/B test commands
 */

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';

async function testSlackCommands() {
  console.log('🧪 Testing Slack Commands');
  console.log('=========================');
  
  try {
    // Test subid report command
    console.log('\n📊 Testing Subid Report Command...');
    const subidReportQueue = new Bull('subidReportQueue', redisUrl);
    
    const subidTestData = {
      daysBack: 7,
      filterMula: false,
      channelId: 'test-channel',
      channelName: '#test-channel'
    };
    
    const subidJob = await subidReportQueue.add('generateSubidReport', subidTestData);
    console.log('✅ Subid report job added:', subidJob.id);
    
    // Test A/B test command
    console.log('\n🧪 Testing A/B Test Command...');
    const abTestQueue = new Bull('abTestQueue', redisUrl);
    
    const abTestData = {
      daysBack: 7,
      experimentName: 'smartscroll_button_variant',
      useCached: true,
      channelId: 'test-channel',
      channelName: '#test-channel'
    };
    
    const abTestJob = await abTestQueue.add('generateABTestReport', abTestData);
    console.log('✅ A/B test job added:', abTestJob.id);
    
    // Wait for processing
    console.log('\n⏳ Waiting for job processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check job statuses
    const subidStatus = await subidJob.getState();
    const abTestStatus = await abTestJob.getState();
    
    console.log('\n📊 Job Status:');
    console.log(`Subid Report: ${subidStatus}`);
    console.log(`A/B Test: ${abTestStatus}`);
    
    if (subidStatus === 'failed') {
      const subidError = await subidJob.failedReason;
      console.log('💥 Subid Report Error:', subidError);
    }
    
    if (abTestStatus === 'failed') {
      const abTestError = await abTestJob.failedReason;
      console.log('💥 A/B Test Error:', abTestError);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    // Clean up
    process.exit(0);
  }
}

// Run the test
testSlackCommands(); 