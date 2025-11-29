-- Site Search Traffic Analysis
-- Description: Get search_id traffic counts by domain for search phrase analysis
-- Parameters: domain, days_back
-- Output: search_id, domain, widget_views

WITH search_traffic AS (
  SELECT 
    properties['search_id'] AS search_id,
    properties['host'] AS domain,
    COUNT(*) AS widget_views
  FROM mula.webtag_logs
  WHERE properties['eventName'] = 'mula_widget_view'
    AND properties['host'] = '{{domain}}'
    AND properties['search_id'] IS NOT NULL
    AND properties['search_id'] != ''
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
  GROUP BY properties['search_id'], properties['host']
)

SELECT 
  search_id,
  domain,
  widget_views
FROM search_traffic
WHERE widget_views > 0
ORDER BY widget_views DESC
LIMIT 20;
