const https = require('https');
const querystring = require('querystring');
const config = require('../config');

/**
 * Impact Data Collector
 * Collects individual click and action records with detailed attribution fields
 * Uses the ReportExport endpoint for Actions and ClickExport endpoint for Clicks
 * Based on: https://integrations.impact.com/impact-publisher/reference/export-reports
 * and: https://integrations.impact.com/impact-publisher/reference/clicks-overview
 */

class ImpactDataCollector {
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
          'User-Agent': 'Mula-Data-Collector/1.0'
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

  /**
   * Export a report using the ReportExport endpoint
   * @param {string} reportId - Report ID or handle
   * @param {Object} options - Export options
   * @returns {Object} Export job information
   */
  async exportReport(reportId, options = {}) {
    const {
      startDate,
      endDate,
      subId1,
      subId2,
      subId3,
      resultFormat = 'JSON',
      subAid
    } = options;

    console.log(`\n🔍 Exporting report: ${reportId}`);

    const params = {
      ResultFormat: resultFormat
    };

    // Add required parameters
    if (startDate) params.START_DATE = startDate;
    if (endDate) params.END_DATE = endDate;
    if (subAid) params.SUBAID = subAid;

    // Add subId filters
    if (subId1) params.SubId1 = subId1;
    if (subId2) params.SubId2 = subId2;
    if (subId3) params.SubId3 = subId3;

    const result = await this.makeRequest(`/ReportExport/${reportId}`, params);
    
    if (result.success) {
      console.log('✅ Export job created successfully');
      return result.data;
    } else {
      throw new Error(`Failed to create export job: ${result.data}`);
    }
  }

  /**
   * Export clicks using the ClickExport endpoint
   * @param {Object} options - Export options
   * @returns {Object} Export job information
   */
  async exportClicks(options = {}) {
    const {
      startDate,
      endDate,
      subId1,
      subId2,
      subId3,
      resultFormat = 'JSON',
      subAid
    } = options;

    console.log(`\n🔍 Exporting clicks using ClickExport endpoint`);

    const params = {
      ResultFormat: resultFormat
    };

    // Add required parameters
    if (startDate) params.START_DATE = startDate;
    if (endDate) params.END_DATE = endDate;
    if (subAid) params.SUBAID = subAid;

    // Add subId filters
    if (subId1) params.SubId1 = subId1;
    if (subId2) params.SubId2 = subId2;
    if (subId3) params.SubId3 = subId3;

    const result = await this.makeRequest(`/ClickExport`, params);
    
    if (result.success) {
      console.log('✅ Click export job created successfully');
      return result.data;
    } else {
      throw new Error(`Failed to create click export job: ${result.data}`);
    }
  }

  /**
   * Poll a job until completion
   * @param {string} jobId - Job ID from export response
   * @param {number} maxAttempts - Maximum polling attempts (default: 20)
   * @param {number} pollInterval - Polling interval in seconds (default: 10)
   * @returns {Object} Job status and result data
   */
  async pollJob(jobId, maxAttempts = 20, pollInterval = 10) {
    console.log(`\n🔍 Polling job: ${jobId}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}`);
      
      const result = await this.makeRequest(`/Jobs/${jobId}`);
      
      if (result.success) {
        const job = result.data;
        console.log(`📊 Job Status: ${job.Status}`);
        
        if (job.Status === 'COMPLETED') {
          console.log('✅ Job completed! Downloading results...');
          return await this.downloadJobResult(jobId);
        } else if (job.Status === 'FAILED') {
          console.log('❌ Job failed!');
          throw new Error(`Export job failed: ${job.Status}`);
        } else {
          console.log(`⏳ Job still processing... (${job.Status})`);
        }
      } else {
        throw new Error('Failed to get job status');
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${pollInterval} seconds before next poll...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
      }
    }

    throw new Error('Max polling attempts reached. Job may still be processing.');
  }

  /**
   * Download job result
   * @param {string} jobId - Job ID
   * @returns {Object} Job result data
   */
  async downloadJobResult(jobId) {
    console.log(`\n📥 Downloading job result: ${jobId}`);
    
    const result = await this.makeRequest(`/Jobs/${jobId}/Download`);
    
    if (result.success) {
      console.log('✅ Job result downloaded successfully!');
      return result.data;
    } else if (result.statusCode === 302) {
      console.log('🔄 Following redirect to download results...');
      return await this.downloadFromRedirect(result.data, jobId);
    } else {
      throw new Error('Failed to download job result');
    }
  }

  /**
   * Download from redirect URL
   * @param {string} redirectResponse - HTML response containing redirect
   * @param {string} jobId - Job ID for logging
   * @returns {Object} Downloaded data
   */
  async downloadFromRedirect(redirectResponse, jobId) {
    const match = redirectResponse.match(/href="([^"]+)"/);
    if (!match) {
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
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              console.log('✅ Results downloaded from redirect successfully!');
              resolve(response);
            } else {
              reject(new Error('Failed to download from redirect'));
            }
          } catch (error) {
            reject(new Error('Failed to parse redirect response'));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Get individual action records with detailed attribution
   * @param {Object} options - Query options
   * @returns {Array} Processed action records
   */
  async getActionRecords(options = {}) {
    console.log('\n🔍 Collecting Action Records');
    console.log('============================');

    const exportResult = await this.exportReport('mp_action_listing_fast', options);
    
    if (exportResult.Status === 'QUEUED') {
      const jobId = exportResult.QueuedUri.split('/').pop();
      console.log(`📋 Job queued with ID: ${jobId}`);
      
      const jobResult = await this.pollJob(jobId);
      return this.processActionRecords(jobResult);
    } else if (exportResult.Status === 'COMPLETED') {
      return this.processActionRecords(exportResult);
    } else {
      throw new Error(`Unexpected export status: ${exportResult.Status}`);
    }
  }

  /**
   * Get individual click records with detailed attribution
   * @param {Object} options - Query options
   * @returns {Array} Processed click records
   */
  async getClickRecords(options = {}) {
    console.log('\n🔍 Collecting Click Records');
    console.log('============================');

    const exportResult = await this.exportClicks(options);
    
    if (exportResult.Status === 'QUEUED') {
      const jobId = exportResult.QueuedUri.split('/').pop();
      console.log(`📋 Job queued with ID: ${jobId}`);
      
      const jobResult = await this.pollJob(jobId);
      return this.processClickRecords(jobResult);
    } else if (exportResult.Status === 'COMPLETED') {
      return this.processClickRecords(exportResult);
    } else {
      throw new Error(`Unexpected export status: ${exportResult.Status}`);
    }
  }

  /**
   * Process action records to extract attribution fields
   * @param {Object} data - Raw action data from export
   * @returns {Array} Processed action records
   */
  processActionRecords(data) {
    console.log('📊 Processing action records...');
    
    let records = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data.Records && Array.isArray(data.Records)) {
      records = data.Records;
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records;
    } else {
      console.log('📄 Unexpected data format:', typeof data);
      return [];
    }

    console.log(`📊 Found ${records.length} action records`);

    return records.map(record => ({
      // Core attribution fields
      subId1: record.Subid1 || record.SubId1 || record.subid1 || null,
      subId2: record.Subid2 || record.SubId2 || record.subid2 || null,
      subId3: record.Subid3 || record.SubId3 || record.subid3 || null,
      
      // Action identification
      actionId: record.action_id || record.Action_Id || record.Id || record.id || null,
      
      // Timestamps
      actionDate: record.action_date || record.Action_Date || record.Date || record.date || null,
      
      // Revenue data
      earnings: parseFloat(record.Payout || record.earnings || record.Earnings || 0),
      saleAmount: parseFloat(record.sale_amount || record.Sale_Amount || record.SaleAmount || 0),
      
      // Campaign data
      campaignName: record.Campaign || record.campaign_name || record.CampaignName || null,
      
      // Action details
      actionTracker: record.action_tracker || record.Event_Type || record.Action_Type || null,
      status: record.Status || record.status || null,
      promoCode: record.promo_code || record.Promo_Code || record.PromoCode || null,
      
      // Raw record for debugging
      rawRecord: record
    }));
  }

  /**
   * Process click records to extract attribution fields
   * @param {Object} data - Raw click data from export
   * @returns {Array} Processed click records
   */
  processClickRecords(data) {
    console.log('📊 Processing click records...');
    
    let records = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data.Clicks && Array.isArray(data.Clicks)) {
      records = data.Clicks;
    } else if (data.Records && Array.isArray(data.Records)) {
      records = data.Records;
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records;
    } else {
      console.log('📄 Unexpected data format:', typeof data);
      console.log('📄 Available keys:', Object.keys(data || {}));
      return [];
    }

    console.log(`📊 Found ${records.length} click records`);

    return records.map(record => ({
      // Core attribution fields
      subId1: record.SubId1 || record.Subid1 || record.subid1 || null,
      subId2: record.SubId2 || record.Subid2 || record.subid2 || null,
      subId3: record.SubId3 || record.Subid3 || record.subid3 || null,
      
      // Click identification
      clickId: record.Id || record.ClickId || record.click_id || record.id || null,
      
      // Timestamps
      clickDate: record.EventDate || record.ClickDate || record.Date || record.click_date || record.date || null,
      
      // Campaign data
      campaignName: record.ProgramName || record.Campaign || record.campaign_name || record.CampaignName || null,
      programId: record.ProgramId || record.program_id || null,
      
      // Ad data
      adId: record.AdId || record.ad_id || null,
      adName: record.AdName || record.ad_name || null,
      adType: record.AdType || record.ad_type || null,
      productSku: record.ProductSku || record.product_sku || null,
      
      // URL data
      referringUrl: record.ReferringDomain || record.ReferringURL || record.referring_url || record.ReferringUrl || null,
      destinationUrl: record.LandingPageUrl || record.DestinationURL || record.destination_url || record.DestinationUrl || null,
      
      // Device/browser data
      deviceType: record.DeviceType || record.device_type || null,
      deviceFamily: record.DeviceFamily || record.device_family || null,
      browser: record.Browser || record.browser || null,
      operatingSystem: record.Os || record.OperatingSystem || record.operating_system || null,
      
      // Geographic data
      country: record.CustomerCountry || record.Country || record.country || null,
      region: record.CustomerRegion || record.Region || record.region || null,
      city: record.CustomerCity || record.City || record.city || null,
      area: record.CustomerArea || record.area || null,
      
      // Media data
      mediaId: record.MediaId || record.media_id || null,
      mediaName: record.MediaName || record.media_name || null,
      profileId: record.ProfileId || record.profile_id || null,
      
      // Click metrics
      uniqueClick: record.UniqueClick || record.unique_click || null,
      cpcBid: record.CpcBid || record.cpc_bid || null,
      
      // Raw record for debugging
      rawRecord: record
    }));
  }

  /**
   * Get both clicks and actions for a specific time period
   * @param {Object} options - Query options
   * @returns {Object} Combined click and action data
   */
  async getClickAndActionData(options = {}) {
    console.log('\n🔍 Collecting Click and Action Data');
    console.log('===================================');

    const [clicks, actions] = await Promise.all([
      this.getClickRecords(options).catch(error => {
        console.log('⚠️  Click collection failed:', error.message);
        return [];
      }),
      this.getActionRecords(options).catch(error => {
        console.log('⚠️  Action collection failed:', error.message);
        return [];
      })
    ]);

    return {
      clicks,
      actions,
      summary: {
        clickCount: clicks.length,
        actionCount: actions.length,
        totalEarnings: actions.reduce((sum, action) => sum + action.earnings, 0),
        totalSales: actions.reduce((sum, action) => sum + action.saleAmount, 0)
      }
    };
  }

  /**
   * Display processed data in a formatted way
   * @param {Array} records - Processed records
   * @param {string} type - Type of records ('clicks' or 'actions')
   */
  displayData(records, type = 'data') {
    console.log(`\n📊 ${type.toUpperCase()} RECORDS (${records.length} total)`);
    console.log('='.repeat(50));

    if (records.length === 0) {
      console.log('❌ No records found');
      return;
    }

    records.slice(0, 10).forEach((record, index) => {
      console.log(`\n${index + 1}. Record:`);
      console.log(`   SubId1: ${record.subId1 || 'N/A'}`);
      console.log(`   SubId2: ${record.subId2 || 'N/A'}`);
      console.log(`   SubId3: ${record.subId3 || 'N/A'}`);
      
      if (type === 'clicks') {
        console.log(`   Click Date: ${record.clickDate || 'N/A'}`);
        console.log(`   Campaign: ${record.campaignName || 'N/A'}`);
        console.log(`   Referring URL: ${record.referringUrl || 'N/A'}`);
      } else if (type === 'actions') {
        console.log(`   Action Date: ${record.actionDate || 'N/A'}`);
        console.log(`   Earnings: $${record.earnings.toFixed(2)}`);
        console.log(`   Sale Amount: $${record.saleAmount.toFixed(2)}`);
        console.log(`   Action Type: ${record.actionTracker || 'N/A'}`);
      }
    });

    if (records.length > 10) {
      console.log(`\n... and ${records.length - 10} more records`);
    }
  }
}

module.exports = { ImpactDataCollector };
