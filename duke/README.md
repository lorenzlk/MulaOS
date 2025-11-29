# Duke - Onboarding & Placement Intelligence Agent

**Named After**: [Duke Kahanamoku](https://en.wikipedia.org/wiki/Duke_Kahanamoku) - Father of modern surfing, Olympic champion, sheriff of Honolulu, and cultural ambassador

**Why Duke?**: Just as Duke Kahanamoku was a cultural ambassador who brought surfing to the world and built bridges between cultures, Duke the agent structures partnerships, builds business relationships, and guides strategic decisions that grow the Mula ecosystem.

---

## Mission

**Accelerate pre-sales and onboarding by answering: "Where should we place SmartScroll and what pages is it eligible for?"**

Duke automates the technical discovery that currently takes 2-3 weeks of manual work, reducing it to minutes.

---

## Core Capabilities

### 1. **SmartScroll Placement Intelligence**

**Answers:**
- Where should we place SmartScroll?
- What pages is it eligible for?
- What's the optimal DOM placement?

**Detection:**
- ✅ Article pages (templated structure)
- ✅ Clean break at end of content (above footer, below content)
- ✅ DOM structure analysis (content → footer gap)
- ✅ Mobile vs. desktop placement strategies

**Output:**
- Placement recommendations with DOM selectors
- Eligibility scoring per page type
- Ready-to-deploy targeting rules

---

### 2. **Competitor Intelligence**

**Detection:**
- Taboola presence and placement
- Outbrain presence and placement
- Other native ad networks

**Strategy:**
- If competitors running → Ask for beta test against them
- Identify inventory overlap
- Recommend A/B test opportunities

**Output:**
- Competitor map (who's running where)
- Beta test recommendations
- Inventory opportunities

---

### 3. **Technical Onboarding**

**SDK Health Check:**
- Verifies `cdn.makemula.ai` deployment
- Checks homepage and article pages
- Detects GTM dynamic loading

**Traffic Analysis:**
- Sitemap + RSS feed analysis
- Traffic distribution by category
- URL pattern discovery

**Deployment Readiness:**
- Scoring system (0-100%)
- Timeline estimation
- Critical path to launch

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

**Key Principle**: MulaOS is a **POC architecture** that informs product strategy. Duke and Granny are sub-agents that will be subsumed by the engineering/product team, not integrated directly into the SDK.

---

## Usage

### CLI Commands

```bash
# Onboarding analysis
node src/index.js onboard <domain>

# Example
node src/index.js onboard on3.com
```

### Programmatic API

```javascript
const { DukeOnboarding } = require('./src/onboard');

const duke = new DukeOnboarding();
const results = await duke.analyze('on3.com');

console.log(results.placement_intelligence);
console.log(results.competitor_intelligence);
console.log(results.deployment_readiness);
```

---

## Output Structure

```json
{
  "domain": "on3.com",
  "placement_intelligence": {
    "eligible_pages": [
      {
        "pattern": "/teams/*/news/*",
        "eligibility_score": 95,
        "dom_placement": {
          "selector": "article .content",
          "position": "after",
          "mobile_ready": true
        },
        "sample_urls": ["/teams/ohio-state-buckeyes/news/..."]
      }
    ],
    "recommendations": [
      {
        "priority": "HIGH",
        "message": "Article pages have clean content break - perfect for SmartScroll",
        "action": "Deploy SmartScroll below article content, above footer"
      }
    ]
  },
  "competitor_intelligence": {
    "taboola": {
      "present": true,
      "placement": "below-content",
      "beta_test_opportunity": true
    },
    "outbrain": {
      "present": false
    }
  },
  "deployment_readiness": {
    "score": 85,
    "timeline": "3-5 days",
    "blockers": [],
    "critical_path": [
      "1. Configure targeting rules (2 hours)",
      "2. QA on staging (1 day)",
      "3. Deploy to production (same day)"
    ]
  }
}
```

---

## Integration with Granny

**Duke** (Onboarding) + **Granny** (Context) = Complete Publisher Intelligence

- **Duke** answers: "Where can we deploy?"
- **Granny** answers: "What should we show?"

Together, they enable:
- Automated onboarding (Duke)
- Context-aware product selection (Granny → Sally)
- Strategic business decisions (Granny)

---

## Status

✅ **Phase 1: Complete**
- SDK health check
- Traffic analysis
- URL pattern discovery
- Deployment readiness scoring

🔄 **Phase 2: In Progress**
- SmartScroll placement detection
- DOM structure analysis
- Competitor detection (Taboola/Outbrain)

⏳ **Phase 3: Planned**
- Beta test recommendations
- A/B test setup automation
- Integration with Taka agent

---

**Last Updated**: 2025-11-28

