#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const fs = require('fs');

/**
 * List all available reports using the official /Reports endpoint
 * Based on: https://integrations.impact.com/impact-publisher/reference/list-reports
 */

class SimpleReportLister {
  constructor() {
    this.config = config.impact;
    this.baseUrl = this.config.baseUrl;
    this.accountId = this.config.accountId;
    this.auth = `${this.config.username}:${this.config.password}`;
  }

  async listReports() {
    const url = `${this.baseUrl}/${this.accountId}/Reports`;
    
    console.log('🚀 Listing all available reports from Impact API');
    console.log(`📡 URL: ${url}`);
    console.log(`🔐 Auth: ${this.auth.split(':')[0]}:****`);
    console.log('');

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mula-ReportLister/1.0'
        },
        auth: this.auth
      };

      const req = https.request(url, options, (res) => {
        console.log(`📋 Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
        console.log('');
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
          console.log(`📄 Raw Response:`);
          console.log('='.repeat(80));
          console.log(data);
          console.log('='.repeat(80));
          console.log('');
          
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              console.log('✅ Successfully retrieved reports!');
              console.log('');
              
              if (response.Reports && Array.isArray(response.Reports)) {
                console.log(`📊 Found ${response.Reports.length} reports:`);
                console.log('');
                
                response.Reports.forEach((report, index) => {
                  console.log(`${index + 1}. ${report.Name} (ID: ${report.Id})`);
                  console.log(`   Category: ${report.Category}`);
                  console.log(`   Description: ${report.Description}`);
                  console.log(`   API Accessible: ${report.ApiAccessible ? 'Yes' : 'No'}`);
                  
                  if (report.ApiAccessible && report.ApiRunUri) {
                    console.log(`   API Run URI: ${report.ApiRunUri}`);
                  }
                  
                  if (report.MetaDataUri) {
                    console.log(`   Metadata URI: ${report.MetaDataUri}`);
                  }
                  
                  console.log('');
                });
              } else {
                console.log('❌ No reports found or unexpected response format');
              }
              
              // Save the response to a JSON file
              const outputFile = 'impact-reports-response.json';
              fs.writeFileSync(outputFile, JSON.stringify(response, null, 2));
              console.log(`💾 Response saved to: ${outputFile}`);
              console.log(`📂 Open this file in Cursor to view the complete response`);
              
              resolve({ success: true, data: response, statusCode: res.statusCode, rawData: data });
            } else {
              console.log('❌ Failed to retrieve reports');
              resolve({ success: false, data, statusCode: res.statusCode, rawData: data });
            }
          } catch (error) {
            console.log('❌ Failed to parse response');
            console.log('💥 Error:', error.message);
            resolve({ success: false, data, error: error.message, statusCode: res.statusCode, rawData: data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

// Run the report listing
const lister = new SimpleReportLister();
lister.listReports()
  .then((result) => {
    console.log('\n🎉 Report listing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Report listing failed:', error.message);
    process.exit(1);
  }); 