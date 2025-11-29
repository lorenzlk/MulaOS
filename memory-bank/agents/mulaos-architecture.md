# MulaOS Architecture - Sub-Agent Ecosystem

**Date**: 2025-11-28  
**Status**: ✅ Architecture Defined

---

## Core Principle

**MulaOS is NOT integrated into the SDK.** It is a **POC architecture** that informs product strategy. The agents (Granny, Duke) will be sub-agents under the existing "surfers" (Sally, Taka, etc.) and will be subsumed by the engineering/product team.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MULA SDK (Production)                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  SALLY   │  │   TAKA   │  │   ANDY   │  │   OCCY   │  │
│  │  GenAI   │  │  Deploy  │  │ Analytics│  │ Monetize │  │
│  │ Product  │  │  Control │  │ Reports  │  │ Revenue │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐                               │
│  │  CAL     │  │  WESTON   │                               │
│  │  A/B     │  │  Content  │                               │
│  │  Tests   │  │  Analysis │                               │
│  └──────────┘  └──────────┘                               │
│                                                              │
│                    "SURFERS" (Main Agents)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Sub-agents inform & enhance
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              MULAOS (POC Architecture)                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SUB-AGENTS (Ecosystem)                        │  │
│  │                                                         │  │
│  │  ┌──────────────┐          ┌──────────────┐           │  │
│  │  │    GRANNY    │          │     DUKE    │           │  │
│  │  │   Context    │          │  Onboarding │           │  │
│  │  │   Engine     │          │  Placement  │           │  │
│  │  │              │          │             │           │  │
│  │  │ Answers:     │          │ Answers:    │           │  │
│  │  │ "What does   │          │ "Where      │           │  │
│  │  │  this page   │          │  should we  │           │  │
│  │  │  mean?"      │          │  place      │           │  │
│  │  │              │          │  SmartScroll│           │  │
│  │  │              │          │  and what   │           │  │
│  │  │              │          │  pages are  │           │  │
│  │  │              │          │  eligible?"  │           │  │
│  │  └──────────────┘          └──────────────┘           │  │
│  │                                                         │  │
│  │  • Contextual Intelligence                             │  │
│  │  • Business Intelligence                               │  │
│  │  • Affiliate Search Strategies                        │  │
│  │  • Sports Calendar                                     │  │
│  │  • Rivalry Detection                                   │  │
│  │  • Seasonal Opportunities                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         INTEGRATION POINTS                             │  │
│  │                                                         │  │
│  │  Granny → Sally: Contextual intelligence for product  │  │
│  │                  selection (via REST API)             │  │
│  │                                                         │  │
│  │  Duke → Taka: Placement intelligence for deployment   │  │
│  │              (via REST API or direct integration)      │  │
│  │                                                         │  │
│  │  Granny → Occy: Business intelligence for monetization│  │
│  │                                                         │  │
│  │  Duke → Pre-sales: Onboarding intelligence for        │  │
│  │                    customer success                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Agent Responsibilities

### **Granny - Publisher Context Engine**

**Role**: Understands what a page means relative to:
- Time of year
- What's going on in a season or show
- What would a fan of that thing know about
- Something that we can market to

**Capabilities:**
- ✅ Contextual Intelligence (sports calendar, rivalry detection, seasonal trends)
- ✅ Business Intelligence (revenue model, publisher type, market position)
- ✅ Affiliate-Specific Search Strategies (Fanatics + Amazon)
- ✅ Sports Calendar Intelligence (CFB, NFL, NBA, CBB)

**Integration:**
- Provides contextual intelligence to **Sally** (product selection)
- Provides business intelligence to **Occy** (monetization strategy)
- Provides temporal intelligence to **Taka** (deployment timing)

**Location**: `/Users/loganlorenz/MulaOS/granny/` + `/Users/loganlorenz/MulaOS/granny-intelligence-api/`

---

### **Duke - Onboarding & Placement Intelligence Agent**

**Role**: Answers "Where should we place SmartScroll and what pages is it eligible for?"

**Capabilities:**
- ✅ SDK Health Check (verifies `cdn.makemula.ai` deployment)
- ✅ Traffic Analysis (sitemap + RSS feed analysis)
- ✅ URL Pattern Discovery (automatic targeting rules)
- ✅ SmartScroll Placement Intelligence (DOM analysis, eligibility scoring)
- ✅ Competitor Detection (Taboola, Outbrain, Revcontent)
- ✅ Deployment Readiness Assessment (scoring, timeline, critical path)

**Integration:**
- Provides placement intelligence to **Taka** (deployment control)
- Provides onboarding intelligence to **Pre-sales/Customer Success** (accelerated onboarding)

**Location**: `/Users/loganlorenz/MulaOS/duke/`

---

## Integration Pattern

### **Granny → Sally (Product Selection)**

```javascript
// In Sally's searchWorker.js

async function generateProductFeed(domain, url) {
  // 1. Get targeting rule
  const rule = await getSiteTargeting(domain, url);
  
  // 2. Call Granny Intelligence API
  const intelligence = await fetch('http://granny-api:3001/api/intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: domain,
      url: url,
      targetingRule: rule
    })
  }).then(r => r.json());
  
  console.log(`🏄‍♂️ Granny: ${intelligence.context?.event || 'Generic'}`);
  
  // 3. Use affiliate-specific strategies
  if (rule.credentials.impact && intelligence.search_strategies.impact.applicable) {
    await searchFanatics(
      intelligence.search_strategies.impact.primary_search,
      intelligence.search_strategies.impact.filters,
      rule.credentials.impact
    );
  }
  
  if (rule.credentials.amazon && intelligence.search_strategies.amazon.applicable) {
    await searchAmazon(
      intelligence.search_strategies.amazon.primary_search,
      intelligence.search_strategies.amazon.keywords,
      rule.credentials.amazon
    );
  }
}
```

### **Duke → Taka (Deployment Control)**

```javascript
// In Taka's deployment worker

async function deploySmartScroll(domain, url) {
  // 1. Call Duke Placement API
  const placement = await fetch('http://duke-api:3002/api/placement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, url })
  }).then(r => r.json());
  
  if (placement.eligible && placement.eligibility_score >= 80) {
    // 2. Deploy using recommended DOM selector
    await injectSmartScroll({
      selector: placement.dom_placement.selector,
      position: placement.dom_placement.position,
      method: placement.dom_placement.method
    });
  }
}
```

---

## Deployment Strategy

### **Phase 1: POC (Current)**
- ✅ Granny and Duke run as standalone services
- ✅ Web dashboard for visualization
- ✅ REST APIs for integration
- ✅ CLI tools for manual analysis

### **Phase 2: Integration (Future)**
- ⬜ Engineering/product team reviews POC
- ⬜ Sub-agents subsumed into main SDK agents
- ⬜ Granny becomes sub-agent under Sally
- ⬜ Duke becomes sub-agent under Taka
- ⬜ Direct integration (no REST API needed)

### **Phase 3: Production (Future)**
- ⬜ Agents run as part of SDK infrastructure
- ⬜ Automated intelligence updates
- ⬜ Performance monitoring and optimization
- ⬜ A/B testing framework

---

## Key Principles

1. **POC First**: MulaOS is a proof-of-concept that informs product strategy
2. **Sub-Agent Pattern**: Granny and Duke are sub-agents, not replacements
3. **Separation of Concerns**: Context (Granny) vs. Placement (Duke)
4. **Integration Ready**: REST APIs enable easy integration with surfers
5. **Product Strategy**: Architecture guides engineering/product decisions

---

## File Structure

```
/Users/loganlorenz/MulaOS/
├── granny/                    # Granny Context Engine
│   ├── src/
│   │   ├── context.js         # Business context analysis
│   │   └── ...
│   └── README.md
│
├── granny-intelligence-api/    # Granny REST API
│   ├── server.js
│   ├── src/
│   │   ├── GrannyIntelligence.js
│   │   ├── ContextDetector.js
│   │   └── StrategyGenerator.js
│   └── README.md
│
├── duke/                      # Duke Onboarding Agent
│   ├── src/
│   │   ├── onboard.js        # Onboarding analysis
│   │   ├── placement/
│   │   │   ├── PlacementDetector.js
│   │   │   └── CompetitorDetector.js
│   │   └── ...
│   └── README.md
│
└── memory-bank/
    └── agents/
        └── mulaos-architecture.md  # This file
```

---

**Last Updated**: 2025-11-28  
**Status**: ✅ Architecture Complete

