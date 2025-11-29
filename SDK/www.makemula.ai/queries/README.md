# Athena Queries

This directory contains Athena queries for the Mula project, organized for rapid development, version control, and optional scheduling.

## Structure

```
queries/
├── README.md                 # This file
├── queries/                  # Individual query files
│   ├── store-clicks.sql     # Store click analytics
│   └── ...                  # Other queries
├── runners/                  # Query execution scripts
│   ├── store-clicks.js      # Runner for store-clicks.sql
│   └── ...                  # Other runners
├── schedules/               # Cron job configurations
│   ├── daily-reports.json   # Daily scheduled queries
│   └── ...                  # Other schedules
└── utils/                   # Query utilities
    ├── query-runner.js      # Generic query execution utility
    └── scheduler.js         # Cron job scheduler
```

## Query Development Workflow

### 1. Create a New Query

1. Create a `.sql` file in the `queries/` directory
2. Create a corresponding runner in the `runners/` directory
3. Test the query using the runner
4. Optionally add to schedules for automated execution

### 2. Query File Format

Each query file should:
- Be named descriptively (e.g., `store-clicks.sql`)
- Include a header comment with description and parameters
- Use consistent formatting and naming conventions

Example:
```sql
-- Store Click Analytics
-- Description: Counts store clicks by host and page URL
-- Parameters: days_back (default: 1)
-- Output: host, page_url, click_count, search_id

SELECT
  properties['host'] AS host,
  properties['pathname'] AS page_url,
  properties['searchId'] AS search_id,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE datehour >= date_format(current_timestamp - interval '1' day, '%Y/%m/%d/%H')
  AND properties['eventName'] = 'mula_store_click'
  AND properties['host'] NOT LIKE '%localhost%'
GROUP BY properties['host'], properties['pathname'], properties['searchId']
ORDER BY properties['host'], click_count DESC;
```

### 3. Runner File Format

Each runner should:
- Import the query file
- Provide parameter configuration
- Handle execution and output formatting
- Include error handling

Example:
```javascript
const { executeQuery } = require('../utils/query-runner');

const queryConfig = {
  name: 'store-clicks',
  description: 'Store click analytics by host and page',
  parameters: {
    days_back: 1, // default value
    output_location: 's3://prod.makemula.ai/athena-results/store-clicks/'
  }
};

async function runStoreClicksQuery(options = {}) {
  const config = { ...queryConfig.parameters, ...options };
  return await executeQuery('store-clicks', config);
}

module.exports = { runStoreClicksQuery };
```

### 4. Scheduling Queries

To schedule a query for automated execution:

1. Add a schedule configuration to `schedules/`
2. Use the scheduler utility to register the job
3. Monitor execution through logs and alerts

## Usage

### Running a Query Manually

```bash
# Run a specific query
node queries/runners/store-clicks.js

# Run with custom parameters
node queries/runners/store-clicks.js --days-back 7 --output-location s3://my-bucket/results/
```

### Running via Scripts

```bash
# Run all queries
npm run queries:run-all

# Run specific query
npm run queries:run -- store-clicks

# Run with parameters
npm run queries:run -- store-clicks --days-back 7
```

### Scheduling Queries

```bash
# Start the scheduler
npm run queries:schedule

# Add a new schedule
npm run queries:schedule:add -- daily-reports
```

## Best Practices

### Query Design
- Use descriptive names for tables and columns
- Include proper filtering for data quality
- Optimize for performance with appropriate partitioning
- Add comments for complex logic

### Error Handling
- Always include error handling in runners
- Log errors with sufficient context
- Provide fallback behavior when possible
- Monitor query execution times

### Performance
- Use appropriate date partitioning
- Limit result sets when possible
- Consider query complexity and cost
- Monitor and optimize slow queries

### Version Control
- Commit query changes with descriptive messages
- Include parameter documentation
- Tag releases for production queries
- Maintain query history and evolution

## Monitoring

### Query Execution
- Monitor execution times and costs
- Track success/failure rates
- Alert on query failures
- Review query performance regularly

### Data Quality
- Validate query results
- Check for data completeness
- Monitor for anomalies
- Review data freshness

## Troubleshooting

### Common Issues
- **Query Timeout**: Optimize query or increase timeout
- **Permission Errors**: Check AWS credentials and permissions
- **Data Not Found**: Verify table names and partitions
- **Cost Issues**: Review query efficiency and data volume

### Debugging
- Use Athena query history for debugging
- Check CloudWatch logs for errors
- Validate query syntax before execution
- Test with smaller datasets first 