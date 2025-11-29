#!/usr/bin/env node

require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');
const path = require('path');

async function testOptimizedEngagementReport() {
  console.log('🧪 Testing Optimized Engagement Report for on3.com (3 days)...\n');
  
  try {
    // Test with on3.com domain and 3-day lookback
    const result = await executeQuery('engagement-report', {
      parameters: {
        domain: 'www.on3.com',
        days_back: 3
      }
    });
    
    console.log('✅ Query executed successfully!');
    console.log('Query Execution ID:', result.queryExecutionId);
    console.log('Output Location:', result.outputLocation);
    console.log('Execution Time:', result.executionTime, 'ms');
    console.log('Data Scanned:', result.dataScanned, 'bytes');
    
    // Extract timestamp from output location and construct local file path
    const timestamp = result.outputLocation.split('/').slice(-2, -1)[0];
    const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', 'engagement-report', timestamp, `${result.queryExecutionId}.csv`);
    
    console.log('\n📁 Local CSV file path:', localFilePath);
    
    // Read the CSV file manually (executeQuery only downloads, doesn't return content)
    const fs = require('fs').promises;
    try {
      const csvContent = await fs.readFile(localFilePath, 'utf8');
      console.log('\n📊 CSV Content Preview:');
      console.log(csvContent.substring(0, 500) + '...');
    } catch (error) {
      console.log('\n❌ Failed to read CSV file:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testOptimizedEngagementReport();
}

module.exports = { testOptimizedEngagementReport };
