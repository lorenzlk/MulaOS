-- Store Clicks with Search ID Analysis
-- Description: Analyzes store clicks that have search IDs to understand search-to-purchase conversion
-- Parameters: none
-- Output: search_id, host, page_url, click_count

SELECT
  properties['searchId'] AS search_id,
  properties['host'] AS host,
  properties['pathname'] AS page_url,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['searchId'] IS NOT NULL
  AND properties['searchId'] != ''
  AND properties['host'] IS NOT NULL
  AND properties['host'] NOT LIKE '%localhost%'
GROUP BY properties['searchId'], properties['host'], properties['pathname']
ORDER BY click_count DESC, search_id; 