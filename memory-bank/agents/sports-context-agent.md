# Sports Context Intelligence Agent

## Overview

**Agent Name**: Sports Context Intelligence Agent (SCIA)  
**Alias**: "Granny" 🏈  
**Domain**: Sports vertical on ON3 (college football, basketball, recruiting)  
**Purpose**: Leverage real-time sports context to personalize monetization strategies, product recommendations, and content placement

**Core Insight**: Fan engagement and purchasing intent varies dramatically based on team performance, game situations, and emotional moments. A winning streak = championship gear demand. Homecoming week = different intent than rivalry week. Road game = different content appetite than home game.

**Why "Granny"?**: Like a grandmother who knows every player, every rivalry, every tradition - Granny understands the deep context that makes sports fans tick. She knows when to celebrate and when to give space.

---

## The Problem Granny Solves

### Current State (Generic)
```
Article: "Ohio State beats Michigan 45-23"
↓
Mula: Generic "Ohio State football" product search
→ Returns: Random jerseys, generic team gear
→ Monetization: One-size-fits-all approach
```

### With Scout (Context-Aware)
```
Article: "Ohio State beats Michigan 45-23"
↓
Granny Context Analysis:
  - Team: Ohio State Buckeyes
  - Record: 11-1 (championship contender)
  - Game Type: Rivalry (Michigan)
  - Result: Dominant win (22-point margin)
  - Fan Sentiment: EXTREMELY HIGH (rivalry win)
  - Season Phase: Late season, playoff implications
↓
Granny Decision:
  IF (rivalry win + playoff implications):
    → Product Search: "Ohio State Big Ten Championship gear"
    → Widget Type: TopShelf (high engagement moment)
    → Placement: Multiple spots (capitalize on traffic)
  ELSE IF (blowout loss):
    → Widget Type: Next Page Articles (low purchase intent)
    → Focus: Keep engagement, defer monetization
```

---

## Sports Context Data Model

### Team Context

```yaml
team:
  id: "ohio-state-buckeyes"
  name: "Ohio State Buckeyes"
  sport: "football"
  conference: "Big Ten"
  division: "East"
  
  current_season:
    record:
      wins: 11
      losses: 1
      conference_wins: 8
      conference_losses: 1
    
    ranking:
      ap_poll: 2
      cfp_ranking: 2
      trend: "rising"  # rising, falling, stable
    
    streaks:
      current: "win_5"  # 5-game winning streak
      longest_win: 8
      longest_loss: 0
    
    performance_context:
      points_per_game: 42.3
      points_allowed: 18.1
      margin_of_victory: 24.2
      momentum: "hot"  # hot, cold, neutral
    
  schedule_context:
    next_game:
      opponent: "Michigan"
      date: "2024-11-30"
      location: "home"  # home, away, neutral
      game_type: "rivalry"  # rivalry, conference, non-conference, playoff
      homecoming: false
      senior_day: true
      
    recent_games:
      - opponent: "Indiana"
        result: "win"
        score: "38-15"
        location: "home"
        significance: "conference clincher"
```

### Fan Sentiment Model

```yaml
sentiment_signals:
  performance_based:
    winning_streak: 
      value: 5
      sentiment: "euphoric"
      purchase_intent: "very_high"
      
    recent_loss:
      value: false
      sentiment: "positive"
    
    rivalry_outcome:
      opponent: "Michigan"
      result: "win"
      margin: 22
      sentiment: "ecstatic"
      multiplier: 2.5x
  
  calendar_events:
    homecoming_week:
      active: false
      sentiment: "nostalgic"
      purchase_intent: "high"
      product_types: ["vintage", "alumni"]
    
    senior_day:
      active: true
      sentiment: "emotional"
      purchase_intent: "medium"
      product_types: ["commemorative", "signed"]
    
    rivalry_week:
      active: true
      opponent: "Michigan"
      sentiment: "intense"
      purchase_intent: "very_high"
      product_types: ["championship", "rivalry"]
  
  recruiting_context:
    commitment_announcement:
      active: false
      player: null
      sentiment: "excited"
    
    transfer_portal:
      active: false
      sentiment: "anxious"
```

### Content Context

```yaml
article_analysis:
  url: "/teams/ohio-state-buckeyes/news/ohio-state-beats-michigan-45-23/"
  
  content_type: "game_recap"  # game_recap, recruiting, analysis, injury, transfer
  
  topics:
    primary: "football"
    secondary: ["rivalry", "championship", "playoff"]
  
  mentioned_players:
    - name: "Marvin Harrison Jr"
      position: "WR"
      stats: "8 catches, 156 yards, 3 TDs"
      draft_prospect: true
    - name: "Kyle McCord"
      position: "QB"
      stats: "22/28, 387 yards, 4 TDs"
  
  engagement_signals:
    pageviews_first_hour: 45000
    comments: 892
    shares: 1243
    velocity: "viral"  # viral, trending, normal, slow
  
  fan_sentiment_in_comments:
    dominant_emotion: "celebration"
    themes: ["championship hopes", "playoff bound", "beat michigan"]
    toxicity_score: 0.12  # low toxicity
```

---

## Decision Framework

### Monetization Strategy Selection

```yaml
decision_tree:
  
  # HIGH ENGAGEMENT + HIGH PURCHASE INTENT
  - condition:
      team_performance: "winning_streak >= 3"
      game_significance: ["rivalry", "championship", "playoff"]
      fan_sentiment: ["euphoric", "ecstatic"]
    strategy:
      widget_type: "topshelf"
      product_search_query: "{team} {season_context} championship gear"
      placement_density: "high"  # Multiple widgets
      product_focus: "premium"  # Higher price point items
      ad_strategy: "defer"  # Products > Ads when purchase intent is high
    example:
      query: "Ohio State Big Ten Championship gear 2024"
      products: ["Championship t-shirts", "Division champion hats", "Playoff bound hoodies"]
  
  # MODERATE ENGAGEMENT + MODERATE INTENT
  - condition:
      team_performance: "neutral"
      game_type: ["conference", "non-conference"]
      fan_sentiment: "positive"
    strategy:
      widget_type: "smartscroll"
      product_search_query: "{team} football {product_category}"
      placement_density: "medium"
      product_focus: "standard"
      ad_strategy: "mix"  # 70% products, 30% ads
    example:
      query: "Ohio State football jerseys"
      products: ["Team jerseys", "Fan gear", "Accessories"]
  
  # LOW ENGAGEMENT + LOW PURCHASE INTENT
  - condition:
      team_performance: "losing_streak >= 2"
      recent_result: "blowout_loss"
      fan_sentiment: ["frustrated", "angry", "disappointed"]
    strategy:
      widget_type: "next_page_articles"
      product_search_query: null  # Skip product widgets
      placement_density: "low"
      product_focus: null
      ad_strategy: "video_ads"  # Focus on engagement, not commerce
    example:
      recommendation: "Show related articles, defer monetization until sentiment improves"
  
  # RECRUITING CONTEXT
  - condition:
      content_type: "recruiting"
      event_type: ["commitment", "official_visit", "signing_day"]
      fan_sentiment: "excited"
    strategy:
      widget_type: "topshelf"
      product_search_query: "{team} recruiting class {year} gear"
      placement_density: "medium"
      product_focus: "future"  # Next season gear
      ad_strategy: "recruiting_video"
    example:
      query: "Ohio State 2025 recruiting class apparel"
      products: ["2025 signing day gear", "Future stars collection"]
```

---

## Real-Time Context APIs

### Data Sources

```yaml
sports_data_apis:
  
  # Game schedules and results
  espn_api:
    endpoint: "http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{team_id}"
    data:
      - schedule
      - scores
      - standings
      - statistics
    refresh: "hourly"
  
  # Rankings
  cfp_rankings:
    source: "collegefootballplayoff.com"
    data: ["cfp_rankings", "ap_poll", "coaches_poll"]
    refresh: "weekly"
  
  # Real-time scores
  live_scores:
    source: "thescore.com API"
    data: "live game updates"
    refresh: "real-time (webhooks)"
  
  # Recruiting
  on3_recruiting_api:
    source: "internal ON3 API"
    data:
      - player_rankings
      - commitments
      - crystal_ball_predictions
      - official_visits
    refresh: "real-time"
  
  # Social sentiment
  social_listening:
    sources: ["twitter_api", "reddit_api"]
    data: "fan sentiment, trending topics"
    keywords: ["{team} football", "#{team_hashtag}"]
    refresh: "15min"
```

### Context Enrichment Pipeline

```
Article Published (ON3)
         ↓
Extract Team + Sport + Topic
         ↓
┌────────────────────────────────────────┐
│  Scout Context Enrichment              │
├────────────────────────────────────────┤
│ 1. Fetch Team Record (ESPN API)       │
│ 2. Get Recent Game Results            │
│ 3. Check Schedule (Next Game)         │
│ 4. Pull Rankings (CFP/AP)             │
│ 5. Analyze Sentiment (Social)         │
│ 6. Detect Calendar Events             │
│    (Homecoming, Rivalry, etc.)        │
└────────────────────────────────────────┘
         ↓
Context Object Created
         ↓
┌────────────────────────────────────────┐
│  Scout Decision Engine                 │
├────────────────────────────────────────┤
│ IF (high_purchase_intent):             │
│   → TopShelf + Premium Products        │
│ ELSE IF (moderate_intent):             │
│   → SmartScroll + Standard Products    │
│ ELSE IF (low_intent):                  │
│   → Next Page Articles + Video Ads     │
└────────────────────────────────────────┘
         ↓
Monetization Strategy Deployed
```

---

## Product Search Query Personalization

### Context-Driven Query Templates

```yaml
query_templates:
  
  # Championship/Playoff Context
  championship_bound:
    condition: "ranking <= 4 AND late_season"
    template: "{team} {conference} championship {year} playoff gear"
    examples:
      - "Ohio State Big Ten Championship 2024 playoff gear"
      - "Michigan playoff bound championship apparel"
  
  # Rivalry Week
  rivalry_win:
    condition: "game_type == 'rivalry' AND result == 'win'"
    template: "{team} beat {rival} {year} rivalry gear"
    examples:
      - "Ohio State beat Michigan 2024 rivalry gear"
      - "Alabama beat Auburn Iron Bowl champions"
  
  rivalry_week_buildup:
    condition: "game_type == 'rivalry' AND days_until_game <= 7"
    template: "{team} vs {rival} rivalry week {year}"
    examples:
      - "Ohio State vs Michigan rivalry week 2024"
      - "Alabama vs Auburn Iron Bowl gear"
  
  # Homecoming
  homecoming_week:
    condition: "homecoming == true"
    template: "{team} homecoming {year} alumni vintage"
    examples:
      - "Ohio State homecoming 2024 alumni gear"
      - "Georgia homecoming vintage collection"
  
  # Senior Day
  senior_day:
    condition: "senior_day == true"
    template: "{team} senior day {year} commemorative"
    examples:
      - "Ohio State senior day 2024 commemorative"
  
  # Hot Streak
  winning_streak:
    condition: "winning_streak >= 5"
    template: "{team} {winning_streak} game winning streak champions"
    examples:
      - "Ohio State 8 game winning streak champions"
  
  # Upset Win
  upset_victory:
    condition: "opponent_ranking <= 10 AND team_ranking > opponent_ranking AND result == 'win'"
    template: "{team} upset {ranked_opponent} celebration gear"
    examples:
      - "Purdue upset Ohio State celebration gear"
  
  # Struggling Season (Low Intent)
  losing_streak:
    condition: "losing_streak >= 3"
    template: null  # Skip products, show articles
    alternative: "next_page_articles"
  
  # Recruiting
  commitment_day:
    condition: "content_type == 'recruiting' AND event == 'commitment'"
    template: "{team} {year} recruiting class future stars"
    examples:
      - "Ohio State 2025 recruiting class future stars gear"
  
  signing_day:
    condition: "event == 'signing_day'"
    template: "{team} {year} signing day class loaded"
    examples:
      - "Ohio State 2025 signing day class loaded gear"
  
  # Player-Specific (Draft Prospects)
  player_spotlight:
    condition: "player_mentioned AND draft_prospect == true"
    template: "{player_name} {team} {position} NFL draft gear"
    examples:
      - "Marvin Harrison Jr Ohio State WR NFL draft gear"
      - "Caleb Williams USC QB Heisman gear"
```

---

## Widget Type Decision Matrix

```yaml
widget_selection:
  
  topshelf:
    conditions:
      - "fan_sentiment IN ['euphoric', 'ecstatic', 'excited']"
      - "purchase_intent >= 7/10"
      - "engagement_velocity == 'viral'"
    placement:
      - "above_the_fold"  # High visibility
      - "mid_article"
      - "end_of_article"
    density: "high"  # Multiple placements
    product_count: 12
  
  smartscroll:
    conditions:
      - "fan_sentiment IN ['positive', 'hopeful', 'neutral']"
      - "purchase_intent >= 4/10"
      - "engagement_velocity IN ['trending', 'normal']"
    placement:
      - "end_of_article"
    density: "medium"
    product_count: 20  # Infinite scroll
  
  next_page_articles:
    conditions:
      - "fan_sentiment IN ['frustrated', 'angry', 'disappointed']"
      - "purchase_intent < 4/10"
      - "engagement_velocity == 'slow'"
    placement:
      - "end_of_article"
    density: "low"
    product_count: 0  # No products
    content_type: "related_articles"
  
  video_ad_unit:
    conditions:
      - "purchase_intent < 3/10"
      - "content_type == 'analysis'"
      - "engagement_time > 2min"  # Users invested in content
    placement:
      - "mid_article"
    ad_type: "video"
    fallback: "programmatic_display"
```

---

## Implementation Architecture

### Scout Service Stack

```
┌─────────────────────────────────────────────────────┐
│  Scout Context Service (Node.js)                     │
├─────────────────────────────────────────────────────┤
│  /scout/enrich                                       │
│    Input: { team, sport, article_url }              │
│    Output: { context, sentiment, recommendation }   │
│                                                      │
│  /scout/recommend-strategy                           │
│    Input: { context }                                │
│    Output: { widget_type, query, placement }        │
│                                                      │
│  /scout/query-template                               │
│    Input: { team, context }                          │
│    Output: { search_query, product_focus }          │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Context Data Layer (Redis Cache)                   │
├─────────────────────────────────────────────────────┤
│  team:{team_id}:record        → Cached 1hr          │
│  team:{team_id}:schedule      → Cached 1hr          │
│  team:{team_id}:sentiment     → Cached 15min        │
│  game:{game_id}:live_score    → Real-time           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  External APIs                                       │
├─────────────────────────────────────────────────────┤
│  ESPN API (schedules, scores, standings)            │
│  CFP Rankings API (playoff rankings)                │
│  ON3 Recruiting API (commitments, rankings)         │
│  Social APIs (Twitter, Reddit sentiment)            │
└─────────────────────────────────────────────────────┘
```

### Integration with Existing Mula Flow

```
Article Published on ON3
         ↓
Mula BootLoader Detects Page
         ↓
┌────────────────────────────────────────┐
│  NEW: Call Scout Context Service       │
│  GET /scout/enrich?url={article_url}   │
└────────────────────────────────────────┘
         ↓
Scout Returns:
{
  "team": "ohio-state-buckeyes",
  "context": {
    "record": "11-1",
    "recent_result": "win vs Michigan",
    "fan_sentiment": "ecstatic",
    "purchase_intent": 9.2
  },
  "recommendation": {
    "widget_type": "topshelf",
    "product_query": "Ohio State Big Ten Championship 2024 playoff gear",
    "placement_density": "high",
    "ad_strategy": "defer"
  }
}
         ↓
Sally (Product Search Agent)
  Uses Scout's query instead of generic query
  → "Ohio State Big Ten Championship 2024 playoff gear"
         ↓
Taka (Deployment Agent)
  Deploys TopShelf (not SmartScroll)
  Multiple placements (high density)
         ↓
Occy (Monetization Agent)
  Skips video ads (high product purchase intent)
  Focuses on premium products
```

---

## Example Scenarios

### Scenario 1: Championship Game Win

```yaml
context:
  article: "Ohio State beats Oregon 45-38 in Big Ten Championship"
  team_record: "12-1"
  game_significance: "conference championship"
  playoff_implications: "secured playoff berth"
  fan_sentiment: "euphoric"

scout_analysis:
  purchase_intent: 9.5/10
  emotional_state: "peak celebration"
  window: "48-hour high intent window"

recommendation:
  widget_type: "topshelf"
  query: "Ohio State Big Ten Champions 2024 College Football Playoff gear"
  products:
    - "Big Ten Championship T-Shirts"
    - "Playoff Bound Hoodies"
    - "Conference Champion Hats"
    - "Commemorative Posters"
  placement:
    - above_fold: true
    - mid_article: true
    - end_of_article: true
  ad_strategy: "zero programmatic ads"  # All product monetization
  
predicted_performance:
  click_through_rate: "8-12%"
  revenue_per_pageview: "$0.45"
  rationale: "Peak fan euphoria + championship purchase cycle"
```

### Scenario 2: Rivalry Week Buildup

```yaml
context:
  article: "5 things to watch in Ohio State vs Michigan"
  days_until_game: 3
  rivalry: "The Game"
  both_teams_ranked: true
  playoff_implications: true
  fan_sentiment: "intense anticipation"

scout_analysis:
  purchase_intent: 7.5/10
  emotional_state: "high anticipation"
  product_focus: "rivalry-specific"

recommendation:
  widget_type: "smartscroll"
  query: "Ohio State vs Michigan rivalry gear Beat Michigan"
  products:
    - "Beat Michigan T-Shirts"
    - "Rivalry Week Hoodies"
    - "Historic Rivalry Collection"
    - "Game Day Essentials"
  placement:
    - end_of_article: true
  ad_strategy: "mix"  # 70% products, 30% rivalry week video ads
  
predicted_performance:
  click_through_rate: "5-7%"
  revenue_per_pageview: "$0.28"
  rationale: "High engagement, moderate immediate purchase (fans wait for outcome)"
```

### Scenario 3: Bad Loss (Low Intent)

```yaml
context:
  article: "Ohio State blown out by Michigan 42-10"
  team_record: "10-2"
  loss_type: "blowout to rival"
  playoff_hopes: "severely damaged"
  fan_sentiment: "devastated"

scout_analysis:
  purchase_intent: 2.0/10
  emotional_state: "anger and disappointment"
  window: "7-day low intent window"

recommendation:
  widget_type: "next_page_articles"
  query: null  # Skip product search
  content_strategy:
    - "What went wrong: Analysis articles"
    - "Looking ahead to bowl game"
    - "Recruiting class update (positive spin)"
  placement:
    - end_of_article: true
  ad_strategy: "video_ads_only"  # Programmatic video, not commerce
  
predicted_performance:
  click_through_rate: "N/A (articles)"
  revenue_per_pageview: "$0.08 (video ads)"
  rationale: "Defer commerce monetization until sentiment recovers"
```

### Scenario 4: Recruiting Commitment

```yaml
context:
  article: "Five-star QB commits to Ohio State"
  player: "Dylan Raiola"
  rating: "5-star"
  position: "QB"
  class_year: 2025
  fan_sentiment: "excited about future"

scout_analysis:
  purchase_intent: 6.5/10
  emotional_state: "optimistic about future"
  product_focus: "future/recruiting"

recommendation:
  widget_type: "topshelf"
  query: "Ohio State 2025 recruiting class loaded future stars"
  products:
    - "2025 Signing Day Gear"
    - "Future National Champs Collection"
    - "Recruiting Class Loaded T-Shirts"
  placement:
    - mid_article: true
    - end_of_article: true
  ad_strategy: "mix"  # Products + recruiting videos
  
predicted_performance:
  click_through_rate: "4-6%"
  revenue_per_pageview: "$0.18"
  rationale: "Forward-looking purchase intent, not immediate gratification"
```

---

## Scout API Endpoints

### Enrich Article Context

```http
POST /api/scout/enrich
Content-Type: application/json

{
  "url": "https://www.on3.com/teams/ohio-state-buckeyes/news/...",
  "team": "ohio-state-buckeyes",
  "sport": "football"
}

Response:
{
  "context": {
    "team": {
      "id": "ohio-state-buckeyes",
      "record": { "wins": 11, "losses": 1 },
      "ranking": { "ap": 2, "cfp": 2 },
      "momentum": "hot",
      "next_game": {
        "opponent": "Michigan",
        "date": "2024-11-30",
        "location": "home",
        "type": "rivalry"
      }
    },
    "sentiment": {
      "score": 8.7,
      "label": "euphoric",
      "purchase_intent": 9.2
    },
    "calendar": {
      "homecoming": false,
      "rivalry_week": true,
      "senior_day": false
    }
  },
  "recommendation": {
    "widget_type": "topshelf",
    "query": "Ohio State Big Ten Championship 2024 playoff gear",
    "placement_density": "high",
    "ad_strategy": "defer"
  }
}
```

### Get Query Template

```http
POST /api/scout/query-template
Content-Type: application/json

{
  "team": "ohio-state-buckeyes",
  "context": {
    "game_type": "rivalry",
    "result": "win",
    "opponent": "Michigan"
  }
}

Response:
{
  "query": "Ohio State beat Michigan 2024 rivalry gear",
  "product_focus": "rivalry_champions",
  "price_range": "premium",
  "rationale": "Rivalry win triggers high-value purchase behavior"
}
```

### Get Monetization Strategy

```http
POST /api/scout/strategy
Content-Type: application/json

{
  "team": "ohio-state-buckeyes",
  "article_type": "game_recap",
  "sentiment": 8.5,
  "purchase_intent": 9.0
}

Response:
{
  "strategy": {
    "primary": "topshelf_products",
    "secondary": null,
    "avoid": ["video_ads", "programmatic_display"]
  },
  "placement": {
    "above_fold": true,
    "mid_article": true,
    "end_of_article": true
  },
  "expected_rpm": "$4.50",
  "confidence": 0.87
}
```

---

## Data Schema

### Team Context Record (Redis)

```json
{
  "team_id": "ohio-state-buckeyes",
  "sport": "football",
  "last_updated": "2024-11-26T14:30:00Z",
  "ttl": 3600,
  
  "season": {
    "year": 2024,
    "record": { "wins": 11, "losses": 1 },
    "conference_record": { "wins": 8, "losses": 1 },
    "streak": { "type": "win", "count": 5 }
  },
  
  "rankings": {
    "ap": 2,
    "cfp": 2,
    "coaches": 2,
    "trend": "rising"
  },
  
  "recent_games": [
    {
      "date": "2024-11-23",
      "opponent": "Michigan",
      "result": "win",
      "score": { "team": 45, "opponent": 23 },
      "location": "home",
      "significance": "rivalry"
    }
  ],
  
  "schedule": {
    "next_game": {
      "date": "2024-12-07",
      "opponent": "Oregon",
      "location": "neutral",
      "game_type": "championship",
      "playoff_implications": true
    }
  },
  
  "sentiment": {
    "score": 8.7,
    "label": "euphoric",
    "purchase_intent": 9.2,
    "sources": ["twitter", "reddit", "on3_comments"],
    "trending_topics": ["big ten champs", "playoff bound", "beat michigan"]
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Build Scout service API
- [ ] Integrate ESPN API for schedules/scores
- [ ] Create context enrichment pipeline
- [ ] Build Redis caching layer
- [ ] Define query templates for top scenarios

### Phase 2: Decision Logic (Week 3-4)
- [ ] Implement widget type decision matrix
- [ ] Build query personalization engine
- [ ] Create sentiment analysis module
- [ ] Test with ON3 Ohio State pages

### Phase 3: Integration (Week 5-6)
- [ ] Integrate Scout with Sally (product search)
- [ ] Connect Scout to Taka (deployment)
- [ ] Update Mula BootLoader to call Scout
- [ ] Deploy to ON3 staging environment

### Phase 4: Expansion (Week 7-8)
- [ ] Add basketball context
- [ ] Expand to more ON3 team pages
- [ ] Build admin dashboard for Scout
- [ ] Create monitoring and alerting

### Phase 5: Optimization (Week 9-10)
- [ ] A/B test context-aware vs. generic
- [ ] Tune sentiment thresholds
- [ ] Optimize query templates
- [ ] Build ML model for purchase intent prediction

---

## Success Metrics

### Performance Benchmarks

| Metric | Current (Generic) | Target (Scout) | Improvement |
|--------|-------------------|----------------|-------------|
| **CTR** (Championship Context) | 4.2% | 8-12% | 2-3x |
| **CTR** (Rivalry Win) | 3.8% | 7-10% | 2x |
| **CTR** (Losing Streak) | 2.1% | N/A (defer) | Reduce wasted impressions |
| **Revenue/Pageview** (Peak Context) | $0.18 | $0.40-0.50 | 2-3x |
| **Revenue/Pageview** (Low Context) | $0.12 | $0.08 | Better user experience |

### Business Impact

- **Revenue Uplift**: +50-100% on high-context moments
- **User Experience**: Reduce irrelevant product placements by 40%
- **Engagement**: Increase time on site by showing right content type
- **Publisher Value**: Prove sophisticated monetization intelligence

---

## Next Steps

**Immediate**:
1. **Build MVP**: Focus on Ohio State football (single team proof of concept)
2. **Define Top 5 Contexts**: Championship, Rivalry, Homecoming, Recruiting, Loss
3. **Create Query Templates**: Hand-craft queries for each scenario
4. **A/B Test**: Context-aware vs. generic on Ohio State pages

**Which would you like to start with?**
- Build the Scout API service?
- Define the decision logic for widget selection?
- Create the query template system?
- Design the sentiment analysis module?

