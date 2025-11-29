-- Debug Domains with Engagement Data
-- Description: Find domains that have engagement events (time_on_page, scroll_depth_pixels, mula_in_view)
-- Parameters: none
-- Output: domain, event_count, has_engagement_events, has_mula_events

WITH domain_events AS (
  SELECT 
    properties['host'] AS host,
    COUNT(*) AS total_events,
    COUNT_IF(properties['eventName'] IN ('time_on_page', 'scroll_depth_pixels')) AS engagement_events,
    COUNT_IF(properties['eventName'] = 'mula_in_view') AS mula_events,
    COUNT_IF(properties['eventName'] = 'page_view') AS page_views,
    MIN(datehour) AS earliest_date,
    MAX(datehour) AS latest_date
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '30' day, '%Y/%m/%d/%H')
    AND properties['host'] IS NOT NULL
    AND properties['host'] NOT LIKE '%localhost%'
  GROUP BY properties['host']
),

filtered_domains AS (
  SELECT *
  FROM domain_events
  WHERE engagement_events > 0  -- Only domains with engagement data
  ORDER BY engagement_events DESC
)

SELECT 
  host,
  total_events,
  engagement_events,
  mula_events,
  page_views,
  earliest_date,
  latest_date,
  CASE 
    WHEN mula_events > 0 THEN 'Has Mula'
    ELSE 'No Mula'
  END AS mula_status
FROM filtered_domains
LIMIT 20;
