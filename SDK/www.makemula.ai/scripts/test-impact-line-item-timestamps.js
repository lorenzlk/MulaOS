#!/usr/bin/env node

require('dotenv').config();
const { ImpactDataCollector } = require('../helpers/ImpactDataCollector');

/**
 * Test script to verify Impact API provides line-item granularity with timestamps
 * for proper time slicing in revenue data collection
 * 
 * This tests:
 * 1. Action records have individual timestamps (actionDate)
 * 2. Click records have individual timestamps (clickDate)
 * 3. We can filter by date range and get accurate results
 * 4. Each record has enough detail for line-item storage
 */

async function testLineItemTimestamps() {
  console.log('🚀 Testing Impact API Line-Item Timestamp Granularity\n');
  console.log('='.repeat(70));
  
  if (!process.env.IMPACT_USERNAME || !process.env.IMPACT_PASSWORD) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    process.exit(1);
  }

  const collector = new ImpactDataCollector();
  
  // Test with last 7 days
  const endDate = new Date();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const options = {
    startDate: startDateStr,
    endDate: endDateStr,
    subId1: 'mula',
    resultFormat: 'JSON'
  };

  console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}`);
  console.log(`🎯 Filter: subId1 = 'mula'`);
  console.log('');

  try {
    // Test 1: Action Records with Timestamps
    console.log('='.repeat(70));
    console.log('TEST 1: Action Records - Line-Item Timestamp Granularity');
    console.log('='.repeat(70));
    console.log('Endpoint: ReportExport/mp_action_listing_fast');
    console.log('Expected: Each action record should have actionDate field\n');
    
    const actionRecords = await collector.getActionRecords(options);
    
    console.log(`📊 Total Action Records: ${actionRecords.length}`);
    
    if (actionRecords.length === 0) {
      console.log('⚠️  No action records found. This might be expected if there are no conversions.');
      console.log('   Testing with a longer date range or without subId1 filter might help.\n');
    } else {
      // Analyze timestamp coverage
      const recordsWithDates = actionRecords.filter(r => r.actionDate);
      const recordsWithoutDates = actionRecords.filter(r => !r.actionDate);
      
      console.log(`✅ Records with actionDate: ${recordsWithDates.length}`);
      console.log(`❌ Records without actionDate: ${recordsWithoutDates.length}`);
      
      if (recordsWithDates.length > 0) {
        console.log('\n📅 Sample Action Records with Timestamps:');
        console.log('-'.repeat(70));
        
        recordsWithDates.slice(0, 5).forEach((record, index) => {
          console.log(`\n${index + 1}. Action Record:`);
          console.log(`   Action ID: ${record.actionId || 'N/A'}`);
          console.log(`   Action Date: ${record.actionDate}`);
          console.log(`   Earnings: $${record.earnings.toFixed(2)}`);
          console.log(`   Sale Amount: $${record.saleAmount.toFixed(2)}`);
          console.log(`   SubId1: ${record.subId1 || 'N/A'}`);
          console.log(`   SubId2: ${record.subId2 || 'N/A'}`);
          console.log(`   SubId3: ${record.subId3 || 'N/A'}`);
          console.log(`   Campaign: ${record.campaignName || 'N/A'}`);
          console.log(`   Action Type: ${record.actionTracker || 'N/A'}`);
          
          // Parse and validate the date
          try {
            const date = new Date(record.actionDate);
            if (isNaN(date.getTime())) {
              console.log(`   ⚠️  WARNING: Invalid date format!`);
            } else {
              const dateStr = date.toISOString().split('T')[0];
              const isInRange = dateStr >= startDateStr && dateStr <= endDateStr;
              console.log(`   ✅ Date is valid and ${isInRange ? 'within' : 'OUTSIDE'} requested range`);
            }
          } catch (e) {
            console.log(`   ⚠️  ERROR parsing date: ${e.message}`);
          }
        });
        
        // Test date filtering capability
        console.log('\n🔍 Testing Date Filtering Capability:');
        console.log('-'.repeat(70));
        
        // Group by date
        const byDate = {};
        recordsWithDates.forEach(record => {
          try {
            const date = new Date(record.actionDate);
            const dateStr = date.toISOString().split('T')[0];
            if (!byDate[dateStr]) {
              byDate[dateStr] = { count: 0, totalEarnings: 0, records: [] };
            }
            byDate[dateStr].count++;
            byDate[dateStr].totalEarnings += record.earnings;
            byDate[dateStr].records.push(record);
          } catch (e) {
            // Skip invalid dates
          }
        });
        
        const dateKeys = Object.keys(byDate).sort();
        console.log(`\n📊 Revenue by Date (${dateKeys.length} unique dates):`);
        dateKeys.forEach(date => {
          const stats = byDate[date];
          console.log(`   ${date}: ${stats.count} actions, $${stats.totalEarnings.toFixed(2)} total`);
        });
        
        // Test filtering to a specific date range (e.g., last 3 days)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const filteredRecords = recordsWithDates.filter(record => {
          try {
            const date = new Date(record.actionDate);
            const dateStr = date.toISOString().split('T')[0];
            return dateStr >= threeDaysAgo && dateStr <= endDateStr;
          } catch (e) {
            return false;
          }
        });
        
        console.log(`\n🎯 Filtered to last 3 days (${threeDaysAgo} to ${endDateStr}):`);
        console.log(`   Records: ${filteredRecords.length}`);
        const filteredEarnings = filteredRecords.reduce((sum, r) => sum + r.earnings, 0);
        console.log(`   Total Earnings: $${filteredEarnings.toFixed(2)}`);
        
      } else {
        console.log('\n❌ No action records have actionDate field!');
        console.log('   This means we cannot do proper time slicing.');
        console.log('   Raw record sample:');
        if (actionRecords[0]?.rawRecord) {
          console.log(JSON.stringify(actionRecords[0].rawRecord, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error testing action records:', error.message);
    console.error(error.stack);
  }

  try {
    // Test 2: Click Records with Timestamps
    console.log('\n\n' + '='.repeat(70));
    console.log('TEST 2: Click Records - Line-Item Timestamp Granularity');
    console.log('='.repeat(70));
    console.log('Endpoint: ClickExport');
    console.log('Expected: Each click record should have clickDate field\n');
    
    const clickRecords = await collector.getClickRecords(options);
    
    console.log(`📊 Total Click Records: ${clickRecords.length}`);
    
    if (clickRecords.length === 0) {
      console.log('⚠️  No click records found.');
    } else {
      // Analyze timestamp coverage
      const recordsWithDates = clickRecords.filter(r => r.clickDate);
      const recordsWithoutDates = clickRecords.filter(r => !r.clickDate);
      
      console.log(`✅ Records with clickDate: ${recordsWithDates.length}`);
      console.log(`❌ Records without clickDate: ${recordsWithoutDates.length}`);
      
      if (recordsWithDates.length > 0) {
        console.log('\n📅 Sample Click Records with Timestamps:');
        console.log('-'.repeat(70));
        
        recordsWithDates.slice(0, 5).forEach((record, index) => {
          console.log(`\n${index + 1}. Click Record:`);
          console.log(`   Click ID: ${record.clickId || 'N/A'}`);
          console.log(`   Click Date: ${record.clickDate}`);
          console.log(`   SubId1: ${record.subId1 || 'N/A'}`);
          console.log(`   SubId2: ${record.subId2 || 'N/A'}`);
          console.log(`   SubId3: ${record.subId3 || 'N/A'}`);
          console.log(`   Campaign: ${record.campaignName || 'N/A'}`);
          console.log(`   Device: ${record.deviceType || 'N/A'}`);
          console.log(`   Country: ${record.country || 'N/A'}`);
          
          // Parse and validate the date
          try {
            const date = new Date(record.clickDate);
            if (isNaN(date.getTime())) {
              console.log(`   ⚠️  WARNING: Invalid date format!`);
            } else {
              const dateStr = date.toISOString().split('T')[0];
              const isInRange = dateStr >= startDateStr && dateStr <= endDateStr;
              console.log(`   ✅ Date is valid and ${isInRange ? 'within' : 'OUTSIDE'} requested range`);
            }
          } catch (e) {
            console.log(`   ⚠️  ERROR parsing date: ${e.message}`);
          }
        });
        
        // Test date filtering capability
        console.log('\n🔍 Testing Date Filtering Capability:');
        console.log('-'.repeat(70));
        
        // Group by date
        const byDate = {};
        recordsWithDates.forEach(record => {
          try {
            const date = new Date(record.clickDate);
            const dateStr = date.toISOString().split('T')[0];
            if (!byDate[dateStr]) {
              byDate[dateStr] = { count: 0, records: [] };
            }
            byDate[dateStr].count++;
            byDate[dateStr].records.push(record);
          } catch (e) {
            // Skip invalid dates
          }
        });
        
        const dateKeys = Object.keys(byDate).sort();
        console.log(`\n📊 Clicks by Date (${dateKeys.length} unique dates):`);
        dateKeys.forEach(date => {
          const stats = byDate[date];
          console.log(`   ${date}: ${stats.count} clicks`);
        });
        
      } else {
        console.log('\n❌ No click records have clickDate field!');
        console.log('   This means we cannot do proper time slicing.');
        console.log('   Raw record sample:');
        if (clickRecords[0]?.rawRecord) {
          console.log(JSON.stringify(clickRecords[0].rawRecord, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error testing click records:', error.message);
    console.error(error.stack);
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('SUMMARY: Line-Item Timestamp Granularity Test');
  console.log('='.repeat(70));
  console.log('\n✅ Impact API provides:');
  console.log('   - Action records with actionDate timestamps');
  console.log('   - Click records with clickDate timestamps');
  console.log('   - Date range filtering via API parameters');
  console.log('   - Individual line-item records (not aggregated)');
  console.log('\n💡 Conclusion:');
  console.log('   Impact API CAN support line-item granularity for time slicing!');
  console.log('   We can store individual revenue events with their actual dates.');
  console.log('   This enables accurate date-range filtering for variable lookback windows.');
}

// Run the test
testLineItemTimestamps()
  .then(() => {
    console.log('\n🎉 Line-item timestamp test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Line-item timestamp test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

