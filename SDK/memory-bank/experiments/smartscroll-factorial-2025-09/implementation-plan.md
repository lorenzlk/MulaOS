# Implementation Plan: SmartScroll 2x2 Factorial A/B Test

## Architecture Overview

### Components to Modify
1. **ABTest.js** - Experiment configuration and variant assignment
2. **SmartScroll.svelte** - Layout variants and RevContent integration
3. **Analytics Queries** - New Athena queries for factorial analysis
4. **Revenue Attribution** - Multi-partner revenue tracking system

### New Components
1. **RevContent Integration** - Script injection and SubId tracking
2. **Revenue Attribution Service** - Impact API + RevContent API integration
3. **Factorial Analytics** - 2x2 statistical analysis queries

## Implementation Phases

*For detailed planning questions and answers, see [Planning Q&A](./planning-qa.md).*

### Phase 1: ABTest.js Configuration
**Goal**: Set up factorial experiment configuration with clear variant descriptions

#### Changes Required
```javascript
// SmartScroll 2x2 Factorial A/B Test Configuration
export const SMARTSCROLL_FACTORIAL_EXPERIMENT = {
    name: 'smartscroll_factorial_2025_09',
    variants: [
        { id: 'c00', name: 'Control', description: 'Current layout + Mula only' },
        { id: 'c10', name: 'Optimized Layout', description: 'Optimized layout + Mula only' },
        { id: 'c01', name: 'RevContent Monetization', description: 'Current layout + Mula + RevContent' },
        { id: 'c11', name: 'Optimized + RevContent', description: 'Optimized layout + Mula + RevContent' }
    ],
    description: '2x2 factorial test: Layout × Monetization',
    status: 'active',
    
    // Factor definitions for analysis
    factors: {
        layout: { 
            control: 'current', 
            treatment: 'optimized',
            description: 'Card layout optimization (removes brand header, expands image, redesigns meta strip)'
        },
        monetization: { 
            control: 'mula_only', 
            treatment: 'mula_plus_revcontent',
            description: 'Supplemental monetization partner (RevContent) added to existing Mula affiliate'
        }
    },
    
    // Activation condition
    activationCondition: () => {
        return window.Mula.revContent && 
               window.Mula.revContent.pubId && 
               window.Mula.revContent.widgetId;
    }
};
```

#### Helper Functions for Variant Interpretation
```javascript
/**
 * Get variant object by ID
 * @param {string} variantId - The variant ID (c00, c10, c01, c11)
 * @returns {object} Variant object with id, name, description
 */
export function getVariantInfo(variantId) {
    const experiment = SMARTSCROLL_FACTORIAL_EXPERIMENT;
    return experiment.variants.find(v => v.id === variantId) || {
        id: variantId,
        name: 'Unknown',
        description: 'Unknown variant'
    };
}

/**
 * Extract layout factor from variant
 * @param {string} variantId - The variant ID
 * @returns {string} Layout factor (current|optimized)
 */
export function getLayoutFactor(variantId) {
    return variantId.startsWith('c1') ? 'optimized' : 'current';
}

/**
 * Extract monetization factor from variant
 * @param {string} variantId - The variant ID
 * @returns {string} Monetization factor (mula_only|mula_plus_revcontent)
 */
export function getMonetizationFactor(variantId) {
    return variantId.endsWith('1') ? 'mula_plus_revcontent' : 'mula_only';
}
```

#### Key Features
- **RevContent Activation**: Only activate on publishers with RevContent configuration
- **Variant Assignment**: Deterministic based on session ID
- **Query String Overrides**: Support for c00, c10, c01, c11
- **Factor Extraction**: Helper functions to extract layout/monetization factors
- **Clear Descriptions**: Variant objects with id, name, and description for interpretability
- **Lean Payload**: Only variant IDs in logData (descriptions handled server-side)

### Phase 2: SmartScroll Layout Variants
**Goal**: Implement optimized card layout variant

#### Current Layout Analysis
- **Card Structure**: Portrait cards with existing internal layout
- **Content Layout**: Brand header → Image → Title → Description → Meta (price/rating) → Actions
- **Responsive**: Already responsive with existing breakpoints

#### New Optimized Layout Design
Based on provided image:
- **Card Structure**: Portrait cards with redesigned internal layout
- **Content Layout**: Image → Title → Description → Meta strip (price + rating) → Actions
- **Key Changes**:
  - Remove brand title bar from top
  - Expand hero image prominence
  - Redesign price and rating layout in horizontal strip
  - Maintain existing button logic and responsive behavior

#### Implementation Strategy
```css
/* New optimized layout styles */
.mula-card.optimized-layout {
    /* Optimized card specific styles */
}

.mula-card.optimized-layout .mula-card-header {
    display: none; /* Remove brand title bar */
}

.mula-card.optimized-layout .mula-card-image {
    /* Expand hero image prominence */
    aspect-ratio: 2/3;
    margin-bottom: 12px;
}

.mula-card.optimized-layout .mula-card-meta {
    /* Horizontal strip layout for price and rating */
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid #f0f0f5;
}
```

### Phase 3: RevContent Integration
**Goal**: Integrate RevContent as supplemental monetization partner

#### RevContent Configuration
- **Publisher Configuration**: `window.Mula.revContent = {pubId: 'xxx', widgetId: 'yyy'}`
- **Placement**: Every 3rd product card (existing logic)
- **SubId Tracking**: Test name + variant for attribution
- **Monetization Model**: Supplemental to existing Mula affiliate monetization
- **Activation**: Only on publishers with RevContent configuration

#### Script Injection (Head)
```javascript
// RevContent script injection - HEAD components
function injectRevContentScript(variant) {
    if (window.rcws) return; // Already injected
    
    // Get RevContent configuration from publisher
    const revContentConfig = window.Mula.revContent;
    if (!revContentConfig || !revContentConfig.pubId || !revContentConfig.widgetId) {
        console.warn('RevContent configuration not found');
        return;
    }
    
    // 1. Configure subId tracking
    window.rcws = window.rcws || {};
    window.rcws.subIds = {
        [revContentConfig.widgetId]: {
            test: 'MULA_AB_2025_09',
            variant: variant
        }
    };
    
    // 2. Inject RevContent widget script in head
    const script = document.createElement('script');
    script.src = `https://delivery.revcontent.com/${revContentConfig.pubId}/${revContentConfig.widgetId}/widget.js`;
    document.head.appendChild(script);
}
```

#### Light/Shadow DOM Integration
```javascript
// RevContent light/shadow DOM integration - following existing SDK pattern
function injectRevContentSlot(adCounter) {
    const slotName = `mulaRevContentSlot${adCounter}`;
    
    // 1. Create slot element for shadow DOM (goes in SmartScroll component)
    const slotEl = document.createElement('slot');
    slotEl.setAttribute("name", slotName);
    
    // 2. Create div with slot attribute for light DOM
    const slotDiv = document.createElement("div");
    slotDiv.setAttribute("slot", slotName);
    slotDiv.style.width = "300px";
    slotDiv.style.height = "250px";
    slotDiv.style.marginBottom = "18px";
    slotDiv.style.alignSelf = "center";
    
    // 3. Create RevContent widget container div
    const revContentConfig = window.Mula.revContent;
    const revContentDiv = document.createElement("div");
    revContentDiv.setAttribute("data-widget-host", "revcontent");
    revContentDiv.setAttribute("data-pub-id", revContentConfig.pubId);
    revContentDiv.setAttribute("data-widget-id", revContentConfig.widgetId);
    revContentDiv.setAttribute("id", `revcontent-${adCounter}`);
    
    slotDiv.appendChild(revContentDiv);
    
    // 4. Append to light DOM (following existing pattern)
    document.querySelector("mula-smartscroll").appendChild(slotDiv);
    
    return slotEl; // Return slot element for shadow DOM insertion
}
```

#### Integration Points
- **SmartScroll Component**: Inject RevContent slots into shadow DOM when RevContent variants active
- **Light DOM**: Create RevContent widget divs with proper slot attributes
- **Ad Placement Logic**: Use existing every-3rd-card logic with light/shadow DOM pattern
- **SubId Management**: Track test name and variant for attribution
- **Critical**: RevContent div must exist in light DOM for widget to render

### Phase 4: Revenue Attribution System
**Goal**: Track revenue from Mula affiliate and RevContent supplemental monetization

#### Mula Attribution (Enhanced)
- **Method**: subId2 parameter with session ID
- **API**: Impact API with existing integration
- **Attribution Window**: 30 days
- **Purpose**: Measure existing affiliate revenue performance by experiment variant
- **Implementation**: Extend existing subId1='mula' to include subId2=session_id

#### subId2 Implementation Details
**File**: `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js`

```javascript
// Current implementation (line 160)
if (product && product.data_source === 'fanatics_impact') {
  const urlObj = new URL(url);
  urlObj.searchParams.set('subid1', 'mula');
  url = urlObj.toString();
}

// Enhanced implementation for experiment attribution
if (product && product.data_source === 'fanatics_impact') {
  const urlObj = new URL(url);
  urlObj.searchParams.set('subid1', 'mula');
  
  // Add subId2 with session ID for experiment attribution
  if (window.Mula.sessionId) {
    urlObj.searchParams.set('subid2', window.Mula.sessionId);
  }
  
  url = urlObj.toString();
}
```

**Impact API Integration**:
- **Endpoint**: `/Reports/partner_performance_by_subid`
- **Parameters**: `SubId1='mula'`, `SubId2=session_id`
- **Data Flow**: Impact API → Session IDs → Athena Query → Experiment Variant → Revenue Attribution

**Revenue Attribution Process**:
1. **Pull Impact Data**: Get revenue by subId2 (session_id) from Impact API
2. **Extract Session IDs**: Get list of sessions that generated revenue
3. **Query Athena**: Find experiment variant mapping for those sessions using `mula_in_view` events
   - **Parameterized Query**: Session IDs passed as parameter to Athena query
   - **Template**: `queries/smartscroll-factorial-session-experiments.sql`
4. **Join Data**: Match revenue to experiment variants
5. **Calculate RPS**: Revenue per session by variant

**Athena Query Parameters**:
- `{EXPERIMENT_NAME}`: Experiment name (e.g., 'smartscroll_factorial_2025_09')
- `{TARGET_HOST}`: Target host (e.g., 'www.on3.com' or 'NULL')
- `{LOOKBACK_DAYS}`: Lookback period (e.g., 30)
- `{SESSION_IDS}`: Array of session IDs from Impact API (e.g., ['abc123', 'def456'])

#### RevContent Attribution (New)
- **Method**: Blended data approach (Athena + RevContent API)
- **API Endpoint**: `https://api.revcontent.io/stats/publisher/widgets/subids`
- **Authentication**: OAuth2 Client Credentials
- **Attribution Window**: 30 days
- **Data Flow**: 
  1. Session-level impression data from Athena (by variant)
  2. Revenue data from RevContent API (by test/variant via subIds)
  3. Blended attribution report combining both data sources
- **Purpose**: Measure supplemental monetization and interaction effects with Mula revenue

#### Parameterized Revenue Attribution Service
```javascript
// Reusable service for multi-partner revenue attribution
class RevenueAttributionService {
    constructor(config = {}) {
        this.experimentName = config.experimentName || 'smartscroll_factorial_2025_09';
        this.targetHost = config.targetHost || 'www.on3.com';  // NULL for network-wide
        this.lookbackDays = config.lookbackDays || 30;
        this.attributionWindow = config.attributionWindow || 30;
    }
    
    async getMulaRevenue(sessionId, dateRange) {
        // Parameterized Impact API integration
        const hostFilter = this.targetHost ? `AND host = '${this.targetHost}'` : '';
        const query = `
            SELECT variant, SUM(revenue) as total_revenue
            FROM mula.webtag_logs 
            WHERE datehour >= '${dateRange.start}'
            AND experiment = '${this.experimentName}'
            ${hostFilter}
            GROUP BY variant
        `;
        return await this.executeAthenaQuery(query);
    }
    
    async getRevContentRevenue(testName, variant, dateRange) {
        // Parameterized RevContent API integration
        const apiResponse = await this.callRevContentAPI({
            testName: testName || this.experimentName,
            variant: variant,
            dateRange: dateRange
        });
        return this.parseRevContentRevenue(apiResponse);
    }
    
    async getTotalRevenueByVariant(variant, dateRange) {
        // Combine both sources with experiment-specific logic
        const [mulaRevenue, revContentRevenue] = await Promise.all([
            this.getMulaRevenue(null, dateRange),
            this.getRevContentRevenue(this.experimentName, variant, dateRange)
        ]);
        
        // Apply experiment logic: c00/c10 = Mula only, c01/c11 = Mula + RevContent
        const mulaRev = mulaRevenue[variant] || 0;
        const revContentRev = revContentRevenue[variant] || 0;
        
        if (variant.endsWith('0')) {
            return mulaRev;  // Mula only variants
        } else {
            return mulaRev + revContentRev;  // Mula + RevContent variants
        }
    }
}

// Usage examples for different experiments
const on3Experiment = new RevenueAttributionService({
    experimentName: 'smartscroll_factorial_2025_09',
    targetHost: 'www.on3.com',
    lookbackDays: 30
});

const networkWideExperiment = new RevenueAttributionService({
    experimentName: 'future_network_test',
    targetHost: null,  // All hosts
    lookbackDays: 14
});
```

### Phase 5: Analytics Infrastructure
**Goal**: Build Athena queries for factorial analysis

#### New Athena Queries
1. **Factorial CTR Analysis**: `smartscroll-factorial-ctr.sql`
2. **Revenue Attribution Analysis**: `smartscroll-factorial-revenue.sql`
3. **Statistical Significance**: `smartscroll-factorial-stats.sql`

#### Parameterized Query Structure
```sql
-- Parameterized factorial analysis query
-- Parameters filled by Slack command: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}
WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,        -- Filled by --experiment parameter
        '{TARGET_HOST}' as target_host,                -- Filled by --host parameter or 'NULL'
        {LOOKBACK_DAYS} as lookback_days               -- Filled by --days-back parameter
),
variant_metrics AS (
    SELECT 
        CASE 
            WHEN experiment = (SELECT experiment_name FROM experiment_config)
            THEN variant 
            ELSE 'control' 
        END as variant,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(CASE WHEN event_type = 'mula_in_view' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'mula_store_click' THEN 1 END) as clicks
    FROM webtag_logs 
    WHERE (SELECT target_host FROM experiment_config) IS NULL 
       OR host = (SELECT target_host FROM experiment_config)
    AND datehour >= date_add('day', -(SELECT lookback_days FROM experiment_config), current_date)
    GROUP BY variant
)
SELECT 
    variant,
    sessions,
    views,
    clicks,
    clicks::float / views::float as ctr
FROM variant_metrics
ORDER BY variant;
```

#### Slack Command Integration
The queries are designed to work with the existing `/mula-ab-test-performance` Slack command:

**Command Parameters**:
- `--experiment <name>` - Experiment name (default: 'smartscroll_button_variant')
- `--days-back <number>` - Number of days to look back (default: 7, max: 365)
- `--host <domain>` - Target host domain (optional, for domain-specific experiments)
- `--network` - Flag for network-wide experiments (all hosts)

**Usage Examples**:
```
/mula-ab-test-performance --experiment smartscroll_factorial_2025_09 --days-back 30 --host www.on3.com
/mula-ab-test-performance --experiment network_wide_test_2025_10 --days-back 14 --network
```

#### Reusable Query Template
```sql
-- Template for future experiments
-- Parameters filled by Slack command: {EXPERIMENT_NAME}, {TARGET_HOST}, {LOOKBACK_DAYS}
WITH experiment_config AS (
    SELECT 
        '{EXPERIMENT_NAME}' as experiment_name,        -- Filled by --experiment parameter
        '{TARGET_HOST}' as target_host,                -- Filled by --host parameter or 'NULL'
        {LOOKBACK_DAYS} as lookback_days               -- Filled by --days-back parameter
),
-- Rest of query remains the same...
-- Parameters are replaced by Slack command processor before execution
```

## Technical Implementation Details

### ABTest.js Modifications
```javascript
// Domain filtering function
function isOn3Domain() {
    if (typeof window === 'undefined') return false;
    return window.location.hostname.includes('on3.com');
}

// Factorial variant assignment
function getFactorialVariant(sessionId, experimentName, variants) {
    if (!isOn3Domain()) return 'control'; // Only run on on3.com
    
    // Check query string override
    const url = new URL(window.location.href);
    const queryOverride = url.searchParams.get('mulaABTest');
    if (queryOverride && variants.includes(queryOverride)) {
        return queryOverride;
    }
    
    // Deterministic assignment based on session ID
    const hash = simpleHash(sessionId + experimentName);
    const index = hash % variants.length;
    return variants[index];
}
```

### SmartScroll Component Updates
```javascript
// Layout variant detection
const layoutVariant = assignment.variant.startsWith('c1') ? 'vertical' : 'horizontal';
const monetizationVariant = assignment.variant.endsWith('1') ? 'revcontent' : 'mula';

// Conditional rendering
if (layoutVariant === 'vertical') {
    card.classList.add('vertical-layout');
}

// RevContent integration
if (monetizationVariant === 'revcontent') {
    injectRevContentScript(assignment.variant);
}
```

### Testing Strategy
1. **Development Testing**: Use `mulaQaVersion` query parameter
2. **Query String Testing**: `?mulaABTest=c00|c10|c01|c11`
3. **Canary Deployment**: Gradual rollout with monitoring
4. **Revenue Validation**: Cross-check API data sources

## Deployment Plan

### Pre-Deployment
1. **Code Review**: All changes reviewed and approved
2. **Testing**: Comprehensive testing in development environment
3. **Revenue Validation**: Verify RevContent API integration
4. **Performance Testing**: Ensure no Core Web Vitals impact

### Deployment
1. **Canary Release**: 5% traffic to test variants
2. **Monitoring**: Watch for errors and performance issues
3. **Gradual Rollout**: Increase to 25% per variant over 24 hours
4. **Full Launch**: 100% traffic to experiment variants

### Post-Deployment
1. **Monitoring**: Daily metric tracking
2. **Statistical Analysis**: Weekly significance testing
3. **Revenue Validation**: Cross-check attribution data
4. **Performance Monitoring**: Core Web Vitals tracking

## Success Criteria

### Technical Success
- **Zero Errors**: No JavaScript errors or failed API calls
- **Performance**: No negative Core Web Vitals impact
- **Attribution**: Accurate revenue tracking from both partners

### Statistical Success
- **Significance**: p < 0.05 for main effects
- **Effect Size**: ≥20% improvement in primary metrics
- **Power**: ≥80% statistical power achieved

### Business Success
- **Revenue**: Positive RPS impact
- **Engagement**: Maintained or improved CTR
- **Scalability**: Learnings applicable to other publishers

## Risk Mitigation

### Technical Risks
- **RevContent Integration**: Fallback to Mula if RevContent fails
- **Layout Performance**: A/B test both layouts for performance impact
- **Revenue Attribution**: Validate data from both sources

### Business Risks
- **Revenue Impact**: Monitor daily revenue metrics
- **User Experience**: Track user engagement metrics
- **Partner Dependencies**: Maintain Mula as fallback option

## Next Steps
1. **Start Implementation**: Begin with ABTest.js configuration
2. **Build Layout Variants**: Implement vertical card layout
3. **Integrate RevContent**: Add monetization partner
4. **Build Analytics**: Create Athena queries for analysis
5. **Test & Deploy**: Comprehensive testing and deployment
