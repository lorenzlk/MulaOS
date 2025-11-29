-- Next Page CTR Analysis for on3.com
-- Calculates click-through rates and engagement metrics for next page recommendations
-- Parameters: {{days_back}} (default: 30)

WITH session_metrics AS (
  -- Get all sessions that had mula_in_view events on on3.com
  SELECT 
    properties['sessionId'] as session_id,
    COUNT(*) as in_view_count,
    COUNT(CASE WHEN properties['eventName'] = 'mula_next_page_click' THEN 1 END) as next_page_click_count
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'www.on3.com'
    AND properties['eventName'] = 'mula_in_view'
    AND properties['sessionId'] IS NOT NULL
    AND properties['sessionId'] != ''
  GROUP BY properties['sessionId']
),

total_metrics AS (
  -- Get total counts across all sessions
  SELECT 
    COUNT(DISTINCT session_id) as total_sessions,
    SUM(in_view_count) as total_in_views,
    SUM(next_page_click_count) as total_next_page_clicks,
    COUNT(CASE WHEN in_view_count > 0 THEN 1 END) as sessions_with_in_views,
    COUNT(CASE WHEN next_page_click_count > 0 THEN 1 END) as sessions_with_next_page_clicks
  FROM session_metrics
)

SELECT 
  total_sessions,
  total_in_views,
  total_next_page_clicks,
  sessions_with_in_views,
  sessions_with_next_page_clicks,
  
  -- Next Page CTR: (Total Next Page Clicks / Total In-View Events) * 100
  CASE 
    WHEN total_in_views > 0 
    THEN ROUND((CAST(total_next_page_clicks AS DOUBLE) / CAST(total_in_views AS DOUBLE)) * 100, 2)
    ELSE 0 
  END as next_page_ctr_percent,
  
  -- Session Conversion Rate: (Sessions with Next Page Clicks / Total Sessions) * 100
  CASE 
    WHEN total_sessions > 0 
    THEN ROUND((CAST(sessions_with_next_page_clicks AS DOUBLE) / CAST(total_sessions AS DOUBLE)) * 100, 2)
    ELSE 0 
  END as session_conversion_rate_percent,
  
  -- Average Clicks per Session: Total Next Page Clicks / Total Sessions
  CASE 
    WHEN total_sessions > 0 
    THEN ROUND(CAST(total_next_page_clicks AS DOUBLE) / CAST(total_sessions AS DOUBLE), 2)
    ELSE 0 
  END as avg_clicks_per_session

FROM total_metrics
