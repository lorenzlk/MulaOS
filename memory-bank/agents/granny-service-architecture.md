# Granny Service Architecture

## Overview

Granny is a **backend intelligence service** that accesses the same data sources as MulaBot Slack commands, but doesn't run through Slack. This allows Granny to autonomously gather intelligence and generate recommendations that humans (or automation) can execute.

---

## Architecture Principle

**Granny doesn't run Slack commands. Granny accesses the underlying data directly.**

```
┌─────────────────────────────────────────────────────────┐
│                    Data Sources                          │
│  • Postgres (targeting rules, searches, metadata)       │
│  • Athena (events, performance, clicks, views)          │
│  • Impact API (affiliate revenue)                        │
│  • ESPN API (sports calendar)                            │
│  • Redis (cache, metadata)                               │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        │                                 │
        ↓                                 ↓
┌──────────────────┐            ┌──────────────────┐
│   MulaBot        │            │   Granny         │
│   (Slack)        │            │   Service        │
│                  │            │                  │
│ • Slash commands │            │ • Intelligence   │
│ • Human in loop  │            │ • Autonomous     │
│ • Manual actions │            │ • Recommendations│
└──────────────────┘            └──────────────────┘
```

**Both access the same data, different interfaces.**

---

## Data Access Patterns

### 1. Site Targeting Rules (Postgres)

**What MulaBot Slack Command Does**:
```bash
/mula-site-targeting-list on3.com
```

**What Granny Does**:
```javascript
// Granny queries Postgres directly
const targets = await db.query(`
  SELECT 
    id,
    domain,
    type,
    match_value,
    search_phrase,
    status,
    created_at,
    updated_at
  FROM site_search_targets
  WHERE domain = $1
    AND status = 'active'
  ORDER BY created_at DESC
`, ['on3.com']);

// Returns same data as Slack command
[
  {
    id: 93,
    domain: 'on3.com',
    type: 'path_substring',
    match_value: '/teams/ohio-state-buckeyes/news',
    search_phrase: 'Ohio State Buckeyes Inflatable halloween',
    status: 'active',
    created_at: '2024-10-08T12:00:00Z',
    updated_at: '2024-10-08T12:00:00Z'
  },
  // ... more targets
]
```

**Database Table**: `site_search_targets`  
**Location**: Postgres (SDK database)  
**Kale Needs**: Read access for Granny service

---

### 2. Performance Metrics (Athena)

**What MulaBot Slack Command Does**:
```bash
/mula-performance-report on3.com 30
```

**What Granny Does**:
```javascript
// Granny queries Athena directly (same query as Slack command)
const performance = await athena.query(`
  SELECT 
    target_id,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(CASE WHEN event_type = 'widget_view' THEN 1 END) as widget_views,
    COUNT(CASE WHEN event_type = 'feed_click' THEN 1 END) as feed_clicks,
    COUNT(CASE WHEN event_type = 'store_click' THEN 1 END) as store_clicks,
    ROUND(100.0 * feed_clicks / NULLIF(widget_views, 0), 2) as ctr_percent,
    SUM(estimated_revenue) as revenue
  FROM mula_events
  WHERE domain = 'on3.com'
    AND target_id = 93
    AND date >= current_date - interval '30' day
  GROUP BY target_id
`);

// Returns same data as Slack command
{
  target_id: 93,
  sessions: 12450,
  widget_views: 12450,
  feed_clicks: 37,
  store_clicks: 8,
  ctr_percent: 0.30,
  revenue: 445.23
}
```

**Data Source**: Athena (S3 via Kinesis Firehose)  
**Location**: `s3://mula-sdk-data/events/`  
**Kale Needs**: Athena query access for Granny service

---

### 3. Affiliate Revenue (Impact API)

**What MulaBot Slack Command Does**:
```bash
/mula-impact-on3-subid-report 14
```

**What Granny Does**:
```javascript
// Granny calls Impact API directly (same as Slack command)
const revenue = await impactAPI.get('/Actions', {
  params: {
    StartDate: '2024-11-13',
    EndDate: '2024-11-27',
    SubId1: 'ohio-state-buckeyes-news'
  }
});

// Parse response
{
  subid: 'ohio-state-buckeyes-news',
  clicks: 72,
  actions: 12,
  revenue: 187.32,
  epc: 2.60,
  conversion_rate: 0.167
}
```

**Data Source**: Impact API  
**Location**: External API (https://api.impact.com)  
**Kale Needs**: API credentials for Granny service

---

### 4. Sports Context (ESPN API)

**What Granny Needs**:
```javascript
// Granny queries ESPN API
const schedule = await axios.get(
  'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/194/schedule'
);

// Parse upcoming games
{
  next_game: {
    date: '2025-11-30T17:00:00Z',
    opponent: 'Michigan Wolverines',
    location: 'Ann Arbor, MI',
    tv: 'FOX',
    rivalry: true,
    significance: 'Big Ten Championship implications'
  }
}
```

**Data Source**: ESPN API (public)  
**Location**: https://site.api.espn.com  
**Kale Needs**: No auth required (public API)

---

### 5. Content Taxonomy (Postgres + Athena)

**What MulaBot Slack Command Does**:
```bash
/mula-site-taxonomy on3.com
```

**What Granny Does**:
```javascript
// Granny queries Athena for URL patterns
const taxonomy = await athena.query(`
  SELECT 
    REGEXP_EXTRACT(url, '(/[^/]+/[^/]+)') as category,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) as pageviews,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percent
  FROM mula_events
  WHERE domain = 'on3.com'
    AND date >= current_date - interval '30' day
  GROUP BY category
  ORDER BY pageviews DESC
  LIMIT 20
`);

// Returns category breakdown
[
  { category: '/teams/ohio-state-buckeyes', pageviews: 4200000, percent: 13.7 },
  { category: '/teams/michigan-wolverines', pageviews: 3800000, percent: 12.4 },
  // ... more categories
]
```

**Data Source**: Athena (S3 event logs)  
**Kale Needs**: Same Athena access

---

## Granny Service Implementation

### Service Structure

```javascript
// services/granny/index.js
class GrannyIntelligenceService {
  
  constructor() {
    this.db = new PostgresClient(); // Same DB as MulaBot
    this.athena = new AthenaClient(); // Same Athena as reporting
    this.impactAPI = new ImpactClient(); // Same Impact credentials
    this.espnAPI = new ESPNClient(); // Public API
    this.redis = new RedisClient(); // Cache
  }
  
  //═══════════════════════════════════════════════════════
  // INTELLIGENCE GATHERING (Read-Only Operations)
  //═══════════════════════════════════════════════════════
  
  /**
   * Get all targeting rules for a domain
   * (Same data as /mula-site-targeting-list)
   */
  async getTargetingRules(domain) {
    return await this.db.query(`
      SELECT 
        id,
        domain,
        type,
        match_value,
        search_phrase,
        status,
        created_at,
        updated_at
      FROM site_search_targets
      WHERE domain = $1
        AND status = 'active'
      ORDER BY created_at DESC
    `, [domain]);
  }
  
  /**
   * Get performance metrics for a target
   * (Same data as /mula-performance-report)
   */
  async getPerformanceMetrics(domain, targetId, lookbackDays = 30) {
    const query = `
      SELECT 
        target_id,
        date_trunc('day', event_timestamp) as date,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(CASE WHEN event_type = 'widget_view' THEN 1 END) as widget_views,
        COUNT(CASE WHEN event_type = 'feed_click' THEN 1 END) as feed_clicks,
        COUNT(CASE WHEN event_type = 'store_click' THEN 1 END) as store_clicks,
        ROUND(100.0 * feed_clicks / NULLIF(widget_views, 0), 2) as ctr_percent,
        SUM(estimated_revenue) as revenue
      FROM mula_events
      WHERE domain = '${domain}'
        AND target_id = ${targetId}
        AND date >= current_date - interval '${lookbackDays}' day
      GROUP BY target_id, date
      ORDER BY date DESC
    `;
    
    return await this.athena.query(query);
  }
  
  /**
   * Get affiliate revenue data
   * (Same data as /mula-impact-on3-subid-report)
   */
  async getAffiliateRevenue(subId, lookbackDays = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    
    const response = await this.impactAPI.get('/Actions', {
      StartDate: startDate.toISOString().split('T')[0],
      EndDate: new Date().toISOString().split('T')[0],
      SubId1: subId
    });
    
    return {
      subid: subId,
      clicks: response.data.TotalClicks,
      actions: response.data.TotalActions,
      revenue: response.data.TotalRevenue,
      epc: response.data.TotalRevenue / response.data.TotalClicks,
      conversion_rate: response.data.TotalActions / response.data.TotalClicks
    };
  }
  
  /**
   * Get sports calendar context
   * (ESPN API - sports intelligence)
   */
  async getSportsContext(team) {
    const teamId = this.getESPNTeamId(team); // Map team name to ESPN ID
    
    const schedule = await this.espnAPI.get(
      `/sports/football/college-football/teams/${teamId}/schedule`
    );
    
    return {
      next_game: this.parseNextGame(schedule.data),
      rivalries: this.detectRivalries(schedule.data),
      championship_implications: this.detectChampionshipStakes(schedule.data)
    };
  }
  
  /**
   * Get content taxonomy
   * (Same data as /mula-site-taxonomy)
   */
  async getContentTaxonomy(domain, lookbackDays = 30) {
    const query = `
      SELECT 
        REGEXP_EXTRACT(url, '(/[^/]+/[^/]+)') as category,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) as pageviews,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percent
      FROM mula_events
      WHERE domain = '${domain}'
        AND date >= current_date - interval '${lookbackDays}' day
      GROUP BY category
      ORDER BY pageviews DESC
      LIMIT 20
    `;
    
    return await this.athena.query(query);
  }
  
  //═══════════════════════════════════════════════════════
  // INTELLIGENCE ANALYSIS (Granny's Brain)
  //═══════════════════════════════════════════════════════
  
  /**
   * Full publisher intelligence analysis
   */
  async analyzePublisher(domain) {
    console.log(`[Granny] Starting intelligence analysis for ${domain}...`);
    
    // Phase 1: Discovery (parallel data gathering)
    const [
      targeting,
      performance,
      taxonomy
    ] = await Promise.all([
      this.getTargetingRules(domain),
      this.getPerformanceMetrics(domain, null, 30), // All targets
      this.getContentTaxonomy(domain, 30)
    ]);
    
    // Phase 2: Contextual intelligence (if sports publisher)
    let sportsContext = null;
    if (this.isSportsPublisher(domain)) {
      const teams = this.extractTeamsFromTargeting(targeting);
      sportsContext = await Promise.all(
        teams.map(team => this.getSportsContext(team))
      );
    }
    
    // Phase 3: Opportunity identification
    const opportunities = this.identifyOpportunities({
      targeting,
      performance,
      taxonomy,
      sportsContext
    });
    
    // Phase 4: Generate recommendations
    const recommendations = opportunities.map(opp => 
      this.generateRecommendation(opp)
    );
    
    return {
      timestamp: new Date().toISOString(),
      domain,
      current_state: { targeting, performance, taxonomy },
      contextual_intelligence: sportsContext,
      opportunities,
      recommendations
    };
  }
  
  /**
   * Identify optimization opportunities
   */
  identifyOpportunities({ targeting, performance, taxonomy, sportsContext }) {
    const opportunities = [];
    
    // Check each target for contextual relevance
    for (const target of targeting) {
      // Check if search phrase is seasonally relevant
      if (this.isOutdated(target.search_phrase)) {
        opportunities.push({
          type: 'outdated_search',
          severity: 'critical',
          target_id: target.id,
          current_search: target.search_phrase,
          issue: this.describeOutdatedIssue(target.search_phrase),
          context: this.getCurrentContext(target, sportsContext)
        });
      }
      
      // Check for upcoming high-value moments
      if (sportsContext) {
        const upcomingMoment = this.findUpcomingMoment(target, sportsContext);
        if (upcomingMoment && upcomingMoment.days_away <= 3) {
          opportunities.push({
            type: 'contextual_opportunity',
            severity: 'critical',
            target_id: target.id,
            current_search: target.search_phrase,
            upcoming_event: upcomingMoment,
            window: upcomingMoment.optimal_window
          });
        }
      }
      
      // Check for low performance (potential for improvement)
      const targetPerf = performance.find(p => p.target_id === target.id);
      if (targetPerf && targetPerf.ctr_percent < 1.0) {
        opportunities.push({
          type: 'low_performance',
          severity: 'medium',
          target_id: target.id,
          current_ctr: targetPerf.ctr_percent,
          benchmark_ctr: 2.5, // Industry benchmark
          gap: 2.5 - targetPerf.ctr_percent
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Generate actionable recommendation
   */
  generateRecommendation(opportunity) {
    return {
      opportunity_id: this.generateOpportunityId(),
      target_id: opportunity.target_id,
      severity: opportunity.severity,
      type: opportunity.type,
      
      // What's wrong
      current_state: {
        search: opportunity.current_search,
        performance: opportunity.current_ctr || 'N/A'
      },
      
      // What should change
      recommended_change: {
        search: this.generateRecommendedSearch(opportunity),
        reasoning: this.generateReasoning(opportunity)
      },
      
      // Expected impact
      expected_impact: {
        ctr_lift: this.estimateCTRLift(opportunity),
        revenue_lift: this.estimateRevenueLift(opportunity),
        window: opportunity.window || '7 days'
      },
      
      // How to implement (output for humans/automation)
      implementation: {
        method: 'slack_command',
        command: this.generateSlackCommand(opportunity),
        alternative: {
          method: 'sql_update',
          query: this.generateSQLUpdate(opportunity)
        }
      },
      
      // Risk assessment
      risk: {
        level: 'low',
        rollback_plan: 'Revert to previous search phrase',
        testing_recommended: opportunity.severity === 'critical' ? false : true
      }
    };
  }
  
  //═══════════════════════════════════════════════════════
  // OUTPUT GENERATION (For Humans or Automation)
  //═══════════════════════════════════════════════════════
  
  /**
   * Generate Slack command for human execution
   */
  generateSlackCommand(opportunity) {
    const target = opportunity.target_id;
    const domain = opportunity.domain;
    const path = opportunity.match_value;
    const search = this.generateRecommendedSearch(opportunity);
    
    return `/mula-site-targeting-add ${domain} path_substring ${path} "${search}"`;
  }
  
  /**
   * Generate SQL update for direct DB execution
   */
  generateSQLUpdate(opportunity) {
    return `
      UPDATE site_search_targets 
      SET search_phrase = '${this.generateRecommendedSearch(opportunity)}',
          updated_at = NOW()
      WHERE id = ${opportunity.target_id};
    `;
  }
  
  /**
   * Generate formatted report (Slack message or dashboard)
   */
  generateReport(analysis) {
    const criticalOpps = analysis.opportunities.filter(o => o.severity === 'critical');
    
    return {
      summary: {
        domain: analysis.domain,
        timestamp: analysis.timestamp,
        targets_analyzed: analysis.current_state.targeting.length,
        opportunities_found: analysis.opportunities.length,
        critical_opportunities: criticalOpps.length,
        estimated_revenue_at_stake: this.sumRevenueLift(analysis.recommendations)
      },
      
      recommendations: analysis.recommendations.map(rec => ({
        priority: rec.severity === 'critical' ? '🔴 URGENT' : '🟡 MEDIUM',
        target: `Target ${rec.target_id}`,
        issue: rec.current_state.search,
        recommendation: rec.recommended_change.search,
        impact: `+$${rec.expected_impact.revenue_lift} over ${rec.expected_impact.window}`,
        command: rec.implementation.command
      }))
    };
  }
}

module.exports = GrannyIntelligenceService;
```

---

## Data Access Requirements

### Kale Needs to Provide Granny:

#### 1. **Database Access** (Postgres)
```javascript
// Connection config
{
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: 'mula_sdk',
  user: 'granny_service',
  password: process.env.GRANNY_DB_PASSWORD
}

// Tables needed (read-only):
- site_search_targets
- searches
- pages
- domains
// Any other relevant metadata tables
```

#### 2. **Athena Access** (AWS)
```javascript
// AWS credentials
{
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}

// Athena config
{
  database: 'mula_events',
  workgroup: 'primary',
  outputLocation: 's3://mula-athena-results/granny/'
}

// Tables needed (read-only):
- mula_events (partitioned by date)
```

#### 3. **Impact API Access**
```javascript
// API credentials
{
  accountSid: process.env.IMPACT_ACCOUNT_SID,
  authToken: process.env.IMPACT_AUTH_TOKEN,
  apiEndpoint: 'https://api.impact.com'
}

// Endpoints needed (read-only):
- GET /Actions (revenue data)
- GET /Clicks (click data)
```

#### 4. **ESPN API** (Public, no auth)
```javascript
// Base URL
const ESPN_API = 'https://site.api.espn.com/apis/site/v2';

// Endpoints:
- /sports/football/college-football/teams/{teamId}/schedule
- /sports/football/college-football/scoreboard
- /sports/football/college-football/rankings
```

#### 5. **Redis Cache** (Optional but recommended)
```javascript
// Cache expensive queries (Athena, Impact API)
{
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD
}

// Cache keys:
- granny:performance:{domain}:{targetId}:{date}
- granny:sports:{team}:{date}
- granny:taxonomy:{domain}:{date}
```

---

## Deployment Options

### Option 1: Scheduled Service (Cron)
```javascript
// Run Granny on schedule
// services/granny/scheduler.js

const cron = require('node-cron');
const Granny = require('./index');

// Run every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  console.log('[Granny] Starting weekly intelligence analysis...');
  
  const publishers = ['on3.com', 'brit.co', 'defpen.com'];
  
  for (const domain of publishers) {
    const analysis = await Granny.analyzePublisher(domain);
    await sendToSlack(analysis); // Post report to Slack
  }
});

// Run daily for sports publishers (detect upcoming games)
cron.schedule('0 6 * * *', async () => {
  console.log('[Granny] Daily sports intelligence check...');
  
  const sportsPublishers = ['on3.com'];
  
  for (const domain of sportsPublishers) {
    const analysis = await Granny.analyzePublisher(domain);
    
    // Filter for urgent opportunities (3 days or less)
    const urgent = analysis.opportunities.filter(o => 
      o.upcoming_event && o.upcoming_event.days_away <= 3
    );
    
    if (urgent.length > 0) {
      await sendUrgentAlert(analysis); // Alert to Slack
    }
  }
});
```

### Option 2: API Service (On-Demand)
```javascript
// Express API for Granny
// services/granny/api.js

const express = require('express');
const Granny = require('./index');

const app = express();

// Analyze publisher on-demand
app.get('/granny/analyze/:domain', async (req, res) => {
  const { domain } = req.params;
  const analysis = await Granny.analyzePublisher(domain);
  res.json(analysis);
});

// Get recommendations only
app.get('/granny/recommendations/:domain', async (req, res) => {
  const analysis = await Granny.analyzePublisher(req.params.domain);
  res.json(analysis.recommendations);
});

// Health check
app.get('/granny/health', (req, res) => {
  res.json({ status: 'healthy', service: 'granny-intelligence' });
});

app.listen(3001, () => {
  console.log('[Granny] Intelligence API running on port 3001');
});
```

### Option 3: Slack App (Commands trigger Granny)
```javascript
// Slack app triggers Granny service
// services/slack/commands.js

app.post('/slack/commands', async (req, res) => {
  const { command, text } = req.body;
  
  if (command === '/granny-analyze') {
    const domain = text; // e.g., "on3.com"
    
    // Acknowledge immediately
    res.json({ text: `🔍 Granny is analyzing ${domain}... (30 seconds)` });
    
    // Run analysis async
    const analysis = await Granny.analyzePublisher(domain);
    const report = Granny.generateReport(analysis);
    
    // Post results to Slack
    await slack.chat.postMessage({
      channel: req.body.channel_id,
      text: formatGrannyReport(report)
    });
  }
});
```

---

## Integration with Existing Codebase

Granny should reuse existing utilities from SDK:

```javascript
// services/granny/index.js
const AthenaUtils = require('../../../SDK/www.makemula.ai/utils/AthenaUtils');
const { pool } = require('../../../SDK/www.makemula.ai/config/database');
const ImpactAPI = require('../../../SDK/www.makemula.ai/utils/ImpactAPI');

class GrannyIntelligenceService {
  constructor() {
    this.athena = AthenaUtils; // Reuse existing Athena helper
    this.db = pool; // Reuse existing Postgres pool
    this.impactAPI = ImpactAPI; // Reuse existing Impact API client
  }
  
  // ... rest of implementation
}
```

**Key Point**: Granny uses the same helpers/utilities as MulaBot, just accesses them directly instead of via Slack commands.

---

## Summary for Kale

### What Granny Needs:
1. ✅ **Postgres read access** (site_search_targets, searches, pages)
2. ✅ **Athena read access** (mula_events table)
3. ✅ **Impact API credentials** (read-only)
4. ✅ **Redis cache access** (optional, for performance)
5. ✅ **Reuse existing SDK utilities** (AthenaUtils, database pool, etc.)

### What Granny Outputs:
1. **Analysis JSON** (current state + opportunities + recommendations)
2. **Slack commands** (for humans to execute: `/mula-site-targeting-add ...`)
3. **SQL updates** (for automation: `UPDATE site_search_targets SET...`)
4. **Formatted reports** (Slack messages or dashboard display)

### How It Works:
```
1. Granny queries data sources directly (not via Slack)
2. Granny analyzes and generates recommendations
3. Humans execute recommendations via Slack commands
4. OR automation executes via direct DB updates (with approval workflow)
```

**Granny = Backend intelligence service, not a Slack bot.** 🏄

