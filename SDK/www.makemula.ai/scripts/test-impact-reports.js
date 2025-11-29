#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');

/**
 * Test Impact.com API credentials and list available reports
 * Based on: https://integrations.impact.com/impact-publisher/reference/list-reports
 */

async function testImpactReports() {
  console.log('🔍 Testing Impact.com API credentials and listing reports...\n');
  
  const { impact } = config;
  
  if (!impact.username || !impact.password) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set the following environment variables:');
    console.log('  IMPACT_USERNAME');
    console.log('  IMPACT_PASSWORD');
    console.log('\nCurrent config:');
    console.log(`  Account ID: ${impact.accountId}`);
    console.log(`  Username: ${impact.username ? '***SET***' : 'NOT SET'}`);
    console.log(`  Password: ${impact.password ? '***SET***' : 'NOT SET'}`);
    return;
  }

  const url = `${impact.baseUrl}/${impact.accountId}/Reports`;
  
  console.log('📋 Making request to:', url);
  console.log('🔑 Using credentials:', `${impact.username}:***`);
  console.log('');

  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mula-Impact-Test/1.0'
      },
      auth: `${impact.username}:${impact.password}`
    };

    const req = https.request(url, options, (res) => {
      console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Response Headers:`, res.headers);
      console.log('');

      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const reports = JSON.parse(data);
            console.log('✅ Success! Available reports:');
            console.log('');
            
            if (reports && Array.isArray(reports)) {
              reports.forEach((report, index) => {
                console.log(`${index + 1}. ${report.name || 'Unnamed Report'}`);
                if (report.description) {
                  console.log(`   Description: ${report.description}`);
                }
                if (report.id) {
                  console.log(`   ID: ${report.id}`);
                }
                console.log('');
              });
              
              console.log(`📊 Total reports available: ${reports.length}`);
            } else {
              console.log('📄 Raw response:', JSON.stringify(reports, null, 2));
            }
          } else {
            console.error('❌ API request failed');
            console.log('📄 Response body:', data);
          }
        } catch (error) {
          console.error('❌ Failed to parse JSON response:', error.message);
          console.log('📄 Raw response:', data);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Run the test
testImpactReports()
  .then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }); 