# NPM Commands Reference: SmartScroll Density & Position Experiment

## 🚀 Quick Start

```bash
cd www.makemula.ai

# Run fresh analysis (14 days) - RECOMMENDED
npm run experiment:density-position

# Quick analysis (7 days) - for development
npm run experiment:density-position:dev

# Use cached results - FASTEST
npm run experiment:density-position:cached
```

## 📊 All Available Commands

### Density & Position Experiment
```bash
# Fresh analysis (14 days)
npm run experiment:density-position

# Development analysis (7 days)
npm run experiment:density-position:dev

# Cached results (fastest)
npm run experiment:density-position:cached
```

### Button Experiment (for comparison)
```bash
# Fresh analysis
npm run experiment:button

# Cached results
npm run experiment:button:cached
```

### Advanced Usage
```bash
# Custom parameters
node queries/runners/smartscroll-density-position-experiment.js --days-back 30
node queries/runners/smartscroll-density-position-experiment.js --use-cached
node queries/runners/smartscroll-density-position-experiment.js --experiment custom_name

# Help
node queries/runners/smartscroll-density-position-experiment.js --help
```

### Query System
```bash
# List all queries
npm run queries:list

# Run specific query
npm run queries:run smartscroll-density-position-experiment --days-back 14

# Time series analysis
npm run queries:run smartscroll-density-position-timeseries --days-back 14
```

## 📈 What You'll See

### Sample Output
```
🔬 Running SmartScroll Density & Position Experiment Analysis...
📅 Days back: 14
🧪 Experiment: smartscroll_density_position_2025_10
💾 Use cached results: false

=== SmartScroll Density & Position Experiment Results ===
🧪 Experiment: smartscroll_density_position_2025_10
📅 Analysis Period: 14 days

Variant                 Sessions    In Views    Store Clicks    Next Page Clicks    Store CTR    Next Page CTR    Overall Engagement
-------                 --------    --------    -------------    -----------------    ----------    -------------    -------------------
control                 1234        5678        23              12                   0.4051       0.2113          0.6164
density_inverted        1200        5432        28              18                   0.5156       0.3314          0.8470
position_early          1189        5345        25              15                   0.4675       0.2806          0.7481

=== Statistical Significance ===
Variant                 Store CTR Significance        Next Page CTR Significance
-------                 -----------------------        -------------------------
control                 Not Significant               Not Significant
density_inverted        Significant (p < 0.05)        Significant (p < 0.05)
position_early          Not Significant               Significant (p < 0.10)

=== Key Insights (vs Control) ===
🎯 Control Baseline:
   Store CTR: 0.4051%
   Next Page CTR: 0.2113%
   Overall Engagement: 0.6164%

📊 Density Inverted:
   Store CTR: 0.5156% (+27.27% lift)
   Next Page CTR: 0.3314% (+56.84% lift)
   Store CTR Significance: Significant (p < 0.05)
   Next Page CTR Significance: Significant (p < 0.05)

🏆 SIGNIFICANT RESULTS FOUND:
   ✅ density_inverted: Significant (p < 0.05) (Store CTR), Significant (p < 0.05) (Next Page CTR)
```

## 🔧 Troubleshooting

### No Data Found
```bash
# Check if experiment is running
npm run experiment:density-position:dev

# Verify with 1 day
node queries/runners/smartscroll-density-position-experiment.js --days-back 1
```

### Cached Results Not Found
```bash
# Run fresh analysis first
npm run experiment:density-position:dev

# Then use cached
npm run experiment:density-position:cached
```

### Query Errors
```bash
# Test query system
npm run queries:test

# Check query info
npm run queries:info smartscroll-density-position-experiment
```

## 📋 Best Practices

### For Daily Monitoring
```bash
# Use cached for speed
npm run experiment:density-position:cached
```

### For Weekly Analysis
```bash
# Use fresh 14-day analysis
npm run experiment:density-position
```

### For Development
```bash
# Use 7-day analysis for faster iteration
npm run experiment:density-position:dev
```

## 🎯 Success Criteria

- **Sample Size**: 10,000+ in_views per variant
- **Significance**: p < 0.05 for primary metrics
- **Lift**: 15%+ improvement in at least one metric
- **Duration**: 7-14 days minimum

## 📁 File Locations

- **Runner**: `queries/runners/smartscroll-density-position-experiment.js`
- **Query**: `queries/queries/smartscroll-density-position-experiment.sql`
- **Results**: `data/athena-results/smartscroll-density-position-experiment/`
- **Documentation**: `memory-bank/experiments/smartscroll-density-position-2025-10/`
