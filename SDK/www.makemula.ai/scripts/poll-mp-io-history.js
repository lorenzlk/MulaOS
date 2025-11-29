#!/usr/bin/env node

require('dotenv').config();
const { ImpactReportExporter } = require('../helpers/ImpactReportExporter');

/**
 * Poll the mp_io_history job to see what data we get
 */

async function pollMpIoHistory() {
  console.log('🚀 Polling mp_io_history job\n');
  
  const exporter = new ImpactReportExporter();
  
  // The job ID from the previous test
  const jobId = '00be8421-5a1b-4bcc-bbd9-693f6709a6db';
  
  try {
    console.log(`🔍 Polling job: ${jobId}`);
    
    const jobResult = await exporter.pollJob(jobId, 10, 5); // 10 attempts, 5 second intervals
    
    console.log('\n📊 Job completed! Processing data...');
    console.log('📄 Raw job result:', JSON.stringify(jobResult, null, 2));
    
    // Try to process the data
    if (Array.isArray(jobResult)) {
      console.log(`\n📊 Found ${jobResult.length} records`);
      
      if (jobResult.length > 0) {
        console.log('\n📄 Sample record:');
        console.log(JSON.stringify(jobResult[0], null, 2));
        
        // Check for subId fields
        const sampleRecord = jobResult[0];
        const subIdFields = Object.keys(sampleRecord).filter(key => 
          key.toLowerCase().includes('subid') || 
          key.toLowerCase().includes('sub_id')
        );
        
        console.log('\n🎯 SubId-related fields found:');
        subIdFields.forEach(field => {
          console.log(`   ${field}: ${sampleRecord[field]}`);
        });
      }
    } else if (jobResult.Records && Array.isArray(jobResult.Records)) {
      console.log(`\n📊 Found ${jobResult.Records.length} records in Records array`);
      
      if (jobResult.Records.length > 0) {
        console.log('\n📄 Sample record:');
        console.log(JSON.stringify(jobResult.Records[0], null, 2));
        
        // Check for subId fields
        const sampleRecord = jobResult.Records[0];
        const subIdFields = Object.keys(sampleRecord).filter(key => 
          key.toLowerCase().includes('subid') || 
          key.toLowerCase().includes('sub_id')
        );
        
        console.log('\n🎯 SubId-related fields found:');
        subIdFields.forEach(field => {
          console.log(`   ${field}: ${sampleRecord[field]}`);
        });
      }
    } else {
      console.log('\n📄 Unexpected data format:', typeof jobResult);
      console.log('📄 Sample data:', JSON.stringify(jobResult, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error polling job:', error.message);
  }
}

// Run the poll
pollMpIoHistory()
  .then(() => {
    console.log('\n🎉 Polling completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Polling failed:', error.message);
    process.exit(1);
  });
