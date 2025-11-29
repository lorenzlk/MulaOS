# Active Context - MulaOS Architecture: Granny & Duke Split

## 🎯 **Current Status: ARCHITECTURE REFINED**

**Last Updated:** 2025-11-28  
**Session:** Granny & Duke Split - Sub-Agent Architecture

---

## ✅ **What Was Completed**

### **1. Architecture Clarification**

**Key Principle**: MulaOS is **NOT integrated into the SDK**. It is a **POC architecture** that informs product strategy. The agents (Granny, Duke) will be sub-agents under the existing "surfers" (Sally, Taka, etc.) and will be subsumed by the engineering/product team.

---

### **2. Granny & Duke Split**

**Granny** = **Publisher Context Engine**
- Answers: "What does this page mean relative to every other permutation you can think of?"
- When mobilizing a page, gets context of everything else:
  - Time of year
  - What's going on in a season or show
  - What would a fan of that thing know about
  - Something that we can market to
- Complements what we can do on the search side with affiliates

**Duke** = **Onboarding & Placement Intelligence Agent**
- Answers: "Where should we place SmartScroll and what pages is it eligible for?"
- Detection:
  - Article pages (templated structure)
  - Clean break at end of content (above footer, below content)
  - DOM structure analysis
  - Competitor detection (Taboola, Outbrain)
  - If competitors running → Ask for beta test against them
- Accelerates pre-sales and onboarding (2-3 weeks → 2 minutes)

---

### **3. Duke Agent Created**

**Location:** `/Users/loganlorenz/MulaOS/duke/`

**Capabilities:**
- ✅ SDK Health Check
- ✅ Traffic Analysis (sitemap + RSS)
- ✅ URL Pattern Discovery
- ✅ **NEW:** SmartScroll Placement Intelligence (DOM analysis, eligibility scoring)
- ✅ **NEW:** Competitor Detection (Taboola, Outbrain, Revcontent, Content.ad)
- ✅ Deployment Readiness Assessment

**Files Created:**
- `duke/src/onboard.js` - Main onboarding orchestrator
- `duke/src/placement/PlacementDetector.js` - DOM structure analysis
- `duke/src/placement/CompetitorDetector.js` - Competitor detection
- `duke/src/index.js` - CLI entry point
- `duke/README.md` - Documentation

---

### **4. Granny Refocused**

**Location:** `/Users/loganlorenz/MulaOS/granny/`

**Removed:**
- ❌ Onboarding command (`/granny onboard`) → Moved to Duke
- ❌ Technical intelligence → Moved to Duke

**Kept:**
- ✅ Context command (`/granny context`)
- ✅ Business Intelligence
- ✅ Contextual Intelligence (sports calendar, rivalry detection)
- ✅ Affiliate-Specific Search Strategies
- ✅ Standalone Intelligence API (`granny-intelligence-api/`)

---

## 🏗️ **Architecture**

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
│                    "SURFERS" (Main Agents)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Sub-agents inform & enhance
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              MULAOS (POC Architecture)                       │
│                                                              │
│  ┌──────────────┐          ┌──────────────┐               │
│  │    GRANNY    │          │     DUKE     │               │
│  │   Context    │          │  Onboarding  │               │
│  │   Engine     │          │  Placement   │               │
│  │              │          │              │               │
│  │ Answers:     │          │ Answers:     │               │
│  │ "What does   │          │ "Where       │               │
│  │  this page   │          │  should we   │               │
│  │  mean?"      │          │  place        │               │
│  │              │          │  SmartScroll │               │
│  │              │          │  and what    │               │
│  │              │          │  pages are   │               │
│  │              │          │  eligible?"  │               │
│  └──────────────┘          └──────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 **Integration Points**

### **Granny → Sally (Product Selection)**
- Provides contextual intelligence via REST API
- Affiliate-specific search strategies (Fanatics + Amazon)
- Sports calendar intelligence (rivalry week, championships)

### **Duke → Taka (Deployment Control)**
- Provides placement intelligence (DOM selectors, eligibility)
- Competitor detection (beta test opportunities)
- Deployment readiness assessment

### **Duke → Pre-sales/Customer Success**
- Accelerates onboarding (2-3 weeks → 2 minutes)
- Answers: "Where should we place SmartScroll?"
- Identifies eligible pages and optimal placement

---

## 📂 **File Structure**

```
/Users/loganlorenz/MulaOS/
├── granny/                    # Granny Context Engine
│   ├── src/
│   │   ├── index.js          # CLI (context command only)
│   │   ├── context.js        # Business context analysis
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
│   │   ├── index.js          # CLI (onboard command)
│   │   ├── onboard.js        # Onboarding orchestrator
│   │   ├── placement/
│   │   │   ├── PlacementDetector.js
│   │   │   └── CompetitorDetector.js
│   │   ├── scrapers/         # Shared with Granny
│   │   ├── analyzers/        # Shared with Granny
│   │   └── healthcheck/      # Shared with Granny
│   └── README.md
│
└── memory-bank/
    └── agents/
        └── mulaos-architecture.md  # Architecture documentation
```

---

## 🎯 **Next Steps**

### **Phase 1: Testing (1 week)**
1. ⬜ Test Duke onboarding on ON3
2. ⬜ Test Granny context on EssentiallySports
3. ⬜ Validate placement detection accuracy
4. ⬜ Validate competitor detection accuracy

### **Phase 2: Integration (2 weeks)**
1. ⬜ Duke → Taka integration (placement intelligence)
2. ⬜ Granny → Sally integration (contextual intelligence)
3. ⬜ Web dashboard updates (show both agents)

### **Phase 3: Production (Future)**
1. ⬜ Engineering/product team reviews POC
2. ⬜ Sub-agents subsumed into main SDK agents
3. ⬜ Direct integration (no REST API needed)

---

## 💡 **Key Insights**

### **Why Split?**

1. **Separation of Concerns**
   - Granny = Context (what to show)
   - Duke = Placement (where to show)
   - Clean boundaries, focused responsibilities

2. **Different Use Cases**
   - Granny = Real-time intelligence (runs when mobilizing a page)
   - Duke = Pre-sales/onboarding (runs once per publisher)

3. **Different Integration Points**
   - Granny → Sally (product selection)
   - Duke → Taka (deployment control)

4. **POC Architecture**
   - MulaOS is proof-of-concept
   - Informs product strategy
   - Will be subsumed by engineering/product team

---

**Status:** ✅ Architecture Complete  
**Next:** Testing & Integration  
**Impact:** Accelerated onboarding + Context-aware product selection  
**Confidence:** High - clear separation of concerns, focused responsibilities
