# Subid Performance Report Slack Command

## Overview

The `/mula-impact-on3-subid-report` Slack command generates comprehensive subid performance reports from the Impact API and sends them directly to Slack channels.

## Usage

### Basic Usage
```
/mula-impact-on3-subid-report
```
Generates a 7-day subid performance report for all subids.

### Advanced Usage
```
/mula-impact-on3-subid-report --days-back 14 --mula-only
```

## Parameters

### `--days-back N`
- **Type**: Number (1-30)
- **Default**: 7
- **Description**: Number of days to look back for the report
- **Example**: `--days-back 14` for a 14-day report

### `--mula-only` or `--mula`
- **Type**: Flag
- **Default**: false (shows all subids)
- **Description**: Filter to show only Mula-specific subids
- **Example**: `--mula-only` to see only subids containing "mula"

## Examples

### Standard 7-day report
```
/mula-impact-on3-subid-report
```

### 14-day report for Mula subids only
```
/mula-impact-on3-subid-report --days-back 14 --mula-only
```

### 30-day report for all subids
```
/mula-impact-on3-subid-report --days-back 30
```

## Report Content

The Slack message includes:

1. **Header**: Report title with time period
2. **Summary Statistics**:
   - Total Raw Clicks
   - Total Filtered Clicks
   - Total Actions
   - Conversion Rate
   - Total Sales
   - Total Earnings

3. **Top Performers**: Top 5 subids by earnings with:
   - Subid name
   - Earnings
   - Click counts
   - Action counts
   - Conversion rate

4. **Detailed Breakdown**: (if ≤20 records)
   - Individual subid performance
   - Raw vs filtered clicks
   - Sales and earnings per subid

## Technical Details

### Queue Processing
- Uses Bull queue (`subidReportQueue`) for async processing
- Jobs are processed by `subidReportWorker.js`
- Results sent to the channel where command was executed

### API Integration
- Connects to Impact API using configured credentials
- Endpoint: `/Reports/partner_performance_by_subid`
- Uses Basic Authentication with username/password

### Error Handling
- Missing credentials: Shows helpful error message
- API failures: Reports error details to Slack
- Invalid parameters: Returns usage instructions

## Environment Variables

Required for the command to work:

```bash
IMPACT_USERNAME=your_impact_username
IMPACT_PASSWORD=your_impact_password
IMPACT_ACCOUNT_ID=your_impact_account_id
```

## Files

- **Slack Command**: `routes/slack.js` - Command endpoint
- **Worker**: `workers/subidReportWorker.js` - Report generation logic
- **Main Worker**: `worker.js` - Queue processing setup
- **Test Script**: `scripts/test-subid-slack-command.js` - Testing utility

## Troubleshooting

### Common Issues

1. **"Missing Impact API credentials"**
   - Check that `IMPACT_USERNAME` and `IMPACT_PASSWORD` are set
   - Verify credentials are valid

2. **"No records found"**
   - Check if there's data for the specified time period
   - Verify account ID is correct

3. **"Job failed"**
   - Check worker logs for detailed error messages
   - Verify Redis connection is working

### Testing

Run the test script to verify functionality:

```bash
node scripts/test-subid-slack-command.js
```

## Related Commands

- `/mula-performance-report` - General performance reporting
- `/mula-product-performance` - Product-specific performance
- `/mula-health-check` - Site health monitoring 