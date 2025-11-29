# Granny - The Publisher Intelligence Agent

**Named After**: [LeRoy "Granny" Grannis](https://en.wikipedia.org/wiki/LeRoy_Grannis) - "Godfather of Surf Photography"

**Why Granny?**: Just as Granny Grannis understood surf culture deeply—knew when the waves were perfect, understood the surfers, captured the perfect moment—Granny the agent understands publishers holistically and knows the perfect moment for engagement and monetization.

---

## Mission

**Be the expert on each publisher's business from the outside AND inside.**

Like a **superfan**, Granny knows:
- What's happening NOW (championship game, breaking news, seasonal trends)
- The emotional state of the audience (excited, angry, nostalgic)
- What content is resonating today

Like an **insider**, Granny knows:
- What's coming NEXT (rivalry week, product launches, seasonal peaks)
- The business model and monetization strategy
- Where they sit in the market and competitive landscape
- The pulse of what drives their revenue

---

## Core Intelligence Domains

### 1. **Contextual Intelligence** (Real-Time Pulse)

**What's Happening Now**:
- **Sports Context** (ON3, sports publishers)
  - Championship games, rivalry matchups, homecoming weeks
  - Player transfers, coaching changes, recruiting news
  - Playoff implications, rankings movements
  - Emotional moments (upsets, comebacks, heartbreaks)

- **Seasonal Context** (all publishers)
  - Holiday shopping season (Q4)
  - Back-to-school (Aug-Sep)
  - Summer travel season
  - Industry-specific cycles (Fashion Week, CES, Awards season)

- **Cultural Context**
  - Breaking news and trending topics
  - Viral moments and memes
  - Social media sentiment
  - Audience emotional state

**Value**: Enables dynamic product recommendations that match the moment
- Championship → "National Champions celebration gear"
- Rivalry week → "Beat [Rival] merchandise"
- Holiday season → "Gift guides" and seasonal products
- Breaking news → Trend-reactive product feeds

---

### 2. **Business Intelligence** (Strategic Understanding)

**Publisher Business Model**:
- Revenue streams (programmatic ads, affiliate, subscriptions, sponsored content)
- Monetization mix and priorities
- Current RPM and revenue targets
- Traffic patterns and seasonality
- Growth trajectory and goals

**Market Position**:
- Competitive landscape
- Vertical positioning (sports, lifestyle, news, etc.)
- Unique value proposition
- Audience demographics and psychographics
- Brand strength and reputation

**Publisher Segmentation**:
| Segment | Traffic | Sophistication | Mula Strategy |
|---------|---------|----------------|---------------|
| **Enterprise** | 50M+ PV/mo | High (eng team) | Revenue + Innovation |
| **Growth** | 5-50M PV/mo | Medium | Revenue + Efficiency |
| **Mid-Market** | 1-5M PV/mo | Low-Medium | Revenue Lift |
| **Emerging** | <1M PV/mo | Low | Proof Points |

**Value**: Enables smart prioritization, deal structuring, and revenue forecasting

---

### 3. **Technical Intelligence** (Implementation Context)

**Foundation: `/onboard` System**

Granny leverages the existing `/onboard` Slack command for comprehensive technical discovery:

```bash
/onboard https://publisher.com
```

**Automated Analysis (< 60 seconds)**:
- **CMS Detection**: WordPress, Shopify, Wix, Squarespace, Webflow, Drupal, Joomla, Ghost, Medium
- **DOM Selector Discovery**: Optimal SmartScroll placement with 0-100% confidence scores
- **GTM Detection**: Identifies fastest implementation path (30-60 min with GTM)
- **Competitor Analysis**: Detects Taboola, Outbrain, AdSense, Amazon Associates, Skimlinks, etc.
- **Mobile Responsiveness**: Viewport + responsive framework detection
- **Performance Scoring**: Page size (KB), external script count, overall score (0-100)
- **Implementation Complexity**: Easy (GTM), Medium (WordPress), Difficult (Custom)
- **Timeline Estimates**: 30 min (GTM) → 8 hours (complex custom)
- **Sample Article URLs**: 3 real URLs for testing
- **Risk Warnings**: Low confidence, structural issues, competitor conflicts
- **Automatic Logging**: All analyses tracked in Google Sheets

**Granny's Enhancement**:
- **Orchestrates** `/onboard` at the right time (pre-kickoff, post-redesign, deployment verification)
- **Interprets** technical results in context of business goals and timing
- **Detects Gaps** `/onboard` doesn't cover (site crawler, health check, sport-specific intelligence)
- **Combines** technical intel with contextual, business, and temporal intelligence
- **Provides** deployment strategy and prioritization guidance

**Additional Technical Discovery**:
- Analytics setup (GA4, Chartbeat, etc.) - manual observation
- Ad server configuration (GAM, header bidding) - manual observation
- Existing affiliate networks - `/onboard` + manual
- Site structure patterns - future: automated crawler

**Deployment Readiness**:
- Integration complexity score (from `/onboard`)
- Risk factors and mitigations (from `/onboard` + context)
- Recommended placement strategy (orchestrated)
- Expected performance impact (from `/onboard`)

**Value**: Automates onboarding from 2-3 weeks → 3 days (leveraging existing `/onboard` system)

---

### 4. **Temporal Intelligence** (What's Next)

**Predictive Context**:
- **Sports**: Upcoming rivalry games, playoff schedules, off-season events
- **Retail**: Holiday calendar, sale events (Prime Day, Black Friday)
- **Seasonal**: Weather-driven trends, back-to-school, summer
- **Content**: Editorial calendar, planned campaigns, product launches

**Opportunity Windows**:
- High-traffic events (championship games)
- High-intent moments (gift-buying season)
- Audience expansion (viral content moments)
- Competitive moves (when to double down)

**Proactive Recommendations**:
```
Granny Alert (3 days before Ohio State vs. Michigan):
"🔔 Rivalry Week Incoming: Ohio State vs. Michigan (Nov 30)
• Expected traffic spike: +250% on game week
• Recommendation: Switch to 'Beat Michigan' product feed
• Estimated revenue lift: +$5K for the week
• Action: Approve to auto-switch on Monday"
```

**Value**: Maximizes revenue during peak moments, no manual intervention needed

---

## Unified Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRANNY - Publisher Intelligence               │
│         "Like a superfan + insider combined"                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ CONTEXTUAL    │   │ BUSINESS         │   │ TECHNICAL        │
│ INTELLIGENCE  │   │ INTELLIGENCE     │   │ INTELLIGENCE     │
│               │   │                  │   │                  │
│ • Sports      │   │ • Revenue Model  │   │ • Tech Stack     │
│ • Seasonal    │   │ • Market Position│   │ • Site Structure │
│ • Cultural    │   │ • Segmentation   │   │ • Deployment     │
│ • Emotional   │   │ • Forecasting    │   │ • Performance    │
└───────────────┘   └──────────────────┘   └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ TEMPORAL         │
                    │ INTELLIGENCE     │
                    │                  │
                    │ • What's Next    │
                    │ • Predictions    │
                    │ • Opportunities  │
                    │ • Proactive Recs │
                    └──────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ SALLY         │   │ TAKA             │   │ OCCY             │
│ (Products)    │   │ (Deployment)     │   │ (Monetization)   │
│               │   │                  │   │                  │
│ Search with   │   │ Place widgets    │   │ Optimize with    │
│ context       │   │ dynamically      │   │ business goals   │
└───────────────┘   └──────────────────┘   └──────────────────┘
```

---

## Granny Knowledge Base

### Publisher Profiles

```yaml
publisher_profile:
  domain: "on3.com"
  
  business_intelligence:
    vertical: "college_sports"
    segment: "growth"
    monthly_pageviews: 45000000
    revenue_model: ["programmatic", "subscriptions", "affiliate"]
    current_rpm: 8.50
    target_rpm: 10.00
    
    market_position:
      competitive_set: ["247sports.com", "rivals.com"]
      unique_value: "NIL coverage, recruiting intelligence"
      brand_strength: "high"
      
    priorities:
      - "Grow affiliate revenue (+40%)"
      - "Maintain ad viewability (>70%)"
      - "Improve mobile monetization"
  
  contextual_intelligence:
    primary_sport: "college_football"
    team_coverage:
      - team: "ohio_state_buckeyes"
        path: "/teams/ohio-state-buckeyes/news"
        fanbase_size: "massive"
        emotional_intensity: "extreme"
        
      - team: "michigan_wolverines"
        path: "/teams/michigan-wolverines/news"
        fanbase_size: "massive"
        emotional_intensity: "extreme"
    
    rivalries:
      - teams: ["ohio_state", "michigan"]
        game_date: "2025-11-29"
        significance: "The Game - biggest rivalry in sports"
        expected_traffic_spike: 3.5x
        
      - teams: ["alabama", "auburn"]
        game_date: "2025-11-29"
        significance: "Iron Bowl"
        expected_traffic_spike: 4.0x
    
    seasonal_calendar:
      football_season: "Sep 1 - Jan 15"
      signing_day: "Feb 5, Dec 18"
      spring_practice: "Mar 1 - Apr 15"
      transfer_portal: "Dec 1 - Jan 15"
      
    current_context:
      week: "rivalry_week"
      playoff_implications: "high"
      championship_races: ["Big Ten", "SEC"]
      emotional_state: "peak_intensity"
  
  technical_intelligence:
    cms: "wordpress"
    analytics: ["GA4", "Chartbeat"]
    ad_server: "GAM"
    
    injection_points:
      - location: "end_of_article"
        selector: "div.entry-content"
        widget: "SmartScroll"
        priority: 1
        viewability: 0.85
        
      - location: "mid_article"
        selector: "p:nth-of-type(6)"
        widget: "TopShelf"
        priority: 2
        viewability: 0.78
    
    performance:
      lighthouse_score: 78
      mobile_traffic: 0.68
      avg_page_load: 2.4
  
  temporal_intelligence:
    next_big_moments:
      - event: "Ohio State vs Michigan"
        date: "2025-11-29"
        expected_spike: "3.5x traffic"
        opportunity: "rivalry_merchandise"
        action: "Switch to rivalry feed 3 days before"
        
      - event: "College Football Playoff"
        date: "2025-12-31"
        expected_spike: "2.8x traffic"
        opportunity: "championship_celebration"
        action: "Prepare team-specific championship feeds"
        
      - event: "National Signing Day"
        date: "2026-02-05"
        expected_spike: "2.2x traffic"
        opportunity: "fan_gear"
        action: "Team pride merchandise"
```

---

## Granny in Action

### Example 1: Ohio State Championship Win

**Context Detection** (real-time):
```
ESPN API: Ohio State defeats Oregon 45-38 (Big Ten Championship)
→ Granny detects: Championship victory
→ Emotional state: CELEBRATION
→ Timing: Within 2 hours of win
```

**Granny Decision**:
```yaml
recommendation:
  action: "switch_product_feed"
  target: "/teams/ohio-state-buckeyes/news"
  old_search: "Ohio State Buckeyes Football"
  new_search: "Ohio State Big Ten Champions 2024"
  duration: "72 hours"
  expected_ctr_lift: "2.5x"
  reasoning: "Capitalize on celebration emotion window"
```

**Result**: 
- CTR: 4.2% (vs. 1.8% baseline) = **2.3x lift**
- Revenue: +$4,200 over 3 days
- No manual intervention required

---

### Example 2: New Publisher Onboarding (brit.co)

**Day 1: Deal Signed**

**Granny Auto-Discovery** (30 minutes):
```yaml
publisher: "brit.co"

business_intelligence:
  vertical: "lifestyle_women"
  monthly_pageviews: 8000000
  audience_demo: "women_25_44"
  revenue_model: ["programmatic", "affiliate", "sponsored"]
  current_rpm: 6.80
  
contextual_intelligence:
  seasonal_peaks: ["Q4_holidays", "back_to_school", "spring_refresh"]
  content_categories: ["home_decor", "beauty", "DIY", "recipes"]
  trending_now: "holiday_decor_2024"
  
technical_intelligence:
  cms: "wordpress"
  ad_server: "GAM"
  readiness_score: 87/100
  recommended_placement: "end_of_article SmartScroll"
  
temporal_intelligence:
  next_opportunity: "Black Friday (Nov 29) - 15 days away"
  recommended_categories: ["home_decor", "beauty_gifts", "kitchen"]
```

**Granny Recommendations**:
```
1. Deploy Phase 1 by Nov 20 (before Black Friday)
2. Focus on home decor + beauty (highest AOV for audience)
3. Expected RPM lift: +$0.45 (+6.6%)
4. Estimated Q4 revenue: $24K
```

**Day 2: Kickoff Call** (with full context already prepared)

**Day 3: Implementation** (pre-validated plan)

---

### Example 3: Proactive Opportunity Alert

**Granny Monitoring** (continuous):
```
Date: Nov 20, 2025
Publisher: on3.com
Context: 9 days until Ohio State vs. Michigan

Granny Alert:
🔔 High-Value Opportunity Detected

Event: Ohio State vs. Michigan (Nov 29)
Traffic Forecast: 3.5x baseline (420K visits expected)
Current Feed: "Ohio State Buckeyes Football" (generic)

Recommendation: Switch to Rivalry Feed
Proposed Search: "Ohio State vs Michigan Rivalry Gear"
Switch Date: Nov 26 (3 days before game)
Revert Date: Dec 2 (3 days after game)

Expected Impact:
• CTR: 3.8% (vs. 1.6% baseline) = +137%
• Revenue Lift: +$8,200 for rivalry week
• Risk: Low (tested pattern)

Action Required: None (auto-approve enabled)
Override: Reply "HOLD" to prevent switch
```

---

## Granny Slack Interface

### Commands

```bash
# Publisher intelligence
/granny profile <domain>
→ Complete publisher intelligence overview

/granny context <domain>
→ What's happening NOW (events, seasonality, trends)

/granny next <domain>
→ What's coming up (opportunities, risks, calendar)

/granny pulse <domain>
→ Real-time pulse check (traffic, engagement, revenue)

# Technical Discovery & Onboarding
/granny onboard <domain>
→ Orchestrates /onboard system + adds strategic context

/granny technical <domain>
→ Technical-only analysis (uses /onboard)

/granny recommend placements <domain>
→ Placement strategy with screenshots

# Note: /onboard can still be used directly for quick technical checks
# Granny adds holistic context and strategic guidance

# Strategic intelligence
/granny compare <domain1> <domain2>
→ Side-by-side publisher comparison

/granny forecast <domain>
→ Revenue forecast with opportunity calendar

/granny priorities
→ Which publishers to focus on this quarter

# Contextual alerts
/granny alerts <domain>
→ Upcoming high-value moments

/granny rivals <team>
→ Rivalry calendar and traffic forecasts

/granny seasonal <vertical>
→ Seasonal calendar for vertical
```

### Natural Language

```
@Granny what's the vibe at ON3 right now?
→ "Rivalry week intensity. Ohio State vs Michigan in 3 days. 
   Traffic up 45% already. Fans are locked in. Perfect time for rivalry merch."

@Granny should we onboard Swimming World or US Weekly first?
→ "US Weekly. 3x the traffic, proven vertical, Q4 holiday timing. 
   Swimming World can wait until Jan (off-season lull)."

@Granny when is brit.co's next big moment?
→ "Black Friday (Nov 29) - 9 days away. Home decor and beauty categories 
   will spike. Deploy Phase 1 by Nov 24 to capture it."
```

---

## Integration with Other Agents

```
Granny (Intelligence) → Sally (Product Discovery)
"It's rivalry week (Ohio State vs Michigan), emotional state = INTENSE"
→ Sally searches for "Beat Michigan merchandise" instead of generic

Granny (Intelligence) → Taka (Deployment)
"Traffic spike incoming (3 days), switch placement priority to mobile"
→ Taka optimizes mobile widget placement

Granny (Intelligence) → Occy (Monetization)
"Championship win detected, capitalize on celebration window (72 hours)"
→ Occy increases product density and prioritizes celebration items

Granny (Intelligence) → Andy (Analytics)
"Compare performance during rivalry week vs. normal week"
→ Andy generates comparative lift analysis
```

---

## Success Metrics

### Publisher Understanding
- **Discovery Speed**: 30 minutes vs. 5-7 days (10-20x faster)
- **Completeness**: 95% automated vs. 60% manual
- **Accuracy**: Context detection accuracy >90%

### Business Impact
- **Contextual CTR Lift**: 2-3x during high-context moments
- **Revenue Lift**: +15-40% during opportunity windows
- **Onboarding Speed**: 3 days vs. 14-21 days (5-7x faster)
- **CS Efficiency**: 80% reduction in manual discovery work

### Proactive Intelligence
- **Opportunity Detection**: 100% of major events detected 3+ days ahead
- **Alert Relevance**: >85% of alerts result in action
- **Auto-Optimization**: 70% of optimizations require zero human intervention

---

## Implementation Priorities

### Phase 1: Core Intelligence (Weeks 1-2)
- [ ] Publisher profile schema and storage
- [ ] Business intelligence module (segmentation, forecasting)
- [ ] Technical discovery automation (tech stack, site structure)

### Phase 2: Contextual Intelligence (Weeks 3-4)
- [ ] Sports context engine (ESPN API integration)
- [ ] Seasonal calendar system
- [ ] Real-time event detection

### Phase 3: Temporal Intelligence (Weeks 5-6)
- [ ] Opportunity prediction engine
- [ ] Proactive alert system
- [ ] Auto-optimization framework

### Phase 4: Slack Integration (Weeks 7-8)
- [ ] `/granny` command suite
- [ ] Natural language interface
- [ ] Alert delivery system

### Phase 5: Advanced Features (Weeks 9-10)
- [ ] Multi-publisher comparative analysis
- [ ] Market trend detection
- [ ] Automated strategic recommendations

---

## The Granny Difference

**Before Granny**:
- Manual discovery takes 2 weeks per publisher
- Static product feeds (same search all year)
- Missed revenue opportunities (championships, rivalries, seasons)
- Subjective prioritization decisions
- Reactive to problems

**With Granny**:
- Automated discovery in 30 minutes
- Dynamic feeds that match the moment
- Proactive opportunity capture
- Data-driven prioritization
- Predictive and proactive

**Granny = The pulse of every publisher's business**

Just like Granny Grannis knew when the waves were perfect and the moment was right, Granny the agent knows when the context is perfect and the moment is right for maximum engagement and revenue.

🏄 **Wisdom + Timing + Pulse = Granny**

