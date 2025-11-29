-- September 11, 2025 Top Products Analysis
-- Description: Shows the most clicked products on September 11, 2025 by host
-- Parameters: none
-- Output: host, product_id, click_count, page_url

SELECT
  properties['host'] AS host,
  properties['eventValue'] AS product_id,
  properties['pathname'] AS page_url,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['host'] IS NOT NULL
  AND properties['host'] != ''
  AND properties['host'] NOT LIKE '%localhost%'
  AND properties['host'] NOT LIKE '%makemula.ai%'
  AND properties['eventValue'] IS NOT NULL
  AND properties['eventValue'] != ''
  AND datehour >= '2025/09/11/00'
  AND datehour < '2025/09/12/00'
GROUP BY properties['host'], properties['eventValue'], properties['pathname']
ORDER BY properties['host'], click_count DESC;
