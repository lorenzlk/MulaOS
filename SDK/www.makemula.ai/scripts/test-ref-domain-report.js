#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * Test Partner Performance by Referring Domain Report
 * Shows which domains are generating clicks in the Impact API
 */

class RefDomainReportTester {
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
          'User-Agent': 'Mula-RefDomain-Test/1.0'
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

  async testRefDomainReport() {
    console.log('\n🔍 Testing: Partner Performance by Referring Domain');
    console.log('===================================================');
    console.log('📅 Looking for recent domain performance data');
    console.log('');
    
    const result = await this.makeRequest('/Reports/partner_performance_by_ref_domain', {
      PageSize: 100
    });
    
    if (result.success) {
      this.displayRefDomainReport(result.data);
    } else {
      console.log('❌ Failed to get referring domain performance data');
      console.log('📄 Response:', result.data);
    }
  }

  displayRefDomainReport(data) {
    if (!data.Records || !Array.isArray(data.Records)) {
      console.log('❌ No records found in response');
      console.log('📄 Raw response:', JSON.stringify(data, null, 2));
      return;
    }

    const records = data.Records;
    console.log(`📊 Total Referring Domains Found: ${records.length}`);
    console.log('');

    // Look specifically for on3.com domains
    const on3Domains = records.filter(record => 
      record.RefDomain && record.RefDomain.toLowerCase().includes('on3.com')
    );

    // Look for other domains that might be relevant
    const otherDomains = records.filter(record => 
      record.RefDomain && !record.RefDomain.toLowerCase().includes('on3.com')
    );

    // Display on3.com domains first
    if (on3Domains.length > 0) {
      console.log('🎯 ON3.COM DOMAINS:');
      console.log('===================');
      on3Domains.forEach((record, index) => {
        this.displayDomainRecord(record, index + 1);
      });
      console.log('');
    } else {
      console.log('❌ No on3.com domains found in referring domain data');
      console.log('');
    }

    // Display other domains
    if (otherDomains.length > 0) {
      console.log('📈 OTHER REFERRING DOMAINS:');
      console.log('===========================');
      otherDomains.slice(0, 10).forEach((record, index) => {
        this.displayDomainRecord(record, index + 1);
      });
      
      if (otherDomains.length > 10) {
        console.log(`... and ${otherDomains.length - 10} more domains`);
      }
      console.log('');
    }

    // Summary statistics
    this.displaySummary(records);
  }

  displayDomainRecord(record, index) {
    const domain = record.RefDomain || '(unknown)';
    const rawClicks = parseInt(record.raw_clicks) || 0;
    const clicks = parseInt(record.Clicks) || 0;
    const actions = parseInt(record.Actions) || 0;
    const sales = parseFloat(record.sale_amount) || 0;
    const earnings = parseFloat(record.Earnings) || 0;
    const conversionRate = clicks > 0 ? ((actions / clicks) * 100).toFixed(1) : '0.0';

    console.log(`${index}. ${domain}`);
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

    // Top performing domains
    const topDomains = records
      .filter(record => parseFloat(record.Earnings) > 0)
      .sort((a, b) => parseFloat(b.Earnings) - parseFloat(a.Earnings))
      .slice(0, 5);

    if (topDomains.length > 0) {
      console.log('🏆 TOP PERFORMING DOMAINS (by earnings):');
      console.log('=======================================');
      topDomains.forEach((record, index) => {
        const domain = record.RefDomain || '(unknown)';
        const earnings = parseFloat(record.Earnings).toFixed(2);
        const clicks = parseInt(record.Clicks) || 0;
        console.log(`${index + 1}. ${domain}: $${earnings} (${clicks} clicks)`);
      });
      console.log('');
    }
  }
}

async function testRefDomainReport() {
  console.log('🚀 Starting Referring Domain Performance Test\n');
  
  if (!config.impact.username || !config.impact.password) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    return;
  }

  const tester = new RefDomainReportTester();
  
  try {
    await tester.testRefDomainReport();
    console.log('\n✨ Referring domain test completed!');
    
  } catch (error) {
    console.error('\n💥 Referring domain test failed:', error.message);
  }
}

// Run the test
testRefDomainReport()
  .then(() => {
    console.log('\n🎉 Referring domain test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Referring domain test failed:', error.message);
    process.exit(1);
  }); 