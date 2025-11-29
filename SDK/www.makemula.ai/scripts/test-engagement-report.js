#!/usr/bin/env node

require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');

async function testEngagementReport() {
  console.log('🧪 Testing Engagement Report Query...\n');
  
  try {
    // Test with a sample domain and lookback period
    const result = await executeQuery('engagement-report', {
      parameters: {
        domain: 'example.com',
        days_back: 7
      }
    });
    
    console.log('✅ Query executed successfully!');
    console.log('Query Execution ID:', result.queryExecutionId);
    console.log('Output Location:', result.outputLocation);
    console.log('Execution Time:', result.executionTime, 'ms');
    console.log('Data Scanned:', result.dataScanned, 'bytes');
    
    if (result.data) {
      console.log('\n📊 Query Results:');
      console.log(result.data);
    } else {
      console.log('\n📊 No data returned (this might be expected for test domain)');
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testEngagementReport();
}

module.exports = { testEngagementReport };
