# Product Performance Reports

## Overview

The Product Performance Reports feature provides insights into the most viewed and most clicked products across all Mula-enabled sites. This helps identify which products are generating the most engagement and can inform content strategy decisions.

## Features

- **Real-time Analytics**: Tracks `mula_product_view` and `mula_store_click` events
- **Slack Integration**: Automated reports posted directly to Slack channels with bar charts
- **Configurable Timeframes**: Reports can be generated for 1-30 days
- **Multi-site Aggregation**: Shows performance across all publisher sites
- **Engagement Metrics**: Combines views and clicks for total engagement scoring
- **Visual Charts**: Beautiful bar charts showing top products by views and clicks

## Slack Commands

### `/mula-product-performance [days]`

Generates a product performance report for the specified number of days.

**Parameters:**
- `days` (optional): Number of days to look back (1-30, default: 1)

**Examples:**
```
/mula-product-performance
/mula-product-performance 7
/mula-product-performance 30
```

**Output:**
- Top performing products by total engagement
- Beautiful bar chart showing views vs clicks
- Summary statistics across all sites
- Page URLs where products were displayed

## Query Details

### Athena Query: `product-performance.sql`

The query analyzes two event types:
- `mula_product_view`: When a product card comes into view
- `mula_store_click`: When a user clicks on a product

**Key Metrics:**
- Product ID
- Host (publisher site)
- Page URL
- View count
- Click count
- Total engagement (views + clicks)

**Data Sources:**
- `mula.webtag_logs` table
- Filters out localhost and invalid data
- Uses `datehour` partitioning for efficient queries

## Architecture

### Components

1. **Query**: `www.makemula.ai/queries/queries/product-performance.sql`
2. **Worker**: `www.makemula.ai/workers/productPerformanceWorker.js`
3. **Slack Command**: `www.makemula.ai/routes/slack.js`
4. **Queue**: `productPerformanceQueue` (Bull/Redis)

### Data Flow

1. User runs `/mula-product-performance` command
2. Slack command queues job in `productPerformanceQueue`
3. Worker executes Athena query with parameters
4. Results downloaded from S3 and parsed
5. Bar chart generated using QuickChart API
6. Formatted message with chart sent to Slack channel

### Event Tracking

Product views are tracked using the `ViewTracker.js` component:
```javascript
// Product cards are tracked when they come into view
logEvent("mula_product_view", productId, {
    ...widgetLogParams,
    product_id: productId
});
```

Store clicks are tracked in product cards:
```javascript
// Store clicks are tracked when users click buy/view buttons
logEvent("mula_store_click", product.product_id, {...widgetLogParams});
```

## Testing

### Manual Testing

1. **Test Query Execution with Chart:**
   ```bash
   cd www.makemula.ai
   node scripts/test-product-performance.js
   ```
   This will generate a bar chart and post it to Slack

2. **Test Slack Command:**
   - Use `/mula-product-performance` in Slack
   - Verify report with bar chart is generated and posted

3. **Test with Different Timeframes:**
   ```bash
   /mula-product-performance 7
   /mula-product-performance 30
   ```

### CLI Testing

```bash
cd www.makemula.ai/queries
node cli.js run product-performance --days-back 1
```

## Configuration

### Environment Variables

- `SLACK_TOKEN`: Required for posting to Slack
- `AWS_REGION`: Athena region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `REDISCLOUD_URL`: Redis connection for job queues

### Slack App Configuration

The Slack app needs the following permissions:
- `chat:write`: Post messages to channels
- `commands`: Execute slash commands

## Troubleshooting

### Common Issues

1. **No Data Returned**
   - Check if `mula_product_view` and `mula_store_click` events exist
   - Verify date range has data
   - Check Athena table partitions

2. **Query Timeout**
   - Reduce date range
   - Check Athena query limits
   - Verify S3 permissions

3. **Slack Posting Failures**
   - Check `SLACK_TOKEN` environment variable
   - Verify bot has channel permissions
   - Check message size limits

### Debug Commands

```bash
# Check query execution
cd www.makemula.ai/queries
node cli.js info product-performance

# Test query with parameters
node cli.js run product-performance --days-back 1 --parameters '{"days_back": 1}'

# Check worker logs
heroku logs --tail -a www-makemula-ai
```

## Future Enhancements

- **Product Metadata**: Include product titles, prices, and images
- **Conversion Tracking**: Track actual purchases vs. clicks
- **Trend Analysis**: Compare performance over time periods
- **Publisher Filtering**: Filter reports by specific publishers
- **Export Options**: CSV/Excel export functionality
- **Scheduled Reports**: Automated daily/weekly reports 