#!/usr/bin/env node

require('dotenv').config();
const { ImpactDataCollector } = require('../helpers/ImpactDataCollector');

/**
 * Test script for collecting individual click and action records from Impact API
 * Uses both the Actions report (mp_action_listing_fast) and Clicks report (ClickExport)
 * Based on: https://integrations.impact.com/impact-publisher/reference/export-reports
 * and: https://integrations.impact.com/impact-publisher/reference/clicks-overview
 */

async function testImpactDataCollection() {
  console.log('🚀 Testing Impact Data Collection for Individual Records\n');
  
  const collector = new ImpactDataCollector();
  
  // Calculate date range for last 7 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const baseOptions = {
    startDate,
    endDate,
    subId1: 'mula',
    resultFormat: 'JSON'
  };

  console.log('📅 Date range:', `${startDate} to ${endDate}`);
  console.log('📋 Base options:', baseOptions);

  try {
    // Test 1: Get Action Records (we know this works)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Individual Action Records');
    console.log('='.repeat(60));
    console.log('Using: mp_action_listing_fast report');
    console.log('Description: Displays data for each individual action that has been credited to you.');
    
    const actionRecords = await collector.getActionRecords(baseOptions);
    collector.displayData(actionRecords, 'actions');
    
    // Analyze action data for subId2/subId3
    const actionsWithSubId2 = actionRecords.filter(record => record.subId2);
    const actionsWithSubId3 = actionRecords.filter(record => record.subId3);
    
    console.log(`\n📊 Action Analysis:`);
    console.log(`   Total actions: ${actionRecords.length}`);
    console.log(`   Actions with subId2: ${actionsWithSubId2.length}`);
    console.log(`   Actions with subId3: ${actionsWithSubId3.length}`);
    
    if (actionsWithSubId2.length > 0) {
      console.log(`\n🎯 Sample actions with subId2:`);
      actionsWithSubId2.slice(0, 3).forEach((action, index) => {
        console.log(`   ${index + 1}. SubId1: ${action.subId1}, SubId2: ${action.subId2}, SubId3: ${action.subId3}, Earnings: $${action.earnings.toFixed(2)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error collecting action records:', error.message);
  }

  try {
    // Test 2: Get Click Records (using ClickExport endpoint)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Individual Click Records');
    console.log('='.repeat(60));
    console.log('Using: ClickExport endpoint');
    console.log('Description: Individual click events with detailed attribution');
    
    const clickRecords = await collector.getClickRecords(baseOptions);
    collector.displayData(clickRecords, 'clicks');
    
    // Analyze click data for subId2/subId3
    const clicksWithSubId2 = clickRecords.filter(record => record.subId2);
    const clicksWithSubId3 = clickRecords.filter(record => record.subId3);
    
    console.log(`\n📊 Click Analysis:`);
    console.log(`   Total clicks: ${clickRecords.length}`);
    console.log(`   Clicks with subId2: ${clicksWithSubId2.length}`);
    console.log(`   Clicks with subId3: ${clicksWithSubId3.length}`);
    
    if (clicksWithSubId2.length > 0) {
      console.log(`\n🎯 Sample clicks with subId2:`);
      clicksWithSubId2.slice(0, 3).forEach((click, index) => {
        console.log(`   ${index + 1}. SubId1: ${click.subId1}, SubId2: ${click.subId2}, SubId3: ${click.subId3}, Date: ${click.clickDate}`);
      });
    }

  } catch (error) {
    console.error('❌ Error collecting click records:', error.message);
  }

  try {
    // Test 3: Get Combined Data
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Combined Click and Action Data');
    console.log('='.repeat(60));
    console.log('Getting both clicks and actions in parallel');
    
    const combinedData = await collector.getClickAndActionData(baseOptions);
    
    console.log('\n📊 Combined Data Summary:');
    console.log(`   Total Clicks: ${combinedData.summary.clickCount}`);
    console.log(`   Total Actions: ${combinedData.summary.actionCount}`);
    console.log(`   Total Earnings: $${combinedData.summary.totalEarnings.toFixed(2)}`);
    console.log(`   Total Sales: $${combinedData.summary.totalSales.toFixed(2)}`);
    
    // Look for records with subId2
    const allRecordsWithSubId2 = [
      ...combinedData.clicks.filter(record => record.subId2),
      ...combinedData.actions.filter(record => record.subId2)
    ];
    
    if (allRecordsWithSubId2.length > 0) {
      console.log(`\n🎯 Found ${allRecordsWithSubId2.length} total records with subId2`);
      console.log('📋 Sample records with subId2:');
      allRecordsWithSubId2.slice(0, 5).forEach((record, index) => {
        const type = record.actionId ? 'Action' : 'Click';
        console.log(`   ${index + 1}. ${type} - SubId1: ${record.subId1}, SubId2: ${record.subId2}, SubId3: ${record.subId3}`);
      });
    } else {
      console.log('\n❌ No records with subId2 found');
      console.log('💡 This suggests:');
      console.log('   - subId2 is not being passed in tracking URLs yet');
      console.log('   - Need to implement subId2 in the SDK');
      console.log('   - Check if subId2 is being passed correctly');
    }

  } catch (error) {
    console.error('❌ Error collecting combined data:', error.message);
  }

  try {
    // Test 4: Test with subId2 filter (if we have any)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Filter by subId2 (if available)');
    console.log('='.repeat(60));
    
    // First, let's see if we can find any subId2 values
    const allActionRecords = await collector.getActionRecords({
      ...baseOptions,
      // Remove subId1 filter to get all records
      subId1: null
    });
    
    const uniqueSubId2s = [...new Set(allActionRecords.map(record => record.subId2).filter(Boolean))];
    
    if (uniqueSubId2s.length > 0) {
      console.log(`\n🎯 Found ${uniqueSubId2s.length} unique subId2 values`);
      console.log('📋 Sample subId2s:', uniqueSubId2s.slice(0, 5));
      
      // Test with the first subId2
      const testSubId2 = uniqueSubId2s[0];
      console.log(`\n🔍 Testing with subId2: ${testSubId2}`);
      
      const filteredActions = await collector.getActionRecords({
        ...baseOptions,
        subId2: testSubId2
      });
      
      console.log(`📊 Filtered actions for subId2 '${testSubId2}': ${filteredActions.length}`);
      collector.displayData(filteredActions, 'filtered actions');
      
    } else {
      console.log('❌ No subId2 values found in action records');
      console.log('💡 This means:');
      console.log('   - subId2 is not being passed in tracking URLs');
      console.log('   - Need to implement subId2 in the SDK');
      console.log('   - Check the BootLoader.js implementation');
    }

  } catch (error) {
    console.error('❌ Error testing subId2 filter:', error.message);
  }

  console.log('\n✨ Impact data collection testing completed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Action records: Available via mp_action_listing_fast');
  console.log('   ❓ Click records: Testing via ClickExport endpoint');
  console.log('   ✅ Attribution fields: SubId1, SubId2, SubId3 supported');
  console.log('   💡 Next step: Implement subId2/subId3 in tracking URLs');
}

// Run the test
testImpactDataCollection()
  .then(() => {
    console.log('\n🎉 Impact data collection testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Impact data collection testing failed:', error.message);
    process.exit(1);
  });
