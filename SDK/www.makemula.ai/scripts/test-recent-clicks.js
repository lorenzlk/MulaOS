#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * Quick test to check for recent click data
 */

async function testRecentClicks() {
  console.log('🔍 Testing for recent click data...\n');
  
  const { impact } = config;
  const url = `${impact.baseUrl}/${impact.accountId}/Reports/partner_payable_click_data`;
  
  console.log('📡 Making request to:', url);
  
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
      console.log(`📋 Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log('✅ Click Data Retrieved:');
            console.log('📄 Response format:', typeof response);
            
            if (response && response.Records && Array.isArray(response.Records)) {
              console.log(`📊 Total click records: ${response.Records.length}`);
              
              // Look for recent clicks with subid
              const recentClicks = response.Records.slice(0, 10);
              console.log('\n📋 Recent click records:');
              recentClicks.forEach((click, index) => {
                console.log(`\n${index + 1}. Click Record:`);
                console.log(`   Date: ${click.Date || 'N/A'}`);
                console.log(`   Sub ID: ${click.pubsubid1_ || 'N/A'}`);
                console.log(`   Campaign: ${click.Campaign || 'N/A'}`);
                console.log(`   Referring URL: ${click.ReferringURL || 'N/A'}`);
              });
              
              // Check specifically for 'mula' subid
              const mulaClicks = response.Records.filter(click => 
                click.pubsubid1_ && click.pubsubid1_.toLowerCase().includes('mula')
              );
              
              if (mulaClicks.length > 0) {
                console.log('\n🎉 Found Mula clicks!');
                mulaClicks.forEach((click, index) => {
                  console.log(`\nMula Click ${index + 1}:`);
                  console.log(`   Sub ID: ${click.pubsubid1_}`);
                  console.log(`   Date: ${click.Date || 'N/A'}`);
                  console.log(`   Campaign: ${click.Campaign || 'N/A'}`);
                });
              } else {
                console.log('\n❌ No Mula clicks found yet (may need time to process)');
              }
            } else {
              console.log('📄 Raw response:', JSON.stringify(response, null, 2));
            }
          } else {
            console.log('❌ Failed to get click data');
            console.log('📄 Response:', data);
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.log('📄 Raw response:', data);
        }
        
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run the test
testRecentClicks()
  .then(() => {
    console.log('\n✨ Click test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Click test failed:', error.message);
    process.exit(1);
  }); 