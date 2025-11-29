-- Site Search URLs Analysis
-- Description: Get top URLs for specific search_id and domain
-- Parameters: search_id, domain, days_back
-- Output: search_id, page_url, widget_views

SELECT 
  properties['search_id'] AS search_id,
  properties['pathname'] AS page_url,
  COUNT(*) AS widget_views
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_widget_view'
  AND properties['host'] = '{{domain}}'
  AND properties['search_id'] = '{{search_id}}'
  AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
GROUP BY properties['search_id'], properties['pathname']
ORDER BY widget_views DESC
LIMIT 3;
