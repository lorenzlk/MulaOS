# Experiment Reporting Guide: SmartScroll Density & Position

## 📊 NPM Scripts for Experiment Reports

The experiment reporting system is fully integrated with npm scripts for easy access. All commands should be run from the `www.makemula.ai` directory.

### Quick Commands

```bash
# Run fresh analysis (14 days)
npm run experiment:density-position

# Run fresh analysis (7 days) - faster for development
npm run experiment:density-position:dev

# Use cached results (fastest)
npm run experiment:density-position:cached

# Run other experiments
npm run experiment:button
npm run experiment:button:cached
```

### Advanced Usage

```bash
# Custom parameters
node queries/runners/smartscroll-density-position-experiment.js --days-back 30
node queries/runners/smartscroll-density-position-experiment.js --use-cached
node queries/runners/smartscroll-density-position-experiment.js --experiment custom_experiment_name

# Help
node queries/runners/smartscroll-density-position-experiment.js --help
```

## 📈 Report Output

### Main Metrics Table
```
Variant                 Sessions    In Views    Store Clicks    Next Page Clicks    Store CTR    Next Page CTR    Overall Engagement
-------                 --------    --------    -------------    -----------------    ----------    -------------    -------------------
control                 1234        5678        23              12                   0.4051       0.2113          0.6164
density_inverted        1200        5432        28              18                   0.5156       0.3314          0.8470
position_early          1189        5345        25              15                   0.4675       0.2806          0.7481
```

### Statistical Significance
```
Variant                 Store CTR Significance        Next Page CTR Significance
-------                 -----------------------        -------------------------
control                 Not Significant               Not Significant
density_inverted        Significant (p < 0.05)        Significant (p < 0.05)
position_early          Not Significant               Significant (p < 0.10)
```

### Key Insights
```
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

📊 Position Early:
   Store CTR: 0.4675% (+15.40% lift)
   Next Page CTR: 0.2806% (+32.80% lift)
   Store CTR Significance: Not Significant
   Next Page CTR Significance: Significant (p < 0.10)

🏆 SIGNIFICANT RESULTS FOUND:
   ✅ density_inverted: Significant (p < 0.05) (Store CTR), Significant (p < 0.05) (Next Page CTR)
```

## 🔧 Query System Integration

### Using the Query CLI

```bash
# List all available queries
npm run queries:list

# Get info about specific query
npm run queries:info smartscroll-density-position-experiment

# Run query directly
npm run queries:run smartscroll-density-position-experiment --days-back 14

# Run time series query
npm run queries:run smartscroll-density-position-timeseries --days-back 14
```

### Direct Query Execution

```bash
# Main experiment analysis
node queries/cli.js run smartscroll-density-position-experiment --days-back 14

# Time series analysis
node queries/cli.js run smartscroll-density-position-timeseries --days-back 14

# With custom parameters
node queries/cli.js run smartscroll-density-position-experiment --parameters '{"days_back": 30}'
```

## 📁 File Locations

### Query Files
- **Main Analysis**: `queries/queries/smartscroll-density-position-experiment.sql`
- **Time Series**: `queries/queries/smartscroll-density-position-timeseries.sql`

### Runner Scripts
- **Density/Position**: `queries/runners/smartscroll-density-position-experiment.js`
- **Button Experiment**: `queries/runners/smartscroll-button-experiment.js`

### Results Storage
- **CSV Results**: `data/athena-results/smartscroll-density-position-experiment/`
- **Time Series**: `data/athena-results/smartscroll-density-position-timeseries/`

## 📊 Understanding the Metrics

### Primary Metrics
- **Store CTR**: `mula_store_click / mula_in_view` - Product engagement rate
- **Next Page CTR**: `mula_next_page_click / mula_in_view` - Article engagement rate
- **Overall Engagement**: `(store_clicks + next_page_clicks) / in_views` - Total engagement rate

### Secondary Metrics
- **Store Discovery Rate**: Sessions with store clicks / Total sessions
- **Article Discovery Rate**: Sessions with next page clicks / Total sessions
- **Sessions**: Unique user sessions in the experiment
- **In Views**: Total widget view events (denominator for CTR)

### Statistical Significance
- **Chi-Square Test**: Tests if CTR differences are statistically significant
- **P-Value Thresholds**: 
  - p < 0.05: Significant (95% confidence)
  - p < 0.10: Marginally significant (90% confidence)
  - p > 0.10: Not significant

## 🚀 Automated Reporting

### Daily Monitoring
```bash
# Add to crontab for daily reports
0 9 * * * cd /path/to/www.makemula.ai && npm run experiment:density-position:cached
```

### Slack Integration
The system can be integrated with Slack for automated daily reports by modifying the runner scripts to send results to Slack channels.

### Scheduled Queries
```bash
# Create scheduled query
npm run queries:schedule:create daily-density-position "0 9 * * *" smartscroll-density-position-experiment

# Start scheduler
npm run queries:schedule:start

# List active schedules
npm run queries:schedule:list
```

## 🔍 Troubleshooting

### Common Issues

1. **No Data Found**
   ```bash
   # Check if experiment is running
   npm run queries:run smartscroll-density-position-experiment --days-back 1
   
   # Verify experiment name
   node queries/runners/smartscroll-density-position-experiment.js --experiment smartscroll_density_position_2025_10
   ```

2. **Cached Results Not Found**
   ```bash
   # Run fresh analysis first
   npm run experiment:density-position:dev
   
   # Then use cached
   npm run experiment:density-position:cached
   ```

3. **Query Execution Errors**
   ```bash
   # Test query system
   npm run queries:test
   
   # Check query info
   npm run queries:info smartscroll-density-position-experiment
   ```

### Debug Mode
```bash
# Run with debug output
DEBUG=* node queries/runners/smartscroll-density-position-experiment.js --days-back 7
```

## 📋 Best Practices

### For Development
- Use `:dev` scripts for faster iteration (7 days)
- Use `:cached` for quick checks during development
- Run fresh analysis before making decisions

### For Production
- Use 14+ day analysis periods for statistical significance
- Monitor daily trends with time series queries
- Set up automated reporting for continuous monitoring

### For Analysis
- Look for both statistical significance AND practical significance
- Consider lift percentages in context of baseline CTR
- Monitor both primary metrics (Store CTR, Next Page CTR)
- Check for interaction effects between variants

## 🎯 Success Criteria

### Statistical Requirements
- **Sample Size**: 10,000+ in_views per variant
- **Significance**: p < 0.05 for primary metrics
- **Duration**: 7-14 days minimum

### Business Requirements
- **Minimum Lift**: 15% improvement in at least one primary metric
- **No Regression**: No significant decrease in other metrics
- **Stability**: Consistent results over multiple days

### Decision Framework
1. **Clear Winner**: Significant improvement in primary metrics
2. **Mixed Results**: Analyze trade-offs and business impact
3. **No Winner**: Consider extending experiment or different approach
4. **Negative Impact**: Revert to control and analyze learnings
