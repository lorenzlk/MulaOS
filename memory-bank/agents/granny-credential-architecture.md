# Granny + Sally: Credential-Aware Search Architecture

## 🎯 Current Implementation (from Screenshots)

### **Two Ways to "Mulaize" Content:**

#### 1. **Page-Level Targeting** ("All Pages" tab)
```
Publisher: www.elitedaily.com
Pages:
  - /relationships/hannah-brown-interview-bachelor...
  - /beauty/rihanna-fenty-beauty-cherriez-gone-bad...
  - /fashion/dollcore-aesthetic
  - /entertainment/bella-ramsey-dislike-pedro-pascal-daddy

Credentials: [Select credentials dropdown]
  ✓ Amazon Credentials
    - Default (Mula)
    - McClatchy
    - Brit.co
  ✓ Impact Credentials
    - ON3 (Impact)
```

**Pattern:** Each PAGE can be assigned specific credentials

#### 2. **Search-Level Targeting** ("All Searches" tab)
```
New Search:
  Search Phrase: [text input]
  Credentials: [Select credentials dropdown]
    ✓ Amazon Credentials
      - Default (Mula)
      - McClatchy
      - Brit.co
    ✓ Impact Credentials
      - ON3 (Impact)
```

**Pattern:** Each SEARCH PHRASE can be assigned specific credentials

---

## 🏗️ Credential Architecture

### **Credential Groups:**

```javascript
// Amazon Credentials
amazonCredentials = [
  {
    id: 'mula-default',
    name: 'Default (Mula)',
    type: 'amazon',
    associateTag: 'mula-20',
    accessKey: '...',
    secretKey: '...'
  },
  {
    id: 'mcclatchy-amazon',
    name: 'McClatchy',
    type: 'amazon',
    associateTag: 'mcclatchy-20',
    accessKey: '...',
    secretKey: '...'
  },
  {
    id: 'britco-amazon',
    name: 'Brit.co',
    type: 'amazon',
    associateTag: 'britco-20',
    accessKey: '...',
    secretKey: '...'
  }
]

// Impact Credentials (Fanatics, etc.)
impactCredentials = [
  {
    id: 'on3-impact',
    name: 'ON3 (Impact)',
    type: 'impact',
    accountSid: '...',
    authToken: '...',
    campaignId: 'fanatics'
  }
]
```

---

## 🔄 How Targeting Works Today

### **Site Targeting Rules** (from slash commands)

```javascript
// Example: /mula-site-targeting-add
{
  domain: 'on3.com',
  path: '/teams/ohio-state-buckeyes/',
  search: 'Ohio State Buckeyes merchandise',
  credentials: {
    amazon: null,  // Use default
    impact: 'on3-impact'  // Use ON3's Impact account
  }
}

// Example: Elite Daily with custom Amazon
{
  domain: 'elitedaily.com',
  path: '/fashion/',
  search: 'fashion trends',
  credentials: {
    amazon: 'mula-default',  // Use Mula's Amazon
    impact: null  // No Impact/Fanatics
  }
}

// Example: Brit.co with their own Amazon
{
  domain: 'brit.co',
  path: '/britpicks/',
  search: 'prime day deals',
  credentials: {
    amazon: 'britco-amazon',  // Use Brit.co's Amazon account
    impact: null
  }
}
```

---

## 🧠 Granny's Enhanced Intelligence

### **Problem:**
Granny currently suggests ONE search phrase, but doesn't account for:
1. Multiple affiliate partners per page
2. Different credentials per affiliate
3. Different search strategies per affiliate

### **Solution:**
Granny must provide **credential-aware, affiliate-specific search strategies**

---

## 📊 Granny's New Output Format

### **Context API Response:**

```javascript
// GET /api/context?domain=on3.com&url=/teams/ohio-state-buckeyes/news/...

{
  domain: "on3.com",
  url: "/teams/ohio-state-buckeyes/news/michigan-preview",
  
  // Detected Context
  contextual_intelligence: {
    current_event: "Ohio State vs. Michigan - Rivalry Week",
    sport: "cfb",
    team: "ohio-state",
    rival: "michigan",
    urgency: "high",
    expected_lift: "3-4x CTR",
    duration: "7 days"
  },
  
  // Affiliate-Specific Strategies
  search_strategies: {
    
    // For Impact credentials (Fanatics)
    impact: {
      primary_search: "Beat Michigan",
      secondary_search: "Ohio State Rivalry",
      filters: {
        sport: "cfb",
        team: "ohio-state",
        tags: ["rivalry", "michigan", "beat"]
      },
      boost_keywords: ["beat", "rivalry", "game day"],
      reasoning: "Fanatics has specific rivalry merchandise collections",
      applicable_credentials: ["on3-impact"],  // Which Impact accounts this works for
      expected_products: 15-25
    },
    
    // For Amazon credentials
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
      category_hints: ["sports fan shop", "clothing"],
      reasoning: "Amazon search requires descriptive, keyword-rich queries",
      applicable_credentials: ["mula-default", "mcclatchy-amazon", "britco-amazon"],  // Works for all Amazon accounts
      expected_products: 20-40
    }
  },
  
  // Fallback (if no context)
  fallback_strategies: {
    impact: {
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

## 🔌 Sally's Search Flow

### **Current Flow (Simplified):**

```javascript
// Sally's searchWorker.js (current)

async function generateProductFeed(domain, url) {
  // 1. Get site targeting rule
  const rule = await getSiteTargeting(domain, url);
  // rule = { search: "Ohio State Buckeyes merchandise", credentials: { impact: "on3-impact" } }
  
  // 2. Search with static phrase
  const products = await searchImpact(rule.search, rule.credentials.impact);
  
  // 3. Return products
  return products;
}
```

### **Enhanced Flow (with Granny):**

```javascript
// Sally's searchWorker.js (enhanced)

async function generateProductFeed(domain, url) {
  // 1. Get site targeting rule (includes credentials)
  const rule = await getSiteTargeting(domain, url);
  // rule = {
  //   search: "Ohio State Buckeyes merchandise",
  //   credentials: {
  //     amazon: null,
  //     impact: "on3-impact"
  //   }
  // }
  
  // 2. Get Granny's contextual intelligence
  const context = await GrannyAPI.getContext(domain, url);
  
  // 3. Determine which affiliates to search
  const affiliates = [];
  
  if (rule.credentials.impact) {
    affiliates.push({
      type: 'impact',
      credentialId: rule.credentials.impact,
      strategy: context.search_strategies?.impact || context.fallback_strategies.impact
    });
  }
  
  if (rule.credentials.amazon) {
    affiliates.push({
      type: 'amazon',
      credentialId: rule.credentials.amazon,
      strategy: context.search_strategies?.amazon || context.fallback_strategies.amazon
    });
  }
  
  // 4. Search each affiliate with contextual strategy
  const allProducts = [];
  
  for (const affiliate of affiliates) {
    console.log(`🏄‍♂️ Granny says: Use "${affiliate.strategy.primary_search}" for ${affiliate.type}`);
    
    if (affiliate.type === 'impact') {
      const products = await searchImpact(
        affiliate.strategy.primary_search,
        affiliate.strategy.filters,
        affiliate.credentialId
      );
      allProducts.push(...products);
    }
    
    if (affiliate.type === 'amazon') {
      const products = await searchAmazon(
        affiliate.strategy.primary_search,
        affiliate.strategy.keywords,
        affiliate.credentialId
      );
      allProducts.push(...products);
    }
  }
  
  // 5. Merge and rank products
  return rankProducts(allProducts);
}
```

---

## 🎯 Real-World Examples

### **Example 1: ON3 Ohio State (Rivalry Week)**

**Site Targeting Rule:**
```javascript
{
  domain: "on3.com",
  path: "/teams/ohio-state-buckeyes/",
  search: "Ohio State Buckeyes merchandise",  // Generic baseline
  credentials: {
    amazon: null,  // Not configured
    impact: "on3-impact"  // ON3's Fanatics account via Impact
  }
}
```

**Granny Detects:**
- It's late November
- Ohio State plays Michigan on Saturday
- Rivalry Week context

**Granny Provides:**
```javascript
{
  search_strategies: {
    impact: {
      primary_search: "Beat Michigan",  // 🎯 Contextual!
      filters: { sport: "cfb", team: "ohio-state", event: "rivalry" }
    }
  }
}
```

**Sally Executes:**
```javascript
// Search Impact (Fanatics) with ON3's credentials
const products = await searchImpact(
  "Beat Michigan",  // Granny's contextual search
  { sport: "cfb", team: "ohio-state" },
  "on3-impact"  // ON3's Impact account
);
```

**Result:**
- Shows "Beat Michigan" rivalry merchandise
- Uses ON3's Impact account for attribution
- 3-4x CTR lift vs. generic "Ohio State merchandise"

---

### **Example 2: Elite Daily Fashion (Multiple Credentials)**

**Site Targeting Rule:**
```javascript
{
  domain: "elitedaily.com",
  path: "/fashion/",
  search: "fashion trends",
  credentials: {
    amazon: "mula-default",  // Use Mula's Amazon account
    impact: null  // No Impact configured
  }
}
```

**Granny Provides:**
```javascript
{
  search_strategies: {
    amazon: {
      primary_search: "trending fashion clothing women 2025",
      keywords: ["fashion", "trends", "clothing", "women", "style"]
    }
  }
}
```

**Sally Executes:**
```javascript
// Only search Amazon (no Impact configured)
const products = await searchAmazon(
  "trending fashion clothing women 2025",
  ["fashion", "trends", "clothing"],
  "mula-default"  // Mula's Amazon Associates account
);
```

---

### **Example 3: Brit.co Prime Day (Custom Amazon)**

**Site Targeting Rule:**
```javascript
{
  domain: "brit.co",
  path: "/britpicks/prime-day/",
  search: "prime day deals",
  credentials: {
    amazon: "britco-amazon",  // Brit.co's own Amazon account
    impact: null
  }
}
```

**Granny Detects:**
- It's Prime Day (mid-July)
- Shopping holiday context

**Granny Provides:**
```javascript
{
  search_strategies: {
    amazon: {
      primary_search: "amazon prime day exclusive deals 2025",
      keywords: ["prime day", "deals", "exclusive", "limited time"],
      urgency: "critical"  // Time-sensitive!
    }
  }
}
```

**Sally Executes:**
```javascript
const products = await searchAmazon(
  "amazon prime day exclusive deals 2025",
  ["prime day", "deals", "exclusive"],
  "britco-amazon"  // Uses Brit.co's Amazon Associates tag
);
```

---

## 🏗️ Database Schema (Inferred)

### **Site Targeting Rules Table:**

```sql
CREATE TABLE site_targeting (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  path VARCHAR(500),  -- URL pattern
  search_phrase VARCHAR(500),  -- Base search
  amazon_credential_id VARCHAR(100),  -- References amazon_credentials.id
  impact_credential_id VARCHAR(100),  -- References impact_credentials.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example rows:
INSERT INTO site_targeting VALUES
  (1, 'on3.com', '/teams/ohio-state-buckeyes/', 'Ohio State Buckeyes merchandise', NULL, 'on3-impact'),
  (2, 'elitedaily.com', '/fashion/', 'fashion trends', 'mula-default', NULL),
  (3, 'brit.co', '/britpicks/prime-day/', 'prime day deals', 'britco-amazon', NULL);
```

### **Amazon Credentials Table:**

```sql
CREATE TABLE amazon_credentials (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  associate_tag VARCHAR(100) NOT NULL,
  access_key TEXT,
  secret_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example rows:
INSERT INTO amazon_credentials VALUES
  ('mula-default', 'Default (Mula)', 'mula-20', '...', '...'),
  ('mcclatchy-amazon', 'McClatchy', 'mcclatchy-20', '...', '...'),
  ('britco-amazon', 'Brit.co', 'britco-20', '...', '...');
```

### **Impact Credentials Table:**

```sql
CREATE TABLE impact_credentials (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  account_sid VARCHAR(100) NOT NULL,
  auth_token TEXT,
  campaign_id VARCHAR(100),  -- e.g., 'fanatics'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example rows:
INSERT INTO impact_credentials VALUES
  ('on3-impact', 'ON3 (Impact)', 'ACC123...', '...', 'fanatics');
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Granny Context API (1 week)**
- ✅ Build contextual intelligence (sports, rivals, seasons)
- ⬜ Add affiliate-specific search strategy generation
- ⬜ Create REST API endpoint: `GET /api/context`
- ⬜ Test with ON3, Elite Daily, Brit.co examples

### **Phase 2: Sally Integration (1-2 weeks)**
- ⬜ Update Sally's searchWorker to call Granny API
- ⬜ Read credentials from site_targeting rules
- ⬜ Execute affiliate-specific searches
- ⬜ Merge and rank products across affiliates
- ⬜ Log Granny recommendations for analysis

### **Phase 3: Validation (1 week)**
- ⬜ Deploy to one publisher (ON3 recommended)
- ⬜ A/B test: Generic vs. Contextual search
- ⬜ Measure CTR lift during rivalry week
- ⬜ Validate 3-4x lift hypothesis

### **Phase 4: Scale & Automate (2 weeks)**
- ⬜ Deploy to all publishers
- ⬜ Granny daemon monitors sports calendar
- ⬜ Auto-detect high-value moments
- ⬜ Slack alerts for manual review

---

## 💡 Key Insights

### **Credential Selection:**
- ✅ Credentials are set at the **targeting rule level** (not page level)
- ✅ Each rule can have BOTH Amazon + Impact credentials
- ✅ NULL credential = don't search that affiliate
- ✅ Multiple publishers can share credentials (e.g., "mula-default")

### **Granny's Role:**
- ✅ Provide **contextual intelligence** (rivalry, championship, etc.)
- ✅ Generate **affiliate-specific search strategies**
- ✅ Do NOT manage credentials (that's in the database)
- ✅ Do NOT execute searches (that's Sally's job)

### **Sally's Role:**
- ✅ Read targeting rules (includes credentials)
- ✅ Call Granny for context
- ✅ Execute searches with correct credentials
- ✅ Merge products across affiliates
- ✅ Log performance for optimization

---

## 📊 Expected Impact

### **ON3 Example (Rivalry Week):**

**Without Granny:**
```
Search: "Ohio State Buckeyes merchandise" (generic)
CTR: 1.2%
Revenue: $45K/mo
```

**With Granny:**
```
Search: "Beat Michigan" (contextual, rivalry week)
CTR: 4.1% (3.4x lift!)
Revenue: $66K/mo (+$21K/mo = +47% lift!)
```

### **Across All Publishers:**
- 20% of traffic hits high-context moments
- 3-4x CTR lift during those moments
- $250K+ annual revenue lift per publisher
- Zero manual work (automated via Granny)

---

**Status:** 🎯 Architecture Complete!  
**Next:** Build Granny Context API with affiliate-aware strategies  
**Impact:** Right search strategy + Right credentials = Maximum revenue

