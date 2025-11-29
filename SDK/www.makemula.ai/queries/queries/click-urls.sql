-- Top URLs with Store Clicks
-- Description: Returns top 20 URLs on a specific domain that received mula_store_click events during the lookback window
-- Parameters: domain (required), days_back (default: 7)
-- Output: page_url, click_count, search_id

SELECT
  properties['pathname'] AS page_url,
  count(*) AS click_count,
  properties['search_id'] AS search_id
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['host'] = '{{domain}}'
  AND properties['pathname'] IS NOT NULL
  AND properties['pathname'] != ''
  AND properties['search_id'] IS NOT NULL
  AND properties['search_id'] != ''
  AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
GROUP BY properties['pathname'], properties['search_id']
ORDER BY click_count DESC
LIMIT 20;
