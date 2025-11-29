-- Debug query to see what data exists for stylecaster mulaAuto experiment
-- Check page views and event counts

WITH base_events AS (
  SELECT
    properties['host'] AS host,
    properties['pathname'] AS pathname,
    properties['queryString'] AS queryString,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['eventValue'] AS eventValue,
    datehour
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '14' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'stylecaster.com'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['sessionId'] IS NOT NULL
    AND properties['pathname'] = '/beauty/skin-care/1234831123/baebody-snail-mucin-face-sheet-mask/'
)

SELECT 
  CASE 
    WHEN queryString LIKE '%mulaAuto=1%' OR queryString LIKE '%mulaAuto%' THEN 'test'
    ELSE 'control'
  END AS variant,
  eventName,
  COUNT(*) AS event_count,
  COUNT(DISTINCT sessionId) AS unique_sessions,
  MIN(datehour) AS first_seen,
  MAX(datehour) AS last_seen
FROM base_events
GROUP BY 
  CASE 
    WHEN queryString LIKE '%mulaAuto=1%' OR queryString LIKE '%mulaAuto%' THEN 'test'
    ELSE 'control'
  END,
  eventName
ORDER BY variant, eventName;

