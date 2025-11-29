-- Next Page Recommendations Query
-- Description: Finds most popular articles by mula_widget_view counts for next-page recommendations
-- Parameters: domain, days_back, category_or_path, limit (default: 5)
-- Output: pathname, view_count

WITH article_views AS (
  SELECT 
    properties['host'] AS domain,
    properties['article_section'] AS article_section,
    properties['pathname'] AS pathname,
    COUNT(*) AS view_count
  FROM mula.webtag_logs
  WHERE properties['eventName'] = 'mula_widget_view'
    AND properties['host'] = '{{domain}}'
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
  GROUP BY properties['host'], properties['article_section'], properties['pathname']
)

SELECT 
  pathname,
  view_count
FROM article_views
WHERE view_count > 0
  AND (
    -- Match by JSON-LD article section
    (article_section IS NOT NULL AND article_section = '{{category_or_path}}')
    OR
    -- Match by path stem
    (pathname LIKE '{{category_or_path}}%')
  )
ORDER BY view_count DESC
LIMIT {{limit}};
