# RevContent Integration: SmartScroll 2x2 Factorial A/B Test

## Overview

This document details the integration of RevContent as a supplemental monetization partner for the SmartScroll 2x2 factorial A/B test. RevContent will run alongside existing Mula affiliate monetization on any publisher with RevContent configuration to measure both additive revenue effects and potential interaction effects.

## RevContent Configuration

### Publisher Configuration
**Location**: `./sdk.makemula.ai/svelte-components/public/pubs/<TLD>/index.js`

```javascript
// Example publisher configuration
window.Mula.revContent = {
    pubId: '198204',      // Publisher ID from RevContent
    widgetId: '287645'    // Widget ID from RevContent (on3.com)
};

// Available publisher configurations:
// - brit.co: widgetId: '287642'
// - swimmingworld.com: widgetId: '287643'  
// - stylecaster.com: widgetId: '287644'
// - on3.com: widgetId: '287645'
// - defpen.com: widgetId: '287646'
```

### Widget Details
- **Widget Type**: 300x250 display ad
- **Placement**: Every 3rd product card in SmartScroll feed
- **Monetization Model**: Supplemental to existing Mula affiliate monetization
- **Activation**: Only on publishers with RevContent configuration

### SubId Tracking
- **Test Name**: `MULA_AB_2025_09`
- **Variant Labels**: `c00`, `c10`, `c01`, `c11`
- **Purpose**: Revenue attribution by experiment variant
- **Data Source**: Blended approach (Athena session data + RevContent API revenue data)

## Implementation Details

### Light/Shadow DOM Pattern
RevContent integration follows the existing SDK pattern for light/shadow DOM:

1. **Script Injection**: RevContent widget script and subId configuration in `<head>`
2. **Shadow DOM**: Slot elements created in SmartScroll component
3. **Light DOM**: RevContent widget divs with slot attributes
4. **Critical**: RevContent div must exist in light DOM for widget to render

### Script Injection
RevContent script must be injected in the `<head>` before any widget scripts load:

```javascript
// RevContent script injection function
function injectRevContentScript(variant) {
    // Prevent duplicate injection
    if (window.rcws) return;
    
    // Get RevContent configuration from publisher
    const revContentConfig = window.Mula.revContent;
    if (!revContentConfig || !revContentConfig.pubId || !revContentConfig.widgetId) {
        console.warn('RevContent configuration not found');
        return;
    }
    
    // Set up SubId tracking
    window.rcws = window.rcws || {};
    window.rcws.subIds = {
        [revContentConfig.widgetId]: {
            test: 'MULA_AB_2025_09',
            variant: variant
        }
    };
    
    // Inject RevContent script
    const script = document.createElement('script');
    script.src = `https://delivery.revcontent.com/${revContentConfig.pubId}/${revContentConfig.widgetId}/widget.js`;
    script.async = true;
    document.head.appendChild(script);
}
```

### Integration with SmartScroll
RevContent widgets are injected every 3rd product card using existing logic:

```javascript
// In SmartScroll.svelte renderProducts() function
if (monetizationVariant === 'revcontent' && totalItemsInserted > 0 && index % 3 === 0) {
    // Get RevContent configuration from publisher
    const revContentConfig = window.Mula.revContent;
    if (!revContentConfig || !revContentConfig.pubId || !revContentConfig.widgetId) {
        console.warn('RevContent configuration not found');
        return;
    }
    
    // Create RevContent widget container
    const revContentDiv = document.createElement('div');
    revContentDiv.setAttribute('data-widget-host', 'revcontent');
    revContentDiv.setAttribute('data-pub-id', revContentConfig.pubId);
    revContentDiv.setAttribute('data-widget-id', revContentConfig.widgetId);
    revContentDiv.style.width = '300px';
    revContentDiv.style.height = '250px';
    revContentDiv.style.marginBottom = '18px';
    revContentDiv.style.alignSelf = 'center';
    
    // Insert into feed
    productFeed.insertBefore(revContentDiv, sentinelElement);
    totalItemsInserted++;
}
```

### SubId Management
SubId tracking is handled automatically by RevContent when the script loads with the `window.rcws.subIds` configuration.

## Revenue Attribution

### RevContent API Integration
Revenue data is retrieved via RevContent's Sub ID Stats API:

**API Documentation**: [RevContent Publisher-Advertiser API Requests](https://help.revcontent.com/knowledge/publisher-advertiser-api-requests)

#### Authentication
```javascript
// OAuth2 Client Credentials flow
async function getRevContentToken() {
    const response = await fetch('https://api.revcontent.io/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.REVCONTENT_CLIENT_ID,
            client_secret: process.env.REVCONTENT_CLIENT_SECRET
        })
    });
    
    const data = await response.json();
    return data.access_token; // Valid for ~24 hours
}
```

#### Revenue Data Retrieval
```javascript
// Collect widget IDs from all publishers with RevContent configuration
function collectRevContentWidgetIds() {
    // This would be implemented in the analytics system
    // to collect all active RevContent widget IDs from publishers
    return [
        '287642', // brit.co
        '287643', // swimmingworld.com
        '287644', // stylecaster.com
        '287645', // on3.com
        '287646'  // defpen.com
    ];
}

// Get Sub ID stats for experiment variants
async function getRevContentRevenue(startDate, endDate, widgetIds) {
    const token = await getRevContentToken();
    const url = new URL('https://api.revcontent.io/stats/publisher/widgets/subids');
    url.searchParams.set('date_start', startDate);
    url.searchParams.set('date_end', endDate);
    url.searchParams.set('widget_ids', widgetIds.join(','));
    url.searchParams.set('group_by', 'date,widget_id,sub_ids');
    url.searchParams.set('sub_id_keys', 'test,variant');
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', '500');
    
    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    return await response.json();
}
```

### Expected API Response
```json
{
    "data": [
        {
            "date": "2025-09-01",
            "widget_id": "287645",
            "sub_ids": {"test": "MULA_AB_2025_09", "variant": "c10"},
            "impressions": 152340,
            "viewable_impressions": 131004,
            "clicks": 1842,
            "ctr": 0.012,
            "revenue": 436.52,
            "ad_rpm": 3.33
        }
    ],
    "pagination": {"page": 1, "limit": 500, "total_pages": 3}
}
```

## Revenue Attribution Service

### Multi-Partner Revenue Tracking
```javascript
class RevenueAttributionService {
    constructor() {
        this.revContentClientId = process.env.REVCONTENT_CLIENT_ID;
        this.revContentClientSecret = process.env.REVCONTENT_CLIENT_SECRET;
    }
    
    async getMulaRevenue(sessionIds, dateRange) {
        // Use existing Impact API integration
        // Filter by session IDs and date range
        // Return revenue by session ID
    }
    
    async getRevContentRevenue(testName, dateRange) {
        const token = await this.getRevContentToken();
        const data = await this.getRevContentRevenue(token, dateRange.start, dateRange.end);
        
        // Group by variant
        const revenueByVariant = {};
        data.data.forEach(row => {
            const variant = row.sub_ids.variant;
            if (!revenueByVariant[variant]) {
                revenueByVariant[variant] = 0;
            }
            revenueByVariant[variant] += row.revenue;
        });
        
        return revenueByVariant;
    }
    
    async getTotalRevenueByVariant(dateRange) {
        const [mulaRevenue, revContentRevenue] = await Promise.all([
            this.getMulaRevenue(null, dateRange), // All sessions
            this.getRevContentRevenue('MULA_AB_2025_09', dateRange)
        ]);
        
        // Combine revenue by variant
        const totalRevenue = {
            'c00': mulaRevenue.c00 || 0,
            'c10': mulaRevenue.c10 || 0,
            'c01': (mulaRevenue.c01 || 0) + (revContentRevenue.c01 || 0),
            'c11': (mulaRevenue.c11 || 0) + (revContentRevenue.c11 || 0)
        };
        
        return totalRevenue;
    }
}
```

## Testing Strategy

### Development Testing
1. **Script Injection**: Verify RevContent script loads correctly
2. **SubId Tracking**: Confirm SubIds are set properly
3. **Widget Rendering**: Ensure ads display in correct positions
4. **API Integration**: Test revenue data retrieval

### Production Testing
1. **Canary Deployment**: Test with 5% traffic initially
2. **Revenue Validation**: Cross-check RevContent data with Mula data
3. **Performance Monitoring**: Ensure no Core Web Vitals impact
4. **Error Handling**: Monitor for failed API calls or script errors

### Query String Testing
```javascript
// Test specific variants
?mulaABTest=c01  // Test RevContent with horizontal layout
?mulaABTest=c11  // Test RevContent with vertical layout
```

## Error Handling

### Script Loading Failures
```javascript
// Fallback if RevContent script fails to load
function handleRevContentError() {
    console.warn('RevContent script failed to load, falling back to Mula monetization');
    // Switch to Mula monetization for affected variants
    // Log error for monitoring
}
```

### API Failures
```javascript
// Handle RevContent API failures
async function getRevContentRevenueWithFallback(token, startDate, endDate) {
    try {
        return await getRevContentRevenue(token, startDate, endDate);
    } catch (error) {
        console.error('RevContent API error:', error);
        // Return zero revenue for affected variants
        return {
            'c01': 0,
            'c11': 0
        };
    }
}
```

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Script Load Success Rate**: % of successful RevContent script loads
2. **Widget Render Rate**: % of RevContent widgets that render successfully
3. **API Success Rate**: % of successful RevContent API calls
4. **Revenue Attribution**: Accuracy of revenue data by variant

### Alerts
1. **Script Load Failure**: Alert if RevContent script fails to load
2. **API Failure**: Alert if RevContent API calls fail
3. **Revenue Discrepancy**: Alert if RevContent revenue data is missing
4. **Performance Impact**: Alert if Core Web Vitals degrade

## Configuration Management

### Environment Variables
```bash
# RevContent API credentials
REVCONTENT_CLIENT_ID=your_client_id
REVCONTENT_CLIENT_SECRET=your_client_secret
REVCONTENT_API_KEY=your_api_key

# Experiment configuration
FACTORIAL_EXPERIMENT_NAME=MULA_AB_2025_09

# Note: RevContent configuration is now publisher-specific
# Each publisher sets window.Mula.revContent = {pubId: 'xxx', widgetId: 'yyy'}
# in their ./sdk.makemula.ai/svelte-components/public/pubs/<TLD>/index.js file
```

### Feature Flags
```javascript
// Feature flag for RevContent integration
const REVCONTENT_ENABLED = process.env.REVCONTENT_ENABLED === 'true';

// Conditional RevContent integration
if (REVCONTENT_ENABLED && monetizationVariant === 'revcontent') {
    injectRevContentScript(assignment.variant);
}
```

## Success Criteria

### Technical Success
- **Script Loading**: 99%+ successful RevContent script loads
- **Widget Rendering**: 95%+ successful widget renders
- **API Reliability**: 99%+ successful API calls
- **Performance**: No negative Core Web Vitals impact

### Business Success
- **Revenue Attribution**: Accurate revenue tracking by variant
- **Monetization Performance**: Competitive RPM vs Mula
- **User Experience**: No negative impact on user engagement

## Troubleshooting

### Common Issues
1. **Script Not Loading**: Check domain restrictions and CORS settings
2. **SubIds Not Tracking**: Verify `window.rcws.subIds` configuration
3. **API Authentication**: Check client credentials and token expiration
4. **Revenue Data Missing**: Verify SubId tracking and API parameters

### Debug Tools
```javascript
// Debug RevContent integration
window.debugRevContent = function() {
    console.log('RevContent Status:', {
        scriptLoaded: !!window.rcws,
        subIds: window.rcws?.subIds,
        widgets: document.querySelectorAll('[data-widget-host="revcontent"]').length
    });
};
```

## Next Steps
1. **Obtain API Credentials**: Get RevContent API access
2. **Implement Script Injection**: Add RevContent script loading
3. **Build Revenue Service**: Create attribution service
4. **Test Integration**: Comprehensive testing before deployment
5. **Deploy & Monitor**: Gradual rollout with monitoring
