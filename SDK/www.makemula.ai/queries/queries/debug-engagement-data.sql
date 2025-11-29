-- Debug Engagement Data for on3.com
-- Description: Check what engagement data exists and why the main query might not be working
-- Parameters: none
-- Output: debug information about available data

WITH debug_data AS (
  SELECT
    properties['host'] AS host,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['eventValue'] AS eventValue,
    properties['timestamp'] AS timestamp,
    datehour
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '3' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'www.on3.com'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['sessionId'] IS NOT NULL
    AND properties['eventName'] IN ('time_on_page', 'scroll_depth_pixels', 'mula_in_view')
  LIMIT 100
)

SELECT 
  host,
  sessionId,
  eventName,
  eventValue,
  timestamp,
  datehour,
  CASE 
    WHEN timestamp IS NOT NULL THEN 'Has Timestamp'
    ELSE 'No Timestamp'
  END AS timestamp_status
FROM debug_data
ORDER BY sessionId, eventName;
