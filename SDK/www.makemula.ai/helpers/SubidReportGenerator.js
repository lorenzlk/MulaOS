const https = require('https');
const querystring = require('querystring');
const config = require('../config');

/**
 * Subid Report Generator
 * Generates comprehensive subid performance reports with configurable lookback windows
 * Can be used standalone or integrated with workers
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

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generateSubidReport(daysBack = 7, filterMula = false, useExportApi = true) {
    console.log('\n📊 Generating Subid Performance Report');
    console.log('=====================================');
    console.log(`📅 Report Period: Last ${daysBack} days`);
    console.log(`🎯 Filter Mula Only: ${filterMula}`);
    console.log(`🚀 Using Export API: ${useExportApi}`);
    console.log('');
    
    if (useExportApi) {
      return await this.generateExportReport(daysBack, filterMula);
    } else {
      return await this.generateStandardReport(daysBack, filterMula);
    }
  }

  async generateStandardReport(daysBack, filterMula) {
    const result = await this.makeRequest('/Reports/partner_performance_by_subid', {
      PageSize: 100
    });
    
    if (result.success) {
      return this.formatSubidReport(result.data, daysBack, filterMula);
    } else {
      throw new Error(`Failed to get Sub ID performance data: ${result.data}`);
    }
  }

  async generateExportReport(daysBack, filterMula) {
    // Store the daysBack for use in redirect downloads
    this.currentDaysBack = daysBack;
    
    // Calculate date range
    const endDate = this.getDateDaysAgo(0);
    const startDate = this.getDateDaysAgo(daysBack);
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    
    const params = {
      START_DATE: startDate,
      END_DATE: endDate,
      ResultFormat: 'JSON'
    };

    // Add mula filter if requested
    if (filterMula) {
      params.SubId1 = 'mula';
    }
    
    console.log('📋 Export Parameters:', params);
    
    const result = await this.makeRequest('/ReportExport/partner_performance_by_subid', params);
    
    if (result.success) {
      if (result.data.Status === 'QUEUED') {
        const jobId = result.data.QueuedUri.split('/').pop();
        console.log(`📋 Job queued with ID: ${jobId}`);
        return await this.pollAndDownload(jobId, `Subid Report (${daysBack} days)`);
      } else if (result.data.Status === 'COMPLETED') {
        return this.formatSubidReport(result.data, daysBack, filterMula);
      } else {
        throw new Error(`Unexpected export status: ${result.data.Status}`);
      }
    } else {
      throw new Error(`Failed to export subid report: ${result.data}`);
    }
  }

  async pollAndDownload(jobId, jobName) {
    console.log(`\n🔍 Polling job status for ${jobName}...`);
    console.log(`📋 Job ID: ${jobId}`);
    
    const maxAttempts = 10;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`\n🔄 Polling attempt ${attempt}/${maxAttempts}`);
      
      const result = await this.makeRequest(`/Jobs/${jobId}`);
      
      if (result.success) {
        const job = result.data;
        console.log(`📊 Status: ${job.Status}`);
        
        if (job.Status === 'COMPLETED') {
          console.log('✅ Job completed! Downloading results...');
          return await this.downloadResults(jobId, jobName);
        } else if (job.Status === 'FAILED') {
          console.log('❌ Job failed!');
          console.log('📄 Error details:', JSON.stringify(job, null, 2));
          throw new Error(`Export job failed: ${job.Status}`);
        } else {
          console.log(`⏳ Job still processing... (${job.Status})`);
        }
      } else {
        console.log('❌ Failed to get job status');
        console.log('📄 Response:', result.data);
        throw new Error('Failed to get job status');
      }

      if (attempt < maxAttempts) {
        console.log('\n⏳ Waiting 5 seconds before next poll...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    throw new Error('Max polling attempts reached. Job may still be processing.');
  }

  async downloadResults(jobId, jobName) {
    console.log(`\n📥 Downloading results for ${jobName}...`);
    
    const result = await this.makeRequest(`/Jobs/${jobId}/Download`);
    
    if (result.success) {
      console.log('✅ Results downloaded successfully!');
      return this.formatSubidReport(result.data, this.currentDaysBack || 7, false);
    } else if (result.statusCode === 302) {
      console.log('🔄 Following redirect to download results...');
      return await this.downloadFromRedirect(result.data, jobName);
    } else {
      console.log('❌ Failed to download job results');
      console.log('📄 Response:', result.data);
      throw new Error('Failed to download job results');
    }
  }

  async downloadFromRedirect(redirectResponse, jobName) {
    const match = redirectResponse.match(/href="([^"]+)"/);
    if (!match) {
      console.log('❌ Could not extract redirect URL from response');
      console.log('📄 Response:', redirectResponse);
      throw new Error('Could not extract redirect URL');
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
              resolve(this.formatSubidReport(response, this.currentDaysBack || 7, false));
            } else {
              console.log('❌ Failed to download from redirect');
              console.log('📄 Response:', data);
              reject(new Error('Failed to download from redirect'));
            }
          } catch (error) {
            console.log('❌ Failed to parse redirect response');
            console.log('📄 Response:', data);
            console.log('💥 Error:', error.message);
            reject(new Error('Failed to parse redirect response'));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  formatSubidReport(data, daysBack, filterMula) {
    if (!data.Records || !Array.isArray(data.Records)) {
      throw new Error('No records found in response');
    }

    const records = data.Records;
    console.log(`📊 Total Records Found: ${records.length}`);

    // Filter records based on criteria
    let filteredRecords = records;
    if (filterMula) {
      filteredRecords = records.filter(record => 
        record.pubsubid1_ && record.pubsubid1_.toLowerCase().includes('mula')
      );
      console.log(`🎯 Filtered to ${filteredRecords.length} Mula-related records`);
    }

    // Calculate summary statistics
    const totalClicks = filteredRecords.reduce((sum, record) => sum + (parseInt(record.Clicks) || 0), 0);
    const totalActions = filteredRecords.reduce((sum, record) => sum + (parseInt(record.Actions) || 0), 0);
    const totalEarnings = filteredRecords.reduce((sum, record) => sum + parseFloat(record.Earnings || 0), 0);
    const overallConversionRate = totalClicks > 0 ? ((totalActions / totalClicks) * 100).toFixed(1) : '0.0';

    // Get top performers
    const topPerformers = filteredRecords
      .filter(record => parseFloat(record.Earnings || 0) > 0)
      .sort((a, b) => parseFloat(b.Earnings || 0) - parseFloat(a.Earnings || 0))
      .slice(0, 5);

    // Format for Slack
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Impact Subid Performance Report (${daysBack} days)`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Summary Statistics*\n• Total Clicks: ${totalClicks.toLocaleString()}\n• Total Actions: ${totalActions.toLocaleString()}\n• Conversion Rate: ${overallConversionRate}%\n• Total Earnings: $${totalEarnings.toFixed(2)}`
        }
      }
    ];

    // Add top performers section
    if (topPerformers.length > 0) {
      const topPerformersText = topPerformers.map((record, index) => {
        const subid = record.pubsubid1_ || '(empty)';
        const earnings = parseFloat(record.Earnings || 0).toFixed(2);
        const clicks = parseInt(record.Clicks) || 0;
        const actions = parseInt(record.Actions) || 0;
        const conversionRate = clicks > 0 ? ((actions / clicks) * 100).toFixed(1) : '0.0';
        return `${index + 1}. *${subid}*: $${earnings} (${clicks} clicks, ${actions} actions, ${conversionRate}% conv)`;
      }).join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🏆 Top Performers (by earnings)*\n${topPerformersText}`
        }
      });
    }

    // Add detailed breakdown if not too many records
    if (filteredRecords.length <= 20) {
      const breakdownText = filteredRecords.map((record, index) => {
        const subid = record.pubsubid1_ || '(empty)';
        const clicks = parseInt(record.Clicks) || 0;
        const actions = parseInt(record.Actions) || 0;
        const earnings = parseFloat(record.Earnings || 0);
        const conversionRate = clicks > 0 ? ((actions / clicks) * 100).toFixed(1) : '0.0';
        
        return `${index + 1}. *${subid}*\n   • Clicks: ${clicks} | Actions: ${actions} | Conv: ${conversionRate}%\n   • Earnings: $${earnings.toFixed(2)}`;
      }).join('\n\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Detailed Breakdown*\n${breakdownText}`
        }
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Records Found*\nShowing ${filteredRecords.length} subids. Use \`--mula-only\` flag to filter for Mula-specific subids only.`
        }
      });
    }

    return {
      text: `📊 Impact Subid Performance Report (${daysBack} days) - Total Earnings: $${totalEarnings.toFixed(2)}`,
      blocks,
      rawData: filteredRecords,
      summary: {
        totalClicks,
        totalActions,
        totalEarnings,
        conversionRate: overallConversionRate,
        recordCount: filteredRecords.length
      }
    };
  }

  // Console-friendly display method for standalone usage
  displayConsoleReport(reportData, reportName) {
    console.log(`\n📊 ${reportName} Report Summary:`);
    console.log('=====================================');
    console.log(`📊 Total Records: ${reportData.summary.recordCount}`);
    console.log(`📈 Total Clicks: ${reportData.summary.totalClicks.toLocaleString()}`);
    console.log(`🎯 Total Actions: ${reportData.summary.totalActions.toLocaleString()}`);
    console.log(`💰 Total Earnings: $${reportData.summary.totalEarnings.toFixed(2)}`);
    console.log(`📊 Conversion Rate: ${reportData.summary.conversionRate}%`);
    
    if (reportData.rawData && reportData.rawData.length > 0) {
      console.log('\n📋 Top Records:');
      reportData.rawData.slice(0, 10).forEach((record, index) => {
        console.log(`\n${index + 1}. SubId: "${record.pubsubid1_}"`);
        console.log(`   Campaign: ${record.Campaign || 'N/A'}`);
        console.log(`   Clicks: ${record.Clicks || 0}`);
        console.log(`   Actions: ${record.Actions || 0}`);
        console.log(`   Earnings: $${parseFloat(record.Earnings || 0).toFixed(2)}`);
      });
    }
  }
}

module.exports = { SubidReportGenerator };
