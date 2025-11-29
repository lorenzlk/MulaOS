# Product Context

## Why Mula Exists

Digital publishers struggle to monetize their content effectively. Traditional ad networks provide declining revenue, and manual affiliate marketing requires significant editorial overhead. Publishers need an intelligent system that can:

1. **Understand their content** at scale
2. **Match relevant products** to reader interests
3. **Deploy monetization** without technical complexity
4. **Prove incremental value** with clear analytics
5. **Respect editorial standards** through human oversight

## Problems We Solve

### For Publishers

**Revenue Gap**: Publishers leave money on the table by not monetizing every relevant content opportunity.

**Technical Complexity**: Implementing dynamic affiliate feeds requires engineering resources most publishers don't have.

**Editorial Control**: Automated systems often sacrifice quality for speed, risking brand reputation.

**Attribution Uncertainty**: Publishers can't prove which monetization strategies actually work.

### For the Mula Team

**Partnership Management**: Need to track dozens of publisher relationships, contacts, projects, and tasks efficiently.

**Operational Overhead**: Manual tracking in Notion created friction and data silos.

**Scalability**: As we grow, we need systems that can handle more partners without proportional overhead.

## How Mula Should Work

### The Publisher Experience

1. **Minimal Integration**: Simple JavaScript embed, no backend changes required
2. **Editorial Oversight**: Publishers review and approve product feeds via Slack
3. **Dynamic Placement**: Mula automatically identifies optimal injection points
4. **Clear Reporting**: Daily/weekly performance reports delivered to Slack
5. **Revenue Lift**: Measurable increase in affiliate and ad revenue

### The Agent System

Six specialized AI agents work together:

- **Weston** crawls and analyzes content, building taxonomy
- **Sally** uses LLMs to generate relevant product recommendations
- **Taka** deploys feeds dynamically into site layouts
- **Andy** delivers performance insights and engagement metrics
- **Occy** optimizes for maximum revenue
- **Cal** runs experiments to improve performance

### The Operations System (MulaOS)

Supports the Mula team with:

- **CRM Functionality**: Track publisher relationships and contacts
- **Project Management**: Manage implementation projects and tasks
- **Pipeline Visibility**: Track partnership opportunities
- **Activity Logging**: Record all touchpoints with partners
- **Integration**: Connect operational data with Google Workspace tools

## User Experience Goals

### For Publishers

- **Zero Friction**: Integration in minutes, not days
- **Trust & Control**: Human approval for all AI recommendations
- **Transparency**: Clear metrics on performance and revenue
- **Brand Safety**: Products align with editorial standards

### For Mula Team

- **Efficiency**: Reduce time spent on administrative tasks
- **Visibility**: Clear view of all partnerships and activities
- **Collaboration**: Seamless teamwork across all partner interactions
- **Data-Driven**: Make decisions based on complete information

## How Mula Actually Works (Production System)

### Publisher Onboarding Flow

**Step 1: Integration** (5 minutes)
```html
<!-- Publisher adds single script tag -->
<script src="https://cdn.jsdelivr.net/npm/@makemula/sdk@latest"></script>
<script>
  window.Mula.init({
    publisherId: 'unique-publisher-id',
    domain: 'www.publisher.com'
  });
</script>
```

**Step 2: Page Activation** (via Slack)
- Publisher sends Slack command: `/mulaize www.publisher.com/article-url`
- System crawls page, analyzes content
- LLM generates relevant product search strategy
- Products stored temporarily, approval requested

**Step 3: Human Approval** (via Slack)
- Publisher receives Slack message with product preview
- Interactive buttons: "Approve" or "Reject with Feedback"
- On approval: Products go live on page immediately
- On rejection: LLM uses feedback to improve next search

**Step 4: Dynamic Deployment** (automatic)
- Widget appears on page without code changes
- Products personalized based on user behavior
- A/B test variant assigned via cookie
- Real-time event tracking begins

### User Experience Flow

**Reader Visits Article**:
1. Page loads → Mula SDK initializes
2. Bot detection checks user agent
3. Manifest loaded from S3 (cached by CDN)
4. A/B test variant assigned (cookie-based)
5. Widget renders with products
6. Personalization cookies track behavior:
   - `__mula_spv`: Search phrase views
   - `__mula_ivc`: Item view counts
   - `__mula_npv`: Next page article views (prevents repeats)

**Reader Interacts**:
- Product view → Event sent to Kinesis Firehose
- Product click → Affiliate link with SubID tracking
  - `subId1`: Domain
  - `subId2`: Search phrase + A/B variant
  - `subId3`: Product title
- SmartScroll → Loads next article + product feed
- Exit → All events processed for analytics

### Revenue Attribution Flow

**Click Tracking**:
1. User clicks product → Redirects through affiliate network
2. SubID parameters encode context (domain, phrase, product, variant)
3. Affiliate network (Amazon/Impact) tracks click
4. Purchase happens (hours/days later)

**Revenue Collection** (daily automated):
1. Cron job triggers `revenueCollectionWorker` at 5 AM
2. Worker calls Impact API for previous day's data
3. Individual click and action records collected
4. Attribution decoded from SubID fields
5. Revenue stored in Postgres with full context
6. Publisher RPM calculations updated

**Reporting** (weekly automated):
- `/mula-performance-report` Slack command or automated schedule
- Queries Athena for event data, Postgres for revenue
- Generates charts: views, clicks, ad views, RPM
- Calculates lift vs. baseline (with vs. without Mula)
- Delivered to publisher's private Slack channel

### Human-in-the-Loop Workflows

**Product Approval Loop**:
- Purpose: Ensures editorial quality and brand safety
- Frequency: Every new page or search phrase
- Interface: Slack interactive messages
- Outcome: Approved products go live, rejected products trigger new search with feedback
- Editorial Control: Publisher has 100% control over what appears

**Search Targeting Management**:
- Purpose: Automated placement across site sections
- Command: `/mula-site-targeting-add www.site.com/category/ "search phrase"`
- Effect: All pages under `/category/` automatically get products for "search phrase"
- Approval: Still requires human approval before going live
- Flexibility: Can add, list, or remove targeting rules anytime

**Feedback Integration**:
- Rejection reasons stored in Postgres
- LLM uses feedback to refine search strategy
- Learns publisher preferences over time
- Example: "Products too expensive" → Future searches prioritize lower price points

### Multi-Platform Orchestration

**Credential Resolution**:
- Default Mula credentials for most publishers
- McClatchy uses their own Amazon Associates credentials
- ON3 uses Impact API for Fanatics affiliate program
- Automatic platform detection based on domain

**Search Strategy Adaptation**:
- Amazon: Searches across multiple indexes (All, Fashion, HomeGarden, etc.)
- Fanatics (via Impact): Category-based search with commission filters
- Google Shopping: SERP API with price comparison
- LLM evaluates results, ranks by relevance to page content

**Revenue Optimization**:
- Balances relevance (user satisfaction) vs. commission (revenue)
- A/B tests different product orderings
- Personalization increases CTR on repeat visits
- Site targeting ensures high-reach pages get best products

### Operational Control Systems

**Slack Commands** (18+ available):
- `/mulaize` - Activate single page
- `/mula-performance-report` - View KPIs
- `/mula-engagement-report` - Cohort analysis
- `/mula-site-targeting-add` - Automated placement
- `/mula-next-page-targeting-*` - SmartScroll article recs
- `/mula-health-check` - System status
- Many more (see `techContext.md` for full list)

**Permission System**:
- Domain-based access control
- Roles: `viewer` (read-only) or `editor` (can approve/create)
- User email-based authentication
- Example: `brit.co` team members can only control their domain

**Monitoring & Alerting**:
- Grafana dashboard with real-time CloudWatch metrics
- Search phrase view counts by domain
- Bot detection rates
- Performance latency (p50, p95, p99)
- Automated Slack alerts for errors/anomalies

## Success Metrics

### Product Success (Mula SDK)

**Primary Metrics**:
- Affiliate revenue per publisher (tracked via SubID)
- RPM (revenue per thousand page views)
- Click-through rate (CTR) on product widgets
- Time on page lift (measured via engagement reports)
- Publisher retention rate

**Secondary Metrics**:
- Widget viewability rate
- Scroll depth increase (SmartScroll)
- Bot-filtered engagement accuracy
- A/B test statistical significance

**Operational Metrics**:
- Search approval rate (% approved vs. rejected)
- Average approval time (time to human decision)
- System uptime (target: 99.9%)
- API error rates (OpenAI, Impact, Amazon)

### Operations Success (MulaOS)

- Partner onboarding time
- Task completion rate
- Data accuracy and completeness
- Team collaboration efficiency

