-- Debug SessionId Coverage for twsn.net
-- Description: Check what percentage of page views have sessionId populated
-- Parameters: none
-- Output: breakdown of sessionId coverage

WITH all_page_views AS (
  SELECT
    COUNT(*) AS total_page_views
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '1' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['pathname'] IS NOT NULL
    AND properties['pathname'] != '/'
    AND properties['pathname'] != ''
),

page_views_with_session AS (
  SELECT
    COUNT(*) AS page_views_with_sessionid
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '1' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['pathname'] IS NOT NULL
    AND properties['pathname'] != '/'
    AND properties['pathname'] != ''
    AND properties['sessionId'] IS NOT NULL
    AND properties['sessionId'] != ''
)

SELECT
  apv.total_page_views,
  pws.page_views_with_sessionid,
  apv.total_page_views - pws.page_views_with_sessionid AS page_views_without_sessionid,
  CAST(pws.page_views_with_sessionid AS DOUBLE) / apv.total_page_views * 100 AS percent_with_sessionid
FROM all_page_views apv
CROSS JOIN page_views_with_session pws;

