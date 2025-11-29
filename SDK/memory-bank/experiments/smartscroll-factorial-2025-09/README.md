# SmartScroll 2x2 Factorial A/B Test - September 2025

## Overview

This experiment tests the interaction between SmartScroll layout changes and monetization partner selection on on3.com. It's a 2x2 factorial design testing both layout optimization and RevContent monetization integration.

## Quick Links

- [Experiment Design](./experiment-design.md) - Complete experimental design and methodology
- [Implementation Plan](./implementation-plan.md) - Technical implementation details and architecture
- [RevContent Integration](./revcontent-integration.md) - RevContent monetization partner integration
- [Analytics & Reporting](./analytics-reporting.md) - Athena queries and statistical analysis
- [Testing Strategy](./testing-strategy.md) - Development and production testing approach

### Planning Documents
- [Planning Q&A](./planning-qa.md) - Original planning questions and answers
- [MDE Assumptions](./mde-assumptions.md) - Statistical power analysis and sample size requirements

## Experiment Summary

**Type**: 2x2 Factorial Design  
**Publisher**: Any publisher with RevContent configuration  
**Duration**: 1 week (35k daily impressions)  
**Traffic Split**: 25% per variant (~8,750 impressions per variant per day)  

### Variants
1. **c00 (Control)**: Current card layout + Mula affiliate monetization only
2. **c10 (Optimized Layout)**: Optimized card layout + Mula affiliate monetization only  
3. **c01 (RevContent Monetization)**: Current card layout + Mula affiliate + RevContent monetization
4. **c11 (Optimized + RevContent)**: Optimized card layout + Mula affiliate + RevContent monetization

### Key Metrics
- **CTR**: Click-through rate (mula_store_click / mula_in_view)
- **RPS**: Revenue per session (total revenue / sessions by variant)

### Expected Outcomes
- Main effects: Layout impact, Monetization impact
- Interaction effects: Does new layout work better with RevContent?
- Statistical power: 80% power to detect 20% lift (α=0.05)

## Status
- **Phase**: Planning Complete
- **Next**: Implementation
- **Target Launch**: TBD

## Related Files
- RevContent Reporting: `monetization/revcontent/reporting.md`
- RevContent Widget: `monetization/revcontent/on3.com/index.html`
