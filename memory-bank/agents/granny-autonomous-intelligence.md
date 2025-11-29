# Granny - Autonomous Intelligence Gathering

## Overview

Granny autonomously gathers publisher intelligence by running existing MulaBot Slack commands and analyzing external APIs. This allows Granny to build comprehensive publisher profiles without manual data collection.

---

## Available MulaBot Commands

Granny has access to all MulaBot Slack commands and understands their purpose, parameters, and output format.

### 1. Performance & Reporting Commands

```bash
/mula-performance-report <domain1,domain2> <lookback_days>
```
**Purpose**: Get KPI dashboard (widget views, clicks, ad views, RPM)  
**Granny Uses For**: Revenue analysis, traffic patterns, baseline performance  
**Example**: `/mula-performance-report on3.com 30`

```bash
/mula-impact-on3-subid-report <lookback_days>
```
**Purpose**: Affiliate revenue report (clicks, actions, revenue, EPC by SubID)  
**Granny Uses For**: Revenue attribution, product performance, ROI analysis  
**Example**: `/mula-impact-on3-subid-report 14`

```bash
/mula-product-performance <domain> <lookback_days>
```
**Purpose**: SKU-level engagement metrics (which products are clicked)  
**Granny Uses For**: Product relevance analysis, category insights  
**Example**: `/mula-product-performance on3.com 7`

```bash
/mula-engagement-report <domain> <lookback_days>
```
**Purpose**: Cohort analysis (with vs. without Mula), time on page, scroll depth  
**Granny Uses For**: Engagement lift measurement, UX impact  
**Example**: `/mula-engagement-report on3.com 30`

---

### 2. Site Intelligence Commands

```bash
/mula-site-targeting-list <domain>
```
**Purpose**: Lists all active targeting rules (paths, searches, status)  
**Granny Uses For**: Current deployment audit, optimization opportunities  
**Example**: `/mula-site-targeting-list on3.com`

```bash
/mula-site-taxonomy <domain>
```
**Purpose**: Content categorization analysis (top categories by traffic)  
**Granny Uses For**: Understanding content focus, audience interests  
**Example**: `/mula-site-taxonomy on3.com`

```bash
/mula-site-search <domain>
```
**Purpose**: Internal search phrase analysis (what users search for)  
**Granny Uses For**: Intent detection, product opportunity discovery  
**Example**: `/mula-site-search on3.com`

```bash
/mula-click-urls <domain> <lookback_days>
```
**Purpose**: Which content URLs drive affiliate clicks  
**Granny Uses For**: High-value content identification, placement optimization  
**Example**: `/mula-click-urls on3.com 14`

---

### 3. Deployment Management Commands

```bash
/mula-site-targeting-add <domain> <type> <match_value> "<search phrase>"
```
**Purpose**: Add new targeting rule  
**Granny Uses For**: Implementing recommended optimizations  
**Example**: `/mula-site-targeting-add on3.com path_substring /teams/ohio-state-buckeyes/news "Beat Michigan rivalry gear"`

```bash
/mula-site-targeting-rm <domain> <rule_id>
```
**Purpose**: Remove targeting rule  
**Granny Uses For**: Cleaning up outdated or underperforming rules  
**Example**: `/mula-site-targeting-rm on3.com 93`

```bash
/mulaize <url>
```
**Purpose**: Create page + trigger product search  
**Granny Uses For**: Testing new page/category, quick proof of concept  
**Example**: `/mulaize https://on3.com/teams/ohio-state-buckeyes/news/rivalry-week`

```bash
/mula-remulaize <url>
```
**Purpose**: Force fresh product search (ignores cache)  
**Granny Uses For**: Testing new search strategy, refreshing stale feeds  
**Example**: `/mula-remulaize https://on3.com/teams/ohio-state-buckeyes/news`

---

### 4. Testing & Validation Commands

```bash
/mula-ab-test-performance <test_id>
```
**Purpose**: A/B test results and statistical significance  
**Granny Uses For**: Validating optimization impact, measuring lift  
**Example**: `/mula-ab-test-performance rivalry-week-test-2024`

```bash
/mula-health-check <domain>
```
**Purpose**: Site health monitoring (tag fires, errors, performance)  
**Granny Uses For**: Deployment verification, issue detection  
**Example**: `/mula-health-check on3.com`

```bash
/mula-domain-channels-list
```
**Purpose**: Shows domain → Slack channel mappings  
**Granny Uses For**: Understanding reporting setup, channel context  
**Example**: `/mula-domain-channels-list`

---

## External Data Sources

### ESPN API
**Purpose**: Sports context (scores, schedules, standings, player stats)  
**Granny Uses For**: Real-time sports intelligence, rivalry detection, championship tracking  
**Endpoints**:
- `/sports/football/college-football/teams/{team_id}/schedule`
- `/sports/football/college-football/scoreboard`
- `/sports/football/college-football/rankings`

### SimilarWeb API
**Purpose**: Traffic estimates, audience demographics, competitive intelligence  
**Granny Uses For**: Publisher profiling, market analysis, traffic forecasting  
**Endpoints**:
- `/v1/website/{domain}/total-traffic-and-engagement/visits`
- `/v1/website/{domain}/demographics/age`
- `/v1/website/{domain}/similar-sites`

### Google Analytics API (if access granted)
**Purpose**: Precise traffic data, user behavior, conversion tracking  
**Granny Uses For**: Accurate baseline metrics, segment analysis, attribution  

---

## Autonomous Intelligence Gathering Workflow

### Phase 1: Discovery (What's Running Now)

**Step 1**: Check current targeting configuration
```bash
/mula-site-targeting-list on3.com
```
**Granny Analyzes**:
- How many targets are active?
- What search phrases are being used?
- When were they last updated?
- Are any seasonally irrelevant? (e.g., "halloween" in November)

**Step 2**: Get performance baseline
```bash
/mula-performance-report on3.com 30
```
**Granny Analyzes**:
- What's the current RPM?
- What's the CTR trend?
- Are there traffic spikes/dips?
- What's the week-over-week performance?

**Step 3**: Understand revenue attribution
```bash
/mula-impact-on3-subid-report 14
```
**Granny Analyzes**:
- Which SubIDs (pages/feeds) drive revenue?
- What's the EPC (earnings per click)?
- Are there high-traffic, low-revenue pages?

---

### Phase 2: Contextual Analysis (What's Happening Now)

**Step 4**: Check sports calendar (ESPN API)
```javascript
// Granny queries ESPN for Ohio State schedule
GET https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/194/schedule

Response: {
  "events": [
    {
      "date": "2025-11-30T17:00:00Z",
      "name": "Ohio State at Michigan",
      "shortName": "OSU @ MICH",
      "competitions": [{
        "competitors": [
          {"team": {"displayName": "Ohio State"}, "homeAway": "away"},
          {"team": {"displayName": "Michigan"}, "homeAway": "home"}
        ]
      }]
    }
  ]
}
```
**Granny Detects**:
- Rivalry game in 3 days
- High-stakes matchup (#2 vs #5)
- Championship implications

**Step 5**: Analyze content taxonomy
```bash
/mula-site-taxonomy on3.com
```
**Granny Analyzes**:
- What content categories get the most traffic?
- Are there seasonal shifts?
- Which teams/topics are trending?

---

### Phase 3: Opportunity Identification (What Should Change)

**Step 6**: Cross-reference context with current targeting
```yaml
# Granny's Analysis
current_target_93:
  path: "/teams/ohio-state-buckeyes/news"
  search: "Ohio State Buckeyes Inflatable halloween"
  status: "ACTIVE"
  created: "2024-10-08"

contextual_intelligence:
  current_date: "2024-11-27"
  halloween_date: "2024-10-31" # 27 days ago
  next_big_event: "Ohio State vs Michigan" # 3 days away
  
opportunity:
  issue: "Halloween feed is 4 weeks out of date"
  context: "Rivalry week is NOW"
  recommendation: "Switch to rivalry-specific feed"
  expected_lift: "2.3x CTR"
  revenue_impact: "+$6,750 over 7 days"
```

**Step 7**: Validate opportunity with performance data
```bash
/mula-product-performance on3.com 7
```
**Granny Checks**:
- Are halloween products getting any clicks? (likely: NO)
- What's the current CTR on this target? (likely: very low)
- Is there room for improvement? (likely: YES)

---

### Phase 4: Proactive Recommendation (What to Do)

**Step 8**: Generate actionable recommendation
```yaml
granny_recommendation:
  target_id: 93
  action: "update_search_phrase"
  current_search: "Ohio State Buckeyes Inflatable halloween"
  recommended_search: "Beat Michigan rivalry Ohio State gear"
  reasoning:
    - "Halloween ended 4 weeks ago (completely out of season)"
    - "Ohio State vs Michigan in 3 days (peak rivalry moment)"
    - "Historical data shows 2.3x CTR lift during rivalry weeks"
    - "Expected traffic spike: 3.5x (420K pageviews vs. 120K baseline)"
  expected_impact:
    ctr_lift: "2.3x (0.3% → 3.8%)"
    revenue_lift: "+$6,750 over 7 days"
    effort: "2-minute update"
    risk: "ZERO (easy rollback)"
  
  implementation:
    command: "/mula-site-targeting-add on3.com path_substring /teams/ohio-state-buckeyes/news \"Beat Michigan rivalry Ohio State gear\""
    note: "Will create new target; can archive old target 93 after validation"
```

**Step 9**: Auto-execute (with approval) or suggest
```bash
# Granny can suggest:
"I've detected a high-value opportunity. Would you like me to update Target 93?"

# Or auto-execute if approved:
/mula-site-targeting-add on3.com path_substring /teams/ohio-state-buckeyes/news "Beat Michigan rivalry Ohio State gear"
```

---

### Phase 5: Monitoring & Validation (What Happened)

**Step 10**: Monitor impact (after implementation)
```bash
# Day 1 after change
/mula-performance-report on3.com 1

# Compare to baseline
/mula-performance-report on3.com 7
```
**Granny Tracks**:
- CTR change (did it lift?)
- Revenue change (did we capture opportunity?)
- Traffic vs. forecast (was prediction accurate?)

**Step 11**: Generate performance report
```bash
/mula-impact-on3-subid-report 7
```
**Granny Measures**:
- SubID performance for Ohio State target
- Revenue attribution
- EPC (earnings per click)

**Step 12**: Document learnings
```yaml
granny_learning:
  optimization_id: "ohio-state-rivalry-week-2024"
  date_implemented: "2024-11-27"
  date_ended: "2024-12-03"
  
  results:
    ctr_baseline: "0.3%"
    ctr_rivalry_week: "3.8%"
    actual_lift: "2.3x" # Matches prediction ✅
    
    revenue_baseline: "$450/week"
    revenue_rivalry_week: "$7,200/week"
    incremental_revenue: "+$6,750" # Matches prediction ✅
  
  conclusion: "Rivalry week optimization validated. Roll out to all ON3 teams."
  next_action: "Auto-optimize Michigan target for same game (reverse perspective)"
```

---

## Granny's Command Execution Strategy

### 1. **Always Start with Discovery**
```
/mula-site-targeting-list <domain>  → What's running?
/mula-performance-report <domain> 30 → How's it performing?
/mula-site-taxonomy <domain>        → What content matters?
```

### 2. **Layer in Context**
```
ESPN API → What's happening in sports?
Calendar → What season/holiday is it?
Traffic Data → Are there spikes coming?
```

### 3. **Identify Gaps**
```
Compare: Current targeting vs. Contextual opportunities
Flag: Outdated feeds, missed moments, low-performing targets
Quantify: Revenue opportunity, lift potential, risk level
```

### 4. **Generate Recommendations**
```
Specific: Exact command to run
Quantified: Expected impact ($, CTR, traffic)
Justified: Why this matters now
Actionable: One-click execution or approval
```

### 5. **Monitor & Learn**
```
Track: Performance before/after
Validate: Did predictions match reality?
Document: Learnings for future optimizations
Scale: Roll out patterns that work
```

---

## Example: Granny Autonomous Analysis (Ohio State)

### Input: "Analyze ON3 Ohio State property"

**Granny Executes**:

```bash
# Step 1: Discovery
> /mula-site-targeting-list on3.com

Response:
- ID: 93, Path: /teams/ohio-state-buckeyes/news, Search: "Ohio State Buckeyes Inflatable halloween", Status: ACTIVE, Created: 2024-10-08

# Step 2: Performance Baseline
> /mula-performance-report on3.com 30

Response:
- Target 93: 450 clicks, 0.3% CTR, $450 revenue (last 7 days)

# Step 3: Revenue Attribution
> /mula-impact-on3-subid-report 14

Response:
- SubID ohio-state-buckeyes: 12 actions, $187 revenue, $15.58 EPC

# Step 4: Sports Context (ESPN API)
> GET espn.com/api/.../teams/194/schedule

Response:
- Next game: Ohio State vs. Michigan, Nov 30, 2025 (3 days away)

# Step 5: Content Taxonomy
> /mula-site-taxonomy on3.com

Response:
- Top category: /teams/* (68% of traffic)
- Trending: ohio-state-buckeyes, michigan-wolverines
```

**Granny Analysis**:
```yaml
findings:
  current_state:
    target: "Halloween inflatables"
    status: "4 weeks out of date"
    performance: "0.3% CTR (very low)"
    
  contextual_opportunity:
    event: "Ohio State vs Michigan (3 days)"
    significance: "Biggest rivalry in sports"
    traffic_forecast: "3.5x spike incoming"
    
  gap_analysis:
    issue: "Halloween feed during rivalry week"
    missed_revenue: "$6,750 potential"
    
  recommendation:
    action: "Update to rivalry-specific feed"
    search: "Beat Michigan rivalry Ohio State gear"
    expected_lift: "2.3x CTR"
    implementation: "2-minute command"
```

**Granny Output**:
```
🔴 HIGH-VALUE OPPORTUNITY DETECTED

Property: ON3 Ohio State Buckeyes
Issue: Halloween feed is 4 weeks out of date
Opportunity: Ohio State vs Michigan rivalry in 3 days

Current Performance:
• Search: "Ohio State Buckeyes Inflatable halloween"
• CTR: 0.3% (very low)
• Revenue: $450/week

Recommended Change:
• Search: "Beat Michigan rivalry Ohio State gear"
• Expected CTR: 3.8% (2.3x lift)
• Expected Revenue: $7,200/week (+$6,750 incremental)

Implementation:
/mula-site-targeting-add on3.com path_substring /teams/ohio-state-buckeyes/news "Beat Michigan rivalry Ohio State gear"

Would you like me to execute this change? Reply ✅ to approve.
```

---

## Granny's Command Permissions

### Read-Only Commands (No Approval Needed)
- `/mula-performance-report`
- `/mula-site-targeting-list`
- `/mula-site-taxonomy`
- `/mula-click-urls`
- `/mula-product-performance`
- `/mula-engagement-report`
- `/mula-impact-on3-subid-report`
- `/mula-health-check`
- `/mula-domain-channels-list`

**Granny executes these autonomously to gather intelligence.**

### Write Commands (Approval Required)
- `/mula-site-targeting-add`
- `/mula-site-targeting-rm`
- `/mulaize`
- `/mula-remulaize`

**Granny suggests these with one-click approval.**

---

## Integration Pattern

```javascript
// Granny Intelligence Gathering Service
class GrannyIntelligence {
  
  async analyzePublisher(domain) {
    // Phase 1: Discovery
    const targeting = await this.slack.command('/mula-site-targeting-list', domain);
    const performance = await this.slack.command('/mula-performance-report', domain, 30);
    const revenue = await this.slack.command('/mula-impact-on3-subid-report', 14);
    
    // Phase 2: Contextual Analysis
    const sportsContext = await this.espn.getSchedule(domain);
    const taxonomy = await this.slack.command('/mula-site-taxonomy', domain);
    const seasonalContext = this.calendar.getCurrentSeason();
    
    // Phase 3: Opportunity Identification
    const opportunities = this.identifyOpportunities({
      targeting,
      performance,
      sportsContext,
      taxonomy,
      seasonalContext
    });
    
    // Phase 4: Generate Recommendations
    const recommendations = opportunities.map(opp => ({
      target_id: opp.target_id,
      action: 'update_search',
      current: opp.current_search,
      recommended: opp.recommended_search,
      expected_lift: opp.expected_lift,
      revenue_impact: opp.revenue_impact,
      command: this.generateCommand(opp)
    }));
    
    // Phase 5: Return Analysis
    return {
      current_state: { targeting, performance, revenue },
      contextual_intelligence: { sportsContext, taxonomy, seasonalContext },
      opportunities,
      recommendations
    };
  }
  
  generateCommand(opportunity) {
    return `/mula-site-targeting-add ${opportunity.domain} path_substring ${opportunity.path} "${opportunity.recommended_search}"`;
  }
}
```

---

## Benefits of Autonomous Intelligence

### Speed
- **Before**: Manual analysis takes 2-3 hours per publisher
- **With Granny**: Autonomous analysis in 30 seconds

### Completeness
- **Before**: Human analysis misses context (forgot about upcoming game)
- **With Granny**: Always checks all data sources (sports calendar, performance, taxonomy)

### Proactivity
- **Before**: React after missed opportunity ("we should have done rivalry week")
- **With Granny**: Detect 3 days ahead and auto-recommend

### Scale
- **Before**: Can analyze 2-3 publishers per day (manual)
- **With Granny**: Can analyze 100+ publishers per day (automated)

### Learning
- **Before**: Tribal knowledge, inconsistent execution
- **With Granny**: Every optimization documented, patterns scaled

---

## Next Steps

1. **Grant Granny read-only command access** (all `/mula-*-list`, `/mula-*-report` commands)
2. **Connect Granny to ESPN API** (sports context intelligence)
3. **Build approval workflow** for write commands (one-click ✅)
4. **Deploy to ON3** (10 teams, high-frequency sports events)
5. **Monitor & iterate** (validate lift predictions, improve recommendations)

---

**Granny = Autonomous intelligence that never misses an opportunity** 🏄

