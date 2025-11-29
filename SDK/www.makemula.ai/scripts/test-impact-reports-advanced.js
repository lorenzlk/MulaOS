#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * Advanced Impact.com API testing script
 * Tests various report endpoints and parameters
 */

class ImpactAPITester {
  constructor() {
    this.config = config.impact;
    this.baseUrl = this.config.baseUrl;
    this.accountId = this.config.accountId;
    this.auth = `${this.config.username}:${this.config.password}`;
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseUrl}/${this.accountId}${endpoint}`;
    const queryString = Object.keys(params).length > 0 ? `?${querystring.stringify(params)}` : '';
    const fullUrl = url + queryString;

    console.log(`📡 Making request to: ${fullUrl}`);

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mula-Impact-Test/1.0'
        },
        auth: this.auth
      };

      const req = https.request(fullUrl, options, (res) => {
        console.log(`📋 Status: ${res.statusCode} ${res.statusMessage}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              resolve({ success: true, data: response, statusCode: res.statusCode });
            } else {
              resolve({ success: false, data, statusCode: res.statusCode });
            }
          } catch (error) {
            resolve({ success: false, data, error: error.message, statusCode: res.statusCode });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async testListReports() {
    console.log('\n🔍 Testing: List Available Reports');
    console.log('=====================================');
    
    const result = await this.makeRequest('/Reports');
    
    if (result.success) {
      console.log('✅ Success! Available reports:');
      if (Array.isArray(result.data)) {
        result.data.forEach((report, index) => {
          console.log(`  ${index + 1}. ${report.name || 'Unnamed Report'}`);
          if (report.description) console.log(`     Description: ${report.description}`);
          if (report.id) console.log(`     ID: ${report.id}`);
        });
        console.log(`\n📊 Total reports: ${result.data.length}`);
      } else {
        console.log('📄 Response format:', typeof result.data);
        console.log('📄 Sample data:', JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log('❌ Failed to list reports');
      console.log('📄 Response:', result.data);
    }
  }

  async testReportDetails(reportId) {
    console.log(`\n🔍 Testing: Report Details for ID ${reportId}`);
    console.log('==========================================');
    
    const result = await this.makeRequest(`/Reports/${reportId}`);
    
    if (result.success) {
      console.log('✅ Report details:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Failed to get report details');
      console.log('📄 Response:', result.data);
    }
  }

  async testReportData(reportId, params = {}) {
    console.log(`\n🔍 Testing: Report Data for ID ${reportId}`);
    console.log('==========================================');
    console.log('📋 Parameters:', params);
    
    const result = await this.makeRequest(`/Reports/${reportId}/Data`, params);
    
    if (result.success) {
      console.log('✅ Report data retrieved successfully');
      if (Array.isArray(result.data)) {
        console.log(`📊 Records returned: ${result.data.length}`);
        if (result.data.length > 0) {
          console.log('📄 Sample record:');
          console.log(JSON.stringify(result.data[0], null, 2));
        }
      } else {
        console.log('📄 Response format:', typeof result.data);
        console.log('📄 Sample data:', JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log('❌ Failed to get report data');
      console.log('📄 Response:', result.data);
    }
  }

  async testCommonReportTypes() {
    console.log('\n🔍 Testing: Common Report Types');
    console.log('===============================');
    
    // Common report types to test
    const commonReports = [
      'Orders',
      'Clicks',
      'Actions',
      'Campaigns',
      'Products'
    ];

    for (const reportType of commonReports) {
      console.log(`\n📋 Testing ${reportType} report...`);
      const result = await this.makeRequest(`/Reports/${reportType}`);
      
      if (result.success) {
        console.log(`✅ ${reportType} report accessible`);
        if (Array.isArray(result.data) && result.data.length > 0) {
          console.log(`📊 Sample ${reportType} data:`, JSON.stringify(result.data[0], null, 2));
        }
      } else {
        console.log(`❌ ${reportType} report not accessible (${result.statusCode})`);
      }
    }
  }

  async testReportWithDateRange(reportId, lookbackDays = 7) {
    console.log(`\n🔍 Testing: Report with Date Range for ID ${reportId}`);
    console.log('==================================================');
    console.log(`📅 Lookback Period: ${lookbackDays} days`);
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - lookbackDays);
    
    const params = {
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: today.toISOString().split('T')[0],
      pageSize: 10
    };
    
    console.log('📋 Date range parameters:', params);
    console.log(`📅 Date Range: ${startDate.toLocaleDateString()} to ${today.toLocaleDateString()}`);
    
    const result = await this.makeRequest(`/Reports/${reportId}/Data`, params);
    
    if (result.success) {
      console.log('✅ Report data with date range retrieved');
      if (Array.isArray(result.data)) {
        console.log(`📊 Records returned: ${result.data.length}`);
        if (result.data.length > 0) {
          console.log('📄 Sample record:');
          console.log(JSON.stringify(result.data[0], null, 2));
        }
      } else {
        console.log('📄 Response format:', typeof result.data);
        console.log('📄 Sample data:', JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log('❌ Failed to get report data with date range');
      console.log('📄 Response:', result.data);
    }
  }

  async testReportWithDateRangeMultiple(reportId) {
    console.log(`\n🔍 Testing: Report with Multiple Date Ranges for ID ${reportId}`);
    console.log('===============================================================');
    
    // Test different lookback periods
    const lookbackPeriods = [1, 3, 7, 14, 30];
    
    for (const lookback of lookbackPeriods) {
      console.log(`\n📋 Testing ${lookback}-day lookback period...`);
      await this.testReportWithDateRange(reportId, lookback);
      
      // Add a small delay between requests
      if (lookback !== lookbackPeriods[lookbackPeriods.length - 1]) {
        console.log('⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

async function runAdvancedTests() {
  console.log('🚀 Starting Advanced Impact.com API Tests\n');
  
  // Check credentials
  if (!config.impact.username || !config.impact.password) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    return;
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const lookbackDays = parseInt(args[0]) || 7;
  const testSubid = args.includes('--subid') || args.includes('-s');
  const testMultiple = args.includes('--multiple') || args.includes('-m');
  
  console.log('📋 Test Configuration:');
  console.log(`   • Lookback Days: ${lookbackDays}`);
  console.log(`   • Test Subid Report: ${testSubid}`);
  console.log(`   • Test Multiple Periods: ${testMultiple}`);
  console.log('');

  const tester = new ImpactAPITester();
  
  try {
    // Test 1: List all available reports
    await tester.testListReports();
    
    // Test 2: Test common report types
    await tester.testCommonReportTypes();
    
    // Test 3: Test subid report specifically if requested
    if (testSubid) {
      console.log('\n🎯 Testing Subid Report Endpoint');
      console.log('===============================');
      
      // Test the standard Reports endpoint (no date filtering)
      console.log('\n📋 Test: Standard /Reports endpoint (no date filtering)');
      const subidResult = await tester.makeRequest('/Reports/partner_performance_by_subid', {
        PageSize: 10
      });
      
      if (subidResult.success) {
        console.log('✅ Subid report accessible via /Reports endpoint');
        if (subidResult.data.Records) {
          console.log(`📊 Records found: ${subidResult.data.Records.length}`);
        }
      } else {
        console.log('❌ Subid report not accessible via /Reports endpoint');
        console.log('📄 Response:', subidResult.data);
      }
      
      // Test the /Data endpoint with date filtering
      console.log('\n📋 Test: /Reports/partner_performance_by_subid/Data endpoint');
      await tester.testReportWithDateRange('partner_performance_by_subid', lookbackDays);
      
      // Test multiple lookback periods if requested
      if (testMultiple) {
        await tester.testReportWithDateRangeMultiple('partner_performance_by_subid');
      }
    }
    
    // Test 4: Test report with date range (general test)
    if (!testSubid) {
      console.log('\n📋 Test: General report with date range');
      // You can modify this to test a specific report ID
      // await tester.testReportWithDateRange('some-report-id', lookbackDays);
    }
    
    console.log('\n✨ All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

// Show usage information
function showUsage() {
  console.log('Usage: node test-impact-reports-advanced.js [lookbackDays] [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  lookbackDays    Number of days to look back (default: 7)');
  console.log('');
  console.log('Options:');
  console.log('  --subid, -s     Test the subid report endpoint specifically');
  console.log('  --multiple, -m  Test multiple lookback periods (1, 3, 7, 14, 30 days)');
  console.log('');
  console.log('Examples:');
  console.log('  node test-impact-reports-advanced.js                    # Default 7-day test');
  console.log('  node test-impact-reports-advanced.js 14                # 14-day test');
  console.log('  node test-impact-reports-advanced.js 7 --subid         # 7-day subid test');
  console.log('  node test-impact-reports-advanced.js 30 --subid -m     # 30-day subid test with multiple periods');
  console.log('');
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the tests
runAdvancedTests()
  .then(() => {
    console.log('\n🎉 Advanced testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Advanced testing failed:', error.message);
    process.exit(1);
  }); 