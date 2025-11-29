-- Debug Taxonomy Raw Counts for twsn.net
-- Description: Check raw counts at each step of the taxonomy query
-- Parameters: none
-- Output: count statistics

WITH page_views AS (
  SELECT
    properties['host'] AS host,
    properties['pathname'] AS pathname,
    COUNT(DISTINCT properties['sessionId']) AS unique_sessions
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
    AND properties['pathname'] NOT LIKE '/admin%'
    AND properties['pathname'] NOT LIKE '/assets%'
    AND properties['pathname'] NOT LIKE '/css%'
    AND properties['pathname'] NOT LIKE '/js%'
    AND properties['pathname'] NOT LIKE '/images%'
    AND properties['pathname'] NOT LIKE '/api%'
    AND properties['pathname'] NOT LIKE '/%/%/%/%/%'
    AND properties['pathname'] NOT LIKE '/2024/%'
    AND properties['pathname'] NOT LIKE '/2023/%'
    AND properties['pathname'] NOT LIKE '/2022/%'
    AND properties['pathname'] NOT LIKE '/2021/%'
    AND properties['pathname'] NOT LIKE '/2020/%'
  GROUP BY properties['host'], properties['pathname']
)

SELECT
  COUNT(*) AS total_paths,
  SUM(unique_sessions) AS total_unique_sessions,
  AVG(unique_sessions) AS avg_sessions_per_path,
  MIN(unique_sessions) AS min_sessions,
  MAX(unique_sessions) AS max_sessions
FROM page_views;

