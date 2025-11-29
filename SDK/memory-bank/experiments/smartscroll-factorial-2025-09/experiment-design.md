# Experiment Design: SmartScroll 2x2 Factorial A/B Test

## Experimental Design

### Design Type
**2x2 Factorial Design** - Tests two factors simultaneously with all combinations

### Factors
1. **Layout Factor**
   - Control: Current card layout (portrait orientation with existing internal structure)
   - Treatment: Optimized card layout (portrait orientation with redesigned internal layout)

2. **Monetization Factor**
   - Control: Mula affiliate monetization only
   - Treatment: Mula affiliate monetization + RevContent supplemental monetization

### Variants
| Variant | Name | Layout | Monetization | Description |
|---------|------|--------|--------------|-------------|
| c00 | Control | Current | Mula Only | Current card layout with Mula affiliate monetization only |
| c10 | Optimized Layout | Optimized | Mula Only | Optimized card layout with Mula affiliate monetization only |
| c01 | RevContent Monetization | Current | Mula + RevContent | Current card layout with both Mula and RevContent monetization |
| c11 | Optimized + RevContent | Optimized | Mula + RevContent | Optimized card layout with both Mula and RevContent monetization |

### Traffic Allocation
- **Equal Split**: 25% per variant (~8,750 impressions per variant per day)
- **Total Daily Traffic**: ~35,000 mula_in_view events
- **Current CTR**: 0.36% (mula_store_click / mula_in_view)
- **Publisher Scope**: Any publisher with RevContent configuration
- **Activation**: `window.Mula.revContent` must be truthy
- **Configuration**: `window.Mula.revContent = {pubId: 'xxx', widgetId: 'yyy'}`

## Statistical Power Analysis

*For detailed statistical assumptions and calculations, see [MDE Assumptions](./mde-assumptions.md).*

### Baseline Assumptions
- **Daily Impressions**: ~10,000 viewable impressions
- **Baseline CTR**: ~1.0% (100 clicks/day total)
- **Per Cell Traffic**: ~2,500 impressions/day

### Minimum Detectable Effect (MDE)
- **Target MDE**: +20% lift (CTR from 1.0% → 1.2%)
- **Statistical Power**: 80%
- **Significance Level**: α = 0.05

### Expected Runtime
- **Main Effects**: ~18-23 days (3+ weeks)
- **Interaction Effects**: ~20-26 days (3-4 weeks)
- **Conservative Estimate**: 4 weeks for full analysis

## Success Metrics

### Primary Metrics
1. **Click-Through Rate (CTR)**
   - Formula: `mula_store_click / mula_in_view`
   - Denominator: Viewport visibility events (not widget eligibility)
   - Rationale: Measures actual user engagement

2. **Revenue Per Session (RPS)**
   - Formula: `total_revenue / sessions_by_variant`
   - Attribution: 30-day window
   - Sources: Mula (Impact API) + RevContent (Sub ID Stats API)

### Secondary Metrics
- **Viewport Visibility Rate**: mula_in_view / mula_widget_view
- **Session Duration**: Time spent on page
- **Scroll Depth**: How far users scroll through feed
- **Load Performance**: Core Web Vitals impact

## Experimental Hypotheses

### Main Effects
1. **Layout Effect (H1)**: Optimized card layout will improve CTR vs current layout
2. **Monetization Effect (H2)**: Adding RevContent will improve RPS through supplemental monetization

### Interaction Effects
3. **Layout × Monetization (H3)**: Optimized layout + RevContent will have synergistic effects on both CTR and RPS

### Null Hypotheses
- H1₀: No difference in CTR between current and optimized card layouts
- H2₀: No difference in RPS between Mula-only and Mula+RevContent monetization
- H3₀: No interaction between layout optimization and supplemental monetization factors

## Statistical Analysis Plan

### Analysis Method
- **Primary**: Chi-square tests for CTR differences
- **Secondary**: ANOVA for RPS analysis
- **Interaction**: Factorial ANOVA for interaction effects
- **Multiple Comparisons**: Bonferroni correction for multiple testing

### Sample Size Requirements
- **Per Cell**: ~42,700 impressions minimum
- **Total Sample**: ~170,800 impressions across all variants
- **Current Rate**: ~2,500 impressions/cell/day
- **Required Days**: ~18 days minimum

### Stopping Rules
- **Early Stopping**: If p < 0.001 (highly significant)
- **Minimum Runtime**: 14 days (insufficient power before)
- **Maximum Runtime**: 6 weeks (diminishing returns)

## Risk Assessment

### Technical Risks
- **RevContent Integration**: New partner integration complexity
- **Layout Changes**: Potential performance impact
- **Revenue Attribution**: Complex multi-partner attribution

### Mitigation Strategies
- **Domain Filtering**: Only on3.com to limit scope
- **Canary Deployment**: Gradual rollout with monitoring
- **Fallback Logic**: Graceful degradation if RevContent fails
- **Revenue Validation**: Cross-check API data sources

### Business Risks
- **Revenue Impact**: Potential negative impact on existing revenue
- **User Experience**: Layout changes might confuse users
- **Partner Dependencies**: Reliance on RevContent performance

## Success Criteria

### Statistical Success
- **Significance**: p < 0.05 for main effects
- **Effect Size**: ≥20% improvement in primary metrics
- **Power**: ≥80% statistical power achieved

### Business Success
- **Revenue**: Positive RPS impact without CTR degradation
- **Performance**: No negative Core Web Vitals impact
- **Scalability**: Learnings applicable to other publishers

## Next Steps
1. **Implementation**: Build technical infrastructure
2. **Testing**: Validate integration and attribution
3. **Launch**: Deploy with canary traffic
4. **Monitor**: Track metrics and statistical significance
5. **Analyze**: Run statistical analysis at conclusion
6. **Decide**: Implement winning variant or iterate
