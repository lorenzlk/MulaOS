# Testing Revenue/RPM Time Series Locally

This guide explains how to test the revenue and RPM time series functionality locally while connecting to the production database.

## Prerequisites

### 1. Environment Variables (.env)

Update your `.env` file with production credentials:

```bash
# Database (production)
DATABASE_URL=postgresql://user:password@prod-db-host:5432/dbname

# AWS Credentials (for Athena queries)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Slack (optional - only needed if you want to send reports)
SLACK_TOKEN=xoxb-your-token
SLACK_REPORTS_CHANNEL=#your-test-channel
```

### 2. Redis (Optional)

The test script calls the worker directly, so you don't need Redis running. However, if you want to test via the queue:

```bash
# Option 1: Use local Redis
redis-server

# Option 2: Use production Redis (set in .env)
REDISCLOUD_URL=redis://prod-redis-url
```

## Running the Test

### Direct Worker Test (Recommended)

This bypasses the queue and calls the worker directly:

```bash
cd www.makemula.ai
node scripts/test-performance-report-revenue.js [domain] [lookbackDays] [channelId]
```

**Examples:**

```bash
# Test on3.com with 7 days lookback
node scripts/test-performance-report-revenue.js www.on3.com 7

# Test on3.com with 14 days lookback to a specific channel
node scripts/test-performance-report-revenue.js www.on3.com 14 C1234567890

# Test with default settings (on3.com, 7 days)
node scripts/test-performance-report-revenue.js
```

### What to Check

1. **Console Output**: Look for:
   - `Fetching daily revenue data for www.on3.com...`
   - `Enriching time series data with revenue and RPM for on3.com...`
   - `Generating chart for revenue...`
   - `Generating chart for rpm...`

2. **Slack Report**: Check the specified channel for:
   - "Daily Revenue Over Time" chart
   - "RPM Over Time" chart
   - Formatted totals (e.g., `Total Daily Revenue Over Time: $123.45`)

3. **Data Validation**: The script will:
   - Fetch revenue events from the database
   - Group them by date
   - Calculate daily RPM based on smartscroll_in_views
   - Merge into time series data

## Troubleshooting

### "Missing DATABASE_URL"
- Ensure your `.env` file has `DATABASE_URL` pointing to production
- Check that you can connect: `psql $DATABASE_URL`

### "Missing AWS credentials"
- Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
- These are needed for Athena queries to fetch time series data

### "No revenue events found"
- Check that revenue collection has run for the domain
- Verify in database: `SELECT * FROM revenue_events WHERE domain = 'www.on3.com' LIMIT 10;`
- Check collection status: `SELECT * FROM revenue_collection_status WHERE domain = 'www.on3.com';`

### "Error fetching revenue time series"
- Check database connection
- Verify revenue_events table exists and has data
- Check that date formats match between revenue_events and time series data

## Inspecting Data Without Slack

If you want to inspect the data without sending to Slack, you can modify the script to:

1. Comment out the `sendSlackMessage` call in `performanceReportWorker.js`
2. Add console.log statements to output the enriched data
3. Or create a separate inspection script that just fetches and logs the revenue data

## Next Steps

After verifying the integration works:

1. Check that revenue charts appear correctly
2. Verify RPM calculations are accurate
3. Ensure date alignment is correct
4. Test with different lookback periods
5. Test with domains that don't have revenue data (should gracefully skip)

