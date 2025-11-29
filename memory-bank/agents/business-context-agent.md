# Business Context Agent (BCA) Specification

## Agent Profile

**Name**: Business Context Agent (BCA)  
**Alias**: "Duke"  
**Named After**: [Duke Kahanamoku](https://en.wikipedia.org/wiki/Duke_Kahanamoku) - Father of modern surfing, Olympic champion, sheriff of Honolulu, and cultural ambassador  
**Role**: Strategic Business Intelligence & Decision Support  
**Domain**: Business model, economics, partnerships, market strategy

**Why Duke?**: Just as Duke Kahanamoku was a cultural ambassador who brought surfing to the world and built bridges between cultures, Duke the agent structures partnerships, builds business relationships, and guides strategic decisions that grow the Mula ecosystem.

**Mission**: Provide contextual business intelligence to enable data-driven strategic decisions across pilots, partnerships, pricing, and product development.

---

## Core Capabilities

### 1. Business Model Intelligence

**What It Knows**:
- **Revenue Model**: Affiliate revenue share, ad monetization splits, SaaS pricing tiers
- **Unit Economics**: 
  - Cost per pilot (CS time, engineering support)
  - Revenue per publisher (RPM lift, affiliate commissions)
  - Payback period and LTV calculations
  - Margin structure by publisher type
- **Pricing Strategy**:
  - Current pricing models (% revenue share, flat fee, hybrid)
  - Competitive positioning
  - Value-based pricing thresholds
- **Partnership Economics**:
  - Amazon Associates commission structure
  - Impact API revenue sharing
  - Publisher payout models

**Example Queries**:
```
"What's our estimated payback period for a mid-size publisher pilot?"
"If we sign 3 publishers at $X RPM lift, what's our ARR impact?"
"What revenue share % makes sense for a publisher doing $500K/yr in programmatic?"
```

---

### 2. Publisher Segmentation & Prioritization

**Segmentation Framework**:

| Segment | Monthly Pageviews | Tech Sophistication | Value Prop | Priority |
|---------|-------------------|---------------------|------------|----------|
| **Enterprise** | 50M+ | High (eng team) | Revenue + Innovation | High |
| **Growth** | 5-50M | Medium (PM + dev) | Revenue + Efficiency | High |
| **Mid-Market** | 1-5M | Low-Medium | Revenue Lift | Medium |
| **Emerging** | <1M | Low | Proof Points | Low |

**What It Does**:
- **Scoring**: Assigns prioritization score based on:
  - Revenue potential (traffic * RPM lift * commission %)
  - Strategic value (vertical, brand, case study potential)
  - Implementation complexity (tech stack, team sophistication)
  - Competitive urgency (alternatives being evaluated?)
- **Recommendations**: 
  - "Focus on Growth segment - highest ROI per CS hour"
  - "Enterprise deals require 3-month sales cycle - pipeline now for Q3"
  - "Mid-Market batch onboarding - standardized playbook, lower touch"

**Example Queries**:
```
"Which publishers should we prioritize this quarter?"
"What's the expected value of the Swimming World pilot vs. brit.co expansion?"
"Should we pursue this 100M pageview publisher with complex CMS?"
```

---

### 3. Competitive Intelligence

**What It Tracks**:
- **Direct Competitors**: 
  - Taboola, Outbrain (content recommendation + monetization)
  - Skimlinks, VigLink (affiliate link management)
  - Commerce AI players (e.g., Narrativ, Connexity)
- **Positioning**:
  - Feature comparison matrix
  - Pricing benchmarks
  - Win/loss analysis from pilots
- **Market Trends**:
  - Programmatic ad market dynamics
  - Affiliate marketing evolution
  - Publisher consolidation trends
  - AI adoption in media/publishing

**What It Does**:
- **Battle Cards**: Generate competitive positioning for sales conversations
- **Gap Analysis**: Identify feature gaps vs. competitors
- **Pricing Intelligence**: Market-rate benchmarking for negotiations

**Example Queries**:
```
"How does our RPM lift compare to Taboola's benchmarks?"
"What's Skimlinks' revenue share model?"
"Why did we lose the XYZ publisher deal to Outbrain?"
```

---

### 4. Deal Structure & Contract Intelligence

**What It Knows**:
- **Contract Templates**:
  - Pilot agreements (3-6 months, revenue share, terms)
  - Enterprise contracts (SLA, exclusivity, payment terms)
  - Partnership agreements (Amazon, Impact, ad networks)
- **Commercial Terms**:
  - Standard revenue splits by segment
  - Minimum guarantees and performance bonuses
  - Termination clauses and notice periods
  - IP ownership and data rights
- **Negotiation History**:
  - What concessions have we made historically?
  - Which terms are negotiable vs. non-negotiable?
  - Benchmark deal structures by segment

**What It Does**:
- **Deal Scoring**: Assess whether proposed terms are favorable
- **Term Sheet Generation**: Auto-generate starter contracts from templates
- **Risk Flagging**: Identify unusual terms or potential issues
- **Approval Routing**: Recommend escalation path (founder, legal, finance)

**Example Queries**:
```
"Generate a pilot agreement for a 10M pageview lifestyle publisher"
"Is a 25% revenue share within our standard range for Growth segment?"
"What payment terms have we offered similar publishers?"
```

---

### 5. Financial Planning & Forecasting

**What It Tracks**:
- **Revenue Metrics**:
  - ARR (Annual Recurring Revenue) from signed publishers
  - Pipeline value (weighted by stage probability)
  - Revenue per pilot/publisher
  - Affiliate vs. ad revenue mix
- **Cost Structure**:
  - CS cost per pilot (time * hourly rate)
  - Engineering support costs
  - Platform costs (AWS, Heroku, APIs)
  - Sales/marketing CAC
- **Growth Metrics**:
  - Pilot-to-paid conversion rate
  - Expansion revenue from existing publishers
  - Churn rate and retention cohorts
  - New pilot volume by month

**What It Does**:
- **Scenario Planning**: "What if we sign 5 Growth publishers in Q2?"
- **Burn Rate Analysis**: "At current pilot costs, what's our runway?"
- **Target Setting**: "What pilot volume do we need to hit $X ARR?"
- **Board Deck Support**: Auto-generate key metrics for investor updates

**Example Queries**:
```
"What's our projected ARR if all active pilots convert?"
"What's the CAC payback period for our current cohort?"
"Generate Q1 metrics summary for board deck"
```

---

### 6. Strategic Decision Support

**What It Provides**:
- **Build vs. Buy**: Should we build X feature or partner with Y vendor?
- **Vertical Strategy**: Which content verticals should we prioritize? (Sports, Lifestyle, News, etc.)
- **Platform Strategy**: When should we support additional affiliate networks beyond Amazon/Impact?
- **GTM Strategy**: Should we focus on direct sales, partnerships, or self-serve?
- **Product Roadmap**: Which features unlock the most business value?

**Decision Framework**:
```yaml
decision_template:
  question: "Should we integrate with ShareASale affiliate network?"
  
  context:
    - current_networks: [amazon_associates, impact]
    - publisher_requests: 3
    - estimated_dev_effort: 3_weeks
    - potential_revenue_uplift: "15-20%"
  
  analysis:
    pros:
      - "Expands product availability for lifestyle/fashion publishers"
      - "Differentiator vs. competitors (most don't support ShareASale)"
      - "Publisher requested feature (reduces churn risk)"
    cons:
      - "3 weeks engineering time = opportunity cost"
      - "Support burden for 3rd affiliate platform"
      - "Network effects diluted (fewer clicks per platform)"
    
    financial_impact:
      - "If 3 publishers adopt: +$50K ARR (15% lift * $333K avg publisher ARR)"
      - "Engineering cost: $30K (3 weeks * $10K/week loaded cost)"
      - "Payback: 7 months"
    
  recommendation:
    decision: "Proceed if 5+ publishers commit in writing"
    rationale: "Engineering cost is justified with clear demand signal"
    next_steps:
      - "Survey current pilots for ShareASale interest"
      - "Get written commitments from interested publishers"
      - "Prioritize in roadmap if >5 commitments"
```

**Example Queries**:
```
"Should we offer a self-serve tier for small publishers?"
"What's the ROI of building a visual widget placement tool?"
"Should we focus on vertical expansion (new categories) or horizontal (more publishers)?"
```

---

## Data Sources & Integrations

### Internal Data
- **CRM/Notion**: Publisher pipeline, deal stages, contact history
- **Postgres**: Product metrics, revenue data, user behavior
- **Financial Systems**: Costs, revenue, forecasts, budgets
- **Slack**: Pilot feedback, CS interactions, partnership discussions
- **GitHub**: Product roadmap, feature requests, engineering velocity

### External Data
- **Market Research**: Gartner, Forrester reports on ad tech/publisher tools
- **Competitive Intelligence**: Public pricing pages, job postings, press releases
- **Industry Benchmarks**: IAB reports, Digiday surveys, eMarketer data
- **Economic Indicators**: Ad market trends, e-commerce growth rates

---

## Interface Design

### Slack Integration

**Command Pattern**: `/duke <command> [args]`

**Core Commands**:

```bash
# Business intelligence queries
/duke analyze publisher <domain>
→ Returns: Traffic, vertical, tech stack, revenue potential, priority score

/duke forecast revenue --scenario optimistic
→ Returns: ARR projection with pipeline conversion assumptions

/duke compare deal <publisher1> <publisher2>
→ Returns: Side-by-side deal structure, terms, economics

# Decision support
/duke recommend priorities --quarter Q2
→ Returns: Ranked list of opportunities with ROI estimates

/duke evaluate feature <feature_name>
→ Returns: Build vs. buy analysis, ROI, strategic fit

# Competitive intelligence
/duke research competitor <company_name>
→ Returns: Positioning, pricing, recent news, feature comparison

# Contract support
/duke draft pilot-agreement --publisher <domain> --segment growth
→ Returns: Pre-filled contract with recommended terms

# Financial planning
/duke calculate ltv --publisher <domain>
→ Returns: Lifetime value estimate based on traffic, retention, monetization

# Market insights
/duke trends --vertical sports
→ Returns: Market size, growth rate, key players, opportunities
```

**Natural Language Interface**:
```
@Duke what's our payback period for brit.co?
@Duke should we prioritize swimming world or us weekly?
@Duke generate a deal structure for a 20M pageview news publisher
@Duke what's the ROI if we build a WordPress plugin?
```

---

### Web Dashboard

**Business Intelligence Portal**: `app.makemula.ai/intelligence`

**Key Views**:

1. **Pipeline Dashboard**
   - Active pilots by stage
   - Weighted pipeline value
   - Conversion funnel
   - Expected close dates

2. **Publisher Scorecard**
   - All publishers with priority scores
   - Traffic, vertical, tech sophistication
   - Revenue potential estimates
   - Status (pilot, active, churned)

3. **Financial Overview**
   - ARR and MRR
   - Revenue by publisher/segment
   - Cost breakdown (CS, eng, platform)
   - Burn rate and runway

4. **Competitive Matrix**
   - Feature comparison table
   - Pricing benchmarks
   - Win/loss trends
   - Market positioning

5. **Decision Log**
   - Historical strategic decisions
   - Outcomes and learnings
   - Framework templates

---

### API Endpoints

```typescript
// Publisher intelligence
GET /api/duke/publishers/{domain}/analysis
Response: {
  publisher: {
    domain: "brit.co",
    monthly_pageviews: 8000000,
    vertical: "lifestyle",
    tech_stack: "wordpress",
    monetization: ["programmatic", "affiliate", "commerce"]
  },
  intelligence: {
    priority_score: 85,
    revenue_potential: "$120K ARR",
    implementation_complexity: "medium",
    strategic_value: "high - brand name, case study potential"
  },
  recommendations: [
    "Prioritize for Q1 expansion",
    "Propose hybrid revenue share model (70/30)",
    "Target beauty and home verticals initially"
  ]
}

// Deal structure recommendation
POST /api/duke/deals/recommend
Body: {
  publisher: "swimmingworld.com",
  segment: "mid-market",
  monthly_pageviews: 2000000,
  current_rpm: 5.50
}
Response: {
  recommended_structure: {
    model: "revenue_share",
    mula_share: 0.25,
    minimum_guarantee: null,
    contract_length: "6 months",
    auto_renewal: true
  },
  rationale: "Standard mid-market terms. No MG given low risk/volume.",
  comparable_deals: [
    { publisher: "competitor.com", terms: "..." }
  ]
}

// Financial forecast
POST /api/duke/forecast
Body: {
  scenario: "base_case",
  assumptions: {
    pilot_conversion_rate: 0.65,
    avg_publisher_arr: 80000,
    new_pilots_per_month: 2
  }
}
Response: {
  arr_projection: {
    Q1: 240000,
    Q2: 400000,
    Q3: 600000,
    Q4: 840000
  },
  confidence_interval: [0.7, 1.3],
  key_assumptions: [...]
}

// Strategic decision support
POST /api/duke/evaluate
Body: {
  decision: "Should we build Shopify integration?",
  context: {
    publisher_requests: 5,
    estimated_effort_weeks: 8,
    potential_segment: "e-commerce publishers"
  }
}
Response: {
  recommendation: "Proceed with caution",
  score: 6.5,
  analysis: {
    pros: [...],
    cons: [...],
    financial_impact: {...},
    strategic_fit: "medium"
  },
  next_steps: [...]
}
```

---

## Knowledge Base Structure

```
knowledge-base/
├── business-model/
│   ├── revenue-streams.yml
│   ├── cost-structure.yml
│   ├── unit-economics.yml
│   └── pricing-strategy.yml
├── publishers/
│   ├── segments.yml
│   ├── verticals.yml
│   ├── scoring-model.yml
│   └── case-studies/
│       ├── brit-co.yml
│       ├── on3.yml
│       └── swimming-world.yml
├── partnerships/
│   ├── amazon-associates.yml
│   ├── impact-api.yml
│   ├── gam-integration.yml
│   └── potential-partners.yml
├── competitive/
│   ├── taboola.yml
│   ├── outbrain.yml
│   ├── skimlinks.yml
│   └── feature-matrix.yml
├── contracts/
│   ├── templates/
│   │   ├── pilot-agreement.yml
│   │   ├── enterprise-contract.yml
│   │   └── partnership-agreement.yml
│   └── terms/
│       ├── standard-terms.yml
│       ├── negotiable-terms.yml
│       └── deal-history.yml
├── financial/
│   ├── forecasts/
│   │   ├── 2025-q1.yml
│   │   ├── 2025-q2.yml
│   │   └── annual-plan.yml
│   ├── metrics/
│   │   ├── arr-mrr.yml
│   │   ├── pipeline.yml
│   │   └── unit-economics.yml
│   └── budgets/
│       ├── cs-budget.yml
│       ├── engineering-budget.yml
│       └── platform-costs.yml
└── strategy/
    ├── market-analysis.yml
    ├── vertical-strategy.yml
    ├── platform-strategy.yml
    ├── gtm-strategy.yml
    └── decision-log/
        ├── 2025-01-build-wordpress-plugin.yml
        └── 2025-01-shareashale-integration.yml
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create knowledge base structure
- [ ] Document business model, unit economics, pricing
- [ ] Build publisher segmentation model
- [ ] Create initial contract templates

### Phase 2: Intelligence Layer (Week 3-4)
- [ ] Build publisher analysis engine
- [ ] Implement deal recommendation logic
- [ ] Create financial forecasting models
- [ ] Integrate with Postgres/CRM data

### Phase 3: Slack Interface (Week 5-6)
- [ ] Implement `/bailey` slash commands
- [ ] Build natural language query parsing
- [ ] Create interactive decision workflows
- [ ] Deploy to production Slack workspace

### Phase 4: Advanced Features (Week 7-8)
- [ ] Build web dashboard (business intelligence portal)
- [ ] Implement competitive intelligence scraping
- [ ] Create automated insights/alerts
- [ ] Build API for programmatic access

### Phase 5: AI Integration (Week 9-10)
- [ ] Train LLM on business context knowledge base
- [ ] Implement conversational interface
- [ ] Build proactive recommendation engine
- [ ] Create automated decision logging

---

## Example Use Cases

### Use Case 1: Pilot Prioritization

**Scenario**: 3 pilots in pipeline, limited CS capacity this quarter

**Duke Analysis**:
```yaml
analysis:
  publishers:
    - domain: swimmingworld.com
      score: 75
      rationale: "Mid-market, proven vertical (sports), moderate complexity"
      revenue_potential: "$60K ARR"
      probability: 0.70
      weighted_value: "$42K"
    
    - domain: usweekly.com
      score: 90
      rationale: "High traffic, strong brand, commerce focus"
      revenue_potential: "$200K ARR"
      probability: 0.50
      weighted_value: "$100K"
    
    - domain: newpublisher.com
      score: 45
      rationale: "Low traffic, unproven vertical, high complexity"
      revenue_potential: "$30K ARR"
      probability: 0.40
      weighted_value: "$12K"

recommendation:
  priority_order: [usweekly.com, swimmingworld.com, newpublisher.com]
  rationale: "Focus on UsWeekly (highest weighted value) and Swimming World (high probability). Defer newpublisher to next quarter unless capacity frees up."
  resource_allocation:
    usweekly: "Senior CS lead, 60% capacity"
    swimmingworld: "Mid-level CS, 40% capacity"
```

---

### Use Case 2: Deal Structure Negotiation

**Scenario**: Publisher wants 80/20 revenue split (vs. standard 75/25)

**Duke Analysis**:
```yaml
analysis:
  request: "80/20 revenue split (publisher favor)"
  standard: "75/25"
  impact:
    annual_revenue_loss: "$15K (on $100K gross)"
    margin_impact: "15% reduction in contribution margin"
  
  historical_precedent:
    - "Granted 80/20 to brit.co (high-value, case study)"
    - "Granted 80/20 to on3.com (enterprise, exclusivity)"
    - "Standard for all others"
  
  publisher_leverage:
    - "High traffic (20M pageviews/month)"
    - "Strong brand (potential case study)"
    - "Competitive evaluation (considering Taboola)"
  
  negotiation_strategy:
    recommend: "Counter with 77.5/22.5 or 75/25 + performance bonus"
    rationale: "Maintain margin but show flexibility. Performance bonus aligns incentives."
    walk_away_threshold: "80/20 acceptable if >$150K annual gross revenue"

decision:
  approve: "Yes, if publisher commits to 12-month contract + case study"
  terms: "80/20 split for first 6 months, then 75/25 OR 75/25 + 5% bonus if >10% RPM lift"
```

---

### Use Case 3: Build vs. Buy Decision

**Scenario**: Should we build WordPress plugin or use bookmarklet?

**Duke Analysis**:
```yaml
analysis:
  options:
    build_plugin:
      effort: "4 weeks engineering"
      cost: "$40K (loaded cost)"
      benefits:
        - "Easier onboarding (15% faster)"
        - "Better UX (less manual steps)"
        - "Competitive differentiator"
        - "Self-serve potential"
      risks:
        - "WordPress version compatibility"
        - "Support burden (plugin updates)"
        - "Opportunity cost (4 weeks)"
    
    enhanced_bookmarklet:
      effort: "1 week engineering"
      cost: "$10K"
      benefits:
        - "Quick win (ships in 1 week)"
        - "Platform-agnostic (works everywhere)"
        - "Lower support burden"
      risks:
        - "User friction (manual install)"
        - "Not differentiated (competitors have similar)"
  
  financial_comparison:
    plugin_payback:
      assumption: "10% faster onboarding = 1 extra pilot/quarter"
      value: "$80K ARR * 0.25 margin = $20K"
      payback_period: "2 quarters"
    
    bookmarklet_payback:
      assumption: "Marginal improvement"
      value: "$5K incremental"
      payback_period: "2 quarters"
  
  market_research:
    - "47% of publishers use WordPress"
    - "Competitors (Skimlinks, Rakuten) have plugins"
    - "Publishers rate 'ease of integration' as top-3 decision criteria"

recommendation:
  decision: "Build WordPress plugin"
  rationale: "Despite higher cost, plugin aligns with market expectations and enables self-serve future. WordPress is dominant CMS for our target segment."
  phasing:
    mvp: "Basic integration (2 weeks) - ship fast"
    v2: "Advanced features (widget placement UI) - roadmap for Q2"
  next_steps:
    - "Validate with 3 WordPress publishers (get commitments)"
    - "Prioritize in sprint planning"
    - "Prepare WordPress plugin repo submission"
```

---

## Success Metrics

**Agent Performance**:
- **Decision Quality**: % of recommendations adopted that produced positive outcomes
- **Insight Velocity**: Time from query to actionable recommendation
- **Business Impact**: Revenue influenced by Duke recommendations
- **User Adoption**: % of deals/decisions using Duke analysis

**Business Impact**:
- **Deal Velocity**: Reduction in time-to-close for pilots
- **Deal Quality**: Improvement in contract terms (margin, duration, etc.)
- **Resource Efficiency**: CS/eng time saved via prioritization
- **Strategic Clarity**: Reduction in "analysis paralysis" for key decisions

---

## Integration with Existing Agents

```
┌─────────────────────────────────────────────────────────┐
│  Duke (Business Context Agent)                           │
│  - Strategic Intelligence                                │
│  - Publisher Prioritization                              │
│  - Deal Structuring                                      │
│  - Financial Forecasting                                 │
└─────────────────────────────────────────────────────────┘
                           ↓
                  Provides Context To
                           ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Weston     │    Sally     │    Taka      │    Andy      │
│   (Content)  │  (Products)  │  (Deploy)    │  (Analytics) │
│              │              │              │              │
│ • Taxonomy   │ • Search     │ • Placement  │ • Reports    │
│ • Target     │ • Recommend  │ • Control    │ • Insights   │
└──────────────┴──────────────┴──────────────┴──────────────┘
                           ↓
┌──────────────────────────┬──────────────────────────────┐
│        Occy              │           Cal                 │
│    (Monetization)        │      (Experiments)           │
│                          │                              │
│ • Revenue Optimization   │ • A/B Testing                │
│ • Yield Management       │ • Statistical Analysis       │
└──────────────────────────┴──────────────────────────────┘

Duke → "Focus on beauty vertical for brit.co (highest AOV)"
Weston → Analyzes beauty content taxonomy
Sally → Searches for beauty products
Taka → Deploys to beauty article paths
Andy → Reports on beauty vertical performance
Occy → Optimizes beauty product ordering
Cal → Tests beauty product density variations
```

---

## Future Enhancements

### Predictive Intelligence
- **Churn Prediction**: Identify at-risk publishers before they churn
- **Expansion Opportunities**: Detect when publishers are ready for upsell
- **Market Timing**: Optimal timing for outreach based on industry trends

### Automated Deal Desk
- **Dynamic Pricing**: Real-time pricing recommendations based on market conditions
- **Contract Generation**: Fully automated contract creation from templates
- **Approval Workflows**: Intelligent routing based on deal parameters

### Competitive Moat Analysis
- **Feature Gap Detection**: Continuous monitoring of competitive feature releases
- **Win/Loss Analysis**: Automated analysis of why deals are won or lost
- **Positioning Optimization**: Dynamic messaging based on competitive landscape

### Board/Investor Reporting
- **Automated Deck Generation**: One-click board deck with latest metrics
- **Narrative Generation**: AI-written executive summaries of performance
- **Scenario Planning**: Interactive "what-if" analysis for strategic planning

---

## Getting Started

**Immediate Next Steps**:

1. **Create Knowledge Base Structure**:
   ```bash
   mkdir -p knowledge-base/{business-model,publishers,partnerships,competitive,contracts,financial,strategy}
   ```

2. **Document Core Business Model**:
   - Revenue streams and pricing
   - Unit economics and margins
   - Publisher segmentation criteria

3. **Build First Use Case**: Publisher Prioritization
   - Define scoring model
   - Implement calculation logic
   - Create Slack command `/bailey analyze publisher <domain>`

4. **Deploy MVP**: Basic Slack integration for business queries

Would you like me to:
1. **Create the knowledge base YAML files** (business model, pricing, segments)?
2. **Build the publisher scoring model** (prioritization algorithm)?
3. **Draft sample contracts** (pilot agreement, enterprise terms)?
4. **Design the Slack command interface** (command structure, response formats)?

