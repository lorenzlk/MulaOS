# Granny Architecture: Onboarding vs. Contextual Intelligence

## 🎯 Critical Distinction

Granny has **TWO separate functions** that serve **different stages** of the customer lifecycle:

---

## 1. **`/granny onboard`** - Pre-Sales to Onboarding

### Purpose:
**One-time analysis** to determine if a publisher is a good fit and how to deploy Mula.

### When to Use:
- 🔵 **Pre-sales discovery** (before deal signed)
- 🔵 **Onboarding kickoff** (first week after signing)
- 🔵 **Initial configuration** (setting up targeting rules)

### What It Analyzes:
- ✅ SDK Health Check (is Mula already deployed?)
- ✅ URL Pattern Discovery (where to inject widgets)
- ✅ Traffic Distribution (which sports/categories to prioritize)
- ✅ Business Intelligence (publisher type, revenue model, tech stack)
- ✅ Competitive Intelligence (what other solutions are deployed)
- ✅ Monetization Maturity (how sophisticated is their setup)
- ✅ Deployment Readiness (timeline, blockers, critical path)

### Output:
```
📋 Ready-to-Deploy Slack Commands:
/mula-site-targeting-add on3.com path:"/teams/ohio-state-buckeyes/news/" search:"Ohio State Buckeyes merchandise"
/mula-site-targeting-add on3.com path:"/teams/michigan-wolverines/news/" search:"Michigan Wolverines merchandise"
...

🚀 Deployment Readiness: 75%
Timeline: 1-2 weeks
Blockers: SDK not deployed (1-2 days)

💎 Monetization Maturity: 7/10 (Intermediate)
Insight: Solid foundation, some guidance needed
```

### Who Uses It:
- **Sales** - During discovery calls
- **CS Team** - During onboarding kickoff
- **Technical POC** - For deployment planning

### Frequency:
- **Once per publisher** (or when major changes occur)
- Manual, on-demand analysis

---

## 2. **Contextual Intelligence** - Ongoing Operations

### Purpose:
**Continuous intelligence** that feeds into Sally (Product Discovery Agent) to choose the RIGHT products at the RIGHT moment.

### When to Use:
- 🔄 **Daily/Weekly** (automated)
- 🔄 **Real-time** (when generating product feeds)
- 🔄 **Event-driven** (when major sports events detected)

### What It Provides:
- ✅ **Sports Calendar Context** (rivalry week, playoffs, championships)
- ✅ **Team-Specific Context** (Ohio State plays Michigan)
- ✅ **Seasonal Opportunities** (recruiting periods, bowl season)
- ✅ **Emotional State** (championship win, rivalry game, underdog story)

### Output (feeds to Sally Agent):
```json
{
  "domain": "on3.com",
  "url": "/teams/ohio-state-buckeyes/news/rivalry-preview",
  "contextual_intelligence": {
    "current_event": "Ohio State vs. Michigan - Rivalry Week",
    "emotional_state": "high-intensity-rivalry",
    "recommended_search": "Beat Michigan merchandise",
    "urgency": "high",
    "expected_lift": "3-4x CTR",
    "duration": "7 days (game week)",
    "fallback_search": "Ohio State Buckeyes merchandise"
  }
}
```

### Who Uses It:
- **Sally Agent** (Product Discovery) - Chooses which products to show
- **Taka Agent** (Deployment) - Adjusts widget density/placement
- **Occy Agent** (Monetization) - Optimizes revenue strategy

### Frequency:
- **Automated** - Runs continuously
- **Real-time** - Updates when sports calendar changes
- **Event-driven** - Triggers on game days, championships, etc.

---

## 🏗️ How They Work Together

### Stage 1: Pre-Sales (Onboarding Analysis)
```
Sales Rep: "Let me run Granny onboarding on your site..."

Granny Onboarding Output:
✅ Traffic: 2.5M/mo, 68% mobile
✅ Patterns: 8 URL patterns discovered  
✅ Readiness: 75% (1-2 weeks to launch)
✅ Competitors: Moderate market, Mula fills affiliate gap

Sales Rep: "Based on analysis, expect $25K-40K annual lift, 1-2 week deployment"
```

### Stage 2: Onboarding (Deployment)
```
CS uses Granny output to:
1. Deploy SDK to identified URL patterns
2. Configure initial targeting rules
3. Set up reporting and monitoring

Result: Publisher goes live with 8 targeting rules
```

### Stage 3: Operations (Contextual Intelligence)
```
Sally Agent (Daily): "What products should I show on Ohio State pages?"

Granny Contextual: "It's Rivalry Week! Ohio State plays Michigan Saturday"

Sally Agent: 
- Search: "Beat Michigan merchandise" (instead of generic "Ohio State merchandise")
- Products: Rivalry t-shirts, game-day gear, championship hopes items
- Urgency: HIGH (game in 3 days)

Result: 3-4x CTR lift during rivalry week
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   GRANNY AGENT                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────┐      ┌─────────────────────┐   │
│  │ /granny onboard    │      │ Contextual Intel    │   │
│  │ (One-time)         │      │ (Continuous)        │   │
│  └────────────────────┘      └─────────────────────┘   │
│           │                            │                │
│           ├─ SDK Health                ├─ Sports Context│
│           ├─ URL Patterns              ├─ Rivalry Games │
│           ├─ Traffic Analysis          ├─ Championships │
│           ├─ Competitive Intel         ├─ Seasonal Peaks│
│           ├─ Maturity Score            └─ Emotional State│
│           └─ Readiness Score                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ↓                                    ↓
    ┌─────────────┐                    ┌──────────────┐
    │   Sales &   │                    │ Sally Agent  │
    │   CS Team   │                    │ (Products)   │
    │             │                    │              │
    │ - Discovery │                    │ Chooses:     │
    │ - Onboarding│                    │ - Search     │
    │ - Setup     │                    │ - Products   │
    └─────────────┘                    │ - Priority   │
                                       └──────────────┘
                                              │
                                              ↓
                                       ┌──────────────┐
                                       │ Taka Agent   │
                                       │ (Deployment) │
                                       │              │
                                       │ - Placement  │
                                       │ - Density    │
                                       │ - Timing     │
                                       └──────────────┘
```

---

## 🔌 Integration Points

### Sally Agent Integration

**Sally's Search Worker** should call Granny for context:

```javascript
// Sally's searchWorker.js
async function generateProductFeed(domain, url, baseSearch) {
  // Get contextual intelligence from Granny
  const context = await GrannyContextAPI.getContext(domain, url);
  
  if (context && context.recommended_search) {
    console.log(`🏄‍♂️ Granny says: Use "${context.recommended_search}" instead of "${baseSearch}"`);
    console.log(`   Reason: ${context.current_event}`);
    console.log(`   Expected lift: ${context.expected_lift}`);
    
    // Use Granny's contextual search
    return await searchProducts(context.recommended_search);
  }
  
  // Fallback to base search
  return await searchProducts(baseSearch);
}
```

### Example Flow:

```
1. URL: /teams/ohio-state-buckeyes/news/game-preview
2. Base targeting rule: search="Ohio State Buckeyes merchandise"

3. Sally calls Granny: getContext('on3.com', '/teams/ohio-state-buckeyes/news/...')

4. Granny responds:
   {
     current_event: "Ohio State vs. Michigan - Rivalry Week",
     recommended_search: "Beat Michigan merchandise",
     urgency: "high",
     expected_lift: "3-4x CTR",
     duration: "7 days"
   }

5. Sally searches: "Beat Michigan merchandise" (instead of generic)

6. Result: 3-4x higher CTR during rivalry week!
```

---

## 🔄 Continuous Intelligence Loop

### How Contextual Intelligence Stays Fresh:

```javascript
// Granny Daemon (runs continuously)
setInterval(async () => {
  // For each active publisher
  const publishers = await getActivePublishers();
  
  for (const pub of publishers) {
    // Update contextual intelligence
    const context = await analyzeCurrentContext(pub.domain);
    
    // Detect changes
    if (context.has_new_opportunities) {
      // Alert CS team
      await sendSlackAlert(pub.channel, context.opportunities);
      
      // Update Sally's search strategy
      await updateSearchStrategy(pub.domain, context);
    }
  }
}, 3600000); // Run every hour
```

### Example Alerts:

```
🏄‍♂️ Granny Alert: ON3

🎯 NEW OPPORTUNITY DETECTED:
   Ohio State vs. Michigan game in 3 days
   
   Recommended Action:
   Switch /teams/ohio-state-buckeyes/* search to:
   "Beat Michigan merchandise"
   
   Expected Impact: 3-4x CTR lift
   Duration: 7 days (game week)
   
   Auto-update? Reply 'yes' to deploy automatically.
```

---

## 💡 Key Insights

### Onboarding Intelligence:
- **One-time** - Run during sales/setup
- **Static analysis** - Site structure, tech stack, competitors
- **Output**: Deployment plan, Slack commands
- **Users**: Sales, CS, technical team

### Contextual Intelligence:
- **Continuous** - Runs automatically
- **Dynamic analysis** - Sports calendar, events, rivalries
- **Output**: Product search recommendations
- **Users**: Sally (automated), Occy (optimization), Taka (placement)

### The Power of Both:
```
Onboarding Intelligence → "Deploy to these 8 URL patterns"
Contextual Intelligence → "On those patterns, show THESE products RIGHT NOW"

Result: Right infrastructure + Right products at right time = Maximum revenue
```

---

## 🚀 Next Steps

### For Granny Web App (Current):
- ✅ Keep both analyses in web UI (helps with demos!)
- ✅ Onboarding analysis is primary use case
- ✅ Contextual intelligence shows ongoing value

### For Sally Integration:
1. Build Granny Contextual API endpoint
2. Sally calls it before each product search
3. Granny provides enhanced search phrase + context
4. Sally uses contextual phrase when available
5. Log lift metrics to validate effectiveness

### For Automation:
1. Granny daemon monitors sports calendar
2. Detects high-value moments (rivalries, championships)
3. Alerts CS team via Slack
4. Auto-updates Sally's search strategy (with approval)

---

**Status:** 🎯 Architecture Clarified!  
**Next:** Build Granny Contextual API for Sally integration  
**Impact:** Right products at right moments = 3-4x CTR lift

