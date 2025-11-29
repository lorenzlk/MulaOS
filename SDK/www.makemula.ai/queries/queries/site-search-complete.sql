-- Complete Site Search Traffic Analysis
-- Description: Get search phrases with traffic counts in a single query
-- Parameters: domain, days_back
-- Output: search_id, domain, widget_views

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
HAVING COUNT(*) > 0
ORDER BY COUNT(*) DESC
LIMIT 20;
