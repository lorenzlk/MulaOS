#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * List all available reports from Impact API
 * Shows exact server responses
 */

class ReportLister {
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
    console.log(`🔐 Auth: ${this.auth.split(':')[0]}:****`);

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mula-ReportLister/1.0'
        },
        auth: this.auth
      };

      const req = https.request(fullUrl, options, (res) => {
        console.log(`📋 Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
          console.log(`📄 Raw Response Body:`);
          console.log('='.repeat(80));
          console.log(data);
          console.log('='.repeat(80));
          
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              resolve({ success: true, data: response, statusCode: res.statusCode, rawData: data });
            } else {
              resolve({ success: false, data, statusCode: res.statusCode, rawData: data });
            }
          } catch (error) {
            resolve({ success: false, data, error: error.message, statusCode: res.statusCode, rawData: data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async listAllReports() {
    console.log('🚀 Listing all available reports from Impact API\n');
    
    if (!config.impact.username || !config.impact.password) {
      console.error('❌ Missing Impact API credentials!');
      console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
      return;
    }

    // Test 1: List available reports (if this endpoint exists)
    console.log('\n🔍 Test 1: Trying to list available reports...');
    console.log('='.repeat(80));
    
    const result1 = await this.makeRequest('/Reports');
    console.log(`✅ Success: ${result1.success}`);
    console.log('');

    // Test 2: Try different report listing endpoints
    console.log('\n🔍 Test 2: Trying /ReportExport...');
    console.log('='.repeat(80));
    
    const result2 = await this.makeRequest('/ReportExport');
    console.log(`✅ Success: ${result2.success}`);
    console.log('');

    // Test 3: Try to get account info
    console.log('\n🔍 Test 3: Getting account information...');
    console.log('='.repeat(80));
    
    const result3 = await this.makeRequest('');
    console.log(`✅ Success: ${result3.success}`);
    console.log('');

    // Test 4: Try to get report metadata without running them
    console.log('\n🔍 Test 4: Testing report endpoints with minimal parameters...');
    console.log('='.repeat(80));
    
    const reports = [
      'partner_performance_by_subid',
      'partner_performance_by_ref_domain',
      'partner_performance_by_campaign',
      'partner_performance_by_creative',
      'partner_performance_by_action',
      'partner_performance_by_date',
      'partner_performance_by_advertiser',
      'partner_performance_by_affiliate',
      'partner_performance_by_offer',
      'partner_performance_by_region',
      'partner_performance_by_device',
      'partner_performance_by_browser',
      'partner_performance_by_os',
      'partner_performance_by_connection',
      'partner_performance_by_time',
      'partner_performance_by_day_of_week',
      'partner_performance_by_hour',
      'partner_performance_by_month',
      'partner_performance_by_quarter',
      'partner_performance_by_year'
    ];

    for (const report of reports) {
      console.log(`\n📊 Testing: ${report}`);
      console.log('-'.repeat(40));
      
      // Try with minimal parameters to see if endpoint exists
      const result = await this.makeRequest(`/ReportExport/${report}`, { ResultFormat: 'JSON' });
      console.log(`✅ Success: ${result.success}`);
      
      if (result.success) {
        console.log('📄 Response structure:', Object.keys(result.data));
        if (result.data.Status) {
          console.log('📊 Status:', result.data.Status);
        }
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Report listing completed!');
  }
}

// Run the report listing
const lister = new ReportLister();
lister.listAllReports()
  .then(() => {
    console.log('\n🎉 Report listing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Report listing failed:', error.message);
    process.exit(1);
  }); 