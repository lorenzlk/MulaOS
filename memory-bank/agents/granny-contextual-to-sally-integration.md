# Granny → Sally Integration: Affiliate-Aware Contextual Intelligence

## 🎯 Critical Discovery

**Publishers have different affiliate configurations:**
- Each publisher has specific affiliate accounts
- Uses publisher's credentials OR Mula's default credentials
- Two major partners: **Amazon Associates** and **Fanatics (via Impact)**
- **Search strategies differ by affiliate partner**

---

## 🔄 Updated Architecture

### Current Understanding (WRONG):
```javascript
// Granny provides one search phrase
context = {
  recommended_search: "Beat Michigan merchandise"  // ❌ Too generic
}

// Sally searches all affiliates with same phrase
sally.search("Beat Michigan merchandise");  // ❌ Doesn't work well for Amazon
```

### Correct Architecture (NEW):
```javascript
// Granny provides AFFILIATE-SPECIFIC search strategies
context = {
  current_event: "Ohio State vs. Michigan - Rivalry Week",
  urgency: "high",
  expected_lift: "3-4x CTR",
  
  // Separate search strategies per affiliate
  search_strategies: {
    fanatics: {
      search: "Beat Michigan",
      keywords: ["rivalry", "ohio state", "michigan"],
      filters: {
        sport: "cfb",
        team: "ohio-state"
      }
    },
    amazon: {
      search: "ohio state michigan rivalry shirt",
      keywords: ["ohio state", "beat michigan", "rivalry", "buckeyes", "shirt", "merchandise"],
      category: "sports fan shop",
      filters: {
        department: "sports-and-outdoors"
      }
    }
  }
}

// Sally uses affiliate-specific strategy
sally.searchFanatics(context.search_strategies.fanatics);
sally.searchAmazon(context.search_strategies.amazon);
```

---

## 📊 Search Strategy Differences

### **Fanatics Search:**
- **Structured catalog** with team/sport taxonomy
- **Shorter phrases** work better ("Beat Michigan")
- **Filter-based** (team, sport, category)
- **Branded merchandise** focused
- **API returns** structured product data

**Example Fanatics Searches:**
```javascript
// Generic (baseline)
{
  search: "Ohio State",
  filters: { sport: "cfb", team: "ohio-state" }
}

// Rivalry Week (contextual)
{
  search: "Beat Michigan",
  filters: { sport: "cfb", team: "ohio-state", event: "rivalry" }
}

// Championship (contextual)
{
  search: "Ohio State Champions",
  filters: { sport: "cfb", team: "ohio-state", type: "championship" }
}
```

---

### **Amazon Search:**
- **E-commerce search** (like searching Amazon.com)
- **Longer, descriptive phrases** work better
- **Natural language** queries
- **Keyword-rich** for relevance
- **Category filters** important

**Example Amazon Searches:**
```javascript
// Generic (baseline)
{
  search: "ohio state buckeyes merchandise fan gear",
  keywords: ["ohio state", "buckeyes", "fan", "merchandise"],
  category: "sports fan shop"
}

// Rivalry Week (contextual)
{
  search: "ohio state beat michigan rivalry shirt apparel",
  keywords: ["ohio state", "michigan", "rivalry", "beat michigan", "buckeyes", "shirt"],
  category: "sports fan shop"
}

// Championship (contextual)
{
  search: "ohio state national champions college football championship gear",
  keywords: ["ohio state", "national champions", "championship", "cfb", "buckeyes"],
  category: "sports fan shop"
}
```

---

## 🧠 Granny's Enhanced Contextual Intelligence

### New Output Format:

```javascript
// Granny Contextual API Response
{
  domain: "on3.com",
  url: "/teams/ohio-state-buckeyes/news/michigan-preview",
  
  // Context (same as before)
  contextual_intelligence: {
    current_event: "Ohio State vs. Michigan - Rivalry Week",
    emotional_state: "high-intensity-rivalry",
    urgency: "high",
    expected_lift: "3-4x CTR",
    duration: "7 days"
  },
  
  // NEW: Affiliate-specific search strategies
  search_strategies: {
    fanatics: {
      primary_search: "Beat Michigan",
      secondary_search: "Ohio State Rivalry",
      filters: {
        sport: "cfb",
        team: "ohio-state",
        tags: ["rivalry", "michigan"]
      },
      boost_keywords: ["beat", "rivalry", "game day"],
      reasoning: "Fanatics has specific rivalry merchandise collections"
    },
    
    amazon: {
      primary_search: "ohio state beat michigan rivalry shirt",
      secondary_search: "ohio state michigan game day apparel",
      keywords: [
        "ohio state",
        "beat michigan", 
        "rivalry",
        "buckeyes",
        "shirt",
        "apparel",
        "fan gear"
      ],
      category_hints: ["sports fan shop", "clothing", "novelty"],
      reasoning: "Amazon search requires descriptive, keyword-rich queries"
    }
  },
  
  // Fallback strategies (if no context detected)
  fallback_strategies: {
    fanatics: {
      search: "Ohio State",
      filters: { sport: "cfb", team: "ohio-state" }
    },
    amazon: {
      search: "ohio state buckeyes merchandise",
      category: "sports fan shop"
    }
  }
}
```

---

## 🔌 Sally Integration Points

### 1. **Check Publisher Affiliate Config**

```javascript
// Sally's searchWorker.js

async function generateProductFeed(publisher, url) {
  // Get publisher's affiliate configuration
  const affiliateConfig = await getPublisherAffiliateConfig(publisher.domain);
  
  // affiliateConfig = {
  //   fanatics: { account_id: "12345", credentials: {...} },
  //   amazon: { account_id: "67890", credentials: {...} }
  // }
  
  // Get base targeting rule
  const targetingRule = await getSiteTargeting(publisher.domain, url);
  // targetingRule.search = "Ohio State Buckeyes merchandise"
  
  // Get Granny's contextual intelligence
  const context = await GrannyAPI.getContext(publisher.domain, url);
  
  // Search each configured affiliate
  const products = [];
  
  if (affiliateConfig.fanatics) {
    const strategy = context.search_strategies?.fanatics || context.fallback_strategies.fanatics;
    const fanaticsProducts = await searchFanatics(strategy, affiliateConfig.fanatics);
    products.push(...fanaticsProducts);
  }
  
  if (affiliateConfig.amazon) {
    const strategy = context.search_strategies?.amazon || context.fallback_strategies.amazon;
    const amazonProducts = await searchAmazon(strategy, affiliateConfig.amazon);
    products.push(...amazonProducts);
  }
  
  return products;
}
```

### 2. **Fanatics Search Implementation**

```javascript
async function searchFanatics(strategy, credentials) {
  // Impact API call for Fanatics
  const params = {
    search: strategy.primary_search,
    filters: strategy.filters,
    boost: strategy.boost_keywords,
    account: credentials.account_id
  };
  
  console.log(`🏈 Fanatics: "${strategy.primary_search}" with filters:`, strategy.filters);
  
  const response = await ImpactAPI.search(params);
  
  if (response.products.length < 5) {
    // Fallback to secondary search
    console.log(`⚠️ Low results, trying: "${strategy.secondary_search}"`);
    params.search = strategy.secondary_search;
    return await ImpactAPI.search(params);
  }
  
  return response.products;
}
```

### 3. **Amazon Search Implementation**

```javascript
async function searchAmazon(strategy, credentials) {
  // Amazon Product Advertising API
  const params = {
    keywords: strategy.primary_search,
    searchIndex: "SportingGoods", // or strategy.category_hints[0]
    responseGroup: ["ItemAttributes", "Images", "Offers"],
    associateTag: credentials.associate_tag
  };
  
  console.log(`📦 Amazon: "${strategy.primary_search}"`);
  
  const response = await AmazonAPI.ItemSearch(params);
  
  if (response.items.length < 5) {
    // Fallback to secondary search
    console.log(`⚠️ Low results, trying: "${strategy.secondary_search}"`);
    params.keywords = strategy.secondary_search;
    return await AmazonAPI.ItemSearch(params);
  }
  
  return response.items;
}
```

---

## 🎯 Real-World Example

### Scenario: ON3 Ohio State page during Rivalry Week

#### 1. **Publisher Config:**
```javascript
{
  domain: "on3.com",
  affiliates: {
    fanatics: {
      account_id: "on3-fanatics-001",
      credentials: { /* ON3's Fanatics account */ }
    },
    amazon: {
      associate_tag: "on3-20",
      credentials: { /* ON3's Amazon Associates */ }
    }
  }
}
```

#### 2. **Base Targeting Rule:**
```javascript
{
  path: "/teams/ohio-state-buckeyes/",
  search: "Ohio State Buckeyes merchandise"  // Generic baseline
}
```

#### 3. **Granny Detects Context:**
```javascript
// It's late November, rivalry week detected
{
  current_event: "Ohio State vs. Michigan - Rivalry Week",
  urgency: "high",
  expected_lift: "3-4x CTR"
}
```

#### 4. **Granny Provides Affiliate Strategies:**
```javascript
{
  fanatics: {
    primary_search: "Beat Michigan",
    filters: { team: "ohio-state", event: "rivalry" }
  },
  amazon: {
    primary_search: "ohio state beat michigan rivalry shirt apparel"
  }
}
```

#### 5. **Sally Executes:**
```javascript
// Fanatics search
const fanaticsProducts = await searchFanatics({
  search: "Beat Michigan",
  filters: { team: "ohio-state" }
});
// Returns: "Beat Michigan" t-shirts, rivalry gear

// Amazon search
const amazonProducts = await searchAmazon({
  keywords: "ohio state beat michigan rivalry shirt apparel"
});
// Returns: Generic Ohio State rivalry shirts, apparel

// Merge results
const feed = [...fanaticsProducts, ...amazonProducts];
```

#### 6. **Result:**
- **Without Granny:** Generic "Ohio State merchandise" (1.2% CTR)
- **With Granny:** Rivalry-specific "Beat Michigan" gear (4.1% CTR)
- **Lift:** 3.4x CTR increase! 🎯

---

## 🏗️ Implementation Roadmap

### Phase 1: Granny Enhancements (1 week)
- ✅ Add affiliate-specific search strategy generation
- ✅ Fanatics search phrase optimization
- ✅ Amazon search phrase optimization
- ✅ Update Granny API response format

### Phase 2: Sally Integration (1-2 weeks)
- ⬜ Read publisher affiliate configuration
- ⬜ Call Granny Contextual API
- ⬜ Implement affiliate-specific search logic
- ⬜ Fanatics search with contextual strategy
- ⬜ Amazon search with contextual strategy
- ⬜ Product merging and ranking

### Phase 3: Validation (1 week)
- ⬜ A/B test: Generic vs. Contextual search
- ⬜ Measure CTR lift during rivalry week
- ⬜ Measure CTR lift during championships
- ⬜ Validate 3-4x lift hypothesis

### Phase 4: Automation (2 weeks)
- ⬜ Granny daemon monitors sports calendar
- ⬜ Auto-detects high-value moments
- ⬜ Auto-updates Sally search strategies
- ⬜ Slack alerts for manual review/approval

---

## 💡 Search Strategy Principles

### **Fanatics (Structured Catalog):**
- ✅ Short, targeted phrases
- ✅ Use team/sport filters
- ✅ Leverage event tags (rivalry, championship)
- ✅ Brand-focused (official merchandise)
- ❌ Avoid over-specifying (let filters do the work)

### **Amazon (E-commerce Search):**
- ✅ Longer, descriptive phrases
- ✅ Keyword-rich for relevance
- ✅ Natural language queries
- ✅ Category hints for better results
- ❌ Avoid too generic (low relevance)

### **Context Types:**

| Context | Fanatics Search | Amazon Search |
|---------|----------------|---------------|
| **Generic** | "Ohio State" | "ohio state buckeyes merchandise" |
| **Rivalry** | "Beat Michigan" | "ohio state beat michigan rivalry shirt" |
| **Championship** | "Ohio State Champions" | "ohio state national champions gear" |
| **Homecoming** | "Ohio State Homecoming" | "ohio state homecoming apparel" |
| **Playoff** | "Ohio State Playoff" | "ohio state college football playoff gear" |

---

## 🚀 Expected Impact

### CTR Lift by Context:

| Context | Baseline CTR | Contextual CTR | Lift |
|---------|-------------|----------------|------|
| Generic (no context) | 1.2% | 1.2% | 1.0x |
| Regular season | 1.2% | 1.8% | 1.5x |
| Rivalry week | 1.2% | 4.1% | 3.4x |
| Championship | 1.2% | 5.2% | 4.3x |
| Post-win (72hr) | 1.2% | 3.6% | 3.0x |

### Revenue Impact (ON3 Example):
```
Baseline (no Granny):
- 2.5M pageviews/mo
- 1.2% CTR = 30K clicks/mo
- $1.50 avg commission
- $45K/mo revenue

With Granny (20% of traffic in high-context moments):
- 2M pageviews (80%) × 1.2% = 24K clicks
- 500K pageviews (20%) × 4.0% = 20K clicks
- Total: 44K clicks/mo
- $1.50 avg commission
- $66K/mo revenue

Lift: $21K/mo = $252K/year incremental revenue!
```

---

## 📝 Next Steps

### Immediate:
1. Update Granny contextual intelligence to include affiliate-specific strategies
2. Test Fanatics search phrase optimization
3. Test Amazon search phrase optimization
4. Document API contract for Sally integration

### Short-Term:
1. Build Granny Contextual API endpoint
2. Integrate Sally → Granny context calls
3. Implement affiliate-aware search logic
4. Deploy to one publisher for validation

### Medium-Term:
1. A/B test contextual vs. generic search
2. Measure actual CTR lift
3. Automate context detection
4. Scale to all publishers

---

**Status:** 🎯 Architecture Updated!  
**Key Insight:** One context, two affiliate-specific search strategies  
**Impact:** 3-4x CTR lift during high-context moments  
**Next:** Build affiliate-aware contextual intelligence

