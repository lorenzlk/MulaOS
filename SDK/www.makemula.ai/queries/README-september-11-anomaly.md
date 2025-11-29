# September 11, 2025 Anomaly Analysis

## Overview
This analysis investigates the anomalous 10x spike in `mula_store_click` events that occurred on September 11, 2025. The analysis includes three complementary queries to understand the scope, timing, and drivers of this anomaly.

## Queries Created

### 1. Daily Comparison Analysis (`september-11-anomaly-analysis.sql`)
**Purpose**: Compare September 11th click counts to normal daily averages for each host.

**Key Metrics**:
- Anomaly day clicks vs normal average clicks
- Multiplier showing how many times higher than normal
- Comparison to historical maximum daily clicks

**Output Columns**:
- `host`: Publisher domain
- `anomaly_day_clicks`: Total clicks on September 11th
- `normal_avg_clicks`: Average daily clicks (Sept 1-10)
- `normal_max_clicks`: Maximum daily clicks (Sept 1-10)
- `normal_min_clicks`: Minimum daily clicks (Sept 1-10)
- `multiplier_vs_avg`: How many times higher than average
- `multiplier_vs_max`: How many times higher than historical max

### 2. Hourly Breakdown (`september-11-hourly-breakdown.sql`)
**Purpose**: Show the timing of the anomaly by hour for each host.

**Key Insights**:
- When during the day the spike occurred
- Whether it was a sustained spike or concentrated in specific hours
- Pattern analysis across different hosts

**Output Columns**:
- `host`: Publisher domain
- `hour`: Hour timestamp (YYYY-MM-DD HH:00:00)
- `click_count`: Number of clicks in that hour

### 3. Top Products Analysis (`september-11-top-products.sql`)
**Purpose**: Identify which specific products drove the increased click volume.

**Key Insights**:
- Most clicked products on the anomalous day
- Which pages/URLs generated the most clicks
- Product-level attribution of the spike

**Output Columns**:
- `host`: Publisher domain
- `product_id`: Product identifier that was clicked
- `page_url`: URL where the click occurred
- `click_count`: Number of clicks for this product/page combination

## How to Run the Analysis

### Option 1: Run All Queries Together
```bash
cd www.makemula.ai
npm run anomaly-analysis
```

### Option 2: Run Individual Queries
```bash
cd www.makemula.ai

# Daily comparison
npm run queries:run september-11-anomaly-analysis

# Hourly breakdown
npm run queries:run september-11-hourly-breakdown

# Top products
npm run queries:run september-11-top-products
```

### Option 3: Using the CLI Directly
```bash
cd www.makemula.ai

# List all queries
npm run queries:list

# Get info about a specific query
npm run queries:info september-11-anomaly-analysis

# Run a specific query
npm run queries:run september-11-anomaly-analysis
```

## Expected Results

The analysis will help answer these key questions:

1. **Which hosts were affected?** - The daily comparison will show which publisher sites experienced the 10x spike.

2. **How significant was the spike?** - The multiplier columns will quantify exactly how much higher than normal the click volume was.

3. **When did it happen?** - The hourly breakdown will show if it was a sustained spike or concentrated in specific hours.

4. **What drove the spike?** - The top products analysis will identify which specific products and pages generated the most clicks.

5. **Was it organic or systematic?** - The combination of timing and product patterns will help determine if this was natural user behavior or a systematic issue.

## Data Sources

- **Table**: `mula.webtag_logs`
- **Event Type**: `mula_store_click`
- **Time Range**: September 1-14, 2025 (focus on September 11th)
- **Partitioning**: Hourly partitions (`datehour` column)
- **Key Fields**:
  - `properties['host']`: Publisher domain
  - `properties['eventValue']`: Product ID
  - `properties['pathname']`: Page URL
  - `properties['search_id']`: Search context (if available)

## Troubleshooting

If queries fail or return unexpected results:

1. **Check date format**: Ensure the date range covers the correct period
2. **Verify data availability**: Confirm that September 11th data exists in the table
3. **Check host filtering**: The queries exclude localhost and makemula.ai domains
4. **Review permissions**: Ensure AWS credentials have access to the Athena table

## Next Steps

After running the analysis:

1. **Review the daily comparison** to identify which hosts had the biggest spikes
2. **Examine the hourly breakdown** to understand the timing pattern
3. **Analyze the top products** to identify what drove the increased clicks
4. **Cross-reference with other data** (server logs, deployment records, etc.) to identify potential causes
5. **Consider follow-up queries** if specific patterns emerge that need deeper investigation

## Files Created

- `queries/queries/september-11-anomaly-analysis.sql` - Daily comparison query
- `queries/queries/september-11-hourly-breakdown.sql` - Hourly breakdown query  
- `queries/queries/september-11-top-products.sql` - Top products query
- `queries/runners/september-11-anomaly-analysis.js` - Combined analysis runner
- `queries/README-september-11-anomaly.md` - This documentation

The analysis is ready to run and will provide comprehensive insights into the September 11th anomaly.
