# Implementation Plan: SmartScroll Density & Position Experiment

## Technical Architecture

### A/B Test Framework Integration
- **File**: `sdk.makemula.ai/svelte-components/src/lib/ABTest.js`
- **Pattern**: Follow existing experiment structure
- **Assignment**: Deterministic based on session ID hash
- **Override**: Query string support for testing (`?mulaABTest=control`)

### SmartScroll Component Changes
- **File**: `sdk.makemula.ai/svelte-components/src/lib/SmartScroll.svelte`
- **Function**: `insertNextPageItem()` (line 1396)
- **Logic**: Add experiment variant checking
- **Integration**: Include experiment data in event logging

### Analytics Infrastructure
- **File**: `www.makemula.ai/queries/queries/smartscroll-density-position-experiment.sql`
- **Metrics**: Store CTR and Next Page CTR by variant
- **Analysis**: Statistical significance testing
- **Reporting**: Automated results generation

## Implementation Steps

### Phase 1: A/B Test Configuration

#### 1.1 Add Experiment Definition
```javascript
export const SMARTSCROLL_DENSITY_POSITION_EXPERIMENT = {
    name: 'smartscroll_density_position_2025_10',
    variants: [
        { id: 'control', name: 'Control', description: '3-1 products, position 4' },
        { id: 'density_inverted', name: 'Density Inverted', description: '3-1 articles, position 4' },
        { id: 'position_early', name: 'Position Early', description: '3-1 products, position 1' }
    ],
    description: 'Tests density and position of next page articles in SmartScroll',
    status: 'active',
    factors: {
        density: {
            control: '3_1_products',
            treatment: '3_1_articles',
            description: 'Ratio of products to articles in the feed'
        },
        position: {
            control: 'position_4',
            treatment: 'position_1',
            description: 'Starting position for next page articles'
        }
    },
    activationCondition: () => {
        return typeof window !== 'undefined' && 
               window.Mula && 
               window.Mula.nextPage && 
               Array.isArray(window.Mula.nextPage) && 
               window.Mula.nextPage.length > 0;
    }
};
```

#### 1.2 Update Active Experiment
```javascript
export const ACTIVE_EXPERIMENT = SMARTSCROLL_DENSITY_POSITION_EXPERIMENT;
```

#### 1.3 Add Helper Functions
```javascript
export function getDensityFactor(variantId) {
    return variantId === 'density_inverted' ? '3_1_articles' : '3_1_products';
}

export function getPositionFactor(variantId) {
    return variantId === 'position_early' ? 'position_1' : 'position_4';
}
```

### Phase 2: SmartScroll Logic Implementation

#### 2.1 Experiment Integration
- Import ABTest utilities in SmartScroll.svelte
- Get experiment assignment in component initialization
- Pass experiment data to all event logging

#### 2.2 Density Control Logic
```javascript
function shouldInsertNextPageItem(totalItemsInserted, variant) {
    const densityFactor = getDensityFactor(variant);
    
    if (densityFactor === '3_1_articles') {
        // Insert article every 3rd item, but count articles as primary
        return totalItemsInserted % 3 === 0;
    } else {
        // Current logic: insert article every 3rd product
        return totalItemsInserted % 3 === 0;
    }
}
```

#### 2.3 Position Control Logic
```javascript
function getNextPagePosition(variant) {
    const positionFactor = getPositionFactor(variant);
    return positionFactor === 'position_1' ? 1 : 4;
}
```

#### 2.4 Modified Insertion Logic
```javascript
function insertNextPageItem(totalItemsInserted) {
    // Check if we should insert based on variant
    if (!shouldInsertNextPageItem(totalItemsInserted, experimentVariant)) {
        return;
    }
    
    // Rest of existing logic...
}
```

### Phase 3: Analytics Implementation

#### 3.1 Create Analytics Query
- File: `www.makemula.ai/queries/queries/smartscroll-density-position-experiment.sql`
- Metrics: Store CTR, Next Page CTR by variant
- Statistical testing: Chi-square tests
- Time series analysis

#### 3.2 Query Structure
```sql
WITH experiment_metrics AS (
  SELECT
    properties['experiment'] as experiment,
    properties['variant'] as variant,
    COUNT(CASE WHEN properties['eventName'] = 'mula_in_view' THEN 1 END) as in_views,
    COUNT(CASE WHEN properties['eventName'] = 'mula_store_click' THEN 1 END) as store_clicks,
    COUNT(CASE WHEN properties['eventName'] = 'mula_next_page_click' THEN 1 END) as next_page_clicks
  FROM mula.webtag_logs
  WHERE properties['experiment'] = 'smartscroll_density_position_2025_10'
  GROUP BY properties['experiment'], properties['variant']
)
-- CTR calculations and statistical analysis
```

### Phase 4: Testing Strategy

#### 4.1 Development Testing
- Query string overrides for each variant
- Console logging for variant assignment
- Visual verification of density/position changes

#### 4.2 Production Testing
- Gradual rollout (10% → 50% → 100%)
- Real-time monitoring of CTR metrics
- Error rate monitoring

#### 4.3 Rollback Plan
- Immediate: Revert to control variant
- Code: Git revert to previous commit
- Data: Continue collecting for analysis

## File Changes Summary

### New Files
- `memory-bank/experiments/smartscroll-density-position-2025-10/` (documentation)
- `www.makemula.ai/queries/queries/smartscroll-density-position-experiment.sql`

### Modified Files
- `sdk.makemula.ai/svelte-components/src/lib/ABTest.js`
- `sdk.makemula.ai/svelte-components/src/lib/SmartScroll.svelte`

### Dependencies
- No new dependencies required
- Uses existing A/B test framework
- Leverages existing analytics infrastructure

## Success Criteria

### Technical Success
- All variants render correctly
- Experiment data included in all events
- Analytics queries return accurate results
- No performance degradation

### Business Success
- Statistically significant results within 2 weeks
- Clear winner identified
- Actionable insights for product optimization
- No negative impact on revenue

## Timeline

- **Day 1-2**: A/B test configuration and SmartScroll changes
- **Day 3-4**: Analytics query development and testing
- **Day 5-7**: Development testing and bug fixes
- **Day 8-14**: Production rollout and monitoring
- **Day 15-21**: Data collection and analysis
- **Day 22+**: Results analysis and implementation of winning variant
