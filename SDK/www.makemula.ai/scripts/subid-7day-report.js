#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * 7-Day Subid Performance Report Generator
 * Generates comprehensive subid performance reports from Impact API
 */

class SubidReportGenerator {
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
          'User-Agent': 'Mula-Subid-Report/1.0'
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

  async generateSubidReport() {
    console.log('\n📊 Generating 7-Day Subid Performance Report');
    console.log('=============================================');
    console.log(`📅 Report Period: Last 7 days (${this.getDateDaysAgo(7)} to ${this.getDateDaysAgo(0)})`);
    console.log('');
    
    const result = await this.makeRequest('/Reports/partner_performance_by_subid', {
      PageSize: 100 // Get more records for comprehensive report
    });
    
    if (result.success) {
      this.displaySubidReport(result.data);
    } else {
      console.log('❌ Failed to get Sub ID performance data');
      console.log('📄 Response:', result.data);
    }
  }

  displaySubidReport(data) {
    if (!data.Records || !Array.isArray(data.Records)) {
      console.log('❌ No records found in response');
      return;
    }

    const records = data.Records;
    console.log(`📊 Total Subids Found: ${records.length}`);
    console.log('');

    // Filter and sort by performance
    const mulaSubids = records.filter(record => 
      record.pubsubid1_ && record.pubsubid1_.toLowerCase().includes('mula')
    );
    
    const otherSubids = records.filter(record => 
      record.pubsubid1_ && !record.pubsubid1_.toLowerCase().includes('mula')
    );

    // Also include empty subids
    const emptySubids = records.filter(record => 
      !record.pubsubid1_ || record.pubsubid1_ === ''
    );

    // Display Mula-specific subids first
    if (mulaSubids.length > 0) {
      console.log('🎯 MULA SUBIDS:');
      console.log('===============');
      mulaSubids.forEach((record, index) => {
        this.displaySubidRecord(record, index + 1);
      });
      console.log('');
    }

    // Display other subids
    if (otherSubids.length > 0) {
      console.log('📈 OTHER SUBIDS:');
      console.log('================');
      otherSubids.forEach((record, index) => {
        this.displaySubidRecord(record, index + 1);
      });
      console.log('');
    }

    // Display empty subids
    if (emptySubids.length > 0) {
      console.log('🔍 EMPTY/UNTRACKED SUBIDS:');
      console.log('===========================');
      emptySubids.forEach((record, index) => {
        this.displaySubidRecord(record, index + 1);
      });
      console.log('');
    }

    // Summary statistics
    this.displaySummary(records);
  }

  displaySubidRecord(record, index) {
    const subid = record.pubsubid1_ || '(empty)';
    const rawClicks = parseInt(record.raw_clicks) || 0;
    const clicks = parseInt(record.Clicks) || 0;
    const actions = parseInt(record.Actions) || 0;
    const sales = parseFloat(record.sale_amount) || 0;
    const earnings = parseFloat(record.Earnings) || 0;
    const conversionRate = clicks > 0 ? ((actions / clicks) * 100).toFixed(1) : '0.0';

    console.log(`${index}. ${subid}`);
    console.log(`   📊 Raw Clicks: ${rawClicks} | Filtered Clicks: ${clicks} | Actions: ${actions} | Conv Rate: ${conversionRate}%`);
    console.log(`   💰 Sales: $${sales.toFixed(2)} | Earnings: $${earnings.toFixed(2)}`);
    console.log('');
  }

  displaySummary(records) {
    const totalRawClicks = records.reduce((sum, record) => sum + (parseInt(record.raw_clicks) || 0), 0);
    const totalClicks = records.reduce((sum, record) => sum + (parseInt(record.Clicks) || 0), 0);
    const totalActions = records.reduce((sum, record) => sum + (parseInt(record.Actions) || 0), 0);
    const totalSales = records.reduce((sum, record) => sum + (parseFloat(record.sale_amount) || 0), 0);
    const totalEarnings = records.reduce((sum, record) => sum + (parseFloat(record.Earnings) || 0), 0);
    const overallConversionRate = totalClicks > 0 ? ((totalActions / totalClicks) * 100).toFixed(1) : '0.0';

    console.log('📋 SUMMARY STATISTICS:');
    console.log('=======================');
    console.log(`📊 Total Raw Clicks: ${totalRawClicks}`);
    console.log(`📊 Total Filtered Clicks: ${totalClicks}`);
    console.log(`🎯 Total Actions: ${totalActions}`);
    console.log(`📈 Overall Conversion Rate: ${overallConversionRate}%`);
    console.log(`💰 Total Sales: $${totalSales.toFixed(2)}`);
    console.log(`💵 Total Earnings: $${totalEarnings.toFixed(2)}`);
    console.log('');

    // Top performers
    const topPerformers = records
      .filter(record => parseFloat(record.Earnings) > 0)
      .sort((a, b) => parseFloat(b.Earnings) - parseFloat(a.Earnings))
      .slice(0, 3);

    if (topPerformers.length > 0) {
      console.log('🏆 TOP PERFORMERS (by earnings):');
      console.log('===============================');
      topPerformers.forEach((record, index) => {
        const subid = record.pubsubid1_ || '(empty)';
        const earnings = parseFloat(record.Earnings).toFixed(2);
        console.log(`${index + 1}. ${subid}: $${earnings}`);
      });
      console.log('');
    }
  }

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    // Try DD/MM/YYYY format
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`; // DD/MM/YYYY
  }
}

async function generateReport() {
  console.log('🚀 Starting 7-Day Subid Performance Report Generation\n');
  
  if (!config.impact.username || !config.impact.password) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    return;
  }

  const generator = new SubidReportGenerator();
  
  try {
    await generator.generateSubidReport();
    console.log('\n✨ Report generation completed!');
    
  } catch (error) {
    console.error('\n💥 Report generation failed:', error.message);
  }
}

// Run the report generation
generateReport()
  .then(() => {
    console.log('\n🎉 Subid report completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Subid report failed:', error.message);
    process.exit(1);
  }); 