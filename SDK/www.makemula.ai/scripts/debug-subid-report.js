#!/usr/bin/env node

require('dotenv').config();
const { SubidReportGenerator } = require('../helpers/SubidReportGenerator');

async function debugSubidReport() {
  console.log('🔍 Debugging Subid Report Generation\n');
  
  if (!process.env.IMPACT_USERNAME || !process.env.IMPACT_PASSWORD) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    return;
  }

  const generator = new SubidReportGenerator();
  
  try {
    console.log('📊 Calling generateSubidReport(7, true, true)...\n');
    
    // This is the exact call from performanceReportWorker.js line 86
    const subidReport = await generator.generateSubidReport(7, true, true);
    
    console.log('✅ Subid Report Generated Successfully!\n');
    console.log('📋 Full subidReport object:');
    console.log('=====================================');
    console.log(JSON.stringify(subidReport, null, 2));
    
    console.log('\n🔍 Key Properties:');
    console.log('=====================================');
    console.log(`Type of subidReport: ${typeof subidReport}`);
    console.log(`Has 'text' property: ${subidReport.hasOwnProperty('text')}`);
    console.log(`Has 'blocks' property: ${subidReport.hasOwnProperty('blocks')}`);
    console.log(`Has 'rawData' property: ${subidReport.hasOwnProperty('rawData')}`);
    console.log(`Has 'summary' property: ${subidReport.hasOwnProperty('summary')}`);
    
    if (subidReport.text) {
      console.log(`\n📝 Text property content:`);
      console.log('-------------------------------------');
      console.log(subidReport.text);
      
      // Test the regex that's failing
      const earningsMatch = subidReport.text.match(/Total Earnings: \$([\d,]+\.?\d*)/);
      console.log(`\n🔍 Regex match result:`, earningsMatch);
      
      if (earningsMatch) {
        console.log(`✅ Regex matched! Earnings: ${earningsMatch[1]}`);
      } else {
        console.log(`❌ Regex failed to match!`);
      }
    }
    
    if (subidReport.summary) {
      console.log(`\n📊 Summary object:`);
      console.log('-------------------------------------');
      console.log(JSON.stringify(subidReport.summary, null, 2));
    }
    
    if (subidReport.rawData) {
      console.log(`\n📋 Raw data length: ${subidReport.rawData.length}`);
      if (subidReport.rawData.length > 0) {
        console.log(`📋 First record sample:`);
        console.log(JSON.stringify(subidReport.rawData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n💥 Debug failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

debugSubidReport()
  .then(() => {
    console.log('\n🎉 Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error.message);
    process.exit(1);
  });
