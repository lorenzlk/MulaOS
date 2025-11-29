# Experiment Design: SmartScroll Density & Position Test

## Experimental Design

### Design Type
**3-Variant A/B Test** - Tests density and position factors with single-factor variants

### Research Questions
1. **Density Impact**: Does inverting the density from 3-1 products to 3-1 articles improve engagement?
2. **Position Impact**: Does placing articles at position 1 instead of position 4 improve discovery?

### Variants

| Variant | Name | Density | Position | Description |
|---------|------|---------|----------|-------------|
| control | Control | 3-1 products | Position 4 | Current behavior: 3 products, then 1 article, repeat |
| density_inverted | Density Inverted | 3-1 articles | Position 4 | 3 articles, then 1 product, repeat |
| position_early | Position Early | 3-1 products | Position 1 | 1 article, then 3 products, repeat |

### Current State Analysis
- **Current Density**: 3-1 products (75% products, 25% articles)
- **Current Position**: Every 4th tile (positions 4, 7, 10, 13, etc.)
- **Current Logic**: `if (totalItemsInserted % 3 === 0)` in SmartScroll.svelte line 1386

### Traffic Allocation
- **Equal Split**: 33.33% per variant (~16,667 impressions per variant per day)
- **Total Daily Traffic**: ~50,000 mula_in_view events
- **Publisher Scope**: Any publisher with `window.Mula.nextPage` enabled
- **Activation**: Next page feature must be active

## Statistical Power Analysis

### Baseline Assumptions
- **Daily Impressions**: ~50,000 viewable impressions
- **Baseline Store CTR**: ~0.4% (200 clicks/day total)
- **Baseline Next Page CTR**: ~0.2% (100 clicks/day total)
- **Per Cell Traffic**: ~16,667 impressions/day

### Minimum Detectable Effect (MDE)
- **Target MDE**: +15% lift for both Store CTR and Next Page CTR
- **Statistical Power**: 80%
- **Significance Level**: α = 0.05
- **Required Sample Size**: ~2 weeks for statistical significance

### Success Criteria
- **Primary**: Statistically significant improvement in Store CTR or Next Page CTR
- **Secondary**: No significant decrease in the other metric
- **Minimum**: 15% lift in at least one primary metric

## Hypothesis

### Density Hypothesis
**H1**: Inverting density to favor articles (3-1 articles) will increase Next Page CTR while potentially decreasing Store CTR
**Rationale**: More articles = more opportunities for article discovery, but fewer product opportunities

### Position Hypothesis  
**H2**: Placing articles at position 1 will increase Next Page CTR due to earlier discovery
**Rationale**: Users see articles immediately, increasing likelihood of engagement before scrolling away

### Interaction Hypothesis
**H3**: Density and position changes may have interaction effects on overall engagement
**Rationale**: Early article placement combined with higher article density could compound effects

## Risk Assessment

### Low Risk Factors
- Changes isolated to SmartScroll component
- Easy to revert if issues arise
- No impact on existing product functionality
- Clear rollback plan available

### Potential Risks
- **User Experience**: Drastic density changes might confuse users
- **Revenue Impact**: Fewer products could reduce affiliate revenue
- **Technical**: Complex logic might introduce bugs

### Mitigation Strategies
- Thorough testing with query string overrides
- Gradual rollout with monitoring
- Clear rollback plan
- Revenue monitoring during experiment
