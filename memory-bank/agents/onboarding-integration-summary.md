# Integration Summary: `/onboard` Technical Discovery System + Granny

**Date**: November 28, 2025

## Discovery

Found comprehensive **Technical Onboarding System** at `/Users/loganlorenz/Onboarding/` that provides automated publisher website analysis via Slack command:

```bash
/onboard https://publisher.com
```

## What the Existing System Provides

### Core Analysis (< 60 seconds)
- ✅ **CMS Detection**: WordPress, Shopify, Wix, Squarespace, Webflow, Drupal, Joomla, Ghost, Medium
- ✅ **DOM Selector Discovery**: Finds optimal SmartScroll placement with 0-100% confidence scores
- ✅ **GTM Detection**: Determines fastest implementation path (GTM = Easy, 30-60 min)
- ✅ **Competitor Analysis**: Detects Taboola, Outbrain, AdSense, Amazon Associates, Skimlinks, VigLink, etc.
- ✅ **Mobile Responsiveness**: Checks viewport meta tags and responsive frameworks
- ✅ **Performance Scoring**: Page size (KB), external script count, overall score (0-100)
- ✅ **Implementation Complexity**: Easy (GTM), Medium (WordPress), Difficult (Custom)
- ✅ **Timeline Estimates**: 30 min (GTM) to 8 hours (complex custom)
- ✅ **Sample Article URLs**: Provides 3 real article URLs for testing
- ✅ **Risk Warnings**: Flags low confidence, inconsistent structure, competitor conflicts
- ✅ **Automatic Logging**: All analyses logged to Google Sheets for historical reference

### Traffic & Revenue Estimation
- ✅ **Traffic Tiers**: Tier 1 (1M+), Tier 2 (250K-1M), Tier 3 (50K-250K), Tier 4 (<50K)
- ✅ **Revenue Ranges**: $300/mo - $50K+/mo based on heuristic signals
- ⚠️ **Note**: These are hidden in Granny's outputs until validated with actual site data

### Technology Details
- **Platform**: Google Apps Script
- **Analysis Method**: 
  - Crawls 8-26 pages per publisher
  - Multi-factor heuristic scoring for article detection
  - Regex-based HTML parsing (no JavaScript rendering)
  - DOM selector consistency analysis across pages
- **Storage**: Google Sheets for historical tracking
- **Delivery**: Rich Slack Block Kit messages

## How Granny Integrates

### Granny's Role: Orchestrator + Interpreter

Granny **does NOT reimplement** the technical discovery. Instead, Granny:

1. **Orchestrates `/onboard`**: Triggers analysis at the right time (pre-kickoff, post-redesign, etc.)
2. **Interprets Results**: Adds context and strategic guidance
3. **Combines with Context**: Merges technical intel with sports calendar, business goals, seasonal timing
4. **Detects Gaps**: Identifies what `/onboard` can't provide (site crawler, health check, sport-specific intelligence)
5. **Provides Timing**: Recommends when to re-run (site changes, deployment issues)

### Example Integration Flow

```yaml
# Granny discovers new publisher
granny.discover('essentiallysports.com')

# Granny triggers technical discovery
/onboard https://essentiallysports.com

# Granny receives results
{
  cms: "WordPress",
  gtm: false,
  confidence: 100,
  complexity: "Medium",
  timeline: "2-4 hours",
  mobile: true,
  performance: 85,
  competitors: ["AdSense", "Taboola"]
}

# Granny adds strategic context
granny_output:
  deployment_readiness: "✅ GOOD"
  implementation_path: "WordPress Direct (2-4 hours)"
  risk_level: "LOW (standard deployment)"
  competitive_landscape: "AdSense + Taboola (complement, don't conflict)"
  
  next_steps:
    - "Request WordPress admin access"
    - "Run site crawler to discover URL patterns"
    - "Verify tag deployment (health check)"
    - "Start with highest-traffic sport (need content analysis)"
    
  gaps_to_address:
    - "URL path structure unknown → Need crawler"
    - "Sport segmentation unknown → Need content analysis"
    - "Traffic distribution unknown → Need baseline measurement"
```

## Granny's Technical Intelligence Workflow

```yaml
phase_0_pre_onboarding:
  action: "Run /onboard publisher.com"
  timing: "Before kickoff call"
  deliverable: "Technical readiness assessment"
  
phase_1_interpretation:
  input: "/onboard results"
  granny_adds:
    - "100% confidence + GTM = fastest path (prioritize)"
    - "WordPress + no GTM = 2-4 hours (standard effort)"
    - "Custom CMS + low confidence = high risk (manual review)"
  deliverable: "Implementation strategy recommendation"
  
phase_2_gap_detection:
  checks:
    - "Are URL paths documented?" → Need crawler
    - "Is tag deployment verified?" → Need health check
    - "Has site changed?" → Re-run /onboard
  deliverable: "Gap analysis + mitigation plan"
  
phase_3_deployment_readiness:
  assessment:
    technical_risk: "Low/Medium/High (from /onboard)"
    deployment_path: "GTM / WordPress / Custom"
    estimated_effort: "30 min - 8 hours"
    prerequisites: ["GTM access", "WordPress admin", "Publisher coordination"]
  deliverable: "Go/no-go recommendation"
```

## When Granny Re-runs `/onboard`

```yaml
rerun_triggers:
  
  major_site_redesign:
    trigger: "Publisher reports site redesign"
    action: "Re-run /onboard to update selectors"
    
  selector_failures:
    trigger: "Widget not loading (health check fails)"
    action: "Re-run /onboard to find new selectors"
    
  cms_migration:
    trigger: "Publisher migrating CMS platforms"
    action: "Re-run /onboard post-migration"
    
  performance_degradation:
    trigger: "Page load times increased"
    action: "Re-run /onboard to assess new performance"
```

## Revenue Number Handling

**Existing `/onboard` System**:
- Provides traffic tier estimates (Tier 1-4)
- Calculates revenue ranges ($300/mo - $50K+/mo)
- Based on heuristic signals (not actual data)

**Granny's Approach**:
- ❌ **Hides revenue projections** from stakeholder outputs
- ✅ May reference tiers internally for prioritization
- ✅ Focus on **opportunity detection**, not revenue prediction
- ✅ Only communicate revenue after establishing:
  - Actual traffic data (not heuristics)
  - Historical performance baselines
  - Site-specific conversion data

## What Granny Adds Beyond `/onboard`

| `/onboard` Provides | Granny Adds |
|---------------------|-------------|
| CMS detection | Deployment timing recommendation |
| DOM selectors | When to re-run (detect site changes) |
| Competitor widgets | Market positioning insight |
| Performance score | Impact on UX/monetization strategy |
| Implementation complexity | Resource allocation guidance |
| Sample URLs | Content type differentiation (news vs. analysis) |
| Traffic tier (heuristic) | Sports context, seasonal timing, emotional state |

## Key Architectural Decision

**DO NOT REIMPLEMENT** the `/onboard` system. It's mature, production-tested, and comprehensive.

**Instead**: Granny's Technical Intelligence domain becomes a **strategic layer** that:
- Orchestrates `/onboard` execution
- Interprets technical results in business/sports context
- Fills gaps `/onboard` doesn't cover (crawler, health check, sport-specific intel)
- Provides timing and deployment strategy
- Maintains holistic publisher understanding

## Documentation Updates

✅ **Updated**: `granny-integrated-realistic.md`
- Added comprehensive `/onboard` integration section
- Documented orchestration workflow
- Clarified revenue number handling
- Added re-run trigger logic

✅ **Updated**: `activeContext.md`
- Added `/onboard` discovery to "Just Completed" section
- Documented how Granny leverages existing system

## Next Steps

### Phase 1: Validate Integration (Current)
- ✅ Document existing `/onboard` capabilities
- ✅ Define Granny's orchestration role
- ✅ Clarify revenue number handling

### Phase 2: Build Gaps (Future)
- ⏳ **Site Crawler**: Discover actual URL path patterns
- ⏳ **Health Check**: Verify Mula tag deployment, detect conflicts
- ⏳ **Sport-Specific Modules**: Tennis, Golf, Boxing, UFC intelligence

### Phase 3: Automate Orchestration (Future)
- ⏳ Granny auto-triggers `/onboard` during discovery
- ⏳ Granny monitors for site changes → re-run triggers
- ⏳ Granny provides proactive "time to re-analyze" alerts

## Key Takeaway

**The `/onboard` system is a gem.** It provides comprehensive technical discovery in <60 seconds with high accuracy. Granny doesn't need to replace it—Granny needs to leverage it as the foundation of Technical Intelligence and add strategic context, timing, and holistic publisher understanding.

This integration ensures we:
1. ✅ Don't duplicate existing mature functionality
2. ✅ Build on proven infrastructure
3. ✅ Focus Granny on unique value-add (context, strategy, orchestration)
4. ✅ Maintain realistic, data-driven approach (no speculative revenue)

