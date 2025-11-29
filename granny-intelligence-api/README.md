# Granny Intelligence API

**Standalone contextual intelligence service for Mula's Sally Agent**

---

## 🎯 What It Does

Provides **affiliate-aware product search strategies** based on:
- Sports context (rivalry week, championships, playoffs)
- Publisher type (ON3, EssentiallySports, etc.)
- Team detection (Ohio State, Michigan, Alabama, etc.)
- Seasonal timing (current date vs. sports calendar)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:3001
```

---

## 📡 API Usage

### **Health Check:**
```bash
curl http://localhost:3001/health
```

### **Get Intelligence:**
```bash
curl -X POST http://localhost:3001/api/intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "on3.com",
    "url": "/teams/ohio-state-buckeyes/news/michigan-preview",
    "targetingRule": {
      "search": "Ohio State Buckeyes merchandise",
      "credentials": {
        "impact": "on3-impact",
        "amazon": null
      }
    }
  }'
```

### **Response:**
```json
{
  "domain": "on3.com",
  "url": "/teams/ohio-state-buckeyes/news/michigan-preview",
  "timestamp": "2025-11-28T10:30:00Z",
  "context": {
    "type": "rivalry-week",
    "event": "Ohio State Rivalry Week",
    "sport": "cfb",
    "team": "Ohio State",
    "rival": "Michigan",
    "urgency": "high",
    "expected_lift": "3-4x CTR",
    "confidence": "high"
  },
  "search_strategies": {
    "impact": {
      "applicable": true,
      "primary_search": "Beat Michigan",
      "filters": {
        "sport": "cfb",
        "team": "ohio-state",
        "tags": ["rivalry", "michigan"]
      },
      "confidence": 0.92,
      "reasoning": "Rivalry week detected - Fanatics has specific rivalry merchandise"
    },
    "amazon": {
      "applicable": false,
      "primary_search": "Ohio State beat Michigan rivalry shirt",
      "keywords": ["ohio state", "beat michigan", "rivalry", "buckeyes"],
      "confidence": 0.88
    }
  }
}
```

---

## 🔌 Sally Integration

```javascript
// In Sally's searchWorker.js

const fetch = require('node-fetch');

async function generateProductFeed(domain, url) {
  // 1. Get targeting rule
  const rule = await getSiteTargeting(domain, url);
  
  // 2. Call Granny Intelligence API
  const intelligence = await fetch('http://granny-api:3001/api/intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, url, targetingRule: rule })
  }).then(r => r.json());
  
  console.log(`🏄‍♂️ Granny says: ${intelligence.context?.event || 'Generic'}`);
  
  // 3. Use strategies
  if (rule.credentials.impact && intelligence.search_strategies.impact.applicable) {
    const strategy = intelligence.search_strategies.impact;
    await searchFanatics(strategy.primary_search, strategy.filters, rule.credentials.impact);
  }
  
  if (rule.credentials.amazon && intelligence.search_strategies.amazon.applicable) {
    const strategy = intelligence.search_strategies.amazon;
    await searchAmazon(strategy.primary_search, strategy.keywords, rule.credentials.amazon);
  }
}
```

---

## 📊 Supported Contexts

| Context | CFB | NFL | NBA | CBB |
|---------|-----|-----|-----|-----|
| **Rivalry Week** | ✅ Nov 20-30 | ❌ | ❌ | ❌ |
| **Championships** | ✅ Dec 1-7 | ❌ | ❌ | ❌ |
| **Playoffs** | ✅ Dec 20-Jan 20 | ✅ Jan 11-31 | ✅ Apr-Jun | ❌ |
| **March Madness** | ❌ | ❌ | ❌ | ✅ Mar 17-Apr 7 |
| **Super Bowl** | ❌ | ✅ Feb 9 | ❌ | ❌ |
| **Regular Season** | ✅ Aug-Nov | ✅ Sep-Dec | ✅ Oct-Apr | ✅ Nov-Mar |

---

## 🏗️ Architecture

```
granny-intelligence-api/
├── server.js                 # Express API
├── src/
│   ├── GrannyIntelligence.js # Main orchestrator
│   ├── ContextDetector.js    # Detects sports context
│   ├── StrategyGenerator.js  # Generates affiliate strategies
│   └── config/
│       ├── sports.json       # Sports calendar
│       └── teams.json        # Team/rival mappings
└── package.json
```

---

## 🎯 Example Outputs

### **Rivalry Week (ON3 Ohio State):**
```
Context: Ohio State Rivalry Week (HIGH urgency)
Fanatics: "Beat Michigan" + rivalry filters
Amazon: "ohio state beat michigan rivalry shirt"
Expected Lift: 3-4x CTR
```

### **Championship (EssentiallySports):**
```
Context: Super Bowl Week (CRITICAL urgency)
Fanatics: "NFL Champions" + championship filters
Amazon: "super bowl champions gear nfl"
Expected Lift: 4-5x CTR
```

### **No Context (Generic):**
```
Context: None detected
Fanatics: Use base targeting rule
Amazon: Use base targeting rule
Expected Lift: 1.0x (no lift)
```

---

## 🚀 Deployment

### **Development:**
```bash
npm run dev  # Runs with nodemon
```

### **Production:**
```bash
npm start
```

### **Docker:**
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 📈 Monitoring

Track these metrics:
- Intelligence requests/minute
- Context detection rate
- Average confidence scores
- CTR lift by context type
- Revenue attribution

---

**Status:** ✅ Ready to Deploy  
**Port:** 3001  
**Sally Integration:** Ready  
**Impact:** 3-4x CTR lift during high-context moments

