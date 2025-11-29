# SmartScroll A/B Test Implementation

## Overview

This document describes the A/B test implementation for the SmartScroll widget that tested replacing the "View Details" and "Like" buttons with a single "Buy Now" button.

## ⚠️ EXPERIMENT STATUS: CONCLUDED

**Result**: Treatment underperformed with statistically significant negative impact
**Conclusion**: Control variant (View Details + Like) performs better
**Action**: All users reverted to control variant

## Experiment Details

- **Experiment Name**: `smartscroll_button_variant`
- **Status**: CONCLUDED (September 6, 2025)
- **Variants**: 
  - `control`: Original "View Details" + "Like" buttons ✅ **WINNER**
  - `buy_now`: Single black "Buy Now" button ❌ **LOSER**
- **Traffic Split**: 50/50 (deterministic based on session ID)
- **Primary Metric**: Click-through rate (CTR) = store_clicks / widget_views
- **CTR Denominator**: Uses `mula_in_view` (viewport visibility) instead of `mula_widget_view` for accurate engagement metrics

## Final Results (30-day analysis)

- **Control CTR**: 0.3961%
- **Buy Now CTR**: 0.3700%
- **Lift**: -6.60% (statistically significant, p < 0.01)
- **Conclusion**: Buy Now variant significantly underperformed
- **Action**: Reverted all users to control variant

## Implementation Components

### 1. A/B Test Utility (`src/lib/ABTest.js`)

Provides deterministic variant assignment based on session ID:

```javascript
import { getExperimentData, SMARTSCROLL_BUTTON_EXPERIMENT } from './ABTest.js';

// Get experiment data for event logging
const experimentData = getExperimentData(
    sessionId, 
    SMARTSCROLL_BUTTON_EXPERIMENT.name, 
    SMARTSCROLL_BUTTON_EXPERIMENT.variants
);
```

### 2. SmartScroll Component Modifications

The SmartScroll component has been updated to:

- Initialize experiment data in `onMount()`
- Conditionally render different button layouts based on variant
- Include experiment data in all event logging
- Handle different event listeners for each variant

### 3. Event Logging

All events now include experiment data:

```javascript
// Events include experiment and variant
logEvent("mula_widget_view", "smartscroll", {
    widget: "smartscroll",
    experiment: "smartscroll_button_variant",
    variant: "buy_now" // or "control"
});
```

## Button Variants

### Control Variant
- **View Details Button**: Opens product link
- **Like Button**: Toggles like state and triggers personalization
- **Image Click**: Opens product link

### Buy Now Variant
- **Buy Now Button**: Single black button that opens product link
- **Image Click**: Opens product link
- **No Like functionality**: Removed to simplify the interface

## Analytics Query

The experiment results can be analyzed using the SQL query:

**File**: `www.makemula.ai/queries/queries/smartscroll-button-experiment.sql`

**Runner**: `www.makemula.ai/queries/runners/smartscroll-button-experiment.js`

### Running the Analysis

```bash
cd www.makemula.ai/queries
node runners/smartscroll-button-experiment.js 7 smartscroll_button_variant
```

### Output Metrics

- **Widget Views**: Number of unique sessions that viewed the widget (based on `mula_in_view` events)
- **Store Clicks**: Number of clicks on product links
- **CTR**: Click-through rate (store_clicks / widget_views) using viewport visibility as denominator
- **Lift**: Percentage improvement over control
- **Statistical Significance**: Chi-square test results

### CTR Calculation Rationale

The CTR calculation uses `mula_in_view` (viewport visibility) as the denominator instead of `mula_widget_view` (widget eligibility) for several important reasons:

1. **True Visibility**: `mula_in_view` only fires when the widget is actually visible in the viewport (10% threshold)
2. **Accurate Engagement**: Measures clicks from users who had the opportunity to see and interact with the widget
3. **Better Business Metrics**: Reflects actual user engagement rather than technical eligibility
4. **Industry Standard**: Aligns with standard analytics practices for viewport-based metrics

**Previous Issue**: Using `mula_widget_view` as denominator included users who never scrolled to see the widget, artificially deflating CTR metrics and making it difficult to assess true variant performance.

### Forced Variant Exclusion

**Important**: Forced variants (via query string) are automatically excluded from experimental results to prevent contamination:

- When a variant is forced via `?mulaABTest=control` or `?mulaABTest=buy_now`, no experiment data is included in events
- This ensures that testing and debugging activities don't skew the experimental results
- Forced variants are completely invisible to the analytics pipeline

## Testing

### Testing

The A/B test can be tested by:

1. **Using query string parameters** to force specific variants
2. **Checking browser console** for experiment assignment and event logging
3. **Verifying button behavior** matches the assigned variant

### Manual Testing

1. Open the test page in a browser
2. Check the debug panel for experiment assignment
3. Verify button layout matches the assigned variant
4. Test clicking buttons and verify events are logged
5. Clear cookies and reload to test different variants

### Query String Override Testing

You can force a specific variant using the query string parameter:

- **Force Control**: `?mulaABTest=control`
- **Force Buy Now**: `?mulaABTest=buy_now`
- **Random Assignment**: Remove the parameter or use an invalid value

Examples:
```
https://example.com/page?mulaABTest=control
https://example.com/page?mulaABTest=buy_now
https://example.com/page (random assignment)
```

This is useful for:
- Testing specific variants during development
- Debugging variant-specific issues
- Demonstrating the experiment to stakeholders
- Manual QA testing

### Expected Behavior

- **Session Consistency**: Same session ID always gets the same variant
- **Query String Override**: `?mulaABTest=control` or `?mulaABTest=buy_now` forces specific variant
- **Event Logging**: Natural variants include experiment data, forced variants do not
- **Button Functionality**: Each variant has appropriate click handlers
- **Visual Design**: Buy Now variant shows single black button

## Deployment

### 1. Build the SDK

```bash
cd sdk.makemula.ai
npm run build
```

### 2. Deploy to CDN

The built SDK will be available at `cdn.makemula.ai` and will automatically start serving the A/B test.

### 3. Monitor Results

Use the analytics query to monitor experiment performance:

```bash
# Check results for the last 7 days
node queries/runners/smartscroll-button-experiment.js 7

# Check results for the last 30 days  
node queries/runners/smartscroll-button-experiment.js 30
```

## Configuration

### Experiment Parameters

The experiment can be configured by modifying `SMARTSCROLL_BUTTON_EXPERIMENT` in `ABTest.js`:

```javascript
export const SMARTSCROLL_BUTTON_EXPERIMENT = {
    name: 'smartscroll_button_variant',
    variants: ['control', 'buy_now'],
    description: 'Tests replacing View Details + Like buttons with single Buy Now button'
};
```

### Traffic Split

The traffic split is determined by the number of variants. For 50/50 split, use 2 variants. For other splits, modify the variants array.

## Troubleshooting

### Common Issues

1. **No Experiment Data**: Ensure session ID is available in `window.Mula.sessionId`
2. **Wrong Variant**: Check that the hash function is working correctly
3. **Missing Events**: Verify that experiment data is included in event logging
4. **Button Not Working**: Check that event listeners are set up for the correct variant

### Debug Information

Enable detailed logging by setting:

```javascript
window.Mula.logLevel = 2;
```

This will show experiment assignment and event logging in the browser console.

### A/B Test Debugging Functions

The following functions are available on `window.Mula` for debugging:

```javascript
// Unified assignment for UI and logging
const assignment = window.Mula.getExperimentAssignment('smartscroll_button_variant', ['control', 'buy_now']);
console.log(assignment.variant); // For UI
console.log(assignment.logData); // For logging
```

Example usage in browser console:
```javascript
// Check current experiment assignment
const assignment = window.Mula.getExperimentAssignment('smartscroll_button_variant', ['control', 'buy_now']);
console.log('Variant:', assignment.variant);
console.log('Log data:', assignment.logData);
```

**For UI logic:** Use `assignment.variant`.
**For event logging:** Use `assignment.logData`.

## Future Enhancements

1. **Dynamic Traffic Split**: Allow runtime configuration of traffic split
2. **Multiple Experiments**: Support for running multiple experiments simultaneously
3. **Real-time Monitoring**: Dashboard for real-time experiment monitoring
4. **Automatic Winner Selection**: Automatic selection of winning variant based on statistical significance 