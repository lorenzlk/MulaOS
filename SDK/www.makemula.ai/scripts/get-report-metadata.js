#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const fs = require('fs');

/**
 * Get metadata for a specific report
 * Shows available parameters, fields, and configuration
 */

class ReportMetadataFetcher {
  constructor() {
    this.config = config.impact;
    this.baseUrl = this.config.baseUrl;
    this.accountId = this.config.accountId;
    this.auth = `${this.config.username}:${this.config.password}`;
  }

  async getMetadata(reportId) {
    const url = `${this.baseUrl}/${this.accountId}/Reports/${reportId}/MetaData`;
    
    console.log('🚀 Fetching report metadata');
    console.log(`📡 URL: ${url}`);
    console.log(`🔐 Auth: ${this.auth.split(':')[0]}:****`);
    console.log('');

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mula-MetadataFetcher/1.0'
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
              console.log('✅ Successfully retrieved metadata!');
              console.log('');
              
              // Save the response to a JSON file
              const outputFile = `impact-metadata-${reportId}.json`;
              fs.writeFileSync(outputFile, JSON.stringify(response, null, 2));
              console.log(`💾 Metadata saved to: ${outputFile}`);
              console.log(`📂 Open this file in Cursor to view the complete metadata`);
              console.log('');
              
              // Display key metadata information
              this.displayMetadata(response, reportId);
              
              resolve({ success: true, data: response, statusCode: res.statusCode, rawData: data });
            } else {
              console.log('❌ Failed to retrieve metadata');
              resolve({ success: false, data, statusCode: res.statusCode, rawData: data });
            }
          } catch (error) {
            console.log('❌ Failed to parse metadata response');
            console.log('💥 Error:', error.message);
            resolve({ success: false, data, error: error.message, statusCode: res.statusCode, rawData: data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  displayMetadata(metadata, reportId) {
    console.log(`📊 Metadata for report: ${reportId}`);
    console.log('='.repeat(60));
    
    if (metadata.Name) {
      console.log(`📋 Report Name: ${metadata.Name}`);
    }
    
    if (metadata.Description) {
      console.log(`📝 Description: ${metadata.Description}`);
    }
    
    if (metadata.Parameters && Array.isArray(metadata.Parameters)) {
      console.log(`\n🔧 Parameters (${metadata.Parameters.length}):`);
      metadata.Parameters.forEach((param, index) => {
        console.log(`  ${index + 1}. ${param.Name} (${param.Type})`);
        if (param.Required) {
          console.log(`     Required: Yes`);
        }
        if (param.Description) {
          console.log(`     Description: ${param.Description}`);
        }
        if (param.DefaultValue) {
          console.log(`     Default: ${param.DefaultValue}`);
        }
        console.log('');
      });
    }
    
    if (metadata.Columns && Array.isArray(metadata.Columns)) {
      console.log(`\n📊 Columns (${metadata.Columns.length}):`);
      metadata.Columns.forEach((column, index) => {
        console.log(`  ${index + 1}. ${column.Name} (${column.Type})`);
        if (column.Description) {
          console.log(`     Description: ${column.Description}`);
        }
        console.log('');
      });
    }
    
    if (metadata.Filters && Array.isArray(metadata.Filters)) {
      console.log(`\n🔍 Filters (${metadata.Filters.length}):`);
      metadata.Filters.forEach((filter, index) => {
        console.log(`  ${index + 1}. ${filter.Name} (${filter.Type})`);
        if (filter.Description) {
          console.log(`     Description: ${filter.Description}`);
        }
        console.log('');
      });
    }
  }
}

// Run the metadata fetching
const fetcher = new ReportMetadataFetcher();
const reportId = 'partner_performance_by_subid';

fetcher.getMetadata(reportId)
  .then((result) => {
    console.log('\n🎉 Metadata fetching completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Metadata fetching failed:', error.message);
    process.exit(1);
  }); 