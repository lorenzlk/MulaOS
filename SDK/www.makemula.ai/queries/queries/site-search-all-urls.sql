-- All URLs for Site Search Analysis
-- Description: Get all URLs with their search_id and view counts for a domain
-- Parameters: domain, days_back
-- Output: search_id, page_url, url_views

SELECT 
  properties['search_id'] AS search_id,
  properties['pathname'] AS page_url,
  COUNT(*) AS url_views
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_widget_view'
  AND properties['host'] = '{{domain}}'
  AND properties['search_id'] IS NOT NULL
  AND properties['search_id'] != ''
  AND properties['pathname'] IS NOT NULL
  AND properties['pathname'] != ''
  AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
GROUP BY properties['search_id'], properties['pathname']
ORDER BY properties['search_id'], COUNT(*) DESC;
