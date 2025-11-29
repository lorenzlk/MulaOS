#!/usr/bin/env node

require('dotenv').config();
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

/**
 * Poll ReportExport jobs and download results when complete
 * Uses the modern Impact API ReportExport method
 */

class ReportJobPoller {
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

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mula-ReportPoller/1.0'
        },
        auth: this.auth
      };

      const req = https.request(fullUrl, options, (res) => {
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

  async pollJobStatus(jobId, jobName) {
    console.log(`\n🔍 Polling job status for ${jobName}...`);
    console.log(`📋 Job ID: ${jobId}`);
    
    const result = await this.makeRequest(`/Jobs/${jobId}`);
    
    if (result.success) {
      const job = result.data;
      console.log(`📊 Status: ${job.Status}`);
      
      if (job.Status === 'COMPLETE') {
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
    } else {
      console.log('❌ Failed to download job results');
      console.log('📄 Response:', result.data);
      return false;
    }
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
      record.RefDomain && record.RefDomain.toLowerCase().includes('on3.com')
    );

    console.log(`📊 Total referring domains: ${data.length}`);
    console.log(`🎯 on3.com domains: ${on3Domains.length}`);

    if (on3Domains.length > 0) {
      console.log('\n🎯 ON3.COM DOMAINS FOUND:');
      on3Domains.forEach((record, index) => {
        console.log(`${index + 1}. ${record.RefDomain}`);
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
        console.log(`${index + 1}. ${record.RefDomain || '(unknown)'}: $${parseFloat(record.Earnings || 0).toFixed(2)}`);
      });
    }
  }

  async pollJobs() {
    console.log('🚀 Starting Report Job Polling\n');
    
    if (!config.impact.username || !config.impact.password) {
      console.error('❌ Missing Impact API credentials!');
      console.log('Please set IMPACT_USERNAME and IMPACT_PASSWORD environment variables');
      return;
    }

    // Job IDs from the previous ReportExport test
    const jobs = [
      { id: '032a29a7-50e4-4222-9bb8-8ba9dc00d493', name: 'Subid Performance' },
      { id: '640d8d07-8cc6-40f0-a424-5bcdec998399', name: 'Referring Domain Performance' }
    ];

    let completedJobs = 0;
    const maxAttempts = 10;
    let attempt = 0;

    while (completedJobs < jobs.length && attempt < maxAttempts) {
      attempt++;
      console.log(`\n🔄 Polling attempt ${attempt}/${maxAttempts}`);
      
      for (const job of jobs) {
        if (job.completed) continue;
        
        const isComplete = await this.pollJobStatus(job.id, job.name);
        if (isComplete) {
          job.completed = true;
          completedJobs++;
        }
      }

      if (completedJobs < jobs.length) {
        console.log('\n⏳ Waiting 30 seconds before next poll...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    if (completedJobs === jobs.length) {
      console.log('\n🎉 All jobs completed successfully!');
    } else {
      console.log('\n⏰ Some jobs are still processing. You may need to poll again later.');
    }
  }
}

// Run the job polling
const poller = new ReportJobPoller();
poller.pollJobs()
  .then(() => {
    console.log('\n🎉 Job polling completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Job polling failed:', error.message);
    process.exit(1);
  }); 