# Testing Strategy: SmartScroll 2x2 Factorial A/B Test

## Overview

This document outlines the comprehensive testing strategy for the SmartScroll 2x2 factorial A/B test, covering development testing, production validation, and monitoring approaches.

## Testing Phases

### Phase 1: Development Testing
**Goal**: Validate implementation in development environment

#### Unit Testing
1. **ABTest.js Configuration**
   - Test domain filtering (on3.com only)
   - Test variant assignment logic
   - Test query string overrides
   - Test factor extraction functions

2. **SmartScroll Layout Variants**
   - Test horizontal vs vertical layout rendering
   - Test responsive behavior
   - Test card styling and animations
   - Test button functionality

3. **RevContent Integration**
   - Test script injection
   - Test SubId tracking
   - Test widget rendering
   - Test API integration

#### Integration Testing
1. **End-to-End Flow**
   - Test complete user journey
   - Test event tracking
   - Test revenue attribution
   - Test error handling

2. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Mobile)
   - Different screen sizes

#### Performance Testing
1. **Core Web Vitals**
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

2. **Load Time Testing**
   - SDK load time
   - RevContent script load time
   - Widget render time

### Phase 2: Staging Testing
**Goal**: Validate in production-like environment

#### Staging Environment Setup
- **Domain**: staging.on3.com or test subdomain
- **Traffic**: 100% test traffic
- **Data**: Real product feeds and RevContent ads
- **Monitoring**: Full monitoring and alerting

#### Test Scenarios
1. **Variant Testing**
   - Test all 4 variants (c00, c10, c01, c11)
   - Test query string overrides
   - Test variant persistence

2. **Revenue Attribution Testing**
   - Test Mula revenue tracking
   - Test RevContent revenue tracking
   - Test combined attribution

3. **Error Handling Testing**
   - Test RevContent script failure
   - Test API failures
   - Test network issues

### Phase 3: Canary Deployment
**Goal**: Gradual rollout with monitoring

#### Canary Strategy
1. **5% Traffic**: Initial canary deployment
2. **24-Hour Monitoring**: Watch for errors and issues
3. **Gradual Increase**: 10% → 25% → 50% → 100%
4. **Rollback Plan**: Immediate rollback if issues detected

#### Monitoring During Canary
1. **Error Rates**: JavaScript errors, API failures
2. **Performance**: Core Web Vitals, load times
3. **Revenue**: Attribution accuracy
4. **User Experience**: Engagement metrics

### Phase 4: Full Deployment
**Goal**: Complete experiment deployment

#### Full Traffic Allocation
- **25% per variant**: Equal distribution
- **Continuous Monitoring**: Real-time alerting
- **Daily Reports**: Statistical analysis

## Testing Tools and Methods

### Development Testing Tools

#### Query String Testing
```javascript
// Test specific variants
?mulaABTest=c00  // Control: horizontal + Mula
?mulaABTest=c10  // New layout: vertical + Mula
?mulaABTest=c01  // RevContent: horizontal + RevContent
?mulaABTest=c11  // Both: vertical + RevContent

// Test QA version
?mulaQaVersion=factorial-test
```

#### Browser Console Testing
```javascript
// Debug experiment assignment
window.debugExperiment = function() {
    console.log('Experiment Status:', {
        domain: window.location.hostname,
        sessionId: window.Mula.sessionId,
        experiment: window.Mula.experiment,
        variant: window.Mula.variant
    });
};

// Debug RevContent integration
window.debugRevContent = function() {
    console.log('RevContent Status:', {
        scriptLoaded: !!window.rcws,
        subIds: window.rcws?.subIds,
        widgets: document.querySelectorAll('[data-widget-host="revcontent"]').length
    });
};
```

#### Performance Testing
```javascript
// Core Web Vitals testing
window.testCoreWebVitals = function() {
    // Test LCP
    new PerformanceObserver((list) => {
        const entries = list.getEntries();
        console.log('LCP:', entries[entries.length - 1].startTime);
    }).observe({entryTypes: ['largest-contentful-paint']});
    
    // Test FID
    new PerformanceObserver((list) => {
        const entries = list.getEntries();
        console.log('FID:', entries[0].processingStart - entries[0].startTime);
    }).observe({entryTypes: ['first-input']});
    
    // Test CLS
    new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
            }
        }
        console.log('CLS:', clsValue);
    }).observe({entryTypes: ['layout-shift']});
};
```

### Production Testing Tools

#### A/B Test Debugging
```javascript
// A/B test debugging functions
window.Mula.debugABTest = function() {
    const assignment = window.Mula.getExperimentAssignment(
        'smartscroll_factorial_2025_09', 
        ['c00', 'c10', 'c01', 'c11']
    );
    console.log('A/B Test Debug:', {
        variant: assignment.variant,
        logData: assignment.logData,
        isForced: window.Mula.isVariantForced(assignment.variant, 'smartscroll_factorial_2025_09', ['c00', 'c10', 'c01', 'c11'])
    });
};
```

#### Revenue Attribution Testing
```javascript
// Test revenue attribution
window.testRevenueAttribution = function() {
    // Test Mula attribution
    console.log('Mula Attribution:', {
        sessionId: window.Mula.sessionId,
        subId2: window.Mula.sessionId
    });
    
    // Test RevContent attribution
    console.log('RevContent Attribution:', {
        test: 'MULA_AB_2025_09',
        variant: window.Mula.variant,
        subIds: window.rcws?.subIds
    });
};
```

## Test Cases

### Functional Test Cases

#### 1. Variant Assignment Testing
- **Test Case**: Verify correct variant assignment
- **Steps**:
  1. Load page on on3.com
  2. Check experiment assignment
  3. Verify variant is one of c00, c10, c01, c11
  4. Test query string override
- **Expected**: Correct variant assignment and override functionality

#### 2. Layout Variant Testing
- **Test Case**: Verify layout changes work correctly
- **Steps**:
  1. Test c00/c01 (horizontal layout)
  2. Test c10/c11 (vertical layout)
  3. Verify responsive behavior
  4. Test card animations
- **Expected**: Correct layout rendering and responsive behavior

#### 3. RevContent Integration Testing
- **Test Case**: Verify RevContent integration works
- **Steps**:
  1. Test c01/c11 variants (RevContent enabled)
  2. Verify script injection
  3. Verify SubId tracking
  4. Verify widget rendering
- **Expected**: RevContent ads display correctly with proper attribution

#### 4. Event Tracking Testing
- **Test Case**: Verify all events are tracked correctly
- **Steps**:
  1. Test widget view events
  2. Test click events
  3. Test viewport visibility events
  4. Verify experiment data in events
- **Expected**: All events tracked with correct experiment data

### Performance Test Cases

#### 1. Core Web Vitals Testing
- **Test Case**: Verify no negative impact on Core Web Vitals
- **Steps**:
  1. Measure LCP before and after
  2. Measure FID before and after
  3. Measure CLS before and after
  4. Compare with baseline
- **Expected**: No significant degradation in Core Web Vitals

#### 2. Load Time Testing
- **Test Case**: Verify acceptable load times
- **Steps**:
  1. Measure SDK load time
  2. Measure RevContent script load time
  3. Measure widget render time
  4. Test on slow connections
- **Expected**: Load times within acceptable limits

### Revenue Attribution Test Cases

#### 1. Mula Attribution Testing
- **Test Case**: Verify Mula revenue attribution
- **Steps**:
  1. Generate test clicks
  2. Verify subId2 parameter
  3. Check Impact API data
  4. Verify attribution accuracy
- **Expected**: Accurate Mula revenue attribution

#### 2. RevContent Attribution Testing
- **Test Case**: Verify RevContent revenue attribution
- **Steps**:
  1. Generate test impressions
  2. Verify SubId tracking
  3. Check RevContent API data
  4. Verify attribution accuracy
- **Expected**: Accurate RevContent revenue attribution

## Monitoring and Alerting

### Real-Time Monitoring

#### Error Monitoring
```javascript
// Error monitoring setup
window.addEventListener('error', (event) => {
    if (event.message.includes('RevContent') || event.message.includes('Mula')) {
        // Send error to monitoring service
        console.error('Experiment Error:', event);
    }
});
```

#### Performance Monitoring
```javascript
// Performance monitoring
const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        if (entry.name.includes('mula') || entry.name.includes('revcontent')) {
            console.log('Performance Entry:', entry);
        }
    });
});
observer.observe({entryTypes: ['measure', 'navigation']});
```

### Alerts Configuration

#### Critical Alerts
1. **JavaScript Errors**: Any uncaught errors in experiment code
2. **API Failures**: RevContent API or Impact API failures
3. **Revenue Attribution**: Missing or incorrect attribution data
4. **Performance Degradation**: Significant Core Web Vitals impact

#### Warning Alerts
1. **Traffic Imbalance**: Variant distribution >5% from expected
2. **Low Sample Size**: Insufficient data for statistical analysis
3. **High Error Rate**: Error rate >1% for any variant
4. **Revenue Discrepancy**: Significant difference between expected and actual revenue

### Daily Monitoring Checklist

#### Technical Health
- [ ] No JavaScript errors
- [ ] All APIs responding correctly
- [ ] Revenue attribution working
- [ ] Core Web Vitals within limits

#### Experiment Health
- [ ] Traffic distribution balanced
- [ ] All variants receiving traffic
- [ ] Event tracking complete
- [ ] Statistical power adequate

#### Business Health
- [ ] Revenue tracking accurate
- [ ] User engagement maintained
- [ ] No negative business impact
- [ ] Experiment progressing as expected

## Rollback Plan

### Immediate Rollback Triggers
1. **Critical Errors**: Any JavaScript errors that break functionality
2. **Performance Issues**: Significant Core Web Vitals degradation
3. **Revenue Loss**: Significant decrease in revenue
4. **User Experience**: Negative impact on user engagement

### Rollback Process
1. **Immediate**: Disable experiment via feature flag
2. **Revert**: Deploy previous version of code
3. **Monitor**: Watch for resolution of issues
4. **Investigate**: Root cause analysis
5. **Fix**: Address issues before re-deployment

### Rollback Testing
1. **Feature Flag Testing**: Verify rollback mechanism works
2. **Code Reversion**: Test code rollback process
3. **Data Integrity**: Ensure no data loss during rollback
4. **User Impact**: Minimize user experience disruption

## Success Criteria

### Technical Success
- **Zero Critical Errors**: No JavaScript errors or API failures
- **Performance Maintained**: No negative Core Web Vitals impact
- **Attribution Working**: Accurate revenue tracking from both partners

### Statistical Success
- **Adequate Sample Size**: Sufficient data for statistical analysis
- **Balanced Traffic**: 25% per variant with <5% deviation
- **Data Quality**: Complete and accurate event tracking

### Business Success
- **Revenue Maintained**: No negative impact on revenue
- **User Experience**: Maintained or improved engagement
- **Learnings**: Valuable insights for future optimization

## Next Steps
1. **Set Up Testing Environment**: Configure development and staging environments
2. **Implement Test Cases**: Build automated and manual test cases
3. **Set Up Monitoring**: Configure alerts and monitoring systems
4. **Execute Testing**: Run comprehensive testing before deployment
5. **Deploy & Monitor**: Gradual rollout with continuous monitoring
