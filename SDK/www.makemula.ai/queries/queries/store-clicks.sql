-- Store Click Analytics
-- Description: Counts store clicks by host and page URL with search ID
-- Parameters: days_back (default: 1)
-- Output: host, page_url, click_count, search_id

SELECT
  properties['host'] AS host,
  properties['pathname'] AS page_url,
  properties['search_id'] AS search_id,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['search_id'] IS NOT NULL
  AND properties['search_id'] != ''
  AND properties['host'] IS NOT NULL
  AND properties['host'] NOT LIKE '%localhost%'
  AND datehour >= '2025/06/29'
GROUP BY properties['host'], properties['pathname'], properties['search_id']
ORDER BY properties['host'], click_count DESC; 