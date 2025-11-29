# Granny Contextual Intelligence API

**Standalone service that provides contextual intelligence to Sally and other agents.**

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   GRANNY API SERVICE                     │
│                  (Standalone Service)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  POST /api/intelligence                                  │
│    Input: { domain, url, targetingRule }                │
│    Output: contextual intelligence + search strategies  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ REST API
                           ↓
        ┌──────────────────────────────────────┐
        │         SALLY AGENT                   │
        │      (Product Discovery)              │
        ├──────────────────────────────────────┤
        │                                       │
        │  1. Calls Granny API                 │
        │  2. Receives intelligence            │
        │  3. Uses affiliate-specific strategy │
        │  4. Searches products                │
        │                                       │
        └──────────────────────────────────────┘
```

---

## 🔌 API Specification

### **Endpoint:**
```
POST /api/intelligence
```

### **Request:**
```javascript
{
  domain: "on3.com",
  url: "/teams/ohio-state-buckeyes/news/michigan-preview",
  targetingRule: {
    search: "Ohio State Buckeyes merchandise",  // Base search
    credentials: {
      amazon: null,
      impact: "on3-impact"
    }
  }
}
```

### **Response:**
```javascript
{
  domain: "on3.com",
  url: "/teams/ohio-state-buckeyes/news/michigan-preview",
  timestamp: "2025-11-28T10:30:00Z",
  
  // Detected Context
  context: {
    event: "Ohio State vs. Michigan - Rivalry Week",
    sport: "cfb",
    team: "ohio-state",
    rival: "michigan",
    phase: "rivalry-week",
    urgency: "high",
    expected_lift: "3-4x CTR",
    duration: "7 days"
  },
  
  // Affiliate-Specific Search Strategies
  search_strategies: {
    
    // For Impact/Fanatics credentials
    impact: {
      applicable: true,  // This publisher has Impact credentials
      primary_search: "Beat Michigan",
      secondary_search: "Ohio State Rivalry",
      filters: {
        sport: "cfb",
        team: "ohio-state",
        tags: ["rivalry", "michigan"]
      },
      boost_keywords: ["beat", "rivalry", "game day"],
      confidence: 0.92,
      reasoning: "Rivalry week detected - Fanatics has specific rivalry merchandise"
    },
    
    // For Amazon credentials
    amazon: {
      applicable: false,  // This publisher doesn't have Amazon credentials
      primary_search: "ohio state beat michigan rivalry shirt",
      secondary_search: "ohio state michigan game day apparel",
      keywords: [
        "ohio state",
        "beat michigan",
        "rivalry",
        "buckeyes",
        "shirt"
      ],
      confidence: 0.88,
      reasoning: "Keyword-rich query optimized for Amazon e-commerce search"
    }
  },
  
  // Fallback strategies (if context detection fails)
  fallback_strategies: {
    impact: {
      search: "Ohio State",
      filters: { sport: "cfb", team: "ohio-state" }
    },
    amazon: {
      search: "ohio state buckeyes merchandise",
      category: "sports fan shop"
    }
  },
  
  // Metadata
  intelligence_metadata: {
    has_context: true,
    context_type: "rivalry-week",
    confidence_level: "high",
    recommendation: "Use contextual strategies for maximum lift"
  }
}
```

---

## 💻 Implementation

### **File Structure:**
```
granny-intelligence-api/
├── package.json
├── server.js                 # Express API server
├── src/
│   ├── GrannyIntelligence.js # Core intelligence engine
│   ├── ContextDetector.js    # Detects sports context
│   ├── StrategyGenerator.js  # Generates affiliate strategies
│   └── config/
│       ├── sports.json       # Sports calendar data
│       ├── teams.json        # Team/rival mappings
│       └── keywords.json     # Search optimization rules
├── .env.example
└── README.md
```

---

## 🚀 Sally Integration

### **Sally's Enhanced Search Flow:**

```javascript
// Sally's searchWorker.js

async function generateProductFeed(domain, url) {
  // 1. Get targeting rule from database
  const targetingRule = await getSiteTargeting(domain, url);
  
  // 2. Call Granny Intelligence API
  const intelligence = await fetch('http://granny-api:3001/api/intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: domain,
      url: url,
      targetingRule: targetingRule
    })
  }).then(r => r.json());
  
  console.log(`🏄‍♂️ Granny Intelligence:`);
  console.log(`   Context: ${intelligence.context?.event || 'Generic'}`);
  console.log(`   Urgency: ${intelligence.context?.urgency || 'medium'}`);
  console.log(`   Expected Lift: ${intelligence.context?.expected_lift || '1.0x'}`);
  
  // 3. Search each configured affiliate with Granny's strategy
  const allProducts = [];
  
  // Impact/Fanatics search
  if (targetingRule.credentials.impact && intelligence.search_strategies.impact.applicable) {
    const strategy = intelligence.intelligence_metadata.has_context
      ? intelligence.search_strategies.impact
      : intelligence.fallback_strategies.impact;
    
    console.log(`📦 Fanatics: "${strategy.primary_search}"`);
    console.log(`   Why: ${strategy.reasoning}`);
    
    const products = await searchImpact(
      strategy.primary_search,
      strategy.filters,
      targetingRule.credentials.impact
    );
    
    allProducts.push(...products.map(p => ({
      ...p,
      source: 'fanatics',
      context_enhanced: intelligence.intelligence_metadata.has_context
    })));
  }
  
  // Amazon search
  if (targetingRule.credentials.amazon && intelligence.search_strategies.amazon.applicable) {
    const strategy = intelligence.intelligence_metadata.has_context
      ? intelligence.search_strategies.amazon
      : intelligence.fallback_strategies.amazon;
    
    console.log(`🛒 Amazon: "${strategy.primary_search}"`);
    console.log(`   Why: ${strategy.reasoning}`);
    
    const products = await searchAmazon(
      strategy.primary_search,
      strategy.keywords,
      targetingRule.credentials.amazon
    );
    
    allProducts.push(...products.map(p => ({
      ...p,
      source: 'amazon',
      context_enhanced: intelligence.intelligence_metadata.has_context
    })));
  }
  
  // 4. Log intelligence used (for A/B testing)
  await logIntelligenceUsage({
    domain: domain,
    url: url,
    context_detected: intelligence.context?.event || null,
    strategies_used: Object.keys(intelligence.search_strategies).filter(
      k => intelligence.search_strategies[k].applicable
    ),
    product_count: allProducts.length
  });
  
  return allProducts;
}
```

---

## 📊 Benefits of Standalone Service

### **1. Separation of Concerns**
- ✅ Granny = Intelligence provider
- ✅ Sally = Product search executor
- ✅ Clear responsibilities

### **2. Reusability**
- ✅ Sally uses it for product search
- ✅ Taka uses it for placement optimization
- ✅ Occy uses it for monetization strategy
- ✅ Andy uses it for performance analysis

### **3. Independent Scaling**
- ✅ Deploy Granny as standalone service
- ✅ Scale independently of Sally
- ✅ Cache intelligence results
- ✅ Monitor intelligence quality separately

### **4. Easy A/B Testing**
```javascript
// Control: Generic search
const products = await searchFanatics("Ohio State");

// Treatment: Granny-enhanced search
const intelligence = await grannyAPI.getIntelligence(domain, url);
const products = await searchFanatics(intelligence.search_strategies.impact);

// Compare CTR lift
```

---

## 🔧 Deployment Options

### **Option 1: Standalone API Server**
```bash
# Deploy Granny API
cd granny-intelligence-api
npm install
npm start  # Runs on port 3001

# Sally calls it via HTTP
curl -X POST http://granny-api:3001/api/intelligence \
  -H "Content-Type: application/json" \
  -d '{"domain":"on3.com","url":"/teams/ohio-state/"}'
```

### **Option 2: Shared Library (Same Codebase)**
```javascript
// Sally imports Granny as a library
const GrannyIntelligence = require('@mula/granny-intelligence');

const intelligence = await GrannyIntelligence.analyze({
  domain: 'on3.com',
  url: '/teams/ohio-state/',
  targetingRule: rule
});
```

### **Option 3: Redis/Bull Queue**
```javascript
// Sally publishes intelligence request
await intelligenceQueue.add('get-intelligence', {
  domain: 'on3.com',
  url: '/teams/ohio-state/',
  targetingRule: rule
});

// Granny worker processes request
intelligenceQueue.process('get-intelligence', async (job) => {
  const intelligence = await GrannyIntelligence.analyze(job.data);
  return intelligence;
});

// Sally waits for result
const intelligence = await intelligenceQueue.waitForResult(jobId);
```

---

## 📈 Monitoring & Analytics

### **Granny Intelligence Metrics:**

```javascript
// Track intelligence quality
{
  timestamp: '2025-11-28T10:30:00Z',
  domain: 'on3.com',
  context_detected: 'rivalry-week',
  confidence: 0.92,
  strategies_generated: ['impact', 'amazon'],
  used_by_sally: true,
  products_found: {
    impact: 18,
    amazon: 32
  },
  ctr_baseline: 0.012,
  ctr_actual: 0.041,
  lift: 3.42,
  revenue_lift: 21000
}
```

### **Dashboard:**
- Intelligence requests per minute
- Context detection accuracy
- Average confidence scores
- CTR lift by context type
- Revenue attribution

---

## 🎯 Example Usage Scenarios

### **Scenario 1: Rivalry Week (ON3)**
```javascript
// Sally calls Granny
const intel = await grannyAPI.getIntelligence({
  domain: 'on3.com',
  url: '/teams/ohio-state-buckeyes/news/...'
});

// Granny responds:
{
  context: { event: "Rivalry Week", urgency: "high" },
  search_strategies: {
    impact: { primary_search: "Beat Michigan" }
  }
}

// Sally uses it:
const products = await searchFanatics("Beat Michigan", filters);

// Result: 3.4x CTR lift!
```

### **Scenario 2: Generic Page (Elite Daily)**
```javascript
// Sally calls Granny
const intel = await grannyAPI.getIntelligence({
  domain: 'elitedaily.com',
  url: '/fashion/summer-trends'
});

// Granny responds:
{
  context: null,  // No special context
  intelligence_metadata: { has_context: false },
  fallback_strategies: {
    amazon: { search: "fashion trends" }
  }
}

// Sally uses fallback:
const products = await searchAmazon("fashion trends");

// Result: Normal CTR (no lift, but no harm)
```

### **Scenario 3: Championship (EssentiallySports)**
```javascript
// Sally calls Granny
const intel = await grannyAPI.getIntelligence({
  domain: 'essentiallysports.com',
  url: '/nfl/super-bowl-preview'
});

// Granny responds:
{
  context: { event: "Super Bowl Week", urgency: "critical" },
  search_strategies: {
    amazon: { primary_search: "super bowl champions gear" }
  }
}

// Sally uses it:
const products = await searchAmazon("super bowl champions gear");

// Result: 4.3x CTR lift!
```

---

## 🚀 Next Steps

### **Phase 1: Build Granny Intelligence API (1 week)**
1. ✅ Core intelligence engine (done)
2. ⬜ REST API server (Express)
3. ⬜ Context detection module
4. ⬜ Strategy generation module
5. ⬜ Deploy as standalone service

### **Phase 2: Sally Integration (1 week)**
1. ⬜ Update Sally's searchWorker
2. ⬜ Add Granny API client
3. ⬜ Implement affiliate-specific search logic
4. ⬜ Add logging for A/B testing

### **Phase 3: Validation (1 week)**
1. ⬜ Deploy to ON3 (pilot publisher)
2. ⬜ A/B test: Generic vs. Granny-enhanced
3. ⬜ Measure actual CTR lift
4. ⬜ Validate 3-4x hypothesis

### **Phase 4: Scale (2 weeks)**
1. ⬜ Deploy to all publishers
2. ⬜ Granny daemon monitors sports calendar
3. ⬜ Auto-updates intelligence
4. ⬜ Performance dashboard

---

**Status:** 🎯 Architecture Defined!  
**Next:** Build Granny Intelligence API as standalone service  
**Impact:** Clean separation, Sally just consumes intelligence

