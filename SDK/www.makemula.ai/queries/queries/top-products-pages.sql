-- Top Products Pages by Store Clicks
-- Description: Finds product IDs with most mula_store_click events by host and pathname in past 30 days
-- Parameters: days_back (default: 30)
-- Output: host, product_id, pathname, click_count

SELECT
  properties['host'] AS host,
  properties['eventValue'] AS product_id,
  properties['pathname'] AS pathname,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['eventValue'] IS NOT NULL
  AND properties['eventValue'] != ''
  AND properties['pathname'] IS NOT NULL
  AND properties['pathname'] != ''
  AND properties['host'] IS NOT NULL
  AND properties['host'] NOT LIKE '%localhost%'
  AND properties['host'] NOT LIKE '%makemula.ai%'
  AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
GROUP BY properties['host'], properties['eventValue'], properties['pathname']
HAVING count(*) >= 1
ORDER BY properties['host'], click_count DESC; 