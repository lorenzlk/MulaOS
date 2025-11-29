#!/usr/bin/env node

require('dotenv').config();
const { subidReportQueue } = require('../workers/subidReportWorker');

/**
 * Test script for Worker Integration
 * Tests the subidReportWorker with the new SubidReportGenerator
 */

async function testWorkerIntegration() {
  console.log('🚀 Testing Worker Integration with SubidReportGenerator\n');
  
  try {
    // Test different report configurations
    const testJobs = [
      {
        name: '7-day Standard Report',
        data: { daysBack: 7, filterMula: false, useExportApi: false }
      },
      {
        name: '3-day Mula-Only Export Report',
        data: { daysBack: 3, filterMula: true, useExportApi: true }
      },
      {
        name: '1-day Mula-Only Standard Report',
        data: { daysBack: 1, filterMula: true, useExportApi: false }
      }
    ];

    for (const testJob of testJobs) {
      console.log(`\n📋 Adding job: ${testJob.name}`);
      console.log(`📊 Parameters:`, testJob.data);
      
      const job = await subidReportQueue.add('generateSubidReport', testJob.data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      
      console.log(`✅ Job added with ID: ${job.id}`);
      
      // Wait a bit between jobs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎯 All test jobs added to queue successfully!');
    console.log('📊 Check the worker logs to see them being processed.');
    
    // Show queue status
    const waiting = await subidReportQueue.getWaiting();
    const active = await subidReportQueue.getActive();
    const completed = await subidReportQueue.getCompleted();
    const failed = await subidReportQueue.getFailed();
    
    console.log('\n📊 Queue Status:');
    console.log(`   Waiting: ${waiting.length}`);
    console.log(`   Active: ${active.length}`);
    console.log(`   Completed: ${completed.length}`);
    console.log(`   Failed: ${failed.length}`);
    
  } catch (error) {
    console.error('❌ Worker integration test failed:', error.message);
    throw error;
  }
}

// Run the test
testWorkerIntegration()
  .then(() => {
    console.log('\n🎉 Worker integration test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Worker integration test failed:', error.message);
    process.exit(1);
  });
