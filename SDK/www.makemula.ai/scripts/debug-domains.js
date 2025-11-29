#!/usr/bin/env node

require('dotenv').config();
const { executeQuery } = require('../queries/utils/query-runner');

async function debugDomains() {
  console.log('🔍 Debugging available domains and data...\n');
  
  try {
    // First, let's see what domains exist
    console.log('📊 Checking available domains...');
    const domainResult = await executeQuery('test-domains', {
      parameters: {}
    });
    
    if (domainResult && domainResult.data) {
      console.log('✅ Domain query results:');
      console.log(domainResult.data);
    }
    
  } catch (error) {
    console.error('❌ Domain query failed:', error);
    
    // Try a simpler approach - let's create a basic query to see what's available
    console.log('\n🔄 Trying alternative approach...');
    
    try {
      const simpleResult = await executeQuery('test-sample-data', {
        parameters: {}
      });
      
      if (simpleResult && simpleResult.data) {
        console.log('✅ Simple query results:');
        console.log(simpleResult.data);
      }
      
    } catch (simpleError) {
      console.error('❌ Simple query also failed:', simpleError);
    }
  }
}

// Run the debug
if (require.main === module) {
  debugDomains();
}

module.exports = { debugDomains };
