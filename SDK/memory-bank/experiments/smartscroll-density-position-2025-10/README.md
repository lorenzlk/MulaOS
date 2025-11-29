# SmartScroll Density & Position Experiment - October 2025

## Overview

This experiment tests the impact of changing next page article density and position in the SmartScroll widget on both Store CTR and Next Page CTR.

## Quick Links

- [Experiment Design](./experiment-design.md) - Complete experimental design and methodology
- [Implementation Plan](./implementation-plan.md) - Technical implementation details
- [Analytics & Reporting](./analytics-reporting.md) - Athena queries and statistical analysis
- [Testing Strategy](./testing-strategy.md) - Development and production testing approach

## Experiment Summary

**Type**: 3-Variant A/B Test  
**Publisher**: Any publisher with next page feature enabled  
**Duration**: 2 weeks (estimated 50k+ daily impressions)  
**Traffic Split**: 33.33% per variant (~16,667 impressions per variant per day)  

### Variants
1. **Control**: 3-1 products, position 4 (current behavior)
2. **Density Inverted**: 3-1 articles, position 4 (test density impact)
3. **Position Early**: 3-1 products, position 1 (test position impact)

### Key Metrics
- **Store CTR**: Click-through rate (mula_store_click / mula_in_view)
- **Next Page CTR**: Click-through rate (mula_next_page_click / mula_in_view)

### Expected Outcomes
- Understand impact of article density on user engagement
- Measure effect of early article placement on discovery
- Optimize feed composition for maximum engagement

## Status
- **Phase**: ✅ CONCLUDED
- **Experiment Period**: October 11 - November 9, 2025 (30 days)
- **Winner**: Position Early (3-1 products, position 1)
- **Results**: See [Experiment Results](./experiment-results.md)

## Final Results Summary

**Position Early** was selected as the winner, delivering:
- **Next Page CTR**: +77.93% lift (statistically significant)
- **Store CTR**: -30.91% impact (not statistically significant)
- **Overall Engagement**: +50% improvement

The variant has been implemented as the default behavior when nextPage is enabled.
