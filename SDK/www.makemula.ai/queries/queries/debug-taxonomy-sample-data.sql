-- Debug Taxonomy Sample Data for twsn.net
-- Description: Show sample page view data to understand the pattern
-- Parameters: none
-- Output: sample records with counts

SELECT
  properties['pathname'] AS pathname,
  COUNT(*) AS total_events,
  COUNT(DISTINCT properties['sessionId']) AS unique_sessions,
  COUNT(*) / COUNT(DISTINCT properties['sessionId']) AS views_per_session
FROM mula.webtag_logs
WHERE
  properties['eventName'] = 'page_view'
  AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
  AND properties['host'] = 'twsn.net'
  AND properties['host'] NOT LIKE '%localhost%'
  AND properties['pathname'] IS NOT NULL
  AND properties['pathname'] != '/'
  AND properties['pathname'] != ''
  AND properties['pathname'] NOT LIKE '/wp-%'
GROUP BY properties['pathname']
ORDER BY total_events DESC
LIMIT 20;

