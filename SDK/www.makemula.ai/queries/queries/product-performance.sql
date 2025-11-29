-- Description: Get top products by views and clicks over the last N days
-- Input: days_back (default 1), domain (optional - filters by host)
-- Output: product_id, search_id, host, view_count, click_count, total_engagement

WITH product_views AS (
  SELECT 
    properties['eventValue'] AS product_id,
    properties['search_id'] AS search_id,
    properties['host'] AS host,
    COUNT(*) AS view_count
  FROM mula.webtag_logs
  WHERE properties['eventName'] = 'mula_product_view'
    AND properties['eventValue'] IS NOT NULL
    AND properties['eventValue'] != ''
    AND properties['search_id'] IS NOT NULL
    AND properties['search_id'] != ''
    AND properties['host'] IS NOT NULL
    AND properties['host'] NOT LIKE '%localhost%'
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND ('{{domain}}' = '' OR properties['host'] = '{{domain}}' OR properties['host'] LIKE '%.{{domain}}')
  GROUP BY properties['eventValue'], properties['search_id'], properties['host']
),
product_clicks AS (
  SELECT 
    properties['eventValue'] AS product_id,
    properties['search_id'] AS search_id,
    properties['host'] AS host,
    COUNT(*) AS click_count
  FROM mula.webtag_logs
  WHERE properties['eventName'] = 'mula_store_click'
    AND properties['eventValue'] IS NOT NULL
    AND properties['eventValue'] != ''
    AND properties['search_id'] IS NOT NULL
    AND properties['search_id'] != ''
    AND properties['host'] IS NOT NULL
    AND properties['host'] NOT LIKE '%localhost%'
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND ('{{domain}}' = '' OR properties['host'] = '{{domain}}' OR properties['host'] LIKE '%.{{domain}}')
  GROUP BY properties['eventValue'], properties['search_id'], properties['host']
)
SELECT 
  COALESCE(pv.product_id, pc.product_id) AS product_id,
  COALESCE(pv.search_id, pc.search_id) AS search_id,
  COALESCE(pv.host, pc.host) AS host,
  COALESCE(pv.view_count, 0) AS view_count,
  COALESCE(pc.click_count, 0) AS click_count,
  COALESCE(pv.view_count, 0) + COALESCE(pc.click_count, 0) AS total_engagement
FROM product_views pv
FULL OUTER JOIN product_clicks pc 
  ON pv.product_id = pc.product_id 
  AND pv.search_id = pc.search_id
  AND COALESCE(pv.host, '') = COALESCE(pc.host, '')
WHERE COALESCE(pv.view_count, 0) + COALESCE(pc.click_count, 0) > 0
ORDER BY total_engagement DESC, view_count DESC, click_count DESC
LIMIT 20; 