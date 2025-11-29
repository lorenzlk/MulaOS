# Granny Implementation Plan 🏈

**Agent**: Sports Context Intelligence Agent ("Granny")  
**Target**: ON3 Team Pages (College Football)  
**Timeline**: 10-14 days to MVP  
**Goal**: 2-3x revenue uplift on high-context moments

---

## 🎯 MVP Scope

### Phase 1: Single Team Proof of Concept
**Target**: Ohio State Buckeyes (highest traffic ON3 team)  
**Sport**: College Football  
**Season**: 2024-25 (Playoffs happening NOW)

### Core Features (MVP)
1. **Real-time team context** (record, rankings, next game)
2. **3 emotional states** (Euphoric, Neutral, Frustrated)
3. **3 monetization strategies** (Products-Heavy, Balanced, Articles-Only)
4. **5 query templates** (Championship, Rivalry, Homecoming, Streak, Default)
5. **Integration with existing Mula flow** (Sally, Taka)

### Out of Scope (Phase 2)
- ❌ Multi-sport support (basketball, recruiting)
- ❌ All 130 FBS teams
- ❌ Social sentiment analysis
- ❌ Player-specific context
- ❌ Recruiting events

---

## 🏗️ Architecture

```
ON3 Article Published
         ↓
Mula BootLoader Detects Page
         ↓
┌────────────────────────────────────────┐
│  Granny Context Service                │
│  GET /granny/enrich?url={article_url}  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  ESPN API                               │
│  - Team record                          │
│  - Recent games                         │
│  - Schedule                             │
│  - Rankings                             │
└────────────────────────────────────────┘
         ↓
Granny Returns Context + Recommendation
         ↓
┌────────────────────────────────────────┐
│  Sally (Product Search)                │
│  Uses Granny's query                   │
│  "Ohio State Big Ten Champs 2024"      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Taka (Deployment)                     │
│  Deploys TopShelf (not SmartScroll)    │
│  High density (multiple placements)    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Occy (Monetization)                   │
│  Skips video ads (product focus)       │
└────────────────────────────────────────┘
```

---

## 📋 Technical Stack

### Backend Service
```yaml
service_name: granny-context-api
runtime: Node.js 20
framework: Express
hosting: Heroku (same as www.makemula.ai)
database: Redis (for caching)

dependencies:
  - axios: HTTP client for ESPN API
  - node-cache: In-memory caching
  - express: Web framework
  - dotenv: Environment config
```

### External APIs
```yaml
espn_api:
  base_url: http://site.api.espn.com/apis/site/v2/sports/football/college-football
  endpoints:
    - /teams/{team_id}
    - /teams/{team_id}/schedule
    - /scoreboard
  rate_limit: 1000 requests/hour
  cost: FREE
  
cfp_rankings:
  source: Manual update (weekly)
  format: JSON config file
  update_frequency: Weekly during season
```

### Data Storage
```yaml
redis_cache:
  team_context: 1 hour TTL
  schedule: 6 hour TTL
  rankings: 24 hour TTL
  
postgres (future):
  historical_context: For ML training
  performance_metrics: Track prediction accuracy
```

---

## 🗓️ 10-Day Build Plan

### **Days 1-2: Foundation** ⚙️

**Goal**: Set up Granny service + ESPN API integration

**Tasks**:
- [ ] Create `granny-context-api` repo
- [ ] Set up Express server with basic routes
- [ ] Implement ESPN API client
  - `getTeamInfo(teamId)`
  - `getTeamSchedule(teamId)`
  - `getRecentGames(teamId)`
- [ ] Create Redis caching layer
- [ ] Write unit tests for API client

**Deliverable**: `/granny/enrich` endpoint returns basic team data

**Code Sample**:
```javascript
// granny-api/services/espn-client.js
class ESPNClient {
  constructor() {
    this.baseURL = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football';
    this.cache = new NodeCache({ stdTTL: 3600 });
  }
  
  async getTeamInfo(teamId) {
    const cacheKey = `team:${teamId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const response = await axios.get(`${this.baseURL}/teams/${teamId}`);
    const data = response.data.team;
    
    this.cache.set(cacheKey, data);
    return data;
  }
  
  async getTeamRecord(teamId) {
    const team = await this.getTeamInfo(teamId);
    return {
      wins: team.record.items[0].stats.find(s => s.name === 'wins').value,
      losses: team.record.items[0].stats.find(s => s.name === 'losses').value
    };
  }
}
```

---

### **Days 3-4: Context Analysis** 🧠

**Goal**: Build decision logic for emotional states + strategies

**Tasks**:
- [ ] Implement sentiment scoring algorithm
  - Win streak detection
  - Rivalry game identification
  - Championship implications
- [ ] Build decision tree for monetization strategies
- [ ] Create query template system
- [ ] Write tests for decision logic

**Deliverable**: Given team context, return recommendation

**Code Sample**:
```javascript
// granny-api/services/context-analyzer.js
class ContextAnalyzer {
  
  analyzeSentiment(teamContext) {
    let sentimentScore = 5.0; // Base neutral
    
    // Winning streak bonus
    if (teamContext.streak.type === 'win') {
      sentimentScore += teamContext.streak.count * 0.3;
    }
    
    // Recent rivalry win
    if (teamContext.recentGames[0]?.type === 'rivalry' && 
        teamContext.recentGames[0]?.result === 'win') {
      sentimentScore += 3.0;
    }
    
    // Championship implications
    if (teamContext.playoffImplications) {
      sentimentScore += 1.5;
    }
    
    // Losing streak penalty
    if (teamContext.streak.type === 'loss') {
      sentimentScore -= teamContext.streak.count * 0.5;
    }
    
    return {
      score: Math.max(0, Math.min(10, sentimentScore)),
      label: this.getSentimentLabel(sentimentScore),
      purchaseIntent: this.getPurchaseIntent(sentimentScore)
    };
  }
  
  getSentimentLabel(score) {
    if (score >= 8.0) return 'euphoric';
    if (score >= 6.0) return 'positive';
    if (score >= 4.0) return 'neutral';
    if (score >= 2.0) return 'frustrated';
    return 'devastated';
  }
  
  getPurchaseIntent(score) {
    return Math.min(10, score * 1.2); // Scale to 0-10
  }
  
  recommendStrategy(sentiment, teamContext) {
    const { label, purchaseIntent } = sentiment;
    
    // High purchase intent - product-heavy
    if (purchaseIntent >= 7.5) {
      return {
        widgetType: 'topshelf',
        query: this.buildQuery(teamContext, 'championship'),
        placementDensity: 'high',
        adStrategy: 'defer',
        rationale: `High fan euphoria (${label}) - maximize product monetization`
      };
    }
    
    // Moderate purchase intent - balanced
    if (purchaseIntent >= 4.0) {
      return {
        widgetType: 'smartscroll',
        query: this.buildQuery(teamContext, 'standard'),
        placementDensity: 'medium',
        adStrategy: 'mix',
        rationale: `Moderate engagement (${label}) - balanced approach`
      };
    }
    
    // Low purchase intent - engagement focus
    return {
      widgetType: 'next_page_articles',
      query: null,
      placementDensity: 'low',
      adStrategy: 'video_ads_only',
      rationale: `Low purchase intent (${label}) - focus on engagement`
    };
  }
}
```

---

### **Days 5-6: Query Templates** 📝

**Goal**: Build context-aware product search queries

**Tasks**:
- [ ] Create query template system
- [ ] Define templates for 5 contexts:
  1. Championship/Playoff
  2. Rivalry Win
  3. Homecoming
  4. Winning Streak
  5. Default
- [ ] Test queries with Sally (product search)
- [ ] Validate product relevance

**Deliverable**: Context-specific queries that return high-quality products

**Code Sample**:
```javascript
// granny-api/services/query-builder.js
class QueryBuilder {
  
  buildQuery(teamContext, contextType) {
    const team = teamContext.name;
    const year = new Date().getFullYear();
    
    const templates = {
      championship: `${team} ${teamContext.conference} championship ${year} playoff gear`,
      
      rivalry_win: `${team} beat ${teamContext.recentGames[0].opponent} ${year} rivalry gear`,
      
      homecoming: `${team} homecoming ${year} alumni vintage`,
      
      winning_streak: `${team} ${teamContext.streak.count} game winning streak champions`,
      
      default: `${team} football ${year}`
    };
    
    return templates[contextType] || templates.default;
  }
  
  // Example outputs:
  // "Ohio State Big Ten championship 2024 playoff gear"
  // "Ohio State beat Michigan 2024 rivalry gear"
  // "Ohio State homecoming 2024 alumni vintage"
  // "Ohio State 5 game winning streak champions"
}
```

---

### **Days 7-8: Integration** 🔌

**Goal**: Connect Granny to existing Mula flow

**Tasks**:
- [ ] Update Mula BootLoader to call Granny
- [ ] Modify Sally to accept Granny's query
- [ ] Update Taka to use Granny's widget recommendation
- [ ] Test end-to-end flow on staging
- [ ] Handle fallbacks (if Granny fails, use default)

**Deliverable**: Full integration with existing SDK

**Code Sample**:
```javascript
// SDK: sdk.makemula.ai/src/lib/BootLoader.js
class BootLoader {
  
  async boot() {
    // ... existing boot logic ...
    
    // NEW: Call Granny for sports context
    const grannyContext = await this.getGrannyContext();
    
    if (grannyContext) {
      // Use Granny's recommendation
      this.widgetType = grannyContext.recommendation.widgetType;
      this.searchQuery = grannyContext.recommendation.query;
      this.placementStrategy = grannyContext.recommendation.placementDensity;
    } else {
      // Fallback to default logic
      this.widgetType = 'smartscroll';
      this.searchQuery = this.buildDefaultQuery();
    }
    
    // Continue with Sally, Taka, etc.
    await this.fetchProducts(this.searchQuery);
    await this.deployWidget(this.widgetType);
  }
  
  async getGrannyContext() {
    try {
      const response = await fetch(
        `https://www.makemula.ai/api/granny/enrich?url=${encodeURIComponent(window.location.href)}`
      );
      
      if (!response.ok) {
        console.warn('[Granny] Failed to fetch context, using default');
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Granny] Error:', error);
      return null; // Graceful fallback
    }
  }
}
```

---

### **Days 9-10: Testing & Deployment** 🚀

**Goal**: Ship to production ON3

**Tasks**:
- [ ] Deploy Granny API to Heroku
- [ ] Set up monitoring (Datadog/Sentry)
- [ ] Configure Slack alerts for errors
- [ ] A/B test: Granny vs. Default (50/50 split)
- [ ] Deploy to ON3 Ohio State pages
- [ ] Monitor for 48 hours

**Deliverable**: Granny live in production with A/B test running

**Monitoring Setup**:
```javascript
// granny-api/middleware/monitoring.js
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log to Datadog
    metrics.timing('granny.request.duration', duration);
    metrics.increment('granny.request.count', 1, [`status:${res.statusCode}`]);
    
    // Alert if slow
    if (duration > 2000) {
      slackAlert(`⚠️ Granny slow response: ${duration}ms for ${req.url}`);
    }
  });
  
  next();
});
```

---

## 📊 Success Metrics (Week 1)

### Primary KPIs
| Metric | Baseline (Default) | Target (Granny) | Success Threshold |
|--------|-------------------|-----------------|-------------------|
| **CTR (Championship Context)** | 4.2% | 8-12% | >7% (1.7x) |
| **CTR (Rivalry Win)** | 3.8% | 7-10% | >6% (1.6x) |
| **Revenue/Pageview (High Context)** | $0.18 | $0.40+ | >$0.30 (1.7x) |
| **Widget Views** | Baseline | +0% | Maintain or increase |

### Secondary KPIs
- **API Response Time**: <500ms (p95)
- **Error Rate**: <1%
- **Cache Hit Rate**: >80%
- **Sentiment Prediction Accuracy**: Manual validation sample

### Business Impact
- **Incremental Revenue**: Estimated +$2-3K/week on Ohio State alone
- **Proof Point**: "Context-aware monetization works"
- **Investor Story**: "AI that understands fan emotion"

---

## 🎯 Ohio State Context Examples

### Example 1: Championship Win (Dec 7, 2024)
```yaml
scenario: "Ohio State beats Oregon 45-38 in Big Ten Championship"

granny_analysis:
  team_record: "12-1"
  game_type: "conference_championship"
  result: "win"
  playoff_implications: true
  sentiment_score: 9.5
  sentiment_label: "euphoric"
  purchase_intent: 9.8

recommendation:
  widget_type: "topshelf"
  query: "Ohio State Big Ten Champions 2024 College Football Playoff gear"
  placement_density: "high"
  ad_strategy: "products_only"
  
expected_performance:
  ctr: "10-14%"
  revenue_per_pageview: "$0.50+"
```

### Example 2: Regular Season Win
```yaml
scenario: "Ohio State beats Indiana 38-15"

granny_analysis:
  team_record: "10-1"
  game_type: "conference"
  result: "win"
  streak: "win_4"
  sentiment_score: 7.2
  sentiment_label: "positive"
  purchase_intent: 6.5

recommendation:
  widget_type: "smartscroll"
  query: "Ohio State football 2024"
  placement_density: "medium"
  ad_strategy: "mix"
  
expected_performance:
  ctr: "5-7%"
  revenue_per_pageview: "$0.22"
```

### Example 3: Bad Loss (Defer Monetization)
```yaml
scenario: "Ohio State loses to Michigan 42-10"

granny_analysis:
  team_record: "10-2"
  game_type: "rivalry"
  result: "blowout_loss"
  playoff_hopes: "damaged"
  sentiment_score: 1.5
  sentiment_label: "devastated"
  purchase_intent: 2.0

recommendation:
  widget_type: "next_page_articles"
  query: null
  placement_density: "low"
  ad_strategy: "video_ads_only"
  
expected_performance:
  ctr: "N/A (articles)"
  revenue_per_pageview: "$0.08 (ads only)"
  
rationale: "Fans devastated. Bad time to sell products. Show empathy with related content."
```

---

## 🔧 Configuration Files

### Team Config (Ohio State)
```yaml
# granny-api/config/teams/ohio-state.yml
team_id: 194
name: "Ohio State Buckeyes"
short_name: "Ohio State"
sport: "football"
conference: "Big Ten"
division: "East"

rivals:
  - team_id: 130
    name: "Michigan"
    rivalry_name: "The Game"
    emotional_multiplier: 2.5
  
  - team_id: 213
    name: "Penn State"
    emotional_multiplier: 1.3

home_field: "Ohio Stadium"
homecoming_week: 7  # Week of season

product_categories:
  primary: ["football", "college_sports"]
  secondary: ["fan_gear", "championship_gear"]
```

### Context Thresholds
```yaml
# granny-api/config/thresholds.yml
sentiment_thresholds:
  euphoric: 8.0
  positive: 6.0
  neutral: 4.0
  frustrated: 2.0
  devastated: 0.0

purchase_intent_thresholds:
  very_high: 7.5
  high: 5.5
  medium: 3.5
  low: 2.0

widget_selection:
  topshelf_threshold: 7.0
  smartscroll_threshold: 4.0
  articles_threshold: 0.0
```

---

## 📝 API Specification

### Enrich Endpoint

```http
GET /api/granny/enrich?url={article_url}

Response:
{
  "success": true,
  "team": {
    "id": 194,
    "name": "Ohio State Buckeyes",
    "record": { "wins": 11, "losses": 1 },
    "ranking": { "ap": 2, "cfp": 2 },
    "streak": { "type": "win", "count": 5 },
    "next_game": {
      "opponent": "Oregon",
      "date": "2024-12-07",
      "type": "championship"
    }
  },
  "sentiment": {
    "score": 8.7,
    "label": "euphoric",
    "purchase_intent": 9.2
  },
  "recommendation": {
    "widget_type": "topshelf",
    "query": "Ohio State Big Ten Championship 2024 playoff gear",
    "placement_density": "high",
    "ad_strategy": "defer",
    "rationale": "Championship moment - maximize product monetization"
  },
  "meta": {
    "cached": false,
    "response_time_ms": 234,
    "version": "1.0.0"
  }
}
```

---

## 🚨 Risk Mitigation

### Risk 1: ESPN API Unavailable
**Mitigation**: Cache last-known context for 24 hours, graceful fallback to default

### Risk 2: Granny Returns Bad Query
**Mitigation**: Validate query format, fallback to team name + sport

### Risk 3: Performance Degradation
**Mitigation**: Timeout Granny call at 1000ms, continue with default

### Risk 4: Wrong Context Detection
**Mitigation**: Manual QA first week, tune thresholds based on feedback

---

## ✅ Go-Live Checklist

### Pre-Launch (Day 9)
- [ ] Granny API deployed to Heroku
- [ ] Redis cache configured
- [ ] ESPN API tested and working
- [ ] All query templates validated
- [ ] Monitoring/alerts set up
- [ ] Slack notifications configured

### Launch Day (Day 10)
- [ ] Enable A/B test (50% Granny, 50% Default)
- [ ] Deploy to ON3 Ohio State pages only
- [ ] Monitor Slack for alerts
- [ ] Check metrics dashboard hourly
- [ ] QA sample pages manually

### Post-Launch (Days 11-12)
- [ ] Analyze first 48 hours of data
- [ ] Compare Granny vs. Default CTR
- [ ] Adjust sentiment thresholds if needed
- [ ] Prepare results summary for team

---

## 📈 Phase 2 Expansion (Weeks 3-4)

### Additional Teams
- Michigan Wolverines
- Alabama Crimson Tide
- Georgia Bulldogs
- Texas Longhorns
- Oregon Ducks

### Additional Contexts
- Recruiting commits
- Transfer portal
- Coach changes
- Award announcements (Heisman, etc.)

### Basketball Season
- March Madness context
- Conference tournaments
- Rivalry games

---

## 🎉 Success Looks Like

**Week 1**:
- Granny returns context for Ohio State articles
- 2x CTR on championship/rivalry moments
- Zero production errors
- Positive team feedback

**Week 2**:
- Roll out to 5 more teams
- $5-10K incremental weekly revenue
- Board deck: "Context-aware AI drives 2x monetization"

**Month 1**:
- All major ON3 teams covered
- Proven ROI: 2-3x revenue on high-context
- Investor pitch: "We understand sports fans better than anyone"

---

**Ready to start building?** 🚀

Next step: Set up the Granny API repo and ESPN client (Days 1-2)

