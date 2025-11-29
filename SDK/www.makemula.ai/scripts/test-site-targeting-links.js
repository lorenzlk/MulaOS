require('dotenv').config();
const { sequelize, SiteTargeting, Search } = require('../models');
const { listSiteTargeting } = require('../helpers/SiteTargetingHelpers');

async function testSiteTargetingLinks() {
  try {
    console.log('🧪 Testing Site Targeting Link Functionality\n');

    // Test 1: Create a test search record
    console.log('1. Creating test search record...');
    const testSearch = await Search.create({
      phrase: 'test search phrase for links',
      phraseID: 'test-phrase-id-123',
      status: 'approved',
      platform: 'amazon',
      platformConfig: { searchIndex: 'All' }
    });
    console.log(`   ✅ Created search record: ID=${testSearch.id}, Phrase="${testSearch.phrase}"`);

    // Test 2: Create a test targeting record
    console.log('\n2. Creating test targeting record...');
    const testTargeting = await SiteTargeting.create({
      topLevelDomain: 'test-links.com',
      targetingType: 'path_substring',
      targetingValue: '/test/',
      searchPhrase: testSearch.phrase,
      channelId: 'C1234567890',
      channelName: '#test-channel'
    });
    console.log(`   ✅ Created targeting record: ID=${testTargeting.id}, SearchPhrase="${testTargeting.searchPhrase}"`);

    // Test 3: Test listSiteTargeting with search info
    console.log('\n3. Testing listSiteTargeting with search info...');
    const records = await listSiteTargeting('test-links.com');
    console.log(`   📋 Found ${records.length} records for test-links.com`);
    
    if (records.length > 0) {
      const record = records[0];
      console.log(`   📝 Record details:`);
      console.log(`      - ID: ${record.id}`);
      console.log(`      - Search Phrase: "${record.searchPhrase}"`);
      console.log(`      - Search Info: ${record.search ? `ID=${record.search.id}, Status=${record.search.status}` : 'None'}`);
      
      // Test 4: Simulate Slack formatting
      console.log('\n4. Testing Slack link formatting...');
      if (record.search && record.search.id) {
        const searchUrl = `https://app.makemula.ai/searches/${record.search.id}`;
        const slackLink = `<${searchUrl}|${record.searchPhrase}>`;
        console.log(`   🔗 Slack link format: ${slackLink}`);
        console.log(`   🔗 Full URL: ${searchUrl}`);
      } else {
        console.log(`   ⚠️  No search info available for link generation`);
      }
    }

    // Test 5: Clean up
    console.log('\n5. Cleaning up test records...');
    await testTargeting.destroy();
    await testSearch.destroy();
    console.log('   ✅ Cleaned up test records');

    console.log('\n🎉 Site targeting link tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testSiteTargetingLinks();
