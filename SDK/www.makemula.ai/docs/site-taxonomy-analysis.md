# Site Taxonomy Analysis

## Overview

The Site Taxonomy Analysis feature provides merchandisers with insights into website structure and content organization by analyzing both URL path structures and JSON-LD article sections. This helps identify high-reach sections for targeted product recommendations.

## Technical Architecture

### Data Flow

```
User Request → Slack Command → Taxonomy Worker → Athena Query → Slack Response
```

### Components

1. **Slack Command Handler** (`routes/slack.js`)
   - Route: `/commands/mula-site-taxonomy`
   - Parameter validation: domain and lookback_days
   - Queues taxonomy analysis job

2. **Taxonomy Analysis Worker** (`workers/taxonomyAnalysisWorker.js`)
   - Processes taxonomy analysis requests
   - Executes Athena queries
   - Formats results for Slack output

3. **Athena Query** (`queries/queries/site-taxonomy-analysis.sql`)
   - Extracts URL path taxonomy (up to 3 levels)
   - Analyzes JSON-LD article sections
   - Aggregates page view metrics

## Data Sources

### URL Path Analysis
- **Source**: `properties['pathname']` in `mula.webtag_logs`
- **Processing**: Extract meaningful path segments, ignore trivial paths
- **Depth**: Up to 3 levels after domain, before page name
- **Example**: `/fashion/trends/2024/` → `fashion`, `trends`, `2024`

### Article Section Analysis
- **Source**: `properties['article_section']` in `mula.webtag_logs`
- **Origin**: Parsed by Mula Bootloader from JSON-LD schema markup
- **Processing**: Group and count by semantic categories
- **Example**: "Fashion & Style", "Beauty & Wellness"

### Page View Metrics
- **Source**: Event counts from `mula.webtag_logs`
- **Filtering**: Domain-specific, date-range limited
- **Aggregation**: Count per taxonomy category

## Taxonomy Analysis Rules

### URL Path Processing
```sql
-- Extract up to 3 meaningful path segments
-- Filter out empty, trivial, or non-taxonomical paths
-- Examples of paths to ignore:
--   / (home page)
--   /2024/01/15/ (date-based paths)
--   /wp-admin/ (admin paths)
--   /assets/css/ (asset paths)
```

### Article Section Processing
```sql
-- Use existing article_section data from Bootloader
-- Group similar categories (e.g., "Fashion" + "Fashion & Style")
-- Count page views per category
-- Filter out null or empty values
```

## Implementation Details

### Slack Command Structure
```javascript
router.post('/commands/mula-site-taxonomy', async (req, res) => {
  // Parse domain and lookback_days
  // Validate parameters
  // Queue taxonomy analysis job
  // Return immediate confirmation
});
```

### Worker Implementation
```javascript
// taxonomyAnalysisWorker.js
const processTaxonomyAnalysis = async (job) => {
  const { domain, lookback_days, channelId } = job.data;
  
  // Execute Athena query
  const results = await executeQuery('site-taxonomy-analysis', {
    domain,
    days_back: lookback_days
  });
  
  // Format results for Slack
  const formattedResults = formatTaxonomyResults(results);
  
  // Send to Slack channel
  await sendSlackMessage(channelId, formattedResults);
};
```

### Athena Query Structure
```sql
-- site-taxonomy-analysis.sql
WITH url_taxonomy AS (
  -- Extract URL path segments
  -- Group by path structure
  -- Count page views
),
article_sections AS (
  -- Group by article_section
  -- Count page views
),
combined_taxonomy AS (
  -- Combine URL and article section insights
  -- Identify high-value targeting opportunities
)
SELECT * FROM combined_taxonomy
ORDER BY page_views DESC;
```

## Output Format

### Slack Message Structure
```
🏛️ *Site Taxonomy Analysis for [domain] ([days] days)*

📁 *URL Path Structure:*
• /category/subcategory/ (X.XK views)
  └── /category/subcategory/segment/ (X.XK views)

🏷️ *Content Categories (JSON-LD):*
• Category Name (X.XK views)
• All categories are shown (up to 1000)

🎯 *Top Product Targeting Opportunities:*
• High-reach paths with merchandising potential
```

### Data Structure
```javascript
{
  domain: "harpersbazaar.com",
  lookback_days: 30,
  url_taxonomy: [
    {
      path: "/fashion/trends/",
      views: 12400,
      subcategories: [
        { path: "/fashion/trends/2024/", views: 8100 },
        { path: "/fashion/trends/fall/", views: 4300 }
      ]
    }
  ],
  article_sections: [
    { category: "Fashion & Style", views: 15200 },
    { category: "Beauty & Wellness", views: 9800 }
  ],
  targeting_opportunities: [
    "High reach fashion section for product targeting",
    "Beauty category with engaged audience"
  ]
}
```

## Future Enhancements

### Phase 1: Core Implementation
- [ ] Create Athena query for taxonomy analysis
- [ ] Implement taxonomy analysis worker
- [ ] Add Slack command handler
- [ ] Test with real domains

### Phase 2: Product List Generation
- [ ] Auto-generate targeted product collections
- [ ] Pre-populate search phrases based on taxonomy
- [ ] Create targeted product lists automatically

### Phase 3: Advanced Analytics
- [ ] Competitor taxonomy comparison
- [ ] Seasonal taxonomy tracking
- [ ] Performance correlation analysis
- [ ] Export and API integration

## Configuration

### Environment Variables
```bash
# Required for Athena queries
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Required for Slack integration
SLACK_TOKEN=your_slack_token
SLACK_SIGNING_SECRET=your_signing_secret
```

### Query Parameters
- `domain`: Target domain for analysis
- `days_back`: Lookback period in days (1-365)
- `min_views`: Minimum page views threshold for inclusion

## Monitoring and Maintenance

### Performance Considerations
- Use Athena partitioning by `datehour` and domain
- Implement query result caching for frequent domains
- Monitor query execution time and data scanning costs

### Error Handling
- Graceful fallback when taxonomy data is incomplete
- Validation of domain format and lookback period
- Logging of analysis failures for debugging

### Data Quality
- Filter out malformed URLs and paths
- Validate article section data integrity
- Monitor for data anomalies or missing information
