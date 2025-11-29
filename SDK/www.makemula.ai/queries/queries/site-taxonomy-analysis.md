# Site Taxonomy Analysis Query

## Description
Analyzes site structure and content organization by extracting URL path taxonomy and JSON-LD article sections to identify high-reach sections for product targeting.

## Parameters
- `domain` (required): Target domain to analyze (e.g., "harpersbazaar.com")
- `days_back` (default: 7): Number of days to look back for data analysis

## Output
- `taxonomy_type`: Type of taxonomy (url_path or article_section)
- `host`: Domain being analyzed
- `taxonomy_value`: The taxonomy path or category name
- `total_views`: Total page views for this taxonomy
- `unique_paths`: Number of unique URLs in this taxonomy
- `hierarchy_level`: URL hierarchy level (1-3 for paths, 0 for article sections)
- `reach_category`: Reach classification (High/Medium/Low)
- `formatted_views`: Human-readable view count (e.g., "1.2K", "15.7K")
- `targeting_insight`: Description of the taxonomy for targeting purposes

## Usage Examples
```sql
-- Analyze harpersbazaar.com for the last 30 days
SELECT * FROM site-taxonomy-analysis WHERE domain = 'harpersbazaar.com' AND days_back = 30;

-- Analyze stylecaster.com for the last 7 days
SELECT * FROM site-taxonomy-analysis WHERE domain = 'stylecaster.com' AND days_back = 7;
```

## Data Sources
- **URL Paths**: Extracted from `properties['pathname']` in `mula.webtag_logs`
- **Article Sections**: From `properties['article_section']` parsed by Mula Bootloader
- **Page Views**: Event counts aggregated by taxonomy category

## Taxonomy Rules
- **URL Paths**: Up to 3 levels after domain, before page name
- **Path Filtering**: Excludes admin, asset, and date-based paths
- **Article Sections**: Uses existing JSON-LD parsing from Bootloader
- **Reach Categories**: High (≥1000 views), Medium (≥500 views), Low (<500 views)

## Performance Notes
- Uses `datehour` partitioning to minimize data scanning
- Filters by domain and date range for efficient queries
- Limits results to 100 rows for Slack display
- Aggregates data in single pass to avoid expensive joins
