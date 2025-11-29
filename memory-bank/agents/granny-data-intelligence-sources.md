# Granny Data Intelligence Sources

## 🎯 Overview

Based on Mula's existing SDK infrastructure, operational workflows, and customer success playbooks, here are **high-value data sources** that Granny could access to dramatically improve onboarding and customer success strategies.

---

## 📊 Data Sources We Already Have Access To

### 1. **Mula SDK Event Data (S3 + Athena)**

**What It Contains:**
- Widget view events (impressions, time-in-view)
- Click events (product clicks, outbound traffic)
- Scroll depth and engagement metrics
- Session data and user behavior
- Page-level performance metrics

**How Granny Could Use It:**

#### Onboarding Intelligence:
```
✅ "ON3's SmartScroll widgets have 2.3x higher CTR on team pages vs. general news"
✅ "EssentiallySports gets 85% of engagement on mobile - prioritize mobile placement"
✅ "Average time-in-view is 8.2 seconds - increase product density recommendation"
```

#### Customer Success Triggers:
```
⚠️ "CTR dropped 40% this week on /nfl/* pages - investigate targeting"
📈 "Boxing content shows 3x engagement vs. baseline - expand boxing inventory"
🎯 "Users scroll past widget 67% of time - recommend above-the-fold placement"
```

**Queries Granny Could Run:**
```sql
-- Top performing URL patterns
SELECT 
  url_pattern,
  SUM(views) as total_views,
  SUM(clicks) as total_clicks,
  ROUND(100.0 * SUM(clicks) / SUM(views), 2) as ctr
FROM mula_events
WHERE domain = 'essentiallysports.com'
  AND event_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY url_pattern
ORDER BY ctr DESC
LIMIT 10;

-- Engagement by device type
SELECT 
  device_type,
  AVG(time_in_view_seconds) as avg_time,
  COUNT(*) as sessions
FROM mula_events
WHERE domain = 'on3.com'
GROUP BY device_type;

-- Best performing times/days
SELECT 
  EXTRACT(DOW FROM event_timestamp) as day_of_week,
  EXTRACT(HOUR FROM event_timestamp) as hour,
  AVG(ctr) as avg_ctr
FROM mula_events
GROUP BY day_of_week, hour
ORDER BY avg_ctr DESC;
```

---

### 2. **Revenue Data (RevenueEvent Table)**

**What It Contains:**
- Impact API revenue events (clicks, conversions, revenue amounts)
- SubID attribution (subid1: mula, subid2: session_id, subid3: team/section)
- Campaign performance data
- Device, geographic, and temporal data
- Amazon Associates revenue (if integrated)

**How Granny Could Use It:**

#### Revenue Intelligence:
```
💰 "ON3 Ohio State pages generate $2.3K/month - 3x higher than average team page"
💰 "Boxing content drives $45 RPM vs. $12 site average - expand boxing targeting"
💰 "Mobile users convert at 2.1x desktop rate - prioritize mobile optimization"
```

#### Strategic Recommendations:
```
📊 "Top 3 revenue-generating URL patterns: /ohio-state/*, /michigan/*, /alabama/*"
📊 "SubID3 'rivalry-week' generates 4x normal revenue - automate rivalry detection"
📊 "Revenue peaks 2-3 days after major sports events - predictive targeting opportunity"
```

**Queries Granny Could Run:**
```sql
-- Revenue by URL pattern (using subid3)
SELECT 
  subid3 as url_section,
  SUM(revenue_amount) as total_revenue,
  COUNT(*) as conversion_count,
  AVG(revenue_amount) as avg_order_value
FROM revenue_events
WHERE domain = 'on3.com'
  AND platform = 'impact'
  AND revenue_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY subid3
ORDER BY total_revenue DESC;

-- Revenue by sport/category
SELECT 
  sport_category,
  SUM(revenue_amount) as revenue,
  COUNT(DISTINCT session_id) as unique_sessions,
  SUM(revenue_amount) / COUNT(DISTINCT session_id) as revenue_per_session
FROM revenue_events
GROUP BY sport_category
ORDER BY revenue DESC;

-- Best performing days (for seasonal insights)
SELECT 
  revenue_date,
  SUM(revenue_amount) as daily_revenue,
  -- Detect spikes (>2x average)
  CASE WHEN SUM(revenue_amount) > (AVG(SUM(revenue_amount)) OVER () * 2)
       THEN 'SPIKE'
       ELSE 'NORMAL' END as performance
FROM revenue_events
WHERE domain = 'essentiallysports.com'
GROUP BY revenue_date
ORDER BY daily_revenue DESC;
```

---

### 3. **Domain Channel Mappings (Postgres)**

**What It Contains:**
- Active publishers and their configuration
- Channel assignments (Slack channels, team ownership)
- Deployment status and dates
- Widget types deployed (SmartScroll, TopShelf)
- Platform targeting (Desktop, Mobile)
- KVP enabled status
- Goal RPM/RPS targets

**How Granny Could Use It:**

#### Onboarding Context:
```
✅ "ON3 deployed 90 days ago, has SmartScroll on Desktop + Mobile, KVP enabled"
✅ "Goal RPM: $3.00, Current: $2.40 - 80% of target, needs optimization"
✅ "Similar publisher (TWSN) achieved goal in 60 days with these patterns: ..."
```

#### Benchmarking & Recommendations:
```
📊 "Publishers with KVP enabled see 1.8x higher RPM vs. non-KVP"
📊 "SmartScroll + TopShelf combo drives 2.3x more revenue than SmartScroll alone"
📊 "Mobile-first deployments reach target RPM 40% faster than desktop-only"
```

**Queries Granny Could Run:**
```sql
-- Publisher cohort analysis
SELECT 
  stage,
  COUNT(*) as publisher_count,
  AVG(EXTRACT(DAY FROM CURRENT_DATE - launch_date)) as avg_days_since_launch,
  AVG(goal_rpm) as avg_goal_rpm
FROM domain_channel_mappings
WHERE type = 'Publisher'
GROUP BY stage;

-- Similar publisher lookup
SELECT 
  domain,
  stage,
  widgets,
  launch_date,
  goal_rpm
FROM domain_channel_mappings
WHERE segment = (SELECT segment FROM domain_channel_mappings WHERE domain = 'on3.com')
  AND stage IN ('Live', 'Pilot Live')
  AND domain != 'on3.com'
ORDER BY launch_date DESC;

-- Feature adoption correlation
SELECT 
  kvp_enabled,
  widgets,
  AVG(goal_rpm) as avg_rpm_goal,
  COUNT(*) as publisher_count
FROM domain_channel_mappings
WHERE stage IN ('Live', 'Pilot Live')
GROUP BY kvp_enabled, widgets;
```

---

### 4. **Search Phrases & Product Performance (Postgres)**

**What It Contains:**
- Active search phrases per domain/URL pattern
- Product performance metrics (views, clicks, engagement)
- Search strategy history (LLM-generated keywords)
- Editorial feedback on products (Slack approvals/rejections)
- Category and taxonomy mappings

**How Granny Could Use It:**

#### Content-to-Product Matching:
```
🎯 "Current search: 'NFL merchandise' - Generic. Recommend: 'Ohio State Buckeyes championship gear'"
🎯 "Boxing content uses 'boxing gear' - Low CTR. Test: 'professional boxing gloves'"
🎯 "Tennis pages have no active searches - Opportunity to add 'tennis equipment'"
```

#### Product Optimization:
```
📈 "Top performing search phrase: 'rivalry merchandise' - 4.2% CTR"
📉 "Worst performing: 'general sports gear' - 0.8% CTR - replace with specific terms"
🔄 "Fashion category gets 2x clicks vs. equipment - rebalance product mix"
```

**Queries Granny Could Run:**
```sql
-- Search phrase performance
SELECT 
  search_phrase,
  url_pattern,
  total_views,
  total_clicks,
  ROUND(100.0 * total_clicks / total_views, 2) as ctr,
  last_updated
FROM search_phrases
WHERE domain = 'essentiallysports.com'
ORDER BY ctr DESC;

-- Underperforming patterns (no search)
SELECT 
  t.url_pattern,
  t.traffic_estimate,
  COALESCE(s.search_phrase, 'NO SEARCH CONFIGURED') as status
FROM traffic_patterns t
LEFT JOIN search_phrases s ON t.url_pattern = s.url_pattern
WHERE t.domain = 'on3.com'
  AND s.search_phrase IS NULL;

-- Editorial feedback patterns
SELECT 
  product_category,
  COUNT(CASE WHEN feedback = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN feedback = 'rejected' THEN 1 END) as rejected,
  ROUND(100.0 * COUNT(CASE WHEN feedback = 'approved' THEN 1 END) / COUNT(*), 1) as approval_rate
FROM product_feedback
WHERE domain = 'bleacherreport.com'
GROUP BY product_category
ORDER BY approval_rate DESC;
```

---

### 5. **Site Targeting Rules (Postgres)**

**What It Contains:**
- Active targeting rules (path, search phrase, status)
- Rule creation dates and history
- Rule performance (if linked to events)
- Disabled/paused rules

**How Granny Could Use It:**

#### Configuration Audit:
```
⚠️ "12 targeting rules created, only 5 active - investigate 7 disabled rules"
⚠️ "Rule '/nfl/*' hasn't been updated in 120 days - may be stale"
✅ "8/10 rules created within 30 days - good ongoing optimization"
```

#### Gap Detection:
```
🔴 "High-traffic pattern '/boxing-news/*' has no targeting rule - missing revenue"
🔴 "Rule '/old-category/*' targets deprecated URL structure - needs update"
🟡 "3 rules target same URL pattern with different searches - consolidation opportunity"
```

**Queries Granny Could Run:**
```sql
-- Active vs. inactive rules
SELECT 
  domain,
  COUNT(*) as total_rules,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_rules,
  SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_rules
FROM site_targeting_rules
GROUP BY domain;

-- Stale rules (not updated in 90 days)
SELECT 
  domain,
  path_pattern,
  search_phrase,
  last_updated,
  EXTRACT(DAY FROM CURRENT_DATE - last_updated) as days_stale
FROM site_targeting_rules
WHERE last_updated < CURRENT_DATE - INTERVAL '90 days'
  AND status = 'active'
ORDER BY days_stale DESC;

-- Duplicate pattern detection
SELECT 
  domain,
  path_pattern,
  COUNT(*) as rule_count,
  STRING_AGG(search_phrase, ' | ') as all_searches
FROM site_targeting_rules
WHERE status = 'active'
GROUP BY domain, path_pattern
HAVING COUNT(*) > 1;
```

---

### 6. **Bull Queue Jobs (Redis)**

**What It Contains:**
- Worker job history (completed, failed, active)
- Job types (performanceReport, engagementReport, searchWorker, etc.)
- Job duration and retry counts
- Error messages and stack traces

**How Granny Could Use It:**

#### System Health Monitoring:
```
⚠️ "searchWorker failing 40% of time for domain X - investigate API issues"
⚠️ "performanceReport jobs taking 3x longer than normal - system degradation"
✅ "All jobs completing successfully, avg duration 12 seconds - healthy"
```

#### Operational Insights:
```
📊 "Domain X runs 8 reports/day - high engagement, likely active pilot"
📊 "No jobs run for Domain Y in 14 days - potential churn risk"
📊 "searchWorker retries increased 200% this week - upstream API issue"
```

---

### 7. **MulaOS Google Sheets (Account & Project Data)**

**What It Contains:**
- Publisher account details (segment, stage, launch date)
- Project tracking (initiatives, status, timeline)
- Contact information (decision makers, technical contacts)
- Notes and relationship history
- Pipeline and deal stages

**How Granny Could Use It:**

#### Account Context:
```
🏢 "EssentiallySports: Tier 2 publisher, Pilot Live stage, launched 45 days ago"
🏢 "Technical contact: John (CTO), prefers Slack, responsive within 4 hours"
🏢 "Related projects: 'Mobile optimization', 'Revenue lift analysis'"
```

#### Relationship Intelligence:
```
📧 "Last contact: 3 days ago via Slack - asking about mobile performance"
📧 "Decision maker: Sarah (VP Revenue) - needs quarterly ROI reports"
📧 "Stage: Pilot → Paid conversion expected in 30 days"
```

**Integration Approach:**
- Read Google Sheets via Sheets API
- Cache account data in Granny's memory
- Refresh on each analysis or via webhook

---

## 🚀 High-Impact Use Cases

### Use Case 1: **Intelligent Onboarding Acceleration**

**Data Sources:** SDK Events + Domain Mappings + Site Targeting

**Granny's Intelligence:**
```
📊 ANALYSIS: New Publisher XYZ
  
  Similar Publishers:
  - ABC: Reached $3 RPM in 60 days with these patterns
  - DEF: 2.4x CTR on mobile-first deployment
  
  Recommended First Actions:
  1. Deploy to mobile first (similar pubs see 40% faster TTFV)
  2. Start with top 3 traffic patterns: /nfl/*, /nba/*, /boxing/*
  3. Enable KVP (1.8x RPM lift for similar publishers)
  
  Expected Timeline:
  - Week 1-2: Tags live, first widget deployed
  - Week 3-4: Baseline metrics established ($0.50-$1.00 RPM expected)
  - Week 5-8: Optimization phase, expect 2x RPM lift
  - Week 9-12: Goal RPM ($3.00) achievable based on similar cohort
```

### Use Case 2: **Proactive Churn Prevention**

**Data Sources:** SDK Events + Revenue Data + Bull Queue Jobs

**Granny's Alerts:**
```
🔴 ALERT: High Churn Risk - EssentiallySports

  Warning Signs:
  - CTR dropped 45% over 14 days
  - No targeting updates in 30 days
  - Last Slack message unanswered for 7 days
  - RPM trending below goal ($1.80 vs. $3.00 target)
  
  Recommended Actions:
  1. Schedule check-in call within 48 hours
  2. Run performance audit to identify issues
  3. Propose 3 quick-win optimizations:
     - Update stale search phrases
     - Add missed URL patterns
     - Test mobile placement adjustments
  
  Recovery Playbook:
  - Week 1: Identify and fix root cause
  - Week 2: Deploy optimizations, monitor closely
  - Week 3: Review results, celebrate wins
```

### Use Case 3: **Automated Optimization Recommendations**

**Data Sources:** SDK Events + Revenue Data + Search Phrases

**Granny's Weekly Report:**
```
📈 OPTIMIZATION OPPORTUNITIES - ON3

  🏆 Quick Wins (high impact, low effort):
  1. Add targeting to /michigan-football/* (500K monthly views, NO TARGETING)
     Expected lift: +$800/month
     
  2. Update search phrase on /ohio-state/*
     Current: "Ohio State merchandise" (1.2% CTR)
     Recommended: "Ohio State Buckeyes championship gear" (3.8% CTR in similar content)
     Expected lift: +3.1x CTR
     
  3. Expand boxing content targeting
     Current: 5 boxing pages targeted
     Opportunity: 42 additional boxing pages (250K views/month)
     Expected lift: +$450/month
  
  📊 Performance Insights:
  - Rivalry week (Nov 20-27) drove 4.2x normal revenue
  - Mobile users convert at 2.3x desktop rate
  - Best performing time: Sat/Sun 12-6pm ET
  
  🎯 Recommended Actions:
  - Deploy 3 quick wins above (Est. time: 30 minutes)
  - Schedule call to discuss rivalry-week automation
  - Test mobile-first placement on high-traffic pages
```

### Use Case 4: **Data-Driven Onboarding Playbook**

**Data Sources:** Domain Mappings + SDK Events + Revenue Data

**Granny's Cohort Analysis:**
```
📊 COHORT INSIGHTS: Tier 2 Publishers

  Success Pattern (Publishers reaching goal RPM in <90 days):
  ✅ 85% deployed mobile-first
  ✅ 92% enabled KVP within first 30 days
  ✅ 78% had 8+ targeting rules active by day 30
  ✅ 100% ran weekly performance reviews
  
  Failure Pattern (Publishers churned or underperforming):
  ❌ 65% deployed desktop-only initially
  ❌ 58% waited >45 days to enable KVP
  ❌ 71% had <5 targeting rules after 60 days
  ❌ 83% had gaps >14 days with no contact
  
  Recommended Onboarding Playbook:
  Week 1: Tags live + mobile deployment + KVP enabled
  Week 2: 3-5 targeting rules deployed (top traffic patterns)
  Week 3: Performance baseline review call
  Week 4: Add 3-5 more rules, optimize underperformers
  Week 5-8: Weekly Slack check-ins, monthly deep-dive calls
```

---

## 🔧 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Connect Granny to Postgres (domain mappings, search phrases, targeting rules)
- [ ] Build query library for common intelligence patterns
- [ ] Create data caching layer (1-hour TTL)
- [ ] Add data freshness indicators

### Phase 2: Event Data Integration (Week 3-4)
- [ ] Connect to Athena for SDK event queries
- [ ] Build aggregation queries (CTR, engagement, traffic patterns)
- [ ] Create anomaly detection (spikes, drops, trends)
- [ ] Add historical comparison (week-over-week, month-over-month)

### Phase 3: Revenue Intelligence (Week 5-6)
- [ ] Integrate Revenue Event data
- [ ] Build RPM/RPS calculators
- [ ] Create revenue attribution by URL pattern
- [ ] Add conversion funnel analysis

### Phase 4: Predictive Intelligence (Week 7-8)
- [ ] Cohort analysis engine (similar publisher lookups)
- [ ] Churn risk scoring
- [ ] Opportunity scoring (revenue potential calculations)
- [ ] Success pattern detection

### Phase 5: Automation (Week 9-10)
- [ ] Automated weekly reports per publisher
- [ ] Proactive alert system (Slack notifications)
- [ ] Auto-generate optimization recommendations
- [ ] Schedule-based analysis (daily/weekly/monthly)

---

## 💡 Key Insights

**What Makes This Powerful:**

1. **Real Data, Not Guesses**: Every recommendation backed by actual performance metrics
2. **Contextual Intelligence**: Understands each publisher's unique situation
3. **Predictive Capabilities**: Learns from cohort patterns to forecast outcomes
4. **Actionable Insights**: Not just "what" but "why" and "how to fix"
5. **Continuous Learning**: Gets smarter as more publishers deploy

**Business Impact:**

- **Faster Onboarding**: Data-driven playbooks reduce TTFV by 40-60%
- **Higher Retention**: Proactive churn prevention catches issues early
- **Revenue Optimization**: Automated recommendations increase RPM by 2-3x
- **Scalable CS**: Intelligence scales without adding CS headcount

---

**Status:** 🎯 Ready to Build  
**Estimated Effort:** 8-10 weeks for full implementation  
**Priority:** 🔴 High - Directly impacts CS efficiency and publisher success

