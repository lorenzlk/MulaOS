-- SmartScroll Density & Position Experiment Analysis
-- Parameters: {{days_back}} (default: 14)

WITH experiment_events AS (
  SELECT
    properties['sessionId'] as session_id,
    properties['experiment'] as experiment,
    properties['variant'] as variant,
    properties['eventName'] as event_name,
    properties['eventValue'] as event_value,
    properties['host'] as host,
    datehour
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['experiment'] = 'smartscroll_density_position_2025_10'
    AND properties['host'] IS NOT NULL
    AND properties['host'] NOT LIKE '%localhost%'
),

-- Aggregate metrics by variant
variant_metrics AS (
  SELECT
    variant,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(CASE WHEN event_name = 'mula_in_view' THEN 1 END) as in_views,
    COUNT(CASE WHEN event_name = 'mula_store_click' THEN 1 END) as store_clicks,
    COUNT(CASE WHEN event_name = 'mula_next_page_click' THEN 1 END) as next_page_clicks,
    COUNT(DISTINCT CASE WHEN event_name = 'mula_store_click' THEN session_id END) as sessions_with_store_clicks,
    COUNT(DISTINCT CASE WHEN event_name = 'mula_next_page_click' THEN session_id END) as sessions_with_next_page_clicks
  FROM experiment_events
  GROUP BY variant
),

-- Calculate CTRs and rates
ctr_calculations AS (
  SELECT
    variant,
    sessions,
    in_views,
    store_clicks,
    next_page_clicks,
    sessions_with_store_clicks,
    sessions_with_next_page_clicks,
    CASE 
      WHEN in_views > 0 
      THEN CAST(store_clicks AS DOUBLE) / CAST(in_views AS DOUBLE)
      ELSE 0 
    END as store_ctr,
    CASE 
      WHEN in_views > 0 
      THEN CAST(next_page_clicks AS DOUBLE) / CAST(in_views AS DOUBLE)
      ELSE 0 
    END as next_page_ctr,
    CASE 
      WHEN in_views > 0 
      THEN CAST((store_clicks + next_page_clicks) AS DOUBLE) / CAST(in_views AS DOUBLE)
      ELSE 0 
    END as overall_engagement_rate,
    CASE 
      WHEN sessions > 0 
      THEN CAST(sessions_with_store_clicks AS DOUBLE) / CAST(sessions AS DOUBLE)
      ELSE 0 
    END as store_discovery_rate,
    CASE 
      WHEN sessions > 0 
      THEN CAST(sessions_with_next_page_clicks AS DOUBLE) / CAST(sessions AS DOUBLE)
      ELSE 0 
    END as article_discovery_rate
  FROM variant_metrics
),

-- Statistical significance testing (Chi-square)
statistical_tests AS (
  SELECT
    *,
    -- Store CTR Chi-square test (assuming 0.4% baseline)
    CASE 
      WHEN in_views > 0 AND store_clicks > 0 THEN
        POWER(CAST(store_clicks AS DOUBLE) - (CAST(in_views AS DOUBLE) * 0.004), 2) / (CAST(in_views AS DOUBLE) * 0.004) +
        POWER((CAST(in_views AS DOUBLE) - CAST(store_clicks AS DOUBLE)) - (CAST(in_views AS DOUBLE) * 0.996), 2) / (CAST(in_views AS DOUBLE) * 0.996)
      ELSE 0
    END as store_ctr_chi_square,
    -- Next Page CTR Chi-square test (assuming 0.2% baseline)
    CASE 
      WHEN in_views > 0 AND next_page_clicks > 0 THEN
        POWER(CAST(next_page_clicks AS DOUBLE) - (CAST(in_views AS DOUBLE) * 0.002), 2) / (CAST(in_views AS DOUBLE) * 0.002) +
        POWER((CAST(in_views AS DOUBLE) - CAST(next_page_clicks AS DOUBLE)) - (CAST(in_views AS DOUBLE) * 0.998), 2) / (CAST(in_views AS DOUBLE) * 0.998)
      ELSE 0
    END as next_page_ctr_chi_square
  FROM ctr_calculations
)

SELECT 
  variant,
  sessions,
  in_views,
  store_clicks,
  next_page_clicks,
  ROUND(store_ctr * 100, 4) as store_ctr_percent,
  ROUND(next_page_ctr * 100, 4) as next_page_ctr_percent,
  ROUND(overall_engagement_rate * 100, 4) as overall_engagement_percent,
  ROUND(store_discovery_rate * 100, 2) as store_discovery_percent,
  ROUND(article_discovery_rate * 100, 2) as article_discovery_percent,
  ROUND(store_ctr_chi_square, 4) as store_ctr_chi_square,
  ROUND(next_page_ctr_chi_square, 4) as next_page_ctr_chi_square,
  CASE 
    WHEN store_ctr_chi_square > 3.84 THEN 'Significant (p < 0.05)'
    WHEN store_ctr_chi_square > 2.71 THEN 'Significant (p < 0.10)'
    ELSE 'Not Significant'
  END as store_ctr_significance,
  CASE 
    WHEN next_page_ctr_chi_square > 3.84 THEN 'Significant (p < 0.05)'
    WHEN next_page_ctr_chi_square > 2.71 THEN 'Significant (p < 0.10)'
    ELSE 'Not Significant'
  END as next_page_ctr_significance
FROM statistical_tests
ORDER BY variant;
