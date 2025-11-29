# Granny - Publisher Intelligence Agent (Integrated & Realistic)

**Purpose**: Understand each publisher's business holistically—like a superfan (knows what's NOW) + insider (knows what's NEXT)—and provide intelligence to support deployment decisions.

---

## Philosophy

**Granny doesn't predict revenue. Granny detects opportunities.**

Instead of speculative forecasts ($23K in 7 days!), Granny focuses on:
1. ✅ **What we can observe** (traffic patterns, content focus, sports calendar)
2. ✅ **What's contextually relevant** (rivalries, seasons, holidays)
3. ✅ **What's technically feasible** (path patterns, deployment readiness)
4. ❌ **NOT revenue predictions** (until we have site-specific data)

**Note on Existing Revenue Estimation**:
The existing `/onboard` system includes **traffic tier estimation** (Tier 1-4) and revenue ranges ($300/mo - $50K+/mo) based on heuristic signals (competitor widgets, site complexity, etc.). These are **hidden from Granny's outputs** until we establish confidence through:
1. Actual traffic data (not heuristics)
2. Historical performance baselines
3. Site-specific conversion data

Granny may reference traffic tiers internally for prioritization, but **does not communicate revenue projections** to stakeholders.

---

## Integration with Existing `/onboard` Technical Discovery System

**CRITICAL**: Mula already has a mature **Technical Onboarding System** via the `/onboard` Slack command (see `/Users/loganlorenz/Onboarding/`). Granny's **Technical Intelligence** domain leverages this existing system rather than reimplementing it.

### What `/onboard` Already Provides:

```bash
/onboard https://publisher.com
```

**Technical Discovery (< 60 seconds)**:
- ✅ **CMS Detection**: WordPress, Shopify, Wix, Squarespace, Webflow, Drupal, Joomla, Ghost, Medium
- ✅ **DOM Selector Discovery**: Finds optimal SmartScroll placement with 0-100% confidence scores
- ✅ **GTM Detection**: Determines fastest implementation path (GTM = Easy, 30-60 min)
- ✅ **Competitor Analysis**: Detects Taboola, Outbrain, AdSense, Amazon Associates, Skimlinks, VigLink
- ✅ **Mobile Responsiveness**: Checks viewport meta tags and responsive frameworks
- ✅ **Performance Scoring**: Page size (KB), external script count (0-100 score)
- ✅ **Implementation Complexity**: Easy (GTM), Medium (WordPress), Difficult (Custom)
- ✅ **Timeline Estimates**: 30 min (GTM) to 8 hours (complex custom)
- ✅ **Sample Article URLs**: Provides 3 real article URLs for testing
- ✅ **Risk Warnings**: Flags low confidence, inconsistent structure, competitor conflicts
- ✅ **Automatic Logging**: All analyses logged to Google Sheets for historical reference

**Example Output**:
```yaml
/onboard https://essentiallysports.com

Quick Summary:
  Complexity: MEDIUM
  Path: WordPress Direct
  Confidence: 100%
  Timeline: 2-4 hours
  Revenue Potential: Tier 2 (250K-1M visits/mo)

Technical Details:
  CMS: WordPress (detected)
  GTM: Not detected
  Primary Selector: .entry-content (100% confidence)
  Mobile Responsive: Yes
  Performance Score: 85/100
  
Competitor Widgets:
  - Google AdSense
  - Taboola
  
Sample Articles:
  - https://www.essentiallysports.com/nba/...
  - https://www.essentiallysports.com/nfl/...
  - https://www.essentiallysports.com/tennis/...
```

### How Granny Leverages `/onboard`:

Granny **orchestrates and interprets** the `/onboard` system as part of holistic publisher intelligence:

```javascript
// Granny's Technical Intelligence workflow

granny.gatherTechnicalIntel('essentiallysports.com')

Steps:
1. Run `/onboard essentiallysports.com` → Get technical analysis
2. Interpret results → "100% confidence + WordPress = straightforward deployment"
3. Combine with context → "Multi-sport publisher, need sport-specific targeting"
4. Flag gaps → "Site crawler needed to discover actual URL paths"
5. Provide deployment strategy → "Start with highest-traffic sports (NFL, NBA)"
```

### What Granny Adds to `/onboard`:

| `/onboard` Provides | Granny Adds |
|---------------------|-------------|
| CMS detection | Deployment timing recommendation |
| DOM selectors | When to re-run (detect site changes) |
| Competitor widgets | Market positioning insight |
| Performance score | Impact on UX/monetization strategy |
| Implementation complexity | Resource allocation guidance |
| Sample URLs | Content type differentiation (news vs. analysis) |

### Granny's Technical Intelligence Workflow:

```yaml
granny.technicalIntelligence('publisher.com'):
  
  step_1_discovery:
    action: "Run /onboard publisher.com"
    timing: "Pre-kickoff (30 days before deployment)"
    deliverable: "Technical readiness assessment"
    
  step_2_interpretation:
    input: "/onboard results"
    analysis:
      - "100% confidence + GTM = fastest path (prioritize)"
      - "WordPress + no GTM = 2-4 hours (standard effort)"
      - "Custom CMS + low confidence = high risk (manual review)"
    deliverable: "Implementation strategy recommendation"
    
  step_3_gap_detection:
    checks:
      - "Are URL paths documented?" → If no, need crawler
      - "Is tag deployment verified?" → If no, need health check
      - "Has site changed?" → If yes, re-run /onboard
    deliverable: "Gap analysis + mitigation plan"
    
  step_4_deployment_readiness:
    assessment:
      technical_risk: "Low/Medium/High (from /onboard)"
      deployment_path: "GTM / WordPress / Custom"
      estimated_effort: "30 min - 8 hours"
      prerequisites: ["GTM access", "WordPress admin", "Publisher coordination"]
    deliverable: "Go/no-go recommendation"
```

### Example: Granny + `/onboard` Integration

**Scenario**: New publisher discovery (EssentiallySports.com)

```bash
# 1. Granny triggers technical discovery
granny.discover('essentiallysports.com')

# 2. Granny orchestrates /onboard
/onboard https://essentiallysports.com

# 3. Granny receives /onboard results
{
  cms: "WordPress",
  gtm: false,
  confidence: 100,
  complexity: "Medium",
  timeline: "2-4 hours",
  mobile: true,
  performance: 85,
  competitors: ["AdSense", "Taboola"]
}

# 4. Granny interprets + adds context
granny.interpret(onboard_results)

Technical Intelligence:
──────────────────────────────────────
Deployment Readiness: ✅ GOOD
  - WordPress (standard CMS, well-supported)
  - 100% selector confidence (high reliability)
  - Mobile responsive (60%+ traffic)
  - Performance: 85/100 (no concerns)
  
Implementation Path: WordPress Direct
  - Estimated: 2-4 hours
  - Risk: LOW (standard deployment)
  - Prerequisites: WordPress admin access
  
Competitive Landscape:
  - AdSense + Taboola detected
  - Opportunity: Complement existing monetization
  - Strategy: Test placement to avoid conflicts
  
Next Steps:
  1. Request WordPress admin access
  2. Run site crawler to discover URL patterns
  3. Verify tag deployment (health check)
  4. Start with highest-traffic sport (determine via content analysis)
  
Gaps to Address:
  ⚠️  URL path structure unknown → Need crawler
  ⚠️  Sport segmentation unknown → Need content analysis
  ⚠️  Traffic distribution unknown → Need baseline measurement
```

### When Granny Re-runs `/onboard`:

```yaml
rerun_triggers:
  
  major_site_redesign:
    trigger: "Publisher reports site redesign"
    action: "Re-run /onboard to update selectors"
    rationale: "DOM structure likely changed"
    
  selector_failures:
    trigger: "Widget not loading (health check fails)"
    action: "Re-run /onboard to find new selectors"
    rationale: "Site structure changed without notice"
    
  cms_migration:
    trigger: "Publisher migrating CMS platforms"
    action: "Re-run /onboard post-migration"
    rationale: "Entire technical stack changed"
    
  performance_degradation:
    trigger: "Page load times increased"
    action: "Re-run /onboard to assess new performance score"
    rationale: "Technical changes impacting performance"
```

---

## Integration with Existing CS Playbook

Granny enhances the existing CS playbook phases:

### Phase 0: Pre-Onboarding (NEW - Granny Intelligence)

**Before the kickoff call**, Granny gathers intelligence by orchestrating existing tools:

```yaml
granny_pre_onboarding_workflow:
  
  step_1_technical_discovery:
    action: "/onboard https://on3.com"
    output:
      cms: "WordPress"
      gtm: true
      confidence: 95
      complexity: "Easy"
      timeline: "30-60 min"
      mobile: true
      performance: 88
      competitors: ["Google Ad Manager"]
      
  step_2_content_analysis:
    method: "URL pattern detection + manual observation"
    output:
      primary_focus: "team coverage (10 teams detected)"
      content_types: ["news", "injury_reports", "recruiting", "analysis"]
      url_patterns:
        - "/teams/ohio-state-buckeyes/news/*"
        - "/teams/michigan-wolverines/news/*"
        
  step_3_contextual_intelligence:
    source: "ESPN API + Sports calendar"
    output:
      current_season: "college_football_regular_season"
      current_week: "Week 14 (Rivalry Week)"
      upcoming_moments:
        - "Ohio State vs Michigan (Nov 30)"
        - "Alabama vs Auburn (Nov 30)"
        - "Conference Championships (Dec 7)"
        
  step_4_deployment_readiness:
    from_onboard: "WordPress + GTM = Easy deployment (30-60 min)"
    from_observation: "Mula tags not yet deployed"
    assessment: "LOW RISK - Standard setup with GTM"
    
  deliverable:
    deployment_strategy: "GTM-based, team-page targeting"
    priority_teams: ["ohio-state", "michigan", "auburn", "alabama"]
    placement: "end-of-article (SmartScroll via .entry-content selector)"
    timing: "URGENT - rivalry week in 3 days"
    technical_effort: "30-60 min (GTM path)"
```

**Deliverable**: Pre-kickoff intelligence brief (no revenue predictions)

**Key Integration**: Granny uses `/onboard` for technical discovery, then adds sports context and timing intelligence.

---

### Phase 1: Pre-Onboarding (Existing - Enhanced)

**CS Playbook Activities**:
- ✅ Intro Call & Value Framing
- ✅ Tech Readiness Checklist
- ✅ Mulaize demo, review products, send Loom

**Granny Enhancement**:
```yaml
granny_provides:
  - Publisher profile (traffic, content focus, vertical)
  - Contextual calendar (upcoming high-traffic moments)
  - Suggested targeting strategy (paths, searches)
  - Technical assessment (CMS, ad tech, readiness)
  - Demo page recommendations (which pages to Mulaize)
```

**Example Granny Brief for Kickoff**:
```
Publisher: ON3.com
Vertical: College Sports (CFB primary)
Traffic: ~45M/mo (estimated)

Contextual Opportunity:
  🔴 URGENT: Rivalry week (Nov 30) in 3 days
  - Ohio State vs Michigan ("The Game")
  - Alabama vs Auburn ("Iron Bowl")
  - Expected traffic spike: 3-5x on game days

Current Targeting:
  ⚠️  10 team pages with static feeds
  ⚠️  4 pages have "halloween" searches (4 weeks out of date)
  
Recommendation:
  - Update to contextual feeds (rivalry-specific)
  - Start with Ohio State + Michigan (highest traffic)
  - Timing: Execute today (before traffic spike)
  
Technical: WordPress + GAM (standard setup, low risk)
```

**NO revenue predictions**, just intelligence to inform decisions.

---

### Phase 2: Onboarding (Week 1-2) - Enhanced

**CS Playbook Activities**:
- ✅ Kickoff Call
- ✅ Slack Kickoff Chat
- ✅ Deployment Milestone (tags live)
- ✅ Deployment confirmation (DevTools check)
- ✅ Reporting Setup (Amazon, GAM, Impact)

**Granny Enhancement**:

**2A: Deployment Intelligence**
```bash
# After tags deployed, Granny confirms
granny.healthCheck('on3.com')

Response:
✅ Tags detected: mula.js v1.57.9
✅ Injection points: Detected (end-of-article selectors)
✅ Conflicts: None detected
✅ Performance: No impact on page speed
⚠️  Targeting: No active rules yet
```

**2B: Targeting Setup Guidance**
```yaml
# Granny suggests targeting rules based on content analysis
granny.suggestTargeting('on3.com')

Suggestions:
  priority_1:
    path: "/teams/ohio-state-buckeyes/news"
    search: "Ohio State Buckeyes Football"
    rationale: "Highest traffic team page"
    context: "Rivalry week coming (update to contextual soon)"
    
  priority_2:
    path: "/teams/michigan-wolverines/news"
    search: "Michigan Wolverines Football"
    rationale: "2nd highest traffic, same rivalry game"
    
  priority_3:
    path: "/teams/alabama-crimson-tide/news"
    search: "Alabama Crimson Tide Football"
    rationale: "Top SEC traffic"
```

**2C: Search Phrase Validation**
```javascript
// Granny tests search phrases BEFORE deployment
const validation = await granny.validateSearchPhrase({
  phrase: "Ohio State Buckeyes Football",
  team: "ohio-state"
});

Response:
{
  phrase: "Ohio State Buckeyes Football",
  products_found: 124,
  products_in_stock: 98 (79%),
  avg_price: $36.90,
  categories: ["apparel", "accessories", "home_decor", "collectibles"],
  relevance: "generic (no context-specific items detected)",
  recommendation: "APPROVED for baseline, consider contextual for high-traffic moments"
}
```

**Deliverable**: Validated targeting plan (no revenue promises)

---

### Phase 3: Activation (Week 2-4) - Enhanced

**CS Playbook Activities**:
- ✅ Insight Loop Begins (48-72 hours post-launch)
- ✅ Weekly Wins (async updates)
- ✅ Rapid Experimentation (test variations)

**Granny Enhancement**:

**3A: Performance Baseline**
```bash
# After 7 days, Granny establishes baseline
granny.establishBaseline('on3.com', 7)

Response:
Baseline Established (7 days):
──────────────────────────────────────
Target 93 (Ohio State):
  Widget Views: 12,450
  Feed Clicks: 37
  CTR: 0.30%
  Store Clicks: 8
  
Analysis:
  ⚠️  CTR is low (< 1.0% benchmark)
  ⚠️  Search phrase: "halloween" (out of season)
  ✅ Widget visibility: Good (85% viewability)
  ✅ Technical: No errors detected
  
Opportunity:
  🔴 Rivalry week in 2 days (contextual opportunity)
  Suggestion: Test contextual search phrase
```

**3B: Contextual Optimization Suggestion**
```yaml
# Granny detects upcoming moment
granny.detectOpportunity('on3.com')

Opportunity Detected:
──────────────────────────────────────
Event: Ohio State vs Michigan
Date: Nov 30 (2 days away)
Significance: Biggest rivalry in sports

Current State:
  Search: "Ohio State Buckeyes Inflatable halloween"
  CTR: 0.30% (baseline established)
  Relevance: Out of season (halloween ended 4 weeks ago)
  
Suggested Change:
  Search: "Beat Michigan rivalry Ohio State gear"
  Rationale: Contextual + rivalry + timely
  Product Validation: 47 products found (42 in stock)
  Risk: LOW (can revert if underperforms)
  
Measurement Plan:
  - Compare CTR (Nov 28-Dec 3) vs baseline (0.30%)
  - Success = ANY improvement over baseline
  - Rollback if CTR drops below 0.25%
```

**NO revenue predictions**, just opportunity detection + measurement plan.

---

### Phase 4: Value Confirmation (Week 4-6) - Enhanced

**CS Playbook Activities**:
- ✅ Results Debrief (performance trends)
- ✅ Case Study Opportunity (flag fit for public proof)

**Granny Enhancement**:

**4A: Performance Analysis**
```bash
# After 4-6 weeks, Granny analyzes patterns
granny.analyzePatterns('on3.com', 30)

Response:
Pattern Analysis (30 days):
──────────────────────────────────────
Baseline Performance (generic feeds):
  Avg CTR: 0.32%
  Consistency: Stable (±0.05%)
  
Contextual Moments (rivalry weeks):
  Avg CTR: 0.78% (2.4x baseline)
  Sample size: 2 rivalry weeks tested
  Consistency: High (both performed similarly)
  
Insight:
  ✅ Contextual optimization validated
  ✅ 2.4x lift is repeatable pattern
  ✅ No negative impact on other metrics
  
Recommendation:
  - Scale contextual approach to all teams
  - Build calendar for proactive optimization
  - Automate rivalry week detection
```

**4B: Opportunity Calendar**
```yaml
# Granny builds forward-looking calendar
granny.buildCalendar('on3.com', 90)

Upcoming Opportunities (Next 90 Days):
──────────────────────────────────────
Dec 7:
  - Conference Championships (5-7 teams)
  - Action: Prepare championship feeds 3 days prior
  
Dec 20 - Jan 20:
  - College Football Playoff (4 rounds)
  - Action: Team-specific playoff feeds for qualifiers
  
Feb 5:
  - National Signing Day
  - Action: Team pride / recruiting content
  
No revenue predictions, just opportunity calendar
```

---

## Granny's Core Capabilities (Realistic)

### 1. Discovery Intelligence

```javascript
granny.discover('essentiallysports.com')

Returns:
{
  publisher_type: "multi_sport_media",
  sports_covered: ["NFL", "NBA", "CFB", "MLB", "NASCAR", ...],
  content_patterns: [
    "/nfl/team-name/*",
    "/college-football/team-name/*"
  ],
  estimated_traffic: "30M+/month",
  current_deployment: "NOT DEPLOYED",
  technical_stack: {
    cms: "unknown (need crawl)",
    ad_tech: "likely_programmatic"
  }
}
```

**What Granny Provides**:
- ✅ Publisher profile
- ✅ Content structure
- ✅ Sports/vertical focus
- ❌ NO revenue predictions

---

### 2. Contextual Intelligence

```javascript
granny.getContext('on3.com', 'ohio-state')

Returns:
{
  team: "Ohio State Buckeyes",
  sport: "college_football",
  current_context: {
    season: "regular_season",
    week: 14,
    record: "11-1",
    ranking: 2,
    next_game: {
      opponent: "Michigan",
      date: "2025-11-30",
      significance: "rivalry + championship_implications",
      days_away: 3
    }
  },
  emotional_state: "peak_intensity",
  traffic_pattern: "expect_spike" // Based on historical patterns
}
```

**What Granny Provides**:
- ✅ Sports calendar
- ✅ Rivalry detection
- ✅ Timing intelligence
- ❌ NO traffic/revenue predictions

---

### 3. Product Validation

```javascript
granny.validateSearchPhrase('Beat Michigan rivalry Ohio State gear')

Returns:
{
  phrase: "Beat Michigan rivalry Ohio State gear",
  products_found: 47,
  products_in_stock: 42,
  sample_products: [
    {
      name: "Ohio State 'Beat Michigan' T-Shirt",
      price: 29.99,
      relevance: "high (rivalry-specific)"
    }
  ],
  assessment: "APPROVED - contextually relevant products available"
}
```

**What Granny Provides**:
- ✅ Product availability
- ✅ Relevance scoring
- ✅ Sample products
- ❌ NO predicted sales

---

### 4. Baseline Establishment

```javascript
granny.establishBaseline('on3.com', 93, 7)

Returns:
{
  target_id: 93,
  measurement_period: "7 days",
  baseline_metrics: {
    widget_views: 12450,
    feed_clicks: 37,
    ctr: 0.30,
    store_clicks: 8
  },
  assessment: "Baseline established. CTR is low, investigate search relevance.",
  next_action: "Compare future performance vs. 0.30% baseline"
}
```

**What Granny Provides**:
- ✅ Actual performance data
- ✅ Baseline for comparison
- ✅ Measurement framework
- ❌ NO future predictions

---

### 5. Opportunity Detection (NOT Prediction)

```javascript
granny.detectOpportunity('on3.com')

Returns:
{
  opportunities: [
    {
      type: "outdated_search",
      target_id: 93,
      current: "halloween inflatables",
      issue: "4 weeks out of season",
      suggestion: "Update to current season"
    },
    {
      type: "contextual_moment",
      target_id: 93,
      event: "Ohio State vs Michigan",
      days_away: 3,
      suggestion: "Test rivalry-specific search phrase"
    }
  ],
  note: "Suggestions are opportunities to test, not guaranteed outcomes"
}
```

**What Granny Provides**:
- ✅ Detected patterns
- ✅ Testing opportunities
- ✅ Timing guidance
- ❌ NO performance guarantees

---

## Integration with Customer Discovery Framework

Granny enhances the customer interview framework from CS Playbook:

### Publisher Profile (Granny Pre-Populates)

**Before Call**:
```yaml
granny_intel:
  audience: "College sports fans (detected from content)"
  content_focus: "Team coverage, recruiting, NIL"
  team_size: "Unknown (estimate: 10-20 based on output volume)"
  
  revenue_streams: # Detected
    - programmatic_ads: "Yes (GAM detected)"
    - subscriptions: "Yes (ON3+ premium)"
    - affiliate: "Yes (Mula partnership)"
    
  traffic_sources: # Estimated
    - primary: "Direct, search, social"
    - seasonal_peaks: "Fall (football season)"
```

**During Call** (Use Granny intel to ask better questions):
- "We see you cover 10 teams—which drive the most traffic?"
- "We noticed GAM for ads—what's your current RPM range?"
- "Your content spikes during rivalry weeks—how do you capitalize on that?"

---

### Monetization Partners (Granny Detects)

**Before Call**:
```yaml
granny_intel:
  current_partners_detected:
    - "Fanatics (via Impact API)"
    - "Google Ad Manager (programmatic)"
    
  affiliate_link_patterns:
    - "Impact tracking links detected"
    - "SubID structure: team-based"
    
  opportunity:
    - "Currently: 10 teams with static product feeds"
    - "Missing: Contextual optimization for high-traffic moments"
```

**During Call**:
- "You're using Fanatics—what categories perform best?"
- "Do you see revenue spikes during rivalry weeks?"
- "Would you be interested in automated contextual optimization?"

---

## Granny's Outputs (Realistic)

### Intelligence Brief (Pre-Kickoff)
```markdown
# Publisher Intelligence: ON3.com

## Profile
- Type: Sports Media (College Football focus)
- Traffic: ~45M pageviews/month (estimated)
- Teams Covered: 10 (Ohio State, Michigan, Alabama, etc.)
- Current Deployment: Active (10 team pages)

## Current State
- 10 targeting rules active
- 4 rules have outdated search phrases (halloween)
- Baseline CTR: 0.30% (low, needs investigation)

## Contextual Calendar
- Rivalry Week: Nov 30 (3 days away)
- Conference Championships: Dec 7
- Playoffs: Dec 20 - Jan 20

## Recommendation
- Update outdated search phrases
- Test contextual optimization during rivalry week
- Measure lift vs. 0.30% baseline

## Technical
- CMS: WordPress
- Ad Tech: GAM
- Risk: Low (standard setup)
```

### Opportunity Detection (Weekly)
```markdown
# Weekly Opportunity Scan: ON3.com

## Detected Opportunities

### 🔴 URGENT (3 days away)
- Ohio State vs Michigan (Nov 30)
- Current: "halloween inflatables" (irrelevant)
- Suggestion: Test "Beat Michigan rivalry" phrase
- Action: Execute before traffic spike

### 🟡 MEDIUM (7 days away)
- Conference Championships (Dec 7)
- Preparation: Identify which teams qualify
- Action: Prepare championship feeds 3 days prior

### 🟢 MONITORING
- Baseline CTR remains low (0.30%)
- Investigate: Search phrase relevance
- Experiment: Test different product categories
```

### Baseline Report (After 7 Days)
```markdown
# Baseline Report: ON3.com (7 Days)

## Performance
Target 93 (Ohio State):
- Widget Views: 12,450
- Feed Clicks: 37
- CTR: 0.30%
- Store Clicks: 8

## Assessment
- Visibility: Good (widget loading properly)
- Engagement: Low (CTR < 1.0% benchmark)
- Hypothesis: Search phrase relevance (halloween out of season)

## Next Steps
- Establish this as baseline (0.30% CTR)
- Test contextual phrases and compare
- Measure: Any improvement = success
```

---

## What Granny Does NOT Do

❌ **Predict revenue** ("$23K in 7 days")  
❌ **Guarantee lift** ("2.3x CTR guaranteed")  
❌ **Forecast traffic** ("420K pageviews expected")  
❌ **Promise outcomes** ("This will definitely work")

---

## What Granny DOES Do

✅ **Detect patterns** (rivalry weeks historically spike)  
✅ **Identify opportunities** (halloween feed is out of season)  
✅ **Validate products** (47 rivalry products available)  
✅ **Establish baselines** (current CTR is 0.30%)  
✅ **Suggest tests** (try contextual phrase and measure)  
✅ **Build calendars** (upcoming high-traffic moments)

---

## Confidence Levels (Realistic)

```yaml
what_granny_knows_with_high_confidence:
  - Sports calendar: 95% (ESPN API data)
  - Content patterns: 90% (detected from URLs)
  - Product availability: 95% (validated via Fanatics)
  - Current performance: 100% (actual metrics from Athena)
  
what_granny_knows_with_medium_confidence:
  - Traffic estimates: 60% (based on public data, not exact)
  - Technical stack: 70% (detected, but not always accurate)
  - Optimal search phrases: 65% (product-validated, but CTR unknown)
  
what_granny_does_NOT_know:
  - Future CTR: Unknown (need site-specific data)
  - Revenue outcomes: Unknown (depends on traffic, AOV, conversion)
  - Traffic spikes: Unknown (historical patterns, not guarantees)
```

---

## Summary

**Granny is an intelligence agent, not a prediction engine.**

**Granny helps you**:
1. Understand what's happening (sports calendar, content analysis)
2. Detect opportunities (outdated feeds, upcoming moments)
3. Validate feasibility (products available, technical readiness)
4. Establish baselines (measure current performance)
5. Suggest experiments (test and compare)

**Granny does NOT**:
- Predict revenue
- Guarantee lift
- Make promises

**Instead, Granny provides intelligence to make informed decisions and measure actual outcomes.**

🏄 **Granny = Intelligence, not predictions**

