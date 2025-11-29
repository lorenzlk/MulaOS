# Granny - Publisher Context Intelligence Agent

**Named After**: [LeRoy "Granny" Grannis](https://en.wikipedia.org/wiki/LeRoy_Grannis) - "Godfather of Surf Photography"

**Why Granny?**: Just as Granny Grannis understood surf culture deeply—knew when the waves were perfect, understood the surfers, captured the perfect moment—Granny the agent understands publishers holistically and knows the perfect moment for engagement and monetization.

---

## Mission

**Be the Publisher Context Engine that answers: "What does this page mean relative to every other permutation you can think of?"**

When mobilizing a page, Granny gets the context of everything else:
- Time of year
- What's going on in a season or show
- What would a fan of that thing know about
- Something that we can market to

This contextual intelligence complements what we can do on the search side with affiliates.

---

## Core Capabilities

### 1. **Contextual Intelligence** (Real-Time Pulse)

**What's Happening Now:**
- **Sports Context** (ON3, sports publishers)
  - Championship games, rivalry matchups, homecoming weeks
  - Player transfers, coaching changes, recruiting news
  - Playoff implications, rankings movements
  - Emotional moments (upsets, comebacks, heartbreaks)

- **Seasonal Context** (all publishers)
  - Holiday shopping season (Q4)
  - Back-to-school (Aug-Sep)
  - Summer travel season
  - Industry-specific cycles (Fashion Week, CES, Awards season)

- **Cultural Context**
  - Breaking news and trending topics
  - Viral moments and memes
  - Social media sentiment
  - Audience emotional state

**Value**: Enables dynamic product recommendations that match the moment
- Championship → "National Champions celebration gear"
- Rivalry week → "Beat [Rival] merchandise"
- Holiday season → "Gift guides" and seasonal products
- Breaking news → Trend-reactive product feeds

---

### 2. **Business Intelligence**

**Strategic Understanding:**
- Revenue model (display ads, affiliate, subscription)
- Publisher type (sports-focused, content publisher, etc.)
- Market position and competitive landscape
- Tech stack and deployment readiness
- Monetization maturity scoring

**Value**: Informs pre-sales, onboarding, and customer success strategies

---

### 3. **Affiliate-Specific Search Strategies**

**Platform-Aware Strategies:**
- **Fanatics (Impact)**: Short phrases + filters (structured catalog)
  - Example: "Beat Michigan" with filters `{sport: "cfb", team: "ohio-state"}`
- **Amazon Associates**: Long, keyword-rich queries (e-commerce search)
  - Example: "Ohio State beat Michigan rivalry shirt championship gear"

**Value**: Optimizes product search for each affiliate's API/site search behavior

---

## Architecture

### Sub-Agent Under Surfers

```
┌─────────────────────────────────────────┐
│         SURFERS (Main Agents)           │
│  Sally  Taka  Andy  Occy  Cal  Weston  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      SUB-AGENTS (Ecosystem)             │
│  ┌──────────┐      ┌──────────┐        │
│  │  GRANNY  │      │   DUKE   │        │
│  │ Context  │      │Onboarding│        │
│  │ Engine   │      │ Placement│        │
│  └──────────┘      └──────────┘        │
└─────────────────────────────────────────┘
```

**Key Principle**: MulaOS is a **POC architecture** that informs product strategy. Granny and Duke are sub-agents that will be subsumed by the engineering/product team, not integrated directly into the SDK.

**Integration**: Granny provides contextual intelligence to Sally (product selection) via REST API.

---

## Usage

### CLI Commands

```bash
# Context analysis
node src/index.js context <domain>

# Example
node src/index.js context on3.com
```

### Programmatic API

```javascript
const { GrannyContext } = require('./src/context');

const granny = new GrannyContext();
const results = await granny.analyze('on3.com');

console.log(results.contextual_intelligence);
console.log(results.search_strategies);
```

### Standalone Intelligence API

Granny also runs as a standalone REST API service:

```bash
cd granny-intelligence-api
npm start
# Running on http://localhost:3001
```

**Endpoints:**
- `POST /api/intelligence` - Get contextual intelligence + search strategies
- `GET /health` - Health check

---

## Output Structure

```json
{
  "domain": "on3.com",
  "contextual_intelligence": {
    "sports_context": [
      {
        "type": "rivalry-week",
        "event": "Ohio State Rivalry Week",
        "sport": "cfb",
        "team": "Ohio State",
        "rival": "Michigan",
        "urgency": "high",
        "expected_lift": "3-4x CTR",
        "confidence": "high"
      }
    ],
    "seasonal_context": [],
    "cultural_context": []
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
      "confidence": 0.92
    },
    "amazon": {
      "applicable": true,
      "primary_search": "Ohio State beat Michigan rivalry shirt",
      "keywords": ["ohio state", "beat michigan", "rivalry", ...],
      "confidence": 0.88
    }
  }
}
```

---

## Integration with Duke

**Granny** (Context) + **Duke** (Onboarding) = Complete Publisher Intelligence

- **Granny** answers: "What should we show?" (contextual intelligence)
- **Duke** answers: "Where can we deploy?" (placement intelligence)

Together, they enable:
- Context-aware product selection (Granny → Sally)
- Automated onboarding (Duke)
- Strategic business decisions (Granny)

---

## Status

✅ **Phase 1: Complete**
- Contextual intelligence (sports calendar, rivalry detection)
- Business intelligence (revenue model, publisher type)
- Affiliate-specific search strategies (Fanatics + Amazon)
- Standalone REST API

🔄 **Phase 2: In Progress**
- ESPN API integration (real-time sports calendar)
- Live game detection
- Injury/roster updates

⏳ **Phase 3: Planned**
- Cultural context detection (trending topics, viral moments)
- Social media sentiment analysis
- Predictive opportunity alerts

---

**Last Updated**: 2025-11-28
