/**
 * Revenue Data Collector Base Class
 * 
 * Abstract base class that defines the interface for platform-specific revenue collectors.
 * Each platform (Impact API, Amazon Associates, etc.) should extend this class.
 */

class RevenueDataCollector {
  constructor(platform, domain, config) {
    if (this.constructor === RevenueDataCollector) {
      throw new Error('RevenueDataCollector is an abstract class and cannot be instantiated directly');
    }
    
    this.platform = platform;
    this.domain = domain;
    this.config = config || {};
  }

  /**
   * Collect revenue data for a date range
   * @param {Date} startDate - Start date (inclusive)
   * @param {Date} endDate - End date (inclusive)
   * @returns {Promise<Array<RevenueEvent>>} Array of revenue events
   */
  async collectRevenueData(startDate, endDate) {
    throw new Error('collectRevenueData must be implemented by subclass');
  }

  /**
   * Transform platform-specific data to generic RevenueEvent format
   * @param {Object} platformData - Platform-specific revenue data
   * @returns {Object} Standardized revenue event object
   */
  transformToRevenueEvent(platformData) {
    throw new Error('transformToRevenueEvent must be implemented by subclass');
  }

  /**
   * Get the date range that should be collected (may differ from requested range)
   * @param {Date} startDate - Requested start date
   * @param {Date} endDate - Requested end date
   * @returns {Object} { startDate, endDate } - Actual date range to collect
   */
  getCollectionDateRange(startDate, endDate) {
    // Default: return as-is, subclasses can override
    return { startDate, endDate };
  }

  /**
   * Validate that a revenue event has required fields
   * @param {Object} event - Revenue event to validate
   * @returns {boolean} True if valid
   */
  validateRevenueEvent(event) {
    if (!event.domain) return false;
    if (!event.platform) return false;
    if (!event.revenue_date) return false;
    if (typeof event.revenue_amount !== 'number' || event.revenue_amount < 0) return false;
    if (!event.attribution_data) return false;
    return true;
  }
}

module.exports = { RevenueDataCollector };

