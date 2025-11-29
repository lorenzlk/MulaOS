-- SmartScroll Density & Position Experiment - Daily Time Series Analysis
-- Parameters: {{days_back}} (default: 14)

WITH daily_metrics AS (
  SELECT
    date_format(datehour, '%Y-%m-%d') as date,
    properties['variant'] as variant,
    COUNT(CASE WHEN properties['eventName'] = 'mula_in_view' THEN 1 END) as in_views,
    COUNT(CASE WHEN properties['eventName'] = 'mula_store_click' THEN 1 END) as store_clicks,
    COUNT(CASE WHEN properties['eventName'] = 'mula_next_page_click' THEN 1 END) as next_page_clicks,
    COUNT(DISTINCT properties['sessionId']) as sessions
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['experiment'] = 'smartscroll_density_position_2025_10'
    AND properties['host'] IS NOT NULL
    AND properties['host'] NOT LIKE '%localhost%'
  GROUP BY date_format(datehour, '%Y-%m-%d'), properties['variant']
)

SELECT 
  date,
  variant,
  sessions,
  in_views,
  store_clicks,
  next_page_clicks,
  ROUND(CAST(store_clicks AS DOUBLE) / CAST(in_views AS DOUBLE) * 100, 4) as store_ctr_percent,
  ROUND(CAST(next_page_clicks AS DOUBLE) / CAST(in_views AS DOUBLE) * 100, 4) as next_page_ctr_percent,
  ROUND(CAST((store_clicks + next_page_clicks) AS DOUBLE) / CAST(in_views AS DOUBLE) * 100, 4) as overall_engagement_percent
FROM daily_metrics
ORDER BY date, variant;
