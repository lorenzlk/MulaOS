-- Engagement Report: Compare engagement metrics between sessions with/without Mula
-- Description: Analyzes time on page and scroll depth for two cohorts: sessions where Mula is shown vs not shown
-- Parameters: domain (required), days_back (default: 7)
-- Output: cohort, sessions, avg_time_on_page, median_time_on_page, avg_scroll_depth, median_scroll_depth, lift_metrics
-- 
-- Performance Notes:
-- - Uses datehour partitioning to minimize data scanning
-- - Single-pass aggregation eliminates expensive joins
-- - Session duration calculated using timestamp difference with fallback to max time_on_page

WITH session_metrics AS (
  SELECT
    properties['host'] AS host,
    properties['sessionId'] AS sessionId,
    -- Determine if session had any mula_in_view events
    CASE 
      WHEN COUNT_IF(properties['eventName'] = 'mula_in_view') > 0 THEN 'mula_shown'
      ELSE 'mula_not_shown'
    END AS cohort,
    -- Max time on page from events (since timestamp field is not available)
    MAX(CASE WHEN properties['eventName'] = 'time_on_page' THEN CAST(properties['eventValue'] AS DOUBLE) END) AS time_on_page_seconds,
    -- Max scroll depth in pixels
    MAX(CASE WHEN properties['eventName'] = 'scroll_depth_pixels' THEN CAST(properties['eventValue'] AS DOUBLE) END) AS scroll_depth_pixels
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['host'] = '{{domain}}'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['sessionId'] IS NOT NULL
  GROUP BY properties['host'], properties['sessionId']
),

-- Filter out sessions with invalid metrics
valid_sessions AS (
  SELECT
    host,
    sessionId,
    cohort,
    time_on_page_seconds,
    scroll_depth_pixels
  FROM session_metrics
  WHERE scroll_depth_pixels > 0
    AND scroll_depth_pixels <= 10000  -- Cap at 10k pixels to avoid extreme outliers
    AND time_on_page_seconds > 0
    AND time_on_page_seconds <= 3600  -- Cap at 1 hour to avoid extreme outliers
),

cohort_aggregates AS (
  SELECT
    cohort,
    COUNT(*) AS sessions,
    -- Time on page metrics
    AVG(time_on_page_seconds) AS avg_time_on_page,
    approx_percentile(time_on_page_seconds, 0.5) AS median_time_on_page,
    STDDEV(time_on_page_seconds) AS stddev_time_on_page,
    -- Scroll depth metrics  
    AVG(scroll_depth_pixels) AS avg_scroll_depth,
    approx_percentile(scroll_depth_pixels, 0.5) AS median_scroll_depth,
    STDDEV(scroll_depth_pixels) AS stddev_scroll_depth
  FROM valid_sessions
  GROUP BY cohort
),

-- Calculate control metrics (mula_not_shown) for lift calculations
control_metrics AS (
  SELECT * FROM cohort_aggregates WHERE cohort = 'mula_not_shown'
),

-- Calculate treatment metrics (mula_shown) and lift
treatment_metrics AS (
  SELECT 
    tm.*,
    cm.avg_time_on_page AS control_avg_time,
    cm.median_time_on_page AS control_median_time,
    cm.avg_scroll_depth AS control_avg_scroll,
    cm.median_scroll_depth AS control_median_scroll,
    -- Time on page lift
    CASE 
      WHEN cm.avg_time_on_page > 0 
      THEN (tm.avg_time_on_page - cm.avg_time_on_page) / cm.avg_time_on_page * 100
      ELSE NULL 
    END AS time_lift_percent,
    -- Scroll depth lift
    CASE 
      WHEN cm.avg_scroll_depth > 0 
      THEN (tm.avg_scroll_depth - cm.avg_scroll_depth) / cm.avg_scroll_depth * 100
      ELSE NULL 
    END AS scroll_lift_percent
  FROM cohort_aggregates tm
  CROSS JOIN control_metrics cm
  WHERE tm.cohort = 'mula_shown'
),

-- Statistical significance calculations using t-test approximation
statistical_significance AS (
  SELECT 
    tm.*,
    -- T-test for time on page (simplified calculation)
    CASE 
      WHEN tm.sessions >= 30 AND cm.sessions >= 30 THEN
        ABS(tm.avg_time_on_page - cm.avg_time_on_page) / 
        SQRT((POWER(tm.stddev_time_on_page, 2) / tm.sessions) + (POWER(cm.stddev_time_on_page, 2) / cm.sessions))
      ELSE NULL
    END AS time_t_statistic,
    -- T-test for scroll depth
    CASE 
      WHEN tm.sessions >= 30 AND cm.sessions >= 30 THEN
        ABS(tm.avg_scroll_depth - cm.avg_scroll_depth) / 
        SQRT((POWER(tm.stddev_scroll_depth, 2) / tm.sessions) + (POWER(cm.stddev_scroll_depth, 2) / cm.sessions))
      ELSE NULL
    END AS scroll_t_statistic
  FROM treatment_metrics tm
  CROSS JOIN control_metrics cm
),

-- Final results with p-value approximations
final_results AS (
  SELECT 
    'mula_not_shown' AS cohort,
    cm.sessions,
    cm.avg_time_on_page,
    cm.median_time_on_page,
    cm.avg_scroll_depth,
    cm.median_scroll_depth,
    NULL AS time_lift_percent,
    NULL AS scroll_lift_percent,
    NULL AS time_p_value,
    NULL AS scroll_p_value
  FROM control_metrics cm
  
  UNION ALL
  
  SELECT 
    'mula_shown' AS cohort,
    ss.sessions,
    ss.avg_time_on_page,
    ss.median_time_on_page,
    ss.avg_scroll_depth,
    ss.median_scroll_depth,
    ss.time_lift_percent,
    ss.scroll_lift_percent,
    -- Approximate p-values (t-statistic > 2.0 = p < 0.05, > 3.0 = p < 0.01)
    CASE 
      WHEN ss.time_t_statistic IS NULL THEN NULL
      WHEN ss.time_t_statistic > 3.0 THEN '< 0.01'
      WHEN ss.time_t_statistic > 2.0 THEN '< 0.05'
      ELSE '> 0.05'
    END AS time_p_value,
    CASE 
      WHEN ss.scroll_t_statistic IS NULL THEN NULL
      WHEN ss.scroll_t_statistic > 3.0 THEN '< 0.01'
      WHEN ss.scroll_t_statistic > 2.0 THEN '< 0.05'
      ELSE '> 0.05'
    END AS scroll_p_value
  FROM statistical_significance ss
)

SELECT * FROM final_results
ORDER BY cohort DESC;
