const { Op } = require('sequelize');

/**
 * Revenue Data Service
 * 
 * Service layer for managing revenue data collection, storage, and retrieval.
 * Handles database operations and business logic for revenue events.
 */
class RevenueDataService {
  constructor(models) {
    this.RevenueEvent = models.RevenueEvent;
    this.RevenueCollectionJob = models.RevenueCollectionJob;
    this.RevenueCollectionStatus = models.RevenueCollectionStatus;
  }

  /**
   * Get revenue data for a domain and date range
   * @param {String} domain - Domain name
   * @param {Date} startDate - Start date (inclusive)
   * @param {Date} endDate - End date (inclusive)
   * @param {String} platform - Optional platform filter
   * @param {Object} options - Additional options (subid filters, etc.)
   * @returns {Promise<Object>} { events, totalRevenue, lastCollectionAt, eventCount }
   */
  async getRevenueData(domain, startDate, endDate, platform = null, options = {}) {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const where = {
      domain,
      revenue_date: {
        [Op.between]: [startDateStr, endDateStr]
      }
    };

    if (platform) {
      where.platform = platform;
    }

    if (options.subid1) {
      where.subid1 = options.subid1.toLowerCase();
    }

    if (options.subid2) {
      where.subid2 = options.subid2;
    }

    if (options.subid3) {
      where.subid3 = options.subid3;
    }

    const events = await this.RevenueEvent.findAll({ 
      where,
      order: [['revenue_date', 'ASC']]
    });

    const totalRevenue = events.reduce((sum, event) => 
      sum + parseFloat(event.revenue_amount), 0
    );

    // Get last collection timestamp
    const statusWhere = { domain };
    if (platform) {
      statusWhere.platform = platform;
    }
    const status = await this.RevenueCollectionStatus.findOne({ where: statusWhere });

    return {
      events,
      totalRevenue,
      eventCount: events.length,
      lastCollectionAt: status?.last_successful_collection_at || null,
      lastCollectionDateRange: status ? {
        start: status.last_collected_date_range_start,
        end: status.last_collected_date_range_end
      } : null
    };
  }

  /**
   * Calculate RPM (Revenue Per Mille) for a domain and date range
   * @param {String} domain - Domain name
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Number} views - Number of views (denominator for RPM)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} { rpm, totalRevenue, views, lastCollectionAt, eventCount }
   */
  async calculateRPM(domain, startDate, endDate, views, options = {}) {
    const revenueData = await this.getRevenueData(domain, startDate, endDate, options.platform, options);
    
    const rpm = views > 0 
      ? (revenueData.totalRevenue / views) * 1000 
      : 0;

    return {
      rpm: rpm.toFixed(2),
      totalRevenue: revenueData.totalRevenue,
      views,
      lastCollectionAt: revenueData.lastCollectionAt,
      eventCount: revenueData.eventCount
    };
  }

  /**
   * Store revenue events in database
   * @param {Array<Object>} events - Revenue events to store
   * @param {Number} jobId - Collection job ID
   * @returns {Promise<Object>} { stored, skipped, errors }
   */
  async storeRevenueEvents(events, jobId) {
    let stored = 0;
    let skipped = 0;
    const errors = [];
    
    for (const event of events) {
      try {
        // Use upsert to handle deduplication
        // If platform_event_id is set, use it for deduplication
        const where = {
          platform: event.platform,
          domain: event.domain
        };

        if (event.platform_event_id) {
          where.platform_event_id = event.platform_event_id;
        }

        const [revenueEvent, created] = await this.RevenueEvent.findOrCreate({
          where,
          defaults: {
            ...event,
            collection_job_id: jobId
          }
        });

        if (created) {
          stored++;
        } else {
          // Update existing record if needed
          await revenueEvent.update({
            ...event,
            collection_job_id: jobId,
            updatedAt: new Date()
          });
          skipped++; // Count as skipped since it already existed
        }
      } catch (error) {
        console.error(`Error storing revenue event:`, error);
        errors.push({ event, error: error.message });
      }
    }

    return { stored, skipped, errors };
  }

  /**
   * Update collection status after successful collection
   * @param {String} domain - Domain name
   * @param {String} platform - Platform name
   * @param {Number} jobId - Collection job ID
   * @param {Date} startDate - Collection start date
   * @param {Date} endDate - Collection end date
   * @param {Number} eventCount - Number of events collected
   * @param {Number} durationSeconds - Collection duration in seconds
   */
  async updateCollectionStatus(domain, platform, jobId, startDate, endDate, eventCount, durationSeconds) {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Ensure database connection is open
    try {
      await this.RevenueCollectionStatus.sequelize.authenticate();
    } catch (error) {
      console.warn('Database connection closed, attempting to reconnect...');
      // Connection will be re-established automatically on next query
    }

    const [status, created] = await this.RevenueCollectionStatus.findOrCreate({
      where: { domain, platform },
      defaults: {
        domain,
        platform,
        last_successful_collection_at: new Date(),
        last_collection_job_id: jobId,
        last_collected_date_range_start: startDateStr,
        last_collected_date_range_end: endDateStr,
        total_events_collected: eventCount,
        last_collection_duration_seconds: durationSeconds
      }
    });

    if (!created) {
      // Update existing status
      await status.update({
        last_successful_collection_at: new Date(),
        last_collection_job_id: jobId,
        last_collected_date_range_start: startDateStr,
        last_collected_date_range_end: endDateStr,
        total_events_collected: status.total_events_collected + eventCount,
        last_collection_duration_seconds: durationSeconds
      });
    }
  }
}

module.exports = { RevenueDataService };

