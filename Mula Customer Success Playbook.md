## **📋 Summary**

Mula’s Customer Success function exists to accelerate time to value, drive product validation, and identify repeatable patterns for scalable customer engagement. At this stage, CSis not a support function, it's a strategic growth lever. Every interaction is an opportunity to uncover the customer’s definition of success, validate our product-market fit, and drive measurable outcomes like revenue lift and adoption. We’re focused on retention, expansion, and proof that:

* Deliver the **first win fast**  
* Unlocks **repeatable value**  
* Captures **insight from friction**  
* Builds credibility with lightweight, high-signal workflows

This playbook outlines key objectives, lifecycle stages, internal tooling, personas, user stories, and operational checklists that power Mula’s pilot success engine.

---

## **🚀 Overview**

Mula’s Customer Success (CS) function is designed to accelerate time to value, learn rapidly from pilot engagements, and lay the foundation for scalable growth. At this stage, CS is not just a service function — it is a strategic feedback engine that drives product validation and customer engagement. Each interaction is an opportunity to discover friction, generate insight, and convert anecdote into signal.

---

## **🎯 Objectives**

| Objective | Description | Priority |
| ----- | ----- | ----- |
| Accelerate Time to Value | Deliver first win quickly for pilot customers and document repeatable moments of value | High |
| Validate Product Assumptions | Use customer feedback to confirm or disprove PMF hypotheses | High |
| Build Engagement Playbooks | Test and refine onboarding, support, and activation workflows | High |
| Reduce Friction | Identify and remove bottlenecks in customer onboarding, reporting, or usage | Med |
| Generate Advocacy | Turn early wins into case studies, referrals, and proof for future sales | Med |

---

## **❓Customer Interviews Framework**

Use this to understand how potential customers are navigating content creation, monetization, platform risk, and AI disruption to inform product development, partnership opportunities, and monetization strategies.

### Publisher Profile

- Describe your audience, content focus, and team size?  
- What are your primary revenue streams today (ads, subscriptions, affiliate, commerce, etc.)?  
- What are your main traffic sources (e.g., search, social, direct, referral)?

### Content Strategy

- Are you trying to reduce reliance on SEO or social trends? If so, how?  
- What formats (video, audio, interactive, newsletters, etc.) are you investing in?  
- What are the biggest challenges you face in scaling personalized or multi-modal content?

### Monetization Partners

- Who are your current affiliate partners? Which platforms and brands convert best for your audience (e.g. highest RPM/RPS)?   
- What % of your content is product centric? Which categories do you write about most?  
- Who are your current ads partners? Do you have an adhesion-unit on mobile that we can refresh when users are in our feed?

### Monetization Challenges

- Which monetization models are working best for you today—and which ones are underperforming?  
- How are ad yields and affiliate performance trending?  
- Are you seeing any signs of subscription fatigue or churn pressure?

## **✅ Success metrics**

### **📈 Leading Indicators**

* Time to First Value (TTFV)  
* Customer engagement score (emails, Slack responses, calls attended)  
* Feature adoption across pilots  
* Onboarding completion rate  
* Action taken after insight delivery (e.g., content updated, modal optimized)

### **📉 Lagging Indicators**

* Pilot-to-paid conversion rate  
* Retention at 30/60/90 days  
* Publisher revenue lift (affiliate or programmatic)  
* Net Promoter Score (NPS) / qualitative satisfaction

---

## **🗺️ Phases & CS Motions**

### **1\. Pre-Onboarding**

* **Intro Call & Value Framing**:   
  * Align on goals, timelines, and expectations. Share key value hypothesis.  
* **Tech Readiness Checklist**:   
  * Access to ad tags, monetization partners’ reporting, analytics, page structure.  
* [Mulaize](https://app.makemula.ai/) demo pages, review products, send loom demo to pub

### **2\. Onboarding (Week 1–2)**

* **Kickoff Call**: Walk through value props, example modals, and first integration step.  
* Slack Kickoff Chat:   
  * Post structured intro message to customer channel with goals, expectations, next steps, and links to resources in the channel.  
* **Deployment Milestone**:   
  * Aim for tags live within “X” days or offer live within “X” days. Tags won’t display anything until we QA so pubs can deploy without fear.  
* Deployment confirmation \- Navigate to the publisher page with Mula tags. View the network tab in chrome developer tools. Look for [Mula.js (whatever version is currently being distributed)](https://docs.google.com/document/d/1UBRpjsx0n8cbDJt6Wf4N-JDyJZYI_4V7Rha2Ud13M-E/edit?tab=t.0) to confirm tags have been added.  
* **Reporting Setup**: Programmatic and affiliate revenue reporting configured  
  * Amazon Associates reporting access  
  * GAM or GAM KVP reporting configured  
  * Impact API credentials

### **3\. Activation (Week 2–4)**

* **Insight Loop Begins**:   
  * Share confirmation of results (scroll depth, revenue lift) within 48–72 hours post-launch. This builds trust that things are working.  
* **Weekly Wins**:   
  * Lightweight async updates and focused on showing impact.  
* **Rapid Experimentation**:   
  * Test variations (trigger, timing, design) and document outcomes.

### **4\. Value Confirmation (Week 4–6)**

* **Results Debrief**:   
  * Walk through performance trends.  
* **Case Study Opportunity**:   
  * Flag fit for public proof. Ask for permission to quote or collaborate on a win story.

---

## **🧰 Internal Tools**

MulaBot’s Slack interface lets Ops, CS, and Product teams:

* **Generate on-demand performance data**

* **Manage where that data is routed**

* **Create / edit page-level targeting rules**

* **Pull affiliate revenue straight from Impact**

---

### **🤖 MulaBot \- Everyone**

#### **Performance & Reporting Commands**

##### Mula Reporting

* **/mula-performance-report \<domain1,domain2\> \<lookback\_days\>** – Builds charts for one or more domains.  
  *  *Example*: /mula-performance-report [brit.co](http://brit.co),defpen.com 7

##### Impact Reporting (On3)

**/mula-impact-on3-subid-report \<lookback\_days\>** – Returns clicks, actions, revenue, and EPC grouped by Mula subid.

*Example: /mula-impact-on3-subid-report 14*

---

### **🤖 MulaBot \- Ops Only**

#### **Domain → Channel Mapping Commands: Mapping is how daily reporting gets delivered to the right Slack channel.**

* **/mula-domain-channels-list** – Shows every domain mapped to a Slack channel.

* **/mula-domain-channels-add \<domain\>** – Creates a new mapping.

   *Example: /mula-domain-channels-add swimmingworldmagazine.com*

* **/mula-domain-channels-rm \<domain\>** – Deletes an existing mapping.

   *Example: /mula-domain-channels-rm swimmingworldmagazine.com*

---

#### **Site-Targeting Commands**

* **/mula-site-targeting-add \<domain\> \<type\> \<match\_value\> "\<search phrase\>"** – Adds a rule and auto-creates (or links) the product feed, queued for approval.

* **/mula-site-targeting-rm \<domain\> \<rule\_id\>** – Removes the rule.

* **/mula-site-targeting-list \<domain\>** – Lists active & deleted rules.

**Rule types**:

* path\_substring (default) – simple URL substring match

* url\_regex – regex match for complex patterns

* ldjson – schema-based (used for Brit commerce pages)

---

#### Common Issues & Resolutions

| Issue | Likely Cause | Fix |
| ----- | ----- | ----- |
| Report fails | Domain unmapped or typo | Add with /mula-domain-channels-add, then rerun. |
| “No mapping found” | Missing mapping | List, then add mapping. |
| Slash-command not recognized | Hidden characters | Re-type directly in Slack. |
| Auto-Mulizer flooding non-commerce pages | Auto logic ignores targeting | Add site-targeting rules or whitelist domains. |

#### **Best Practices**

* Use **top-level domains** only (defpen.com, *not* www.defpen.com).

* After any add/remove, run /mula-domain-channels-list to confirm.

* Re-use feeds across similar articles to concentrate click-through data.

---

#### **HITL Mulaized Page Approval Workflow**

1. **“Carly Crawley”** scans the page and posts suggested high-intent keywords to Slack.

2. A **Mulanaut** approves or rejects each keyword (max 3).

3. **“Sam Searcher”** queries Amazon Associates & Google Shopping with the approved list and returns products.

4. To refine reject, reply **“You must use these keywords: ”** (three or fewer) and Sam retries.

---

#### **Known Gaps & Next Steps**

* Auto-Mulizer should respect targeting filters or a domain whitelist.

* Log how often the rising-article trigger (≥ 100 views/hour) fires and surface counts in the daily digest.

---

### Sales-Enablement Overlay (query-string shortcut)

Any page already running the tag can launch the placement tester with:

?moola\_activate\_sales\_enablements=1

Great for quick Loom demos when the bookmarklet is blocked.

---

## **👥 Publisher Personas & User Stories**

### **Core Personas**

| Persona | Role Focus | Key Motivators | Key Concerns |
| :---- | :---- | :---- | :---- |
| Revenue Lead | Monetization, RPMs, Affiliate Yield | Proving incremental revenue | Ad clutter, channel conflict, growth potential |
| Product Manager | Implementation, Testing, UX | Quick, clean deployment with low lift | Engineering time, site vitals, QA cycles |
| Editor | Content Quality, Audience Trust | Improved recirculation, high-quality experience | Editorial integrity, visual clutter |
| Executive / GM | Growth, Profit, Vision | Scalable solutions that unlock new upside | Time-to-value, strategic fit, partner risk |

---

### **User Stories**

**Revenue Lead**  
“As a revenue lead, I want to see a clear lift in RPM or affiliate earnings within the first month, so I can justify a broader rollout.”  
→ Early benchmarks, UTM-structured proof, control vs test, async dashboard.

**Product Manager**  
“As a product manager, I want a lightweight implementation that doesn’t disrupt page speed or conflict with our ad stack.”  
→ Drop-in code, preflight checklist, low-dependency implementation.

**Editor-in-Chief**  
“As an editor, I want the product to feel native and enhance recirculation, not just add noise.”  
→ Visual mocks, audience insights, emphasis on quality and context.

**Executive / GM**  
“As an executive, I want to know if this can scale across multiple properties without heavy customization.”  
→ Pilot scorecard, expansion roadmap, 10x scalability plan.

## **Core Metrics Glossary**

### **📦 Traffic & Exposure**

| Metric | Definition | Purpose | Insight |
| ----- | ----- | ----- | ----- |
| **tag\_fires** | Number of times the Mula tag successfully loaded on a page. | Measures Mula’s surface area and implementation footprint. | If **tag\_fires** ≫ **widget\_views**, you’ve implemented everywhere but aren’t surfacing widgets—check placement logic or targeting filters to unlock that lost inventory. |
| **widget\_views** | The number of times a Mula widget was visible in the user’s viewport. | Reflects real visual exposure, not just technical load. | If **widget\_views** stagnate while page traffic grows, you may need to rethink widget positioning or lazy-load thresholds to maintain exposure. |
| **smartscroll\_in\_views** | Number of times the SmartScroll unit was scrolled into view. | Tracks deeper engagement and long-scroll monetization. | If **smartscroll\_in\_views** ≪ **widget\_views**, users aren’t scrolling far enough—test “peek” teasers or adjust unit offset to pull readers deeper. |

---

### **📈 Engagement**

| Metric | Definition | Purpose | Insight |
| ----- | ----- | ----- | ----- |
| **feed\_clicks** | Total clicks on product items inside a Mula feed or widget. | Indicates interest in surfaced products. | If **feed\_clicks** drop but **widget\_views** hold steady, your product thumbnails or CTAs need a refresh—experiment with images, labels, or layout. |
| **store\_clicks** | Total outbound clicks to merchant/affiliate destinations. | Captures high-intent behavior for affiliate revenue. | If **store\_clicks** ≪ **feed\_clicks**, check the transition: ensure product pages load fast and affiliate links are prominent and correctly tagged. |
| **load\_more\_clicks** | Clicks on “Load More” within widget feeds. | Signals appetite for additional product content. | A rising **load\_more\_clicks** rate means deeper interest—consider infinite scroll or auto-load variants to capitalize on user curiosity. |

---

### **📊 Rates & Ratios**

| Metric | Formula | Purpose | Insight |
| ----- | ----- | ----- | ----- |
| mula\_feed\_click\_rate | feed\_clicks / widget\_views | CTR of the product feed. | If this rate is low (\< historical baseline), optimize item relevance or CTA prominence; if unusually high, consider expanding into new pages/segments. |
| mula\_store\_click\_rate | store\_clicks / widget\_views | Conversion from exposure to affiliate action. | A rising rate suggests strong product-to-purchase alignment; a falling rate flags friction—audit link health, page speed, or affiliate offer relevance. |
| feed\_click\_per\_in\_view\_rate | feed\_clicks / smartscroll\_in\_views | CTR based on deep-scroll exposures. | If this ≫ mula\_feed\_click\_rate, your infinite feed is more engaging—consider surfacing key products further down the page or in other long-form units. |
| store\_click\_per\_in\_view\_rate | store\_clicks / smartscroll\_in\_views | Affiliate conversion from deep-scroll exposures. | If this lags overall store click-rate, deep-scroll items may be lower value—rotate in higher-margin products or personalized recommendations. |
| ad\_view\_per\_page\_view\_rate | ad\_views / pageviews | Normalized ad-impression metric per pageview. | If this rate falls, ad slots may be empty—check demand, floor pricing, or fluid ad slot settings to increase fill. |
| store\_click\_per\_page\_view\_rate | store\_clicks / pageviews | Efficiency of driving outbound clicks per pageview. | A declining trend signals weakening affiliate yield—test new merchant partnerships or adjust which pages/widgets show product links. |

---

### **⚖️ Session Metrics**

| median\_ad\_views\_per\_session | Median number of Mula ad views in a user session. | Session-level monetization density. | If the median is flat while session length grows, ads aren’t loading on subsequent pages—verify tag persistence across pageviews or single-page apps. |
| :---- | :---- | :---- | :---- |
| **median\_store\_clicks\_per\_session** | Median number of affiliate clicks per user session. | Typical conversion behavior per visit. | If this stays at zero for most sessions, focus on high-intent segments (e.g. product pages) or personalize offers based on referral source or user cohort. |

---

### **💰 Monetization Estimates**

* **cpm\_estimate**  
  Assumed average cost per thousand (CPM) for ad impressions served.  
  * *Purpose:* Used for modeling incremental ad revenue.  
* **incremental\_revenue\_estimate**  
  Total estimated revenue (ads \+ affiliate) attributed to Mula units.  
  * *Purpose:* Top-level business impact metric for publisher reporting.

---

## **🔗 Test Links**

1. **Brit \+ Co** (Beauty Vertical)	  
   1. [https://www.brit.co/old-school-beauty-products/?htlbidqa=47562\&mulaAuto=1](https://www.brit.co/old-school-beauty-products/?htlbidqa=47562&mulaAuto=1)  
2. **On3 Ohio State** (Sports Vertical)  
   1. [https://www.on3.com/teams/ohio-state-buckeyes/news/ohio-state-buckeyes-football-dezie-jones-wide-receiver-black-stripe/](https://www.on3.com/teams/ohio-state-buckeyes/news/ohio-state-buckeyes-football-dezie-jones-wide-receiver-black-stripe/)  
3. On3 Michigan (Sports Vertical)  
   1. [https://www.on3.com/teams/michigan-wolverines/news/michigan-wolverines-football-podcast-preview-and-predictions-for-oklahoma-game/](https://www.on3.com/teams/michigan-wolverines/news/michigan-wolverines-football-podcast-preview-and-predictions-for-oklahoma-game/)  
4. Swimming World (Sports Vertical)  
   1. [https://www.swimmingworldmagazine.com/news/the-all-time-olympic-medals-by-country-united-states-owns-massive-lead/](https://www.swimmingworldmagazine.com/news/the-all-time-olympic-medals-by-country-united-states-owns-massive-lead/)  
5. Us Weekly  
   1. [https://www.usmagazine.com/shopping/](https://www.usmagazine.com/shopping/)

