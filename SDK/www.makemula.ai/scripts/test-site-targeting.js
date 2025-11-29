require('dotenv').config();
const { sequelize, SiteTargeting } = require('../models');
const { 
  addSiteTargeting, 
  listSiteTargeting, 
  removeSiteTargeting, 
  checkTargetingMatch 
} = require('../helpers/SiteTargetingHelpers');

async function testSiteTargeting() {
  try {
    console.log('🧪 Testing Site Targeting Functionality\n');

    // Test 1: Add targeting records
    console.log('1. Adding test targeting records...');
    
    const testRecords = [
      {
        topLevelDomain: 'test.com',
        targetingType: 'path_substring',
        targetingValue: '/fashion/',
        searchPhrase: 'fashion trends for women',
        channelId: 'C1234567890',
        channelName: '#test-channel'
      },
      {
        topLevelDomain: 'test.com',
        targetingType: 'url_pattern',
        targetingValue: '.*\\/beauty\\/.*',
        searchPhrase: 'beauty products and tips',
        channelId: 'C1234567890',
        channelName: '#test-channel'
      },
      {
        topLevelDomain: 'test.com',
        targetingType: 'ld_json',
        targetingValue: 'Style Trends',
        searchPhrase: 'style and fashion advice',
        channelId: 'C1234567890',
        channelName: '#test-channel'
      }
    ];

    const createdRecords = [];
    for (const record of testRecords) {
      const created = await addSiteTargeting(
        record.topLevelDomain,
        record.targetingType,
        record.targetingValue,
        record.searchPhrase,
        record.channelId,
        record.channelName
      );
      createdRecords.push(created);
      console.log(`   ✅ Added record ${created.id}: ${record.targetingType} = ${record.targetingValue}`);
    }

    // Test 2: List targeting records
    console.log('\n2. Listing all targeting records...');
    const allRecords = await listSiteTargeting();
    console.log(`   📋 Found ${allRecords.length} total records`);

    const domainRecords = await listSiteTargeting('test.com');
    console.log(`   📋 Found ${domainRecords.length} records for test.com`);
    
    // Test 2.1: Verify search information is included
    console.log('\n2.1. Verifying search information is included...');
    for (const record of domainRecords) {
      if (record.search) {
        console.log(`   ✅ Record ${record.id} has search info: ID=${record.search.id}, Status=${record.search.status}`);
      } else {
        console.log(`   ⚠️  Record ${record.id} has no search info (search phrase: "${record.searchPhrase}")`);
      }
    }

    // Test 3: Test targeting matches
    console.log('\n3. Testing targeting matches...');
    
    const testCases = [
      {
        url: 'https://test.com/fashion/summer-trends',
        pageContext: null,
        expectedType: 'path_substring'
      },
      {
        url: 'https://test.com/beauty/skincare-routine',
        pageContext: null,
        expectedType: 'url_pattern'
      },
      {
        url: 'https://test.com/lifestyle/article',
        pageContext: 'Style Trends & Inspiration',
        expectedType: 'ld_json'
      },
      {
        url: 'https://test.com/random/page',
        pageContext: null,
        expectedType: null
      }
    ];

    for (const testCase of testCases) {
      const match = await checkTargetingMatch(
        testCase.url, 
        'test.com', 
        testCase.pageContext
      );
      
      if (match) {
        console.log(`   ✅ Match found for ${testCase.url}: ${match.targetingType} = ${match.targetingValue}`);
        if (match.targetingType !== testCase.expectedType) {
          console.log(`   ⚠️  Expected ${testCase.expectedType}, got ${match.targetingType}`);
        }
      } else {
        console.log(`   ❌ No match found for ${testCase.url}`);
        if (testCase.expectedType) {
          console.log(`   ⚠️  Expected ${testCase.expectedType} match`);
        }
      }
    }

    // Test 4: Remove targeting records
    console.log('\n4. Cleaning up test records...');
    for (const record of createdRecords) {
      const removed = await removeSiteTargeting(record.id);
      if (removed) {
        console.log(`   ✅ Removed record ${record.id}`);
      } else {
        console.log(`   ❌ Failed to remove record ${record.id}`);
      }
    }

    console.log('\n🎉 Site targeting tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testSiteTargeting(); 