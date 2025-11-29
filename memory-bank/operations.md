# Operations & Customer Success

## Overview

Mula's Customer Success (CS) function is a strategic growth lever that accelerates time to value, validates product-market fit, and builds repeatable engagement patterns. At this stage, CS is not just support—it's a feedback engine that converts pilot interactions into product insights and proof points.

**Core Philosophy**:
- Deliver the **first win fast**
- Unlock **repeatable value**  
- Capture **insight from friction**
- Build credibility with lightweight, high-signal workflows

---

## Objectives & Success Metrics

### Primary Objectives

| Objective | Description | Priority |
|-----------|-------------|----------|
| **Accelerate Time to Value** | Deliver first win quickly for pilot customers and document repeatable moments of value | High |
| **Validate Product Assumptions** | Use customer feedback to confirm or disprove PMF hypotheses | High |
| **Build Engagement Playbooks** | Test and refine onboarding, support, and activation workflows | High |
| **Reduce Friction** | Identify and remove bottlenecks in customer onboarding, reporting, or usage | Medium |
| **Generate Advocacy** | Turn early wins into case studies, referrals, and proof for future sales | Medium |

### Leading Indicators

- **Time to First Value (TTFV)**: Days from tag deployment to first measurable win
- **Customer Engagement Score**: Email responses, Slack interactions, calls attended
- **Feature Adoption**: Widget types deployed, reporting configured, targeting rules active
- **Onboarding Completion Rate**: % of pilots completing full setup checklist
- **Action Taken After Insight**: Content updated, modal optimized, new pages targeted

### Lagging Indicators

- **Pilot-to-Paid Conversion Rate**: % of pilots converting to paid contracts
- **Retention at 30/60/90 Days**: Active usage milestones
- **Publisher Revenue Lift**: Measurable increase in affiliate or programmatic revenue
- **Net Promoter Score (NPS)**: Qualitative satisfaction and referral likelihood

---

## Customer Lifecycle Phases

### 1. Pre-Onboarding

**Objectives**: Align expectations, confirm readiness, demonstrate value

**Activities**:
- **Intro Call & Value Framing**: Align on goals, timelines, expectations; share key value hypothesis
- **Tech Readiness Checklist**: 
  - Access to ad tags and monetization partners' reporting
  - Analytics platform access (GA4, Adobe, etc.)
  - Page structure documentation
  - Development team contact
- **[Mulaize Demo](https://app.makemula.ai/)**: Walk through live examples
- **Loom Demo**: Record and share personalized walkthrough for publisher team

**Deliverables**:
- Technical requirements document
- Timeline and milestones agreement
- Slack channel setup

---

### 2. Onboarding (Week 1-2)

**Objectives**: Deploy tags, configure reporting, achieve first widget live

**Activities**:
- **Kickoff Call**: Walk through value props, example modals, first integration step
- **Slack Kickoff Message**: 
  - Post structured intro to customer channel
  - Include: goals, expectations, next steps, resource links
- **Tag Deployment Milestone**:
  - Aim for tags live within X days
  - Tags won't display anything until QA complete (safe deployment)
  
**Deployment Verification**:
1. Navigate to publisher page with Mula tags
2. Open Chrome Developer Tools → Network tab
3. Look for `mula.js` (current version) to confirm tags loaded
4. Verify no console errors related to Mula

**Reporting Setup**:
- **Amazon Associates**: Request reporting access or API credentials
- **GAM (Google Ad Manager)**: Configure KVP (Key-Value Pair) `mula_in_view`
- **Impact API**: Obtain credentials for ON3/Fanatics integration

**Week 1-2 Checklist**:
- [ ] Kickoff call completed
- [ ] Slack channel active
- [ ] Tags deployed to staging
- [ ] Tags deployed to production
- [ ] Deployment verified (Chrome DevTools)
- [ ] First widget type selected (TopShelf or SmartScroll)
- [ ] First placement identified
- [ ] Reporting access configured
- [ ] First page "Mulaized" (product search initiated)

---

### 3. Activation (Week 2-4)

**Objectives**: Demonstrate value, establish insight loop, drive adoption

**Activities**:
- **Insight Loop Begins**: 
  - Share confirmation of results (scroll depth, revenue lift) within 48-72 hours post-launch
  - Builds trust that system is working
- **Weekly Wins**: 
  - Lightweight async updates focused on impact
  - Slack messages with key metrics
- **Rapid Experimentation**:
  - Test variations (trigger, timing, design)
  - Document outcomes for playbook

**Week 2-4 Deliverables**:
- First performance report (via `/mula-performance-report`)
- Widget placement optimization recommendations
- Additional pages identified for expansion
- Any friction points documented and addressed

---

### 4. Value Confirmation (Week 4-6)

**Objectives**: Prove lift, generate advocacy, expand deployment

**Activities**:
- **Results Debrief**: 
  - Walk through performance trends
  - Compare baseline vs. Mula-enabled metrics
  - Calculate incremental revenue estimate
- **Case Study Opportunity**:
  - Flag fit for public proof
  - Ask for permission to quote or collaborate on win story
- **Expansion Planning**:
  - Identify additional sections/verticals
  - Additional widget types (if only using one)
  - Site targeting rules for automation

**Week 4-6 Deliverables**:
- Formal results presentation
- ROI calculation and business case
- Expansion roadmap
- Case study draft (if applicable)

---

## Publisher Personas & User Stories

### Core Personas

| Persona | Role Focus | Key Motivators | Key Concerns |
|---------|------------|----------------|--------------|
| **Revenue Lead** | Monetization, RPMs, Affiliate Yield | Proving incremental revenue | Ad clutter, channel conflict, growth potential |
| **Product Manager** | Implementation, Testing, UX | Quick, clean deployment with low lift | Engineering time, site vitals, QA cycles |
| **Editor** | Content Quality, Audience Trust | Improved recirculation, high-quality experience | Editorial integrity, visual clutter |
| **Executive / GM** | Growth, Profit, Vision | Scalable solutions that unlock new upside | Time-to-value, strategic fit, partner risk |

### User Stories

**Revenue Lead**  
> "As a revenue lead, I want to see a clear lift in RPM or affiliate earnings within the first month, so I can justify a broader rollout."

→ **Needs**: Early benchmarks, UTM-structured proof, control vs. test, async dashboard

**Product Manager**  
> "As a product manager, I want a lightweight implementation that doesn't disrupt page speed or conflict with our ad stack."

→ **Needs**: Drop-in code, preflight checklist, low-dependency implementation

**Editor-in-Chief**  
> "As an editor, I want the product to feel native and enhance recirculation, not just add noise."

→ **Needs**: Visual mocks, audience insights, emphasis on quality and context

**Executive / GM**  
> "As an executive, I want to know if this can scale across multiple properties without heavy customization."

→ **Needs**: Pilot scorecard, expansion roadmap, 10x scalability plan

---

## Customer Discovery Framework

Use this framework to understand how potential customers navigate content creation, monetization, platform risk, and AI disruption.

### Publisher Profile
- Describe your audience, content focus, and team size?
- What are your primary revenue streams today (ads, subscriptions, affiliate, commerce, etc.)?
- What are your main traffic sources (e.g., search, social, direct, referral)?

### Content Strategy
- Are you trying to reduce reliance on SEO or social trends? If so, how?
- What formats (video, audio, interactive, newsletters, etc.) are you investing in?
- What are the biggest challenges you face in scaling personalized or multi-modal content?

### Monetization Partners
- Who are your current affiliate partners? Which platforms and brands convert best for your audience (e.g., highest RPM/RPS)?
- What % of your content is product-centric? Which categories do you write about most?
- Who are your current ad partners? Do you have an adhesion-unit on mobile that we can refresh when users are in our feed?

### Monetization Challenges
- Which monetization models are working best for you today—and which ones are underperforming?
- How are ad yields and affiliate performance trending?
- Are you seeing any signs of subscription fatigue or churn pressure?

---

## MulaBot Slack Commands Reference

### For Everyone (CS, Ops, Product)

#### Performance & Reporting

**Mula Reporting**
```
/mula-performance-report <domain1,domain2> <lookback_days>
```
Builds performance charts for one or more domains.

*Example*: `/mula-performance-report brit.co,defpen.com 7`

**Impact Reporting (ON3)**
```
/mula-impact-on3-subid-report <lookback_days>
```
Returns clicks, actions, revenue, and EPC grouped by Mula SubID.

*Example*: `/mula-impact-on3-subid-report 14`

---

### For Ops Only

#### Domain → Channel Mapping

Mapping determines where daily reporting gets delivered.

```
/mula-domain-channels-list
```
Shows every domain mapped to a Slack channel.

```
/mula-domain-channels-add <domain>
```
Creates a new mapping.  
*Example*: `/mula-domain-channels-add swimmingworldmagazine.com`

```
/mula-domain-channels-rm <domain>
```
Deletes an existing mapping.  
*Example*: `/mula-domain-channels-rm swimmingworldmagazine.com`

---

#### Site Targeting Commands

```
/mula-site-targeting-add <domain> <type> <match_value> "<search phrase>"
```
Adds a targeting rule and auto-creates (or links) the product feed, queued for approval.

*Example*: `/mula-site-targeting-add brit.co path_substring /beauty/ "skincare products"`

```
/mula-site-targeting-rm <domain> <rule_id>
```
Removes a targeting rule.

```
/mula-site-targeting-list <domain>
```
Lists active & deleted rules for a domain.

**Rule Types**:
- `path_substring` (default) – Simple URL substring match
- `url_regex` – Regex match for complex patterns
- `ldjson` – Schema-based matching (used for Brit commerce pages)

---

#### Human-in-the-Loop (HITL) Approval Workflow

**Process Flow**:

1. **"Carly Crawley"** (content analysis agent) scans page and posts suggested high-intent keywords to Slack
2. **Mulanaut** (CS/Ops team member) approves or rejects each keyword (max 3)
3. **"Sam Searcher"** (product search agent) queries Amazon Associates & Google Shopping with approved keywords
4. **Refined Rejection**: Reply with `"You must use these keywords: <list>"` (three or fewer) and Sam retries

**Best Practices**:
- Approve 1-3 most relevant keywords (not all suggestions)
- Consider search volume and product availability
- Think about user intent and page context
- Reject with specific guidance for better results

---

### Common Issues & Resolutions

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| Report fails | Domain unmapped or typo | Add with `/mula-domain-channels-add`, then rerun |
| "No mapping found" | Missing mapping | List all mappings, then add missing one |
| Slash command not recognized | Hidden characters | Re-type command directly in Slack |
| Auto-Mulizer flooding non-commerce pages | Auto logic ignores targeting | Add site-targeting rules or whitelist domains |

---

### Best Practices

- **Use top-level domains only**: `defpen.com`, *not* `www.defpen.com`
- **Verify mappings**: After any add/remove, run `/mula-domain-channels-list` to confirm
- **Reuse feeds**: Concentrate click-through data by reusing feeds across similar articles
- **Test before scaling**: Start with high-traffic pages to validate before expansion

---

## Core Metrics Glossary

### Traffic & Exposure

| Metric | Definition | Purpose | Insight |
|--------|------------|---------|---------|
| **tag_fires** | Number of times Mula tag successfully loaded on a page | Measures Mula's surface area and implementation footprint | If tag_fires ≫ widget_views, you've implemented everywhere but aren't surfacing widgets—check placement logic or targeting filters |
| **widget_views** | Number of times a Mula widget was visible in viewport | Reflects real visual exposure, not just technical load | If widget_views stagnate while page traffic grows, rethink widget positioning or lazy-load thresholds |
| **smartscroll_in_views** | Number of times SmartScroll unit was scrolled into view | Tracks deeper engagement and long-scroll monetization | If smartscroll_in_views ≪ widget_views, users aren't scrolling far enough—test "peek" teasers or adjust unit offset |

---

### Engagement

| Metric | Definition | Purpose | Insight |
|--------|------------|---------|---------|
| **feed_clicks** | Total clicks on product items inside Mula feed/widget | Indicates interest in surfaced products | If feed_clicks drop but widget_views hold steady, product thumbnails or CTAs need refresh |
| **store_clicks** | Total outbound clicks to merchant/affiliate destinations | Captures high-intent behavior for affiliate revenue | If store_clicks ≪ feed_clicks, check transition: ensure product pages load fast and affiliate links are prominent |
| **load_more_clicks** | Clicks on "Load More" within widget feeds | Signals appetite for additional product content | Rising load_more_clicks rate means deeper interest—consider infinite scroll or auto-load variants |

---

### Rates & Ratios

| Metric | Formula | Purpose | Insight |
|--------|---------|---------|---------|
| **mula_feed_click_rate** | feed_clicks / widget_views | CTR of the product feed | Low rate (< baseline) → optimize relevance or CTA prominence |
| **mula_store_click_rate** | store_clicks / widget_views | Conversion from exposure to affiliate action | Rising rate = strong product-purchase alignment; falling rate = friction in link/page |
| **feed_click_per_in_view_rate** | feed_clicks / smartscroll_in_views | CTR based on deep-scroll exposures | If ≫ mula_feed_click_rate, infinite feed is more engaging |
| **store_click_per_in_view_rate** | store_clicks / smartscroll_in_views | Affiliate conversion from deep-scroll exposures | If this lags, deep-scroll items may be lower value—rotate higher-margin products |
| **ad_view_per_page_view_rate** | ad_views / pageviews | Normalized ad-impression metric per pageview | Falling rate = ad slots may be empty—check demand, floor pricing |
| **store_click_per_page_view_rate** | store_clicks / pageviews | Efficiency of driving outbound clicks per pageview | Declining trend = weakening affiliate yield—test new merchant partnerships |

---

### Session Metrics

| Metric | Definition | Purpose | Insight |
|--------|------------|---------|---------|
| **median_ad_views_per_session** | Median number of Mula ad views in a user session | Session-level monetization density | If flat while session length grows, ads aren't loading on subsequent pages—verify tag persistence |
| **median_store_clicks_per_session** | Median number of affiliate clicks per user session | Typical conversion behavior per visit | If stays at zero for most sessions, focus on high-intent segments or personalize offers |

---

### Monetization Estimates

- **cpm_estimate**: Assumed average CPM for ad impressions served (used for modeling incremental ad revenue)
- **incremental_revenue_estimate**: Total estimated revenue (ads + affiliate) attributed to Mula units (top-level business impact metric)

---

## Sales Enablement Tools

### Query String Activation

Any page already running the Mula tag can launch the placement tester with:

```
?moola_activate_sales_enablements=1
```

**Use Case**: Quick Loom demos when bookmarklet is blocked

**How It Works**:
1. Add query string to any page URL
2. Sales Enablement Tool activates
3. Select widget type (TopShelf or SmartScroll)
4. Click any element on page to insert widget
5. Widget boots immediately with products

---

## Test Links (Live Examples)

### Production Deployments

1. **Brit + Co** (Beauty Vertical)  
   [https://www.brit.co/old-school-beauty-products/?htlbidqa=47562&mulaAuto=1](https://www.brit.co/old-school-beauty-products/?htlbidqa=47562&mulaAuto=1)

2. **On3 Ohio State** (Sports Vertical)  
   [https://www.on3.com/teams/ohio-state-buckeyes/news/ohio-state-buckeyes-football-dezie-jones-wide-receiver-black-stripe/](https://www.on3.com/teams/ohio-state-buckeyes/news/ohio-state-buckeyes-football-dezie-jones-wide-receiver-black-stripe/)

3. **On3 Michigan** (Sports Vertical)  
   [https://www.on3.com/teams/michigan-wolverines/news/michigan-wolverines-football-podcast-preview-and-predictions-for-oklahoma-game/](https://www.on3.com/teams/michigan-wolverines/news/michigan-wolverines-football-podcast-preview-and-predictions-for-oklahoma-game/)

4. **Swimming World** (Sports Vertical)  
   [https://www.swimmingworldmagazine.com/news/the-all-time-olympic-medals-by-country-united-states-owns-massive-lead/](https://www.swimmingworldmagazine.com/news/the-all-time-olympic-medals-by-country-united-states-owns-massive-lead/)

5. **Us Weekly** (Commerce)  
   [https://www.usmagazine.com/shopping/](https://www.usmagazine.com/shopping/)

---

## Known Gaps & Roadmap

### Current Limitations

- **Auto-Mulizer**: Should respect targeting filters or domain whitelist
- **Rising Article Trigger**: Log how often ≥100 views/hour trigger fires; surface counts in daily digest
- **Reporting Latency**: Some reports can take 30+ seconds; consider `--force` flag to skip cache

### Planned Improvements

- **Publisher Dashboard**: Web-based self-serve reporting (beyond Slack)
- **Automated Onboarding**: Reduce manual steps in tag deployment and verification
- **Proactive Alerts**: Slack notifications when performance degrades or opportunities arise
- **Expanded Platforms**: Additional affiliate networks beyond Amazon and Impact

---

## Internal Operations Best Practices

### Communication

- **Async-First**: Default to Slack messages vs. calls
- **Weekly Syncs**: 15-min check-in with each active pilot
- **Document Everything**: Slack threads are source of truth
- **Use @mentions**: Ensure visibility and accountability

### Escalation

- **Technical Issues**: Tag @logan for backend/infrastructure
- **Product Feedback**: Tag @product-team channel
- **Revenue Questions**: Tag @finance for attribution/billing
- **Partnership Changes**: Tag @partnerships for contract updates

### Knowledge Capture

- **Win Stories**: Document in #wins channel with metrics
- **Friction Points**: Log in #product-feedback with context
- **Feature Requests**: Create GitHub issue + link in Slack
- **Case Studies**: Draft in Google Docs, review with marketing

---

## Success Story Template

**Publisher**: [Name]  
**Vertical**: [e.g., Beauty, Sports, Lifestyle]  
**Challenge**: [What problem were they trying to solve?]  
**Solution**: [What did we deploy? TopShelf, SmartScroll, targeting rules?]  
**Results**:
- Metric 1: [e.g., 15% increase in RPM]
- Metric 2: [e.g., 2.3% CTR on product widgets]
- Metric 3: [e.g., $X incremental revenue in 30 days]

**Quote**: "[Publisher testimonial]" — [Name, Title]

**Lessons Learned**: [What worked well? What would we do differently?]

