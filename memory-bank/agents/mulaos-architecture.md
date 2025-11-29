# MulaOS Architecture - Sub-Agent Ecosystem

**Date**: 2025-11-28  
**Status**: ✅ Architecture Defined

---

## Core Principle

**MulaOS is not part of the SDK today.** It is an R&D system that prototypes intelligence capabilities and informs product strategy. Its purpose is to accelerate and eventually merge into the production SDK agents (“surfers”).

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
                            │ Surfers remain the orchestrators. Sub-agents never call surfers; surfers call sub-agents.
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
│  │  • Offer Strategy Layer (maps context to recommended affiliate category or product line) │  │
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

### Memory Layer
Beneath MulaOS sits the **Memory Bank**, a lightweight knowledge layer used by sub-agents and surfers to store publisher insights, historical patterns, and learned behaviors.

---

## Agent Responsibilities

### **Granny - Publisher Context Engine**

**Role**: Answers the question: “Why does this page matter right now?” Granny provides temporal, contextual, and behavioral meaning so surfers understand what the audience cares about at this moment.

**Capabilities:**
- Contextual Meaning (what the page represents to the reader)
- Temporal Intelligence (seasons, cycles, holidays, sports calendars)
- Behavioral Understanding (what a fan or reader interprets from the content)
- Business Intelligence (publisher type, model, audience patterns)
- Affiliate Opportunity Mapping (context → opportunity buckets such as Team Gear, Tailgate Supplies, Beauty Restock, Holiday Gifts)
- Sports & Entertainment Timing (CFB, NFL, NBA, CBB, episodes, premieres)

Granny does not select products or SKUs; she provides opportunity buckets that Sally uses during feed generation.

This separation of meaning (Granny) and structure (Duke) keeps the system clean, predictable, and production-aligned.

**Integration:**
- Provides contextual intelligence to **Sally** (product selection)
- Provides business intelligence to **Occy** (monetization strategy)
- Provides temporal intelligence to **Taka** (deployment timing)

**Location**: `/Users/loganlorenz/MulaOS/granny/` + `/Users/loganlorenz/MulaOS/granny-intelligence-api/`

---

### **Duke - Onboarding & Placement Intelligence Agent**

**Role**: Answers the question: “Where should SmartScroll live to maximize coverage, eligibility, and valid targeting based on how the publisher’s site is actually built?”

**Capabilities:**
- Coverage Intelligence (which URL patterns represent real content)
- Site Architecture Mapping (DOM, recirc, competitors, layouts)
- Targeting Map Generation (URL → rule mappings for maximum coverage)
- Placement Recommendation (best injection point, not just valid ones)
- Competitor & Recirc Detection (native widgets, recirc modules, footers)
- Eligibility Scoring (structural health, scroll-depth viability)
- Deployment Readiness Assessment

Duke does not select products or interpret contextual meaning; he focuses strictly on coverage, structure, placement, and targeting logic.

This separation of meaning (Granny) and structure (Duke) keeps the system clean, predictable, and production-aligned.

**Integration:**
- Provides placement intelligence to **Taka** (deployment control)
- Provides onboarding intelligence to **Pre-sales/Customer Success** (accelerated onboarding)

**Location**: `/Users/loganlorenz/MulaOS/duke/`

---

## Integration Pattern

### **Granny → Sally (Product Selection)**

Granny informs Sally by providing meaning, timing, and opportunity buckets—not product selection.

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
Sub-agent failures must degrade gracefully; surfers fall back to default logic when intelligence is unavailable.

### **Duke → Taka (Deployment Control)**

Duke informs Taka by providing coverage-aware placement and targeting logic—not contextual interpretation.

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
Sub-agent failures must degrade gracefully; surfers fall back to default logic when intelligence is unavailable.

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

### Orchestrator Model
Sally orchestrates product generation, Taka orchestrates deployment, and Occy orchestrates monetization. Sub-agents provide intelligence; surfers make decisions.

---

## Key Principles

1. **POC First**: MulaOS is a proof-of-concept that informs product strategy  
2. **Sub-Agent Pattern**: Granny and Duke extend surfers but do not override surfer orchestration.  
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
