-- September 11, 2025 Hourly Breakdown
-- Description: Shows hourly mula_store_click events on September 11, 2025 by host
-- Parameters: none
-- Output: host, hour, click_count

SELECT
  properties['host'] AS host,
  date_format(timestamp, '%Y-%m-%d %H:00:00') AS hour,
  count(*) AS click_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
  AND properties['host'] IS NOT NULL
  AND properties['host'] != ''
  AND properties['host'] NOT LIKE '%localhost%'
  AND properties['host'] NOT LIKE '%makemula.ai%'
  AND datehour >= '2025/09/11/00'
  AND datehour < '2025/09/12/00'
GROUP BY properties['host'], date_format(timestamp, '%Y-%m-%d %H:00:00')
ORDER BY properties['host'], hour;
