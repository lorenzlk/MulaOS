const { RevenueDataCollector } = require('../RevenueDataCollector');
const { ImpactDataCollector } = require('../ImpactDataCollector');

/**
 * Impact API Revenue Collector
 * 
 * Collects revenue data from Impact API using action-level records for line-item granularity.
 * Each action record has its own timestamp, enabling accurate date-range filtering.
 */
class ImpactRevenueCollector extends RevenueDataCollector {
  constructor(domain, config) {
    super('impact', domain, config);
    this.impactCollector = new ImpactDataCollector();
  }

  /**
   * Collect revenue data for a date range
   * @param {Date} startDate - Start date (inclusive)
   * @param {Date} endDate - End date (inclusive)
   * @returns {Promise<Array<Object>>} Array of revenue event objects
   */
  async collectRevenueData(startDate, endDate) {
    console.log(`📊 Collecting Impact API revenue data for ${this.domain}`);
    console.log(`   Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Use ImpactDataCollector to get action-level records with timestamps
    // This provides line-item granularity with actual event dates
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const actionRecords = await this.impactCollector.getActionRecords({
      startDate: startDateStr,
      endDate: endDateStr,
      subId1: 'mula', // Filter for Mula subid
      resultFormat: 'JSON'
    });

    console.log(`   Found ${actionRecords.length} action records`);

    // Transform action records to revenue events
    const events = [];
    for (const record of actionRecords) {
      // Only include records with valid dates, earnings, and subid1='mula'
      const recordSubId1 = (record.subId1 || '').toLowerCase();
      if (record.actionDate && record.earnings > 0 && recordSubId1 === 'mula') {
        const event = this.transformToRevenueEvent(record);
        if (this.validateRevenueEvent(event)) {
          events.push(event);
        } else {
          console.warn(`⚠️  Skipping invalid revenue event:`, event);
        }
      } else if (recordSubId1 !== 'mula') {
        console.warn(`⚠️  Skipping record with subid1='${recordSubId1}' (expected 'mula')`);
      }
    }

    console.log(`   Transformed to ${events.length} revenue events`);
    return events;
  }

  /**
   * Transform Impact API action record to revenue event
   * @param {Object} record - Impact API action record
   * @returns {Object} Revenue event object
   */
  transformToRevenueEvent(record) {
    // Parse action date to Date object
    const revenueDate = new Date(record.actionDate);
    const revenueDateStr = revenueDate.toISOString().split('T')[0];
    
    return {
      domain: this.domain,
      platform: 'impact',
      revenue_date: revenueDateStr,
      revenue_amount: parseFloat(record.earnings || 0),
      currency: 'USD',
      attribution_data: {
        saleAmount: record.saleAmount || 0,
        actionId: record.actionId,
        actionTracker: record.actionTracker,
        status: record.status,
        promoCode: record.promoCode,
        campaignName: record.campaignName,
        rawRecord: record.rawRecord
      },
      subid1: record.subId1?.toLowerCase() || null,
      subid2: record.subId2 || null,
      subid3: record.subId3 || null,
      campaign_id: record.campaignName || null,
      action_id: record.actionId || null,
      platform_event_id: this.generateEventId(record)
    };
  }

  /**
   * Generate unique event ID for deduplication
   * @param {Object} record - Impact API action record
   * @returns {string} Unique event ID
   */
  generateEventId(record) {
    // Use actionId if available (most reliable)
    if (record.actionId) {
      return `impact_action_${record.actionId}`;
    }
    
    // Fallback: composite key (less reliable for deduplication)
    // Include timestamp to make it more unique
    const timestamp = record.actionDate ? new Date(record.actionDate).getTime() : Date.now();
    return `impact_${record.subId1}_${record.subId2}_${timestamp}_${record.earnings}`;
  }
}

module.exports = { ImpactRevenueCollector };

