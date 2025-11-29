# Analytics & Reporting: SmartScroll 2x2 Factorial A/B Test

## Overview

This document outlines the analytics infrastructure and reporting system for the SmartScroll 2x2 factorial A/B test, including Athena queries, statistical analysis, and revenue attribution.

## Key Metrics

### Primary Metrics
1. **Click-Through Rate (CTR)**
   - Formula: `mula_store_click / mula_in_view`
   - Denominator: Viewport visibility events (not widget eligibility)
   - Rationale: Measures actual user engagement

2. **Revenue Per Session (RPS)**
   - Formula: `total_revenue / sessions_by_variant`
   - Attribution: 30-day window
   - Sources: Mula (Impact API) + RevContent (Sub ID Stats API)

### Secondary Metrics
- **Viewport Visibility Rate**: `mula_in_view / mula_widget_view`
- **Session Duration**: Time spent on page
- **Scroll Depth**: How far users scroll through feed
- **Load Performance**: Core Web Vitals impact

## Athena Queries

### 1. Factorial CTR Analysis
**File**: `queries/queries/smartscroll-factorial-ctr.sql`

```sql
-- Parameterized Factorial CTR Analysis
-- Analyzes click-through rates by variant with statistical significance
-- Parameters: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}

WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,        -- e.g., 'smartscroll_factorial_2025_09'
        '{TARGET_HOST}' as target_host,                -- e.g., 'www.on3.com' or 'NULL' for all hosts
        {LOOKBACK_DAYS} as lookback_days               -- e.g., 30
),
variant_metrics AS (
    SELECT 
        CASE 
            WHEN properties['experiment'] = (SELECT experiment_name FROM experiment_config)
            THEN properties['variant']
            ELSE 'control' 
        END as variant,
        -- Add descriptive labels (server-side)
        CASE properties['variant']
            WHEN 'c00' THEN 'Control (Current Layout + Mula Only)'
            WHEN 'c10' THEN 'Optimized Layout (Optimized Layout + Mula Only)'
            WHEN 'c01' THEN 'RevContent Monetization (Current Layout + Mula + RevContent)'
            WHEN 'c11' THEN 'Optimized + RevContent (Optimized Layout + Mula + RevContent)'
            ELSE 'Control'
        END as variant_description,
        COUNT(DISTINCT properties['session_id']) as sessions,
        COUNT(CASE WHEN event_type = 'mula_in_view' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'mula_store_click' THEN 1 END) as clicks
    FROM mula.webtag_logs 
    WHERE (SELECT target_host FROM experiment_config) IS NULL 
       OR host = (SELECT target_host FROM experiment_config)
    AND datehour >= date_add('day', -(SELECT lookback_days FROM experiment_config), current_date)
    GROUP BY variant, variant_description
),
ctr_calculation AS (
    SELECT 
        variant,
        variant_description,
        sessions,
        views,
        clicks,
        CASE 
            WHEN views > 0 THEN clicks::float / views::float 
            ELSE 0 
        END as ctr,
        -- Statistical significance calculation
        CASE 
            WHEN views > 0 AND clicks > 0 THEN
                -- Chi-square test for CTR difference
                POWER(clicks - (views * 0.01), 2) / (views * 0.01) +
                POWER((views - clicks) - (views * 0.99), 2) / (views * 0.99)
            ELSE 0
        END as chi_square
    FROM variant_metrics
)
SELECT 
    variant,
    variant_description,
    sessions,
    views,
    clicks,
    ROUND(ctr * 100, 4) as ctr_percent,
    ROUND(chi_square, 4) as chi_square_statistic,
    CASE 
        WHEN chi_square > 3.84 THEN 'Significant (p < 0.05)'
        WHEN chi_square > 2.71 THEN 'Significant (p < 0.10)'
        ELSE 'Not Significant'
    END as significance
FROM ctr_calculation
ORDER BY variant;
```

### 2. Revenue Attribution Analysis
**File**: `queries/queries/smartscroll-factorial-revenue.sql`

```sql
-- Parameterized Factorial Revenue Analysis
-- Analyzes revenue per session by variant
-- Parameters: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}

WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,        -- e.g., 'smartscroll_factorial_2025_09'
        '{TARGET_HOST}' as target_host,                -- e.g., 'www.on3.com' or 'NULL' for all hosts
        {LOOKBACK_DAYS} as lookback_days               -- e.g., 30
),
session_revenue AS (
    SELECT 
        properties['session_id'] as session_id,
        CASE 
            WHEN properties['experiment'] = (SELECT experiment_name FROM experiment_config)
            THEN properties['variant']
            ELSE 'control' 
        END as variant,
        -- Add descriptive labels (server-side)
        CASE properties['variant']
            WHEN 'c00' THEN 'Control (Current Layout + Mula Only)'
            WHEN 'c10' THEN 'Optimized Layout (Optimized Layout + Mula Only)'
            WHEN 'c01' THEN 'RevContent Monetization (Current Layout + Mula + RevContent)'
            WHEN 'c11' THEN 'Optimized + RevContent (Optimized Layout + Mula + RevContent)'
            ELSE 'Control'
        END as variant_description,
        -- Mula revenue (from Impact API via subId2)
        SUM(CASE 
            WHEN event_type = 'mula_store_click' 
            AND properties['revenue'] IS NOT NULL 
            THEN CAST(properties['revenue'] AS DECIMAL(10,2))
            ELSE 0 
        END) as mula_revenue
    FROM mula.webtag_logs 
    WHERE (SELECT target_host FROM experiment_config) IS NULL 
       OR host = (SELECT target_host FROM experiment_config)
    AND datehour >= date_add('day', -(SELECT lookback_days FROM experiment_config), current_date)
    GROUP BY session_id, variant, variant_description
),
variant_revenue AS (
    SELECT 
        variant,
        variant_description,
        COUNT(DISTINCT session_id) as sessions,
        SUM(mula_revenue) as total_mula_revenue,
        AVG(mula_revenue) as avg_mula_revenue_per_session,
        SUM(mula_revenue) / COUNT(DISTINCT session_id) as rps_mula
    FROM session_revenue
    GROUP BY variant, variant_description
)
SELECT 
    variant,
    variant_description,
    sessions,
    ROUND(total_mula_revenue, 2) as total_mula_revenue,
    ROUND(avg_mula_revenue_per_session, 2) as avg_revenue_per_session,
    ROUND(rps_mula, 2) as rps_mula
FROM variant_revenue
ORDER BY variant;
```

### 3. Statistical Significance Analysis
**File**: `queries/queries/smartscroll-factorial-stats.sql`

```sql
-- Parameterized Factorial Statistical Analysis
-- Performs ANOVA and interaction effect analysis
-- Parameters: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}

WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,        -- e.g., 'smartscroll_factorial_2025_09'
        '{TARGET_HOST}' as target_host,                -- e.g., 'www.on3.com' or 'NULL' for all hosts
        {LOOKBACK_DAYS} as lookback_days               -- e.g., 30
),
experiment_data AS (
    SELECT 
        properties['session_id'] as session_id,
        CASE 
            WHEN properties['experiment'] = (SELECT experiment_name FROM experiment_config)
            THEN properties['variant']
            ELSE 'control' 
        END as variant,
        -- Add descriptive labels (server-side)
        CASE properties['variant']
            WHEN 'c00' THEN 'Control (Current Layout + Mula Only)'
            WHEN 'c10' THEN 'Optimized Layout (Optimized Layout + Mula Only)'
            WHEN 'c01' THEN 'RevContent Monetization (Current Layout + Mula + RevContent)'
            WHEN 'c11' THEN 'Optimized + RevContent (Optimized Layout + Mula + RevContent)'
            ELSE 'Control'
        END as variant_description,
        -- Extract factors
        CASE 
            WHEN properties['variant'] IN ('c00', 'c01') THEN 'current'
            WHEN properties['variant'] IN ('c10', 'c11') THEN 'optimized'
            ELSE 'control'
        END as layout_factor,
        CASE 
            WHEN properties['variant'] IN ('c00', 'c10') THEN 'mula_only'
            WHEN properties['variant'] IN ('c01', 'c11') THEN 'mula_plus_revcontent'
            ELSE 'control'
        END as monetization_factor,
        -- Metrics
        COUNT(CASE WHEN event_type = 'mula_in_view' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'mula_store_click' THEN 1 END) as clicks
    FROM mula.webtag_logs 
    WHERE (SELECT target_host FROM experiment_config) IS NULL 
       OR host = (SELECT target_host FROM experiment_config)
    AND datehour >= date_add('day', -(SELECT lookback_days FROM experiment_config), current_date)
    AND properties['experiment'] = (SELECT experiment_name FROM experiment_config)
    GROUP BY session_id, variant, variant_description, layout_factor, monetization_factor
),
ctr_by_session AS (
    SELECT 
        session_id,
        variant,
        variant_description,
        layout_factor,
        monetization_factor,
        CASE 
            WHEN views > 0 THEN clicks::float / views::float 
            ELSE 0 
        END as ctr
    FROM experiment_data
),
anova_calculation AS (
    SELECT 
        layout_factor,
        monetization_factor,
        COUNT(*) as n,
        AVG(ctr) as mean_ctr,
        VARIANCE(ctr) as variance_ctr,
        STDDEV(ctr) as stddev_ctr
    FROM ctr_by_session
    GROUP BY layout_factor, monetization_factor
),
grand_mean AS (
    SELECT AVG(ctr) as overall_mean
    FROM ctr_by_session
),
ss_calculations AS (
    SELECT 
        -- Sum of Squares Total
        SUM(POWER(ctr - (SELECT overall_mean FROM grand_mean), 2)) as sst,
        -- Sum of Squares Between Groups
        SUM(n * POWER(mean_ctr - (SELECT overall_mean FROM grand_mean), 2)) as ssb,
        -- Sum of Squares Within Groups
        SUM((n - 1) * variance_ctr) as ssw
    FROM anova_calculation
)
SELECT 
    'ANOVA Results' as analysis_type,
    ROUND(sst, 4) as sum_squares_total,
    ROUND(ssb, 4) as sum_squares_between,
    ROUND(ssw, 4) as sum_squares_within,
    ROUND(ssb / ssw, 4) as f_statistic,
    CASE 
        WHEN ssb / ssw > 3.84 THEN 'Significant (p < 0.05)'
        WHEN ssb / ssw > 2.71 THEN 'Significant (p < 0.10)'
        ELSE 'Not Significant'
    END as significance
FROM ss_calculations;
```

### 4. Slack Command Integration
**Command**: `/mula-ab-test-performance`

The Athena queries are designed to work with the existing Slack slash command system. Parameters are filled in by the command processor before executing the query.

#### Command Parameters
- `--experiment <name>` - Experiment name (default: 'smartscroll_button_variant')
- `--days-back <number>` - Number of days to look back (default: 7, max: 365)
- `--host <domain>` - Target host domain (optional, for domain-specific experiments)
- `--network` - Flag for network-wide experiments (all hosts with RevContent config)
  - **Active Publishers**: brit.co, swimmingworld.com, stylecaster.com, on3.com, defpen.com

#### Usage Examples

##### Domain-Specific Experiment
```
/mula-ab-test-performance --experiment smartscroll_factorial_2025_09 --days-back 30 --host www.on3.com
```

##### Network-Wide Experiment
```
/mula-ab-test-performance --experiment network_wide_test_2025_10 --days-back 14 --network
```

##### Default Parameters
```
/mula-ab-test-performance
# Uses: experiment='smartscroll_button_variant', days-back=7, all hosts
```

#### Enhanced Slack Report with Clear Descriptions
```javascript
// Enhanced Slack report generation with variant descriptions
function generateFactorialSlackReport(data, experimentName, daysBack) {
    const experiment = SMARTSCROLL_FACTORIAL_EXPERIMENT;
    
    let report = `🧪 *${experiment.description}*\n`;
    report += `📊 *${daysBack}-day analysis*\n\n`;
    
    // Add variant descriptions
    report += `*Variant Descriptions:*\n`;
    Object.values(experiment.variants).forEach(variant => {
        report += `• *${variant.id}* (${variant.name}): ${variant.description}\n`;
    });
    report += `\n`;
    
    // Add results with descriptive names
    report += `*Results:*\n`;
    data.forEach(row => {
        const variantDesc = experiment.variants.find(v => v.id === row.variant);
        report += `• *${variantDesc.name}* (${row.variant}): ${row.ctr_percent}% CTR\n`;
    });
    
    return report;
}
```

### 5. Query Template Structure
**File**: `queries/templates/factorial-analysis-template.sql`

```sql
-- Template for future factorial experiments
-- Parameters filled by Slack command: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}

WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,        -- Filled by --experiment parameter
        '{TARGET_HOST}' as target_host,                -- Filled by --host parameter or 'NULL'
        {LOOKBACK_DAYS} as lookback_days               -- Filled by --days-back parameter
),
-- Rest of query remains the same...
-- Parameters are replaced by Slack command processor before execution
```

## Revenue Attribution System

### Multi-Partner Revenue Tracking
The experiment tracks revenue from both Mula affiliate monetization (Impact API) and RevContent supplemental monetization (Sub ID Stats API) to measure:

1. **Additive Revenue Effects**: Does RevContent add incremental revenue?
2. **Interaction Effects**: Does RevContent affect Mula affiliate revenue performance?
3. **Layout Impact**: How does card layout optimization affect both revenue streams?

### subId2 Session Attribution System
**Purpose**: Track affiliate revenue by experiment variant using Impact API subId2 parameter

#### Current Implementation
- **subId1**: `'mula'` (existing, identifies Mula as the source)
- **subId2**: `session_id` (new, enables experiment variant attribution)

#### SDK Integration
**File**: `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js`

```javascript
// Current implementation (line 160)
if (product && product.data_source === 'fanatics_impact') {
  const urlObj = new URL(url);
  urlObj.searchParams.set('subid1', 'mula');
  url = urlObj.toString();
}

// Enhanced implementation for experiment attribution
if (product && product.data_source === 'fanatics_impact') {
  const urlObj = new URL(url);
  urlObj.searchParams.set('subid1', 'mula');
  
  // Add subId2 with session ID for experiment attribution
  if (window.Mula.sessionId) {
    urlObj.searchParams.set('subid2', window.Mula.sessionId);
  }
  
  url = urlObj.toString();
}
```

#### Impact API Integration
**Endpoint**: `/Reports/partner_performance_by_subid`
**Method**: GET with Basic Authentication
**Parameters**:
- `SubId1`: `'mula'` (filters to Mula subids)
- `SubId2`: `session_id` (filters to specific session)
- `START_DATE`: Start date for report period
- `END_DATE`: End date for report period

#### Revenue Attribution Process
**Approach**: Pull Impact API data directly and join with Athena session data

**Step 1: Collect Impact Revenue Data**
```javascript
// Impact API call to get revenue by subId2 (session_id)
const impactData = await impactCollector.collectRevenueBySession(experimentName, dateRange);
// Returns: [{ session_id: 'abc123', earnings: 15.50, clicks: 3, actions: 1 }, ...]
```

**Step 2: Extract Session IDs**
```javascript
const sessionIds = impactData.map(record => record.session_id);
// Returns: ['abc123', 'def456', 'ghi789', ...]
```

**Step 3: Query Athena for Session → Experiment Mapping**
**File**: `queries/smartscroll-factorial-session-experiments.sql`

```sql
-- Get experiment variant mapping for sessions with revenue
-- Parameters: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}, {SESSION_IDS}
WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,
        '{TARGET_HOST}' as target_host,
        {LOOKBACK_DAYS} as lookback_days
),
session_list AS (
    -- Session IDs passed in by query caller (from Impact API)
    SELECT session_id FROM UNNEST(ARRAY[
        {SESSION_IDS}  -- e.g., ['abc123', 'def456', 'ghi789']
    ]) AS t(session_id)
),
session_experiments AS (
    SELECT 
        sl.session_id,
        wl.properties['experiment'] as experiment,
        wl.properties['variant'] as variant
    FROM session_list sl
    JOIN mula.webtag_logs wl ON sl.session_id = wl.properties['session_id']
    WHERE (SELECT target_host FROM experiment_config) IS NULL 
       OR wl.host = (SELECT target_host FROM experiment_config)
    AND wl.datehour >= date_add('day', -(SELECT lookback_days FROM experiment_config), current_date)
    AND wl.properties['experiment'] = (SELECT experiment_name FROM experiment_config)
    AND wl.event_type = 'mula_in_view'  -- Only sessions that had viewable impressions
    GROUP BY sl.session_id, wl.properties['experiment'], wl.properties['variant']
)
SELECT 
    session_id,
    experiment,
    variant
FROM session_experiments
ORDER BY session_id;
```

**Step 4: Join Impact Revenue with Experiment Data**
```javascript
// Join Impact revenue data with experiment variant mapping
const revenueByVariant = joinRevenueWithExperiments(impactData, sessionExperiments);
// Returns: { c00: { sessions: 100, revenue: 150.00, rps: 1.50 }, ... }
```

#### Impact API Data Collection Process
**File**: `helpers/ImpactRevenueCollector.js` (new)

```javascript
// Impact API data collector for experiment revenue attribution
class ImpactRevenueCollector {
    constructor() {
        this.config = config.impact;
        this.baseUrl = this.config.baseUrl;
        this.accountId = this.config.accountId;
        this.auth = `${this.config.username}:${this.config.password}`;
    }

    async collectRevenueBySession(dateRange) {
        const params = {
            SubId1: 'mula',
            START_DATE: dateRange.start,
            END_DATE: dateRange.end,
            ResultFormat: 'JSON'
        };

        const result = await this.makeRequest('/Reports/partner_performance_by_subid', params);
        
        if (result.success) {
            return this.processRevenueData(result.data);
        } else {
            throw new Error(`Failed to collect Impact revenue data: ${result.data}`);
        }
    }

    processRevenueData(data) {
        // Process Impact API response to extract revenue by session
        return data
            .filter(record => record.SubId2)  // Only records with subId2 (session_id)
            .map(record => ({
                session_id: record.SubId2,  // subId2 contains session ID
                earnings: parseFloat(record.Earnings || 0),
                clicks: parseInt(record.Clicks || 0),
                actions: parseInt(record.Actions || 0),
                date: record.Date
            }));
    }

    async makeRequest(endpoint, params = {}) {
        // Reuse existing SubidReportGenerator.makeRequest logic
        const url = `${this.baseUrl}/${this.accountId}${endpoint}`;
        const queryString = Object.keys(params).length > 0 ? `?${querystring.stringify(params)}` : '';
        const fullUrl = url + queryString;

        return new Promise((resolve, reject) => {
            const options = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mula-Experiment-Revenue/1.0'
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
                            resolve({ success: true, data: response });
                        } else {
                            resolve({ success: false, data, statusCode: res.statusCode });
                        }
                    } catch (error) {
                        resolve({ success: false, data, error: error.message });
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }
}
```

#### Slack Command Integration
**Command**: `/mula-ab-test-performance --experiment smartscroll_factorial_2025_09 --days-back 30 --host www.on3.com`

**Process**:
1. **Collect Revenue Data**: Call Impact API for revenue by subId2 (session_id)
2. **Extract Session IDs**: Get list of session IDs that generated revenue
3. **Query Athena**: Find experiment variant mapping for those sessions
4. **Join Data**: Match revenue to experiment variants
5. **Calculate RPS**: Revenue per session by variant
6. **Generate Report**: Send formatted results to Slack

**Implementation**:
```javascript
// In the A/B test report worker
async function generateFactorialReport(experimentName, daysBack, targetHost) {
    // Step 1: Collect Impact revenue data
    const impactCollector = new ImpactRevenueCollector();
    const dateRange = {
        start: getDateDaysAgo(daysBack),
        end: getDateDaysAgo(0)
    };
    const impactData = await impactCollector.collectRevenueBySession(dateRange);
    
    // Step 2: Extract session IDs
    const sessionIds = impactData.map(record => record.session_id);
    
    // Step 3: Query Athena for experiment mapping
    // Pass session IDs as parameter to the Athena query
    const sessionExperiments = await queryAthenaForSessionExperiments(
        experimentName, 
        sessionIds,  // Array of session IDs from Impact API
        targetHost, 
        daysBack
    );
    
    // Step 4: Join and calculate RPS by variant
    const revenueByVariant = calculateRPSByVariant(impactData, sessionExperiments);
    
    // Step 5: Generate and send report
    return generateSlackReport(revenueByVariant, experimentName, daysBack);
}

// Athena query execution with parameter substitution
async function queryAthenaForSessionExperiments(experimentName, sessionIds, targetHost, daysBack) {
    const query = `
        -- Get experiment variant mapping for sessions with revenue
        -- Parameters: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}, {SESSION_IDS}
        WITH experiment_config AS (
            SELECT 
                '${experimentName}' as experiment_name,
                '${targetHost}' as target_host,
                ${daysBack} as lookback_days
        ),
        session_list AS (
            -- Session IDs passed in by query caller (from Impact API)
            SELECT session_id FROM UNNEST(ARRAY[
                ${JSON.stringify(sessionIds).replace(/"/g, "'")}  -- Convert to SQL array format
            ]) AS t(session_id)
        ),
        session_experiments AS (
            SELECT 
                sl.session_id,
                wl.properties['experiment'] as experiment,
                wl.properties['variant'] as variant
            FROM session_list sl
            JOIN mula.webtag_logs wl ON sl.session_id = wl.properties['session_id']
            WHERE (SELECT target_host FROM experiment_config) IS NULL 
               OR wl.host = (SELECT target_host FROM experiment_config)
            AND wl.datehour >= date_add('day', -(SELECT lookback_days FROM experiment_config), current_date)
            AND wl.properties['experiment'] = (SELECT experiment_name FROM experiment_config)
            AND wl.event_type = 'mula_in_view'  -- Only sessions that had viewable impressions
            GROUP BY sl.session_id, wl.properties['experiment'], wl.properties['variant']
        )
        SELECT 
            session_id,
            experiment,
            variant
        FROM session_experiments
        ORDER BY session_id;
    `;
    
    return await executeAthenaQuery(query);
}
```

#### Mula Revenue Attribution
- **Method**: subId2 parameter with session ID
- **API**: Existing Impact API integration
- **Attribution Window**: 30 days
- **Data Source**: `mula.webtag_logs` with revenue properties

#### RevContent Revenue Attribution
- **Method**: Blended data approach (Athena + RevContent API)
- **API**: `https://api.revcontent.io/stats/publisher/widgets/subids`
- **API Documentation**: [RevContent Publisher-Advertiser API Requests](https://help.revcontent.com/knowledge/publisher-advertiser-api-requests)
- **Attribution Window**: 30 days
- **Data Sources**: 
  - Session-level impression data from Athena (by variant)
  - Revenue data from RevContent API (by test/variant via subIds)
  - Blended attribution report combining both data sources

### Parameterized Revenue Attribution Service
```javascript
// Reusable revenue attribution service for multi-partner tracking
class FactorialRevenueService {
    constructor(config = {}) {
        this.experimentName = config.experimentName || 'smartscroll_factorial_2025_09';
        this.targetHost = config.targetHost || 'www.on3.com';  // NULL for network-wide
        this.lookbackDays = config.lookbackDays || 30;
        this.attributionWindow = config.attributionWindow || 30;
    }
    
    async getRevenueByVariant(dateRange) {
        const [mulaRevenue, revContentRevenue] = await Promise.all([
            this.getMulaRevenue(dateRange),
            this.getRevContentRevenue(dateRange)
        ]);
        
        return this.combineRevenueByVariant(mulaRevenue, revContentRevenue);
    }
    
    combineRevenueByVariant(mulaRevenue, revContentRevenue) {
        // Apply experiment-specific revenue combination logic
        const variants = ['c00', 'c10', 'c01', 'c11'];
        const result = {};
        
        variants.forEach(variant => {
            const mulaRev = mulaRevenue[variant] || 0;
            const revContentRev = revContentRevenue[variant] || 0;
            
            // Experiment logic: c00/c10 = Mula only, c01/c11 = Mula + RevContent
            if (variant.endsWith('0')) {
                result[variant] = mulaRev;  // Mula only variants
            } else {
                result[variant] = mulaRev + revContentRev;  // Mula + RevContent variants
            }
        });
        
        return result;
    }
}

// Usage examples for different experiments
const on3Experiment = new FactorialRevenueService({
    experimentName: 'smartscroll_factorial_2025_09',
    targetHost: 'www.on3.com',
    lookbackDays: 30
});

const networkWideExperiment = new FactorialRevenueService({
    experimentName: 'future_network_test',
    targetHost: null,  // All hosts
    lookbackDays: 14
});
```

## Statistical Analysis

### Main Effects Analysis
1. **Layout Effect**: Compare horizontal vs vertical layouts
2. **Monetization Effect**: Compare Mula vs RevContent monetization

### Interaction Effects Analysis
3. **Layout × Monetization**: Test if vertical layout works better with RevContent

### Statistical Tests
- **Chi-square Test**: For CTR differences between variants
- **ANOVA**: For continuous metrics (RPS, session duration)
- **Factorial ANOVA**: For interaction effects
- **Multiple Comparisons**: Bonferroni correction for multiple testing

## Reporting Dashboard

### Daily Metrics
- **CTR by Variant**: Daily click-through rates
- **RPS by Variant**: Daily revenue per session
- **Statistical Significance**: P-values for main effects and interactions
- **Sample Size**: Current sample size per variant

### Weekly Reports
- **Experiment Progress**: Traffic allocation and data quality
- **Statistical Power**: Current power analysis
- **Revenue Attribution**: Revenue breakdown by partner and variant
- **Performance Impact**: Core Web Vitals monitoring

### Final Analysis
- **Winner Determination**: Statistical significance and effect sizes
- **Business Impact**: Revenue and engagement improvements
- **Recommendations**: Implementation strategy for winning variant

## Query Execution

### Running Analysis Queries
```bash
# Run CTR analysis
node queries/runners/smartscroll-factorial-ctr.js --days-back 7

# Run revenue analysis
node queries/runners/smartscroll-factorial-revenue.js --days-back 7

# Run statistical analysis
node queries/runners/smartscroll-factorial-stats.js --days-back 7
```

### Automated Reporting
```javascript
// Automated daily reporting
class FactorialReporter {
    async generateDailyReport() {
        const [ctrData, revenueData, statsData] = await Promise.all([
            this.runCTRAnalysis(),
            this.runRevenueAnalysis(),
            this.runStatisticalAnalysis()
        ]);
        
        return {
            date: new Date().toISOString().split('T')[0],
            ctr: ctrData,
            revenue: revenueData,
            statistics: statsData
        };
    }
}
```

## Data Quality Monitoring

### Key Quality Checks
1. **Traffic Distribution**: Ensure 25% per variant
2. **Event Completeness**: Verify all events are being tracked
3. **Revenue Attribution**: Cross-check Mula and RevContent data
4. **Statistical Power**: Monitor sample size accumulation

### Alerts
1. **Traffic Imbalance**: Alert if variant distribution deviates >5%
2. **Missing Events**: Alert if event tracking fails
3. **Revenue Discrepancy**: Alert if attribution data is missing
4. **Statistical Power**: Alert when sufficient sample size reached

## Success Criteria

### Statistical Success
- **Significance**: p < 0.05 for main effects
- **Effect Size**: ≥20% improvement in primary metrics
- **Power**: ≥80% statistical power achieved

### Business Success
- **Revenue**: Positive RPS impact
- **Engagement**: Maintained or improved CTR
- **Performance**: No negative Core Web Vitals impact

## Next Steps
1. **Build Queries**: Create Athena queries for analysis
2. **Set Up Attribution**: Implement revenue attribution service
3. **Build Dashboard**: Create reporting dashboard
4. **Automate Monitoring**: Set up alerts and automated reports
5. **Test & Deploy**: Comprehensive testing before experiment launch
