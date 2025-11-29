#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * Test ReportExport endpoint for subid performance
 * Uses the modern Impact API ReportExport method
 */

class ReportExportTester {
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
          'User-Agent': 'Mula-ReportExport-Test/1.0'
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

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD (ISO 8601)
  }

  async testSubidReportExport() {
    console.log('\n🔍 Testing: ReportExport for Subid Performance');
    console.log('===============================================');
    
    // Use the past 7 days (ending yesterday)
    const endDate = this.getDateDaysAgo(1);
    const startDate = this.getDateDaysAgo(8); // 7 days before end date
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log('');
    
    const params = {
      START_DATE: startDate,
      END_DATE: endDate,
      ResultFormat: 'JSON'
    };
    
    console.log('📋 Parameters:', params);
    console.log('');
    
    const result = await this.makeRequest('/ReportExport/partner_performance_by_subid', params);
    
    if (result.success) {
      this.displayExportResult(result.data, 'Subid Performance');
    } else {
      console.log('❌ Failed to export subid performance report');
      console.log('📄 Response:', result.data);
    }
  }

  displayExportResult(data, reportName) {
    console.log('✅ ReportExport request successful!');
    console.log('📄 Response:', JSON.stringify(data, null, 2));
    
    if (data.Status) {
      console.log(`📊 Job Status: ${data.Status}`);
    }
    
    if (data.QueuedUri) {
      console.log(`📋 Job URI: ${data.QueuedUri}`);
      // Extract job ID from URI
      const jobId = data.QueuedUri.split('/').pop();
      console.log(`📋 Job ID: ${jobId}`);
      
      // Store job info for polling
      this.jobs = this.jobs || [];
      this.jobs.push({
        id: jobId,
        name: reportName,
        uri: data.QueuedUri
      });
    }
    
    if (data.ResultUri) {
      console.log(`📥 Download URI: ${data.ResultUri}`);
    }
    
    console.log('');
  }

  async pollJobStatus(jobId, jobName) {
    console.log(`\n🔍 Polling job status for ${jobName}...`);
    console.log(`📋 Job ID: ${jobId}`);
    
    const result = await this.makeRequest(`/Jobs/${jobId}`);
    
    if (result.success) {
      const job = result.data;
      console.log(`📊 Status: ${job.Status}`);
      
      if (job.Status === 'COMPLETED') {
        console.log('✅ Job completed! Downloading results...');
        return await this.downloadJobResults(jobId, jobName);
      } else if (job.Status === 'FAILED') {
        console.log('❌ Job failed!');
        console.log('📄 Error details:', JSON.stringify(job, null, 2));
        return false;
      } else {
        console.log(`⏳ Job still processing... (${job.Status})`);
        return false;
      }
    } else {
      console.log('❌ Failed to get job status');
      console.log('📄 Response:', result.data);
      return false;
    }
  }

  async downloadJobResults(jobId, jobName) {
    console.log(`\n📥 Downloading results for ${jobName}...`);
    
    const result = await this.makeRequest(`/Jobs/${jobId}/Download`);
    
    if (result.success) {
      console.log('✅ Results downloaded successfully!');
      console.log('📄 Response format:', typeof result.data);
      
      if (Array.isArray(result.data)) {
        console.log(`📊 Total records: ${result.data.length}`);
        
        if (result.data.length > 0) {
          console.log('\n📋 Sample records:');
          result.data.slice(0, 3).forEach((record, index) => {
            console.log(`\n${index + 1}. Sample Record:`);
            console.log(JSON.stringify(record, null, 2));
          });
        }
        
        // Analyze the data based on job type
        this.analyzeResults(result.data, jobName);
      } else {
        console.log('📄 Raw response:', JSON.stringify(result.data, null, 2));
      }
      
      return true;
    } else if (result.statusCode === 302) {
      // Handle redirect to Google Cloud Storage
      console.log('🔄 Following redirect to download results...');
      return await this.downloadFromRedirect(result.data, jobName);
    } else {
      console.log('❌ Failed to download job results');
      console.log('📄 Response:', result.data);
      return false;
    }
  }

  async downloadFromRedirect(redirectResponse, jobName) {
    // Extract the redirect URL from the response
    const match = redirectResponse.match(/href="([^"]+)"/);
    if (!match) {
      console.log('❌ Could not extract redirect URL from response');
      console.log('📄 Response:', redirectResponse);
      return false;
    }

    const redirectUrl = match[1];
    console.log(`📡 Following redirect to: ${redirectUrl}`);

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mula-ReportDownloader/1.0'
        }
      };

      const req = https.request(redirectUrl, options, (res) => {
        console.log(`📋 Redirect Status: ${res.statusCode} ${res.statusMessage}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              console.log('✅ Results downloaded from redirect successfully!');
              console.log('📄 Response format:', typeof response);
              
              if (Array.isArray(response)) {
                console.log(`📊 Total records: ${response.length}`);
                
                if (response.length > 0) {
                  console.log('\n📋 Sample records:');
                  response.slice(0, 3).forEach((record, index) => {
                    console.log(`\n${index + 1}. Sample Record:`);
                    console.log(JSON.stringify(record, null, 2));
                  });
                }
                
                // Analyze the data based on job type
                this.analyzeResults(response, jobName);
              } else {
                console.log('📄 Raw response:', JSON.stringify(response, null, 2));
              }
              
              resolve(true);
            } else {
              console.log('❌ Failed to download from redirect');
              console.log('📄 Response:', data);
              resolve(false);
            }
          } catch (error) {
            console.log('❌ Failed to parse redirect response');
            console.log('📄 Response:', data);
            console.log('💥 Error:', error.message);
            resolve(false);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  analyzeResults(data, jobName) {
    console.log(`\n📊 Analysis for ${jobName}:`);
    console.log('=====================================');
    
    if (jobName === 'Subid Performance') {
      this.analyzeSubidResults(data);
    } else if (jobName === 'Referring Domain Performance') {
      this.analyzeRefDomainResults(data);
    }
  }

  analyzeSubidResults(data) {
    if (!Array.isArray(data) || data.length === 0) {
      console.log('❌ No data to analyze');
      return;
    }

    // Look for mula subids
    const mulaSubids = data.filter(record => 
      record.pubsubid1_ && record.pubsubid1_.toLowerCase().includes('mula')
    );

    // Look for empty subids
    const emptySubids = data.filter(record => 
      !record.pubsubid1_ || record.pubsubid1_ === ''
    );

    console.log(`📊 Total records: ${data.length}`);
    console.log(`🎯 Mula subids: ${mulaSubids.length}`);
    console.log(`🔍 Empty subids: ${emptySubids.length}`);

    if (mulaSubids.length > 0) {
      console.log('\n🎯 MULA SUBIDS FOUND:');
      mulaSubids.forEach((record, index) => {
        console.log(`${index + 1}. ${record.pubsubid1_}`);
        console.log(`   Clicks: ${record.Clicks || 0} | Actions: ${record.Actions || 0}`);
        console.log(`   Earnings: $${parseFloat(record.Earnings || 0).toFixed(2)}`);
      });
    }

    if (emptySubids.length > 0) {
      console.log('\n🔍 EMPTY SUBIDS:');
      console.log(`   Total: ${emptySubids.length} records`);
      const totalClicks = emptySubids.reduce((sum, record) => sum + (parseInt(record.Clicks) || 0), 0);
      console.log(`   Total clicks: ${totalClicks}`);
    }
  }

  analyzeRefDomainResults(data) {
    if (!Array.isArray(data) || data.length === 0) {
      console.log('❌ No data to analyze');
      return;
    }

    // Look for on3.com domains
    const on3Domains = data.filter(record => 
      record.Domain && record.Domain.toLowerCase().includes('on3.com')
    );

    console.log(`📊 Total referring domains: ${data.length}`);
    console.log(`🎯 on3.com domains: ${on3Domains.length}`);

    if (on3Domains.length > 0) {
      console.log('\n🎯 ON3.COM DOMAINS FOUND:');
      on3Domains.forEach((record, index) => {
        console.log(`${index + 1}. ${record.Domain}`);
        console.log(`   Clicks: ${record.Clicks || 0} | Actions: ${record.Actions || 0}`);
        console.log(`   Earnings: $${parseFloat(record.Earnings || 0).toFixed(2)}`);
      });
    } else {
      console.log('\n❌ No on3.com domains found in referring domain data');
    }

    // Show top performing domains
    const topDomains = data
      .filter(record => parseFloat(record.Earnings || 0) > 0)
      .sort((a, b) => parseFloat(b.Earnings || 0) - parseFloat(a.Earnings || 0))
      .slice(0, 5);

    if (topDomains.length > 0) {
      console.log('\n🏆 TOP PERFORMING DOMAINS:');
      topDomains.forEach((record, index) => {
        console.log(`${index + 1}. ${record.Domain || '(unknown)'}: $${parseFloat(record.Earnings || 0).toFixed(2)}`);
      });
    }
  }

  async pollAllJobs() {
    if (!this.jobs || this.jobs.length === 0) {
      console.log('\n❌ No jobs to poll');
      return;
    }

    console.log('\n🚀 Starting job polling for all export jobs...');
    
    let completedJobs = 0;
    const maxAttempts = 10;
    let attempt = 0;

    while (completedJobs < this.jobs.length && attempt < maxAttempts) {
      attempt++;
      console.log(`\n🔄 Polling attempt ${attempt}/${maxAttempts}`);
      
      for (const job of this.jobs) {
        if (job.completed) continue;
        
        const isComplete = await this.pollJobStatus(job.id, job.name);
        if (isComplete) {
          job.completed = true;
          completedJobs++;
        }
      }

      if (completedJobs < this.jobs.length) {
        console.log('\n⏳ Waiting 30 seconds before next poll...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    if (completedJobs === this.jobs.length) {
      console.log('\n🎉 All jobs completed successfully!');
    } else {
      console.log('\n⏰ Some jobs are still processing. You may need to poll again later.');
    }
  }

  async testRefDomainReportExport() {
    console.log('\n🔍 Testing: ReportExport for Referring Domain Performance');
    console.log('==========================================================');
    
    // Use a 7-day range ending 2 days ago
    const startDate = '2025-07-10';
    const endDate = '2025-07-17';
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log('');
    
    const params = {
    //   START_DATE: startDate,
    //   END_DATE: endDate,
      ResultFormat: 'JSON'
    };
    
    console.log('📋 Parameters:', params);
    console.log('');
    
    const result = await this.makeRequest('/ReportExport/partner_performance_by_ref_domain', params);
    
    if (result.success) {
      this.displayExportResult(result.data, 'Referring Domain Performance');
    } else {
      console.log('❌ Failed to export referring domain performance report');
      console.log('📄 Response:', result.data);
    }
  }
}

async function testReportExport() {
  console.log('🚀 Starting ReportExport Tests\n');
  
  if (!config.impact.username || !config.impact.password) {
    console.error('❌ Missing Impact API credentials!');
    console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
    return;
  }

  const tester = new ReportExportTester();
  
  try {
    // Test 1: Subid Performance Report Export
    await tester.testSubidReportExport();
    
    console.log('---');
    
    // Test 2: Referring Domain Performance Report Export
    // await tester.testRefDomainReportExport();
    
    // console.log('\n✨ ReportExport jobs kicked off!');
    
    // Now poll all jobs to get results
    await tester.pollAllJobs();
    
    console.log('\n✨ ReportExport tests completed!');
    
  } catch (error) {
    console.error('\n💥 ReportExport test failed:', error.message);
  }
}

// Run the tests
testReportExport()
  .then(() => {
    console.log('\n🎉 ReportExport testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 ReportExport testing failed:', error.message);
    process.exit(1);
  }); 