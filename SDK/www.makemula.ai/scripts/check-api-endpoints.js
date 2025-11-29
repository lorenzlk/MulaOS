#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * Check Impact API endpoints without running reports
 * Shows exact server responses
 */

class APIEndpointChecker {
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
          'User-Agent': 'Mula-API-Checker/1.0'
        },
        auth: this.auth
      };

      const req = https.request(fullUrl, options, (res) => {
        console.log(`📋 Status: ${res.statusCode} ${res.statusMessage}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
          console.log(`📄 Raw Response:`);
          console.log('='.repeat(60));
          console.log(data);
          console.log('='.repeat(60));
          console.log('');
          
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

  async checkEndpoints() {
    console.log('🚀 Checking Impact API endpoints\n');
    
    if (!config.impact.username || !config.impact.password) {
      console.error('❌ Missing Impact API credentials!');
      console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
      return;
    }

    const endpoints = [
      { path: '', description: 'Account root' },
      { path: '/Reports', description: 'Reports listing' },
      { path: '/ReportExport', description: 'ReportExport root' },
      { path: '/Jobs', description: 'Jobs listing' },
      { path: '/Campaigns', description: 'Campaigns' },
      { path: '/Advertisers', description: 'Advertisers' },
      { path: '/Offers', description: 'Offers' },
      { path: '/Creatives', description: 'Creatives' },
      { path: '/Actions', description: 'Actions' },
      { path: '/Regions', description: 'Regions' },
      { path: '/Devices', description: 'Devices' },
      { path: '/Browsers', description: 'Browsers' },
      { path: '/OperatingSystems', description: 'Operating Systems' },
      { path: '/Connections', description: 'Connections' }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing: ${endpoint.description}`);
      console.log(`📍 Endpoint: ${endpoint.path}`);
      console.log('-'.repeat(50));
      
      const result = await this.makeRequest(endpoint.path);
      console.log(`✅ Success: ${result.success}`);
      
      if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          console.log(`📊 Array with ${result.data.length} items`);
          if (result.data.length > 0) {
            console.log('📋 Sample item keys:', Object.keys(result.data[0]));
          }
        } else if (typeof result.data === 'object') {
          console.log('📋 Object keys:', Object.keys(result.data));
        }
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 API endpoint checking completed!');
  }
}

// Run the endpoint checking
const checker = new APIEndpointChecker();
checker.checkEndpoints()
  .then(() => {
    console.log('\n🎉 API checking completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 API checking failed:', error.message);
    process.exit(1);
  }); 