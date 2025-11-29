# Revenue Data System Design

## Overview

This document outlines the design for a robust, decoupled revenue data collection and caching system that supports multiple affiliate platforms (Impact API, Amazon Associates, and future platforms) with independent scheduling, retry logic, and date-range filtering capabilities.

**✅ TESTED & CONFIRMED**: Impact API provides line-item granularity with timestamps. Test script `test-impact-line-item-timestamps.js` confirms:
- Action records have individual `actionDate` timestamps (41/41 records in test)
- Click records have individual `clickDate` timestamps (164/164 records in test)
- Date range filtering works accurately
- Enables proper time slicing for variable lookback windows

## Problem Statement

The current implementation in `performanceReportWorker.js` directly calls the Impact API during report generation, which:
- Is unreliable and often fails, leaving reports without revenue data
- Blocks report generation when API calls fail
- Doesn't support retries or different cadences
- Doesn't show data freshness to users
- Can't handle variable lookback windows properly (needs line-item level data with timestamps)

## Solution Architecture

### Core Principles

1. **Decoupling**: Revenue data collection is completely separate from report generation
2. **Generic Schema**: Platform-agnostic data model that works for Impact API, Amazon Associates, and future platforms
3. **Line-Item Granularity**: Store individual revenue events with timestamps for flexible date range filtering
4. **Caching**: Database-backed cache with timestamps for data freshness tracking
5. **Retry Logic**: Automatic retries with exponential backoff for failed API calls
6. **Flexible Scheduling**: Independent workers can run at different cadences per domain/platform

## Database Schema

### 1. Revenue Data Collection Jobs (`revenue_collection_jobs`)

Tracks scheduled and ad-hoc revenue data collection jobs.

```sql
CREATE TABLE revenue_collection_jobs (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  platform ENUM('impact', 'amazon_associates', 'other') NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  scheduledAt TIMESTAMP NOT NULL,
  startedAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  lastError TEXT NULL,
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 3,
  config JSONB NULL, -- Platform-specific configuration
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revenue_jobs_domain_platform ON revenue_collection_jobs(domain, platform);
CREATE INDEX idx_revenue_jobs_status ON revenue_collection_jobs(status);
CREATE INDEX idx_revenue_jobs_scheduled ON revenue_collection_jobs(scheduledAt) WHERE status = 'pending';
```

### 2. Revenue Events (`revenue_events`)

Stores individual revenue events with full attribution data. This is the core table that enables date-range filtering.

```sql
CREATE TABLE revenue_events (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  platform ENUM('impact', 'amazon_associates', 'other') NOT NULL,
  
  -- Revenue data
  revenue_date DATE NOT NULL, -- Date the revenue event occurred (from affiliate platform)
  revenue_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Attribution data (platform-agnostic, stored as JSONB for flexibility)
  attribution_data JSONB NOT NULL, -- Platform-specific attribution fields
  
  -- Common attribution fields (extracted for easier querying)
  subid1 VARCHAR(255) NULL, -- e.g., 'mula' for Impact API
  subid2 VARCHAR(255) NULL, -- e.g., session_id for Impact API
  subid3 VARCHAR(255) NULL, -- e.g., team/section for Impact API
  campaign_id VARCHAR(255) NULL,
  action_id VARCHAR(255) NULL, -- Transaction/action identifier
  
  -- Collection metadata
  collection_job_id INTEGER REFERENCES revenue_collection_jobs(id),
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When we collected this data
  platform_event_id VARCHAR(255) NULL, -- Unique ID from platform (for deduplication)
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revenue_events_domain_date ON revenue_events(domain, revenue_date);
CREATE INDEX idx_revenue_events_platform_date ON revenue_events(platform, revenue_date);
CREATE INDEX idx_revenue_events_subid1 ON revenue_events(subid1) WHERE subid1 IS NOT NULL;
CREATE INDEX idx_revenue_events_subid2 ON revenue_events(subid2) WHERE subid2 IS NOT NULL;
CREATE INDEX idx_revenue_events_collection_job ON revenue_events(collection_job_id);
CREATE INDEX idx_revenue_events_platform_event_id ON revenue_events(platform, platform_event_id) WHERE platform_event_id IS NOT NULL;
CREATE UNIQUE INDEX idx_revenue_events_dedupe ON revenue_events(platform, platform_event_id, domain) WHERE platform_event_id IS NOT NULL;
```

**Attribution Data JSONB Structure Examples:**

**Impact API:**
```json
{
  "clicks": 5,
  "actions": 2,
  "conversionRate": 40.0,
  "pubsubid1": "mula",
  "pubsubid2": "session_abc123",
  "pubsubid3": "michigan-wolverines",
  "campaign": "Fanatics",
  "rawRecord": { /* full Impact API record */ }
}
```

**Amazon Associates:**
```json
{
  "orderId": "123-4567890-1234567",
  "asin": "B08XYZ123",
  "itemPrice": 29.99,
  "quantity": 1,
  "commission": 1.50,
  "rawRecord": { /* full Amazon Associates record */ }
}
```

### 3. Revenue Collection Status (`revenue_collection_status`)

Tracks the last successful collection for each domain/platform combination, enabling freshness checks.

```sql
CREATE TABLE revenue_collection_status (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  platform ENUM('impact', 'amazon_associates', 'other') NOT NULL,
  
  -- Collection metadata
  last_successful_collection_at TIMESTAMP NULL,
  last_collection_job_id INTEGER REFERENCES revenue_collection_jobs(id),
  last_collected_date_range_start DATE NULL, -- Start date of last collected range
  last_collected_date_range_end DATE NULL,   -- End date of last collected range
  
  -- Collection settings
  collection_cadence_hours INTEGER DEFAULT 24, -- How often to collect (e.g., 24 = daily)
  is_active BOOLEAN DEFAULT true,
  
  -- Statistics
  total_events_collected INTEGER DEFAULT 0,
  last_collection_duration_seconds INTEGER NULL,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(domain, platform)
);

CREATE INDEX idx_revenue_status_domain_platform ON revenue_collection_status(domain, platform);
CREATE INDEX idx_revenue_status_last_collection ON revenue_collection_status(last_successful_collection_at);
```

## Component Design

### 1. Revenue Data Collector Base Class (`RevenueDataCollector`)

Abstract base class that defines the interface for platform-specific collectors.

```javascript
// www.makemula.ai/helpers/RevenueDataCollector.js

class RevenueDataCollector {
  constructor(platform, domain, config) {
    this.platform = platform;
    this.domain = domain;
    this.config = config;
  }

  /**
   * Collect revenue data for a date range
   * @param {Date} startDate - Start date (inclusive)
   * @param {Date} endDate - End date (inclusive)
   * @returns {Promise<Array<RevenueEvent>>} Array of revenue events
   */
  async collectRevenueData(startDate, endDate) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Transform platform-specific data to generic RevenueEvent format
   * @param {Object} platformData - Platform-specific revenue data
   * @returns {RevenueEvent} Standardized revenue event
   */
  transformToRevenueEvent(platformData) {
    throw new Error('Must be implemented by subclass');
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
}
```

### 2. Impact API Revenue Collector (`ImpactRevenueCollector`)

Extends `RevenueDataCollector` to collect data from Impact API using action-level records for line-item granularity.

**✅ TESTED & CONFIRMED**: Impact API provides action records with individual `actionDate` timestamps, enabling proper time slicing. See `test-impact-line-item-timestamps.js` for test results.

```javascript
// www.makemula.ai/helpers/collectors/ImpactRevenueCollector.js

const { RevenueDataCollector } = require('../RevenueDataCollector');
const { ImpactDataCollector } = require('../ImpactDataCollector');

class ImpactRevenueCollector extends RevenueDataCollector {
  constructor(domain, config) {
    super('impact', domain, config);
    this.impactCollector = new ImpactDataCollector();
  }

  async collectRevenueData(startDate, endDate) {
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

    // Transform action records to revenue events
    const events = [];
    for (const record of actionRecords) {
      // Only include records with valid dates and earnings
      if (record.actionDate && record.earnings > 0) {
        events.push(this.transformToRevenueEvent(record));
      }
    }

    return events;
  }

  transformToRevenueEvent(record) {
    // Parse action date to Date object
    const revenueDate = new Date(record.actionDate);
    
    return {
      domain: this.domain,
      platform: 'impact',
      revenue_date: revenueDate.toISOString().split('T')[0], // Store as DATE
      revenue_amount: record.earnings,
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

  generateEventId(record) {
    // Create unique ID from action record
    // Use actionId if available, otherwise create composite key
    if (record.actionId) {
      return `impact_action_${record.actionId}`;
    }
    // Fallback: composite key (less reliable for deduplication)
    return `impact_${record.subId1}_${record.subId2}_${record.actionDate}_${record.earnings}`;
  }
}
```

**Key Benefits of Action-Level Collection**:
- ✅ **Line-Item Granularity**: Each revenue event has its own timestamp (`actionDate`)
- ✅ **Accurate Date Filtering**: Can filter by exact date ranges for variable lookback windows
- ✅ **Rich Attribution**: Includes subId1, subId2, subId3 for detailed tracking
- ✅ **Complete Data**: Includes sale amounts, action types, campaign info
- ✅ **Tested**: Confirmed working with 41 action records over 7 days in test

**Performance Considerations**:
- Action-level collection is more detailed but slower than subid reports
- For large date ranges, may take longer to process
- Consider caching strategy for frequently accessed date ranges

### 3. Amazon Associates Revenue Collector (`AmazonAssociatesRevenueCollector`)

For Amazon Associates, data will be imported (not API-based). This collector handles CSV/JSON imports.

```javascript
// www.makemula.ai/helpers/collectors/AmazonAssociatesRevenueCollector.js

const { RevenueDataCollector } = require('../RevenueDataCollector');

class AmazonAssociatesRevenueCollector extends RevenueDataCollector {
  constructor(domain, config) {
    super('amazon_associates', domain, config);
  }

  async collectRevenueData(startDate, endDate) {
    // Amazon Associates doesn't have an API for revenue data
    // This method would be called when importing CSV/JSON files
    // The actual import logic would be in a separate import script
    
    // For now, return empty array - data will be imported via separate process
    return [];
  }

  /**
   * Import revenue data from Amazon Associates CSV/JSON export
   * @param {Array|String} data - CSV content or parsed JSON array
   * @returns {Promise<Array<RevenueEvent>>}
   */
  async importRevenueData(data) {
    // Parse CSV or JSON
    const records = Array.isArray(data) ? data : this.parseCSV(data);
    
    // Transform to revenue events
    return records.map(record => this.transformToRevenueEvent(record));
  }

  transformToRevenueEvent(record) {
    // Map Amazon Associates fields to our schema
    return {
      domain: this.domain,
      platform: 'amazon_associates',
      revenue_date: new Date(record.date || record.order_date),
      revenue_amount: parseFloat(record.commission_amount || record.commission || 0),
      currency: record.currency || 'USD',
      attribution_data: {
        orderId: record.order_id,
        asin: record.asin,
        itemPrice: parseFloat(record.item_price || 0),
        quantity: parseInt(record.quantity || 1),
        commission: parseFloat(record.commission_amount || record.commission || 0),
        rawRecord: record
      },
      subid1: record.tag || record.associate_tag || null,
      campaign_id: record.campaign || null,
      action_id: record.order_id || null,
      platform_event_id: `amazon_${record.order_id}_${record.asin}`
    };
  }

  parseCSV(csvContent) {
    // CSV parsing logic
    // ...
  }
}
```

### 4. Revenue Data Service (`RevenueDataService`)

Service layer that handles database operations and business logic.

```javascript
// www.makemula.ai/services/RevenueDataService.js

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
   * @returns {Promise<Object>} { events, totalRevenue, lastCollectionAt }
   */
  async getRevenueData(domain, startDate, endDate, platform = null, options = {}) {
    const where = {
      domain,
      revenue_date: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (platform) {
      where.platform = platform;
    }

    if (options.subid1) {
      where.subid1 = options.subid1;
    }

    const events = await this.RevenueEvent.findAll({ where });

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
   * @returns {Promise<Object>} { rpm, totalRevenue, views, lastCollectionAt }
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
   * @param {Array<RevenueEvent>} events - Revenue events to store
   * @param {Number} jobId - Collection job ID
   * @returns {Promise<Number>} Number of events stored
   */
  async storeRevenueEvents(events, jobId) {
    let stored = 0;
    
    for (const event of events) {
      try {
        // Use upsert to handle deduplication
        await this.RevenueEvent.upsert({
          ...event,
          collection_job_id: jobId
        }, {
          conflictFields: ['platform', 'platform_event_id', 'domain']
        });
        stored++;
      } catch (error) {
        console.error(`Error storing revenue event:`, error);
        // Continue with other events
      }
    }

    return stored;
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
    await this.RevenueCollectionStatus.upsert({
      domain,
      platform,
      last_successful_collection_at: new Date(),
      last_collection_job_id: jobId,
      last_collected_date_range_start: startDate,
      last_collected_date_range_end: endDate,
      total_events_collected: sequelize.literal(`total_events_collected + ${eventCount}`),
      last_collection_duration_seconds: durationSeconds
    }, {
      conflictFields: ['domain', 'platform']
    });
  }
}
```

### 5. Revenue Collection Worker (`revenueCollectionWorker.js`)

Background worker that processes revenue collection jobs with retry logic.

```javascript
// www.makemula.ai/workers/revenueCollectionWorker.js

const Bull = require('bull');
const { RevenueDataService } = require('../services/RevenueDataService');
const { ImpactRevenueCollector } = require('../helpers/collectors/ImpactRevenueCollector');
const { AmazonAssociatesRevenueCollector } = require('../helpers/collectors/AmazonAssociatesRevenueCollector');
const models = require('../models');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const revenueCollectionQueue = new Bull('revenueCollectionQueue', redisUrl);

const revenueDataService = new RevenueDataService(models);

// Process revenue collection jobs
revenueCollectionQueue.process('collectRevenue', async (job) => {
  const { domain, platform, startDate, endDate, jobId } = job.data;
  
  const startTime = Date.now();
  
  try {
    // Update job status to running
    await models.RevenueCollectionJob.update(
      { status: 'running', startedAt: new Date() },
      { where: { id: jobId } }
    );

    // Get appropriate collector
    let collector;
    switch (platform) {
      case 'impact':
        collector = new ImpactRevenueCollector(domain, {});
        break;
      case 'amazon_associates':
        collector = new AmazonAssociatesRevenueCollector(domain, {});
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Collect revenue data
    console.log(`Collecting ${platform} revenue data for ${domain} from ${startDate} to ${endDate}`);
    const events = await collector.collectRevenueData(new Date(startDate), new Date(endDate));

    // Store events in database
    const storedCount = await revenueDataService.storeRevenueEvents(events, jobId);

    // Update collection status
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    await revenueDataService.updateCollectionStatus(
      domain,
      platform,
      jobId,
      new Date(startDate),
      new Date(endDate),
      storedCount,
      durationSeconds
    );

    // Update job status to completed
    await models.RevenueCollectionJob.update(
      { 
        status: 'completed', 
        completedAt: new Date() 
      },
      { where: { id: jobId } }
    );

    console.log(`✅ Successfully collected ${storedCount} revenue events for ${domain} (${platform})`);

    return {
      success: true,
      eventCount: storedCount,
      durationSeconds
    };

  } catch (error) {
    console.error(`❌ Error collecting revenue data for ${domain} (${platform}):`, error);

    // Update job with error
    const jobRecord = await models.RevenueCollectionJob.findByPk(jobId);
    const retryCount = (jobRecord.retryCount || 0) + 1;

    await models.RevenueCollectionJob.update(
      { 
        status: retryCount >= jobRecord.maxRetries ? 'failed' : 'pending',
        lastError: error.message,
        retryCount
      },
      { where: { id: jobId } }
    );

    // Retry if not exceeded max retries
    if (retryCount < jobRecord.maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`Retrying in ${delay}ms (attempt ${retryCount}/${jobRecord.maxRetries})`);
      
      await revenueCollectionQueue.add('collectRevenue', job.data, {
        delay,
        attempts: 1 // This is a new job, not a retry of the same job
      });
    }

    throw error;
  }
});

module.exports = { revenueCollectionQueue };
```

### 6. Scheduled Revenue Collection (`scheduledRevenueCollection.js`)

Scheduler that creates collection jobs based on collection status settings.

```javascript
// www.makemula.ai/workers/scheduledRevenueCollection.js

const { RevenueCollectionStatus } = require('../models');
const { revenueCollectionQueue } = require('./revenueCollectionWorker');

/**
 * Check all active revenue collection statuses and schedule jobs as needed
 */
async function scheduleRevenueCollections() {
  const statuses = await RevenueCollectionStatus.findAll({
    where: { is_active: true }
  });

  const now = new Date();
  
  for (const status of statuses) {
    const lastCollection = status.last_successful_collection_at;
    const cadenceHours = status.collection_cadence_hours || 24;
    
    // Check if it's time to collect
    const shouldCollect = !lastCollection || 
      (now - lastCollection) >= (cadenceHours * 60 * 60 * 1000);

    if (shouldCollect) {
      // Determine date range to collect
      const endDate = new Date();
      const startDate = lastCollection 
        ? new Date(lastCollection) // Collect from last collection
        : new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // Default: last 7 days

      // Create collection job
      const job = await models.RevenueCollectionJob.create({
        domain: status.domain,
        platform: status.platform,
        status: 'pending',
        scheduledAt: now,
        maxRetries: 3,
        config: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      // Queue the job
      await revenueCollectionQueue.add('collectRevenue', {
        domain: status.domain,
        platform: status.platform,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        jobId: job.id
      });

      console.log(`Scheduled revenue collection for ${status.domain} (${status.platform})`);
    }
  }
}

// Run every hour
setInterval(scheduleRevenueCollections, 60 * 60 * 1000);

module.exports = { scheduleRevenueCollections };
```

## Integration with Performance Report

### Modified `performanceReportWorker.js`

```javascript
// In processPerformanceReport function, replace fetchOn3RPM call:

// Check if this is on3.com and fetch RPM data
let rpmData = null;
const isOn3 = domains && domains.length === 1 && domains[0] === 'www.on3.com';
if (isOn3) {
    const smartscrollInViews = aggregateValues['smartscroll_in_views'] || 0;
    
    // Calculate date range from lookback days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));
    
    // Get revenue data from cache (database)
    const revenueDataService = new RevenueDataService(models);
    rpmData = await revenueDataService.calculateRPM(
        'www.on3.com',
        startDate,
        endDate,
        smartscrollInViews,
        { platform: 'impact', subid1: 'mula' }
    );
    
    // Add last collection timestamp to RPM data
    rpmData.lastCollectionAt = revenueData.lastCollectionAt;
}
```

### Updated Slack Report Display

```javascript
// In generateSlackBlocks function, update RPM display:

if (rpmData) {
    const lastCollectionText = rpmData.lastCollectionAt
        ? `\n• Last Updated: ${new Date(rpmData.lastCollectionAt).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}`
        : '\n• Last Updated: Never';
    
    blocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*💰 On3.com Revenue Performance*\n• Total Earnings: $${rpmData.totalRevenue.toFixed(2)}\n• SmartScroll In-Views: ${rpmData.smartscrollInViews.toLocaleString()}\n• RPM: $${rpmData.rpm}${lastCollectionText}`
        }
    });
}
```

## Implementation Plan

### Phase 1: Database Schema
1. Create migration for `revenue_collection_jobs` table
2. Create migration for `revenue_events` table
3. Create migration for `revenue_collection_status` table
4. Create Sequelize models for all three tables

### Phase 2: Core Services
1. Create `RevenueDataCollector` base class
2. Create `ImpactRevenueCollector` implementation
3. Create `RevenueDataService` service layer
4. Create database models

### Phase 3: Collection Workers
1. Create `revenueCollectionWorker.js`
2. Create `scheduledRevenueCollection.js`
3. Integrate with existing Bull queue system

### Phase 4: Integration
1. Modify `performanceReportWorker.js` to use cached data
2. Update Slack report display with last collection timestamp
3. Test with on3.com reports

### Phase 5: Amazon Associates Support
1. Create `AmazonAssociatesRevenueCollector`
2. Create import script for CSV/JSON files
3. Test import process

### Phase 6: Monitoring & Operations
1. Add Slack command to manually trigger collections
2. Add Slack command to view collection status
3. Add error alerting for failed collections

## Future Enhancements

1. **✅ Action-Level Data Collection**: **COMPLETED** - Impact API action records with timestamps confirmed working. Implementation ready.
2. **Real-time Updates**: Webhook support for platforms that offer it
3. **Data Validation**: Cross-reference revenue data with click/action data for validation
4. **Revenue Forecasting**: Use historical data for revenue predictions
5. **Multi-Currency Support**: Enhanced currency handling and conversion
6. **Revenue Attribution**: Link revenue events to specific sessions/users for deeper analysis
7. **Click-to-Action Linking**: Join click records with action records for full funnel analysis

## Notes

- **✅ Impact API Line-Item Granularity**: **CONFIRMED** - Impact API provides action-level records with individual `actionDate` timestamps. Test script `test-impact-line-item-timestamps.js` verified:
  - 41/41 action records had `actionDate` timestamps
  - 164/164 click records had `clickDate` timestamps
  - Date range filtering works accurately
  - Can filter to specific date ranges (e.g., last 3 days) with precise results
  - **Implementation**: Use `ImpactDataCollector.getActionRecords()` instead of subid reports for line-item granularity

- **Deduplication**: The `platform_event_id` field enables deduplication. Each platform collector must generate unique IDs. For Impact API, use `actionId` when available.

- **Performance**: With line-item level data, queries may need optimization. Indexes on `domain`, `revenue_date`, and `platform` are critical for performance.

- **Data Retention**: Consider adding a data retention policy to archive old revenue events. Line-item data will grow over time.

- **Collection Strategy**: 
  - Use action-level data for accurate date filtering (recommended)
  - Subid reports are aggregated and don't have per-event dates, but are faster
  - For revenue collection, action-level is preferred for time slicing accuracy

