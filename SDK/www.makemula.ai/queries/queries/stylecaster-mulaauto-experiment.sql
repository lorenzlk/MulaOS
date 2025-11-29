-- Stylecaster mulaAuto Experiment Analysis
-- Description: Compares scroll depth and time on site for control vs test (mulaAuto=1) variations
-- Parameters: {{days_back}} (default: 30)
-- Output: variant, sessions, avg_time_on_page, median_time_on_page, avg_scroll_depth, median_scroll_depth, lift_metrics

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
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'stylecaster.com'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['sessionId'] IS NOT NULL
    AND properties['pathname'] = '/beauty/skin-care/1234831123/baebody-snail-mucin-face-sheet-mask/'
),

-- Determine variant based on queryString
session_variants AS (
  SELECT DISTINCT
    host,
    sessionId,
    pathname,
    CASE 
      WHEN MAX(CASE WHEN queryString LIKE '%mulaAuto=1%' OR queryString LIKE '%mulaAuto%' THEN 1 ELSE 0 END) = 1 THEN 'test'
      ELSE 'control'
    END AS variant
  FROM base_events
  GROUP BY host, sessionId, pathname
),

-- Get time on page metrics per session
time_metrics AS (
  SELECT
    sv.host,
    sv.sessionId,
    sv.pathname,
    sv.variant,
    MAX(CASE WHEN be.eventName = 'time_on_page' THEN CAST(be.eventValue AS DOUBLE) END) AS time_on_page_seconds
  FROM session_variants sv
  INNER JOIN base_events be
    ON sv.host = be.host
    AND sv.sessionId = be.sessionId
    AND sv.pathname = be.pathname
  WHERE be.eventName = 'time_on_page'
  GROUP BY sv.host, sv.sessionId, sv.pathname, sv.variant
),

-- Get scroll depth metrics per session (try both pixels and percent)
scroll_metrics AS (
  SELECT
    sv.host,
    sv.sessionId,
    sv.pathname,
    sv.variant,
    MAX(CASE WHEN be.eventName = 'scroll_depth_pixels' THEN CAST(be.eventValue AS DOUBLE) END) AS scroll_depth_pixels,
    MAX(CASE WHEN be.eventName = 'scroll_depth_percent' THEN CAST(be.eventValue AS DOUBLE) END) AS scroll_depth_percent
  FROM session_variants sv
  INNER JOIN base_events be
    ON sv.host = be.host
    AND sv.sessionId = be.sessionId
    AND sv.pathname = be.pathname
  WHERE be.eventName IN ('scroll_depth_pixels', 'scroll_depth_percent')
  GROUP BY sv.host, sv.sessionId, sv.pathname, sv.variant
),

-- Get page views to count all sessions (not just those with engagement events)
page_view_sessions AS (
  SELECT DISTINCT
    sv.host,
    sv.sessionId,
    sv.pathname,
    sv.variant
  FROM session_variants sv
  INNER JOIN base_events be
    ON sv.host = be.host
    AND sv.sessionId = be.sessionId
    AND sv.pathname = be.pathname
  WHERE be.eventName = 'page_view'
),

-- Combine metrics per session (include all sessions with page views)
session_metrics AS (
  SELECT
    pvs.host,
    pvs.sessionId,
    pvs.pathname,
    pvs.variant,
    tm.time_on_page_seconds,
    COALESCE(sm.scroll_depth_pixels, 0) AS scroll_depth_pixels,
    COALESCE(sm.scroll_depth_percent, 0) AS scroll_depth_percent
  FROM page_view_sessions pvs
  LEFT JOIN time_metrics tm
    ON pvs.host = tm.host
    AND pvs.sessionId = tm.sessionId
    AND pvs.pathname = tm.pathname
  LEFT JOIN scroll_metrics sm
    ON pvs.host = sm.host
    AND pvs.sessionId = sm.sessionId
    AND pvs.pathname = sm.pathname
),

-- Filter out invalid sessions (keep all page views, but cap outliers for engagement metrics)
valid_sessions AS (
  SELECT *
  FROM session_metrics
  WHERE variant IS NOT NULL
    AND (time_on_page_seconds IS NULL OR (time_on_page_seconds > 0 AND time_on_page_seconds <= 3600))  -- Cap at 1 hour
    AND (scroll_depth_pixels IS NULL OR scroll_depth_pixels <= 50000)  -- Cap at 50k pixels
    AND (scroll_depth_percent IS NULL OR scroll_depth_percent <= 100)  -- Cap at 100%
),

-- Calculate variant aggregates
variant_aggregates AS (
  SELECT
    variant,
    COUNT(*) AS sessions,
    -- Time on page metrics
    AVG(time_on_page_seconds) AS avg_time_on_page,
    approx_percentile(time_on_page_seconds, 0.5) AS median_time_on_page,
    STDDEV(time_on_page_seconds) AS stddev_time_on_page,
    MIN(time_on_page_seconds) AS min_time_on_page,
    MAX(time_on_page_seconds) AS max_time_on_page,
    -- Scroll depth metrics (pixels)
    AVG(scroll_depth_pixels) AS avg_scroll_depth_pixels,
    approx_percentile(scroll_depth_pixels, 0.5) AS median_scroll_depth_pixels,
    STDDEV(scroll_depth_pixels) AS stddev_scroll_depth_pixels,
    MAX(scroll_depth_pixels) AS max_scroll_depth_pixels,
    -- Scroll depth metrics (percent)
    AVG(scroll_depth_percent) AS avg_scroll_depth_percent,
    approx_percentile(scroll_depth_percent, 0.5) AS median_scroll_depth_percent,
    STDDEV(scroll_depth_percent) AS stddev_scroll_depth_percent,
    MAX(scroll_depth_percent) AS max_scroll_depth_percent
  FROM valid_sessions
  GROUP BY variant
),

-- Get control metrics
control_metrics AS (
  SELECT * FROM variant_aggregates WHERE variant = 'control'
),

-- Calculate test metrics and lift
test_metrics AS (
  SELECT 
    tm.*,
    cm.avg_time_on_page AS control_avg_time,
    cm.median_time_on_page AS control_median_time,
    cm.avg_scroll_depth_pixels AS control_avg_scroll_pixels,
    cm.median_scroll_depth_pixels AS control_median_scroll_pixels,
    cm.avg_scroll_depth_percent AS control_avg_scroll_percent,
    cm.median_scroll_depth_percent AS control_median_scroll_percent,
    -- Time on page lift
    CASE 
      WHEN cm.avg_time_on_page > 0 
      THEN (tm.avg_time_on_page - cm.avg_time_on_page) / cm.avg_time_on_page * 100
      ELSE NULL 
    END AS time_lift_percent,
    -- Scroll depth lift (pixels)
    CASE 
      WHEN cm.avg_scroll_depth_pixels > 0 
      THEN (tm.avg_scroll_depth_pixels - cm.avg_scroll_depth_pixels) / cm.avg_scroll_depth_pixels * 100
      ELSE NULL 
    END AS scroll_pixels_lift_percent,
    -- Scroll depth lift (percent)
    CASE 
      WHEN cm.avg_scroll_depth_percent > 0 
      THEN (tm.avg_scroll_depth_percent - cm.avg_scroll_depth_percent) / cm.avg_scroll_depth_percent * 100
      ELSE NULL 
    END AS scroll_percent_lift_percent
  FROM variant_aggregates tm
  CROSS JOIN control_metrics cm
  WHERE tm.variant = 'test'
),

-- Statistical significance calculations
statistical_significance AS (
  SELECT 
    tm.*,
    -- T-test for time on page
    CASE 
      WHEN tm.sessions >= 30 AND cm.sessions >= 30 THEN
        ABS(tm.avg_time_on_page - cm.avg_time_on_page) / 
        NULLIF(SQRT((POWER(tm.stddev_time_on_page, 2) / tm.sessions) + (POWER(cm.stddev_time_on_page, 2) / cm.sessions)), 0)
      ELSE NULL
    END AS time_t_statistic,
    -- T-test for scroll depth (pixels)
    CASE 
      WHEN tm.sessions >= 30 AND cm.sessions >= 30 THEN
        ABS(tm.avg_scroll_depth_pixels - cm.avg_scroll_depth_pixels) / 
        NULLIF(SQRT((POWER(tm.stddev_scroll_depth_pixels, 2) / tm.sessions) + (POWER(cm.stddev_scroll_depth_pixels, 2) / cm.sessions)), 0)
      ELSE NULL
    END AS scroll_pixels_t_statistic,
    -- T-test for scroll depth (percent)
    CASE 
      WHEN tm.sessions >= 30 AND cm.sessions >= 30 THEN
        ABS(tm.avg_scroll_depth_percent - cm.avg_scroll_depth_percent) / 
        NULLIF(SQRT((POWER(tm.stddev_scroll_depth_percent, 2) / tm.sessions) + (POWER(cm.stddev_scroll_depth_percent, 2) / cm.sessions)), 0)
      ELSE NULL
    END AS scroll_percent_t_statistic
  FROM test_metrics tm
  CROSS JOIN control_metrics cm
)

-- Final results
SELECT 
  'control' AS variant,
  cm.sessions,
  ROUND(cm.avg_time_on_page, 2) AS avg_time_on_page_seconds,
  ROUND(cm.median_time_on_page, 2) AS median_time_on_page_seconds,
  ROUND(cm.avg_scroll_depth_pixels, 2) AS avg_scroll_depth_pixels,
  ROUND(cm.median_scroll_depth_pixels, 2) AS median_scroll_depth_pixels,
  ROUND(cm.avg_scroll_depth_percent, 2) AS avg_scroll_depth_percent,
  ROUND(cm.median_scroll_depth_percent, 2) AS median_scroll_depth_percent,
  NULL AS time_lift_percent,
  NULL AS scroll_pixels_lift_percent,
  NULL AS scroll_percent_lift_percent,
  NULL AS time_p_value,
  NULL AS scroll_pixels_p_value,
  NULL AS scroll_percent_p_value
FROM control_metrics cm

UNION ALL

SELECT 
  'test' AS variant,
  ss.sessions,
  ROUND(ss.avg_time_on_page, 2) AS avg_time_on_page_seconds,
  ROUND(ss.median_time_on_page, 2) AS median_time_on_page_seconds,
  ROUND(ss.avg_scroll_depth_pixels, 2) AS avg_scroll_depth_pixels,
  ROUND(ss.median_scroll_depth_pixels, 2) AS median_scroll_depth_pixels,
  ROUND(ss.avg_scroll_depth_percent, 2) AS avg_scroll_depth_percent,
  ROUND(ss.median_scroll_depth_percent, 2) AS median_scroll_depth_percent,
  ROUND(ss.time_lift_percent, 2) AS time_lift_percent,
  ROUND(ss.scroll_pixels_lift_percent, 2) AS scroll_pixels_lift_percent,
  ROUND(ss.scroll_percent_lift_percent, 2) AS scroll_percent_lift_percent,
  -- Approximate p-values (t-statistic > 2.0 = p < 0.05, > 3.0 = p < 0.01)
  CASE 
    WHEN ss.time_t_statistic IS NULL THEN NULL
    WHEN ss.time_t_statistic > 3.0 THEN '< 0.01'
    WHEN ss.time_t_statistic > 2.0 THEN '< 0.05'
    ELSE '> 0.05'
  END AS time_p_value,
  CASE 
    WHEN ss.scroll_pixels_t_statistic IS NULL THEN NULL
    WHEN ss.scroll_pixels_t_statistic > 3.0 THEN '< 0.01'
    WHEN ss.scroll_pixels_t_statistic > 2.0 THEN '< 0.05'
    ELSE '> 0.05'
  END AS scroll_pixels_p_value,
  CASE 
    WHEN ss.scroll_percent_t_statistic IS NULL THEN NULL
    WHEN ss.scroll_percent_t_statistic > 3.0 THEN '< 0.01'
    WHEN ss.scroll_percent_t_statistic > 2.0 THEN '< 0.05'
    ELSE '> 0.05'
  END AS scroll_percent_p_value
FROM statistical_significance ss

ORDER BY variant DESC;

