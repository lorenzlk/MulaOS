#!/usr/bin/env node

require('dotenv').config();
const Bull = require('bull');

/**
 * Test script for subid Slack command
 * Simulates the Slack command by adding a job to the queue
 */

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const subidReportQueue = new Bull('subidReportQueue', redisUrl);

async function testSubidCommand() {
  console.log('🧪 Testing Subid Slack Command');
  console.log('==============================');
  
  try {
    // Test parameters
    const testData = {
      daysBack: 7,
      filterMula: false,
      channelId: 'test-channel',
      channelName: '#test-channel'
    };
    
    console.log('📊 Test Parameters:', testData);
    
    // Add job to queue
    const job = await subidReportQueue.add('generateSubidReport', testData);
    
    console.log('✅ Job added to queue:', job.id);
    console.log('📋 Job data:', job.data);
    
    // Wait a moment for processing
    console.log('⏳ Waiting for job processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check job status
    const jobStatus = await job.getState();
    console.log('📊 Job status:', jobStatus);
    
    if (jobStatus === 'completed') {
      console.log('✅ Job completed successfully!');
    } else if (jobStatus === 'failed') {
      console.log('❌ Job failed');
      const failedReason = await job.failedReason;
      console.log('💥 Failure reason:', failedReason);
    } else {
      console.log('⏳ Job still processing...');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    // Clean up
    await subidReportQueue.close();
    process.exit(0);
  }
}

// Run the test
testSubidCommand(); 