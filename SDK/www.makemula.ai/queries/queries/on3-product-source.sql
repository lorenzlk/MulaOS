-- On3.com Product Source Analysis
-- Description: Check what product sources are being served on on3.com domain
-- Parameters: days_back (default: 7)
-- Output: host, product_src, click_count, search_id

SELECT
  properties['host'] AS host,
  COALESCE(properties['product_src'], 'unknown') AS product_src,
  properties['search_id'] AS search_id,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['host'] LIKE '%on3.com%'
  AND properties['search_id'] IS NOT NULL
  AND properties['search_id'] != ''
  AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
GROUP BY properties['host'], COALESCE(properties['product_src'], 'unknown'), properties['search_id']
ORDER BY click_count DESC, product_src; 