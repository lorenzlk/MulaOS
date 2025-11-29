-- Widget View Post-Deployment Comparison
-- Description: Compares widget views for the same hours post-deployment to assess v1.50.1 impact
-- Parameters: {{host}} (required) - The host domain to analyze (e.g., 'www.on3.com')
-- Output: hour, day_1_count, day_2_count, improvement_pct, cumulative_day_1, cumulative_day_2
-- 
-- This query compares hours 4-23 (post v1.50.1 deployment) on Day 1 vs Day 2
-- to see if the new placement logic is restoring reach.

WITH base_events AS (
  SELECT
    properties['host'] AS host,
    properties['eventName'] AS eventName,
    -- Extract hour (0-23) from timestamp
    CAST(date_format(timestamp, '%H') AS INTEGER) AS hour_of_day,
    -- Extract date for day identification
    date_parse(substring(datehour, 1, 10), '%Y/%m/%d') AS event_date,
    -- Calculate days ago (0 = today, 1 = yesterday, 2 = day before)
    CAST(date_diff('day', date_parse(substring(datehour, 1, 10), '%Y/%m/%d'), current_date) AS INTEGER) AS days_ago
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '2' day, '%Y/%m/%d/%H')
    AND properties['eventName'] = 'mula_widget_view'
    AND properties['host'] = '{{host}}'
),

hourly_counts AS (
  SELECT
    hour_of_day,
    days_ago,
    event_date,
    COUNT(*) AS widget_views
  FROM base_events
  WHERE days_ago IN (0, 1)  -- Only Day 1 and Day 2
    AND hour_of_day >= 4  -- Only hours 4-23 (post v1.50.1 deployment at hour 4)
  GROUP BY hour_of_day, days_ago, event_date
),

-- Get the actual dates for labeling
day_labels AS (
  SELECT DISTINCT
    days_ago,
    event_date,
    date_format(event_date, '%Y-%m-%d') AS date_label
  FROM hourly_counts
),

-- Pivot the data to show days as columns
pivoted_data AS (
  SELECT
    hc.hour_of_day,
    MAX(CASE WHEN hc.days_ago = 0 THEN hc.widget_views END) AS day_1_count,
    MAX(CASE WHEN hc.days_ago = 1 THEN hc.widget_views END) AS day_2_count,
    MAX(CASE WHEN hc.days_ago = 0 THEN dl.date_label END) AS day_1_date,
    MAX(CASE WHEN hc.days_ago = 1 THEN dl.date_label END) AS day_2_date
  FROM hourly_counts hc
  LEFT JOIN day_labels dl ON hc.days_ago = dl.days_ago AND hc.event_date = dl.event_date
  GROUP BY hc.hour_of_day
)

SELECT
  hour_of_day AS hour,
  COALESCE(day_1_count, 0) AS day_1_count,
  COALESCE(day_2_count, 0) AS day_2_count,
  day_1_date,
  day_2_date,
  -- Calculate improvement percentage (positive = better, negative = worse)
  CASE 
    WHEN day_2_count > 0 
    THEN ROUND(CAST((COALESCE(day_1_count, 0) - COALESCE(day_2_count, 0)) AS DOUBLE) / CAST(day_2_count AS DOUBLE) * 100, 2)
    WHEN day_1_count > 0 AND day_2_count = 0
    THEN 999.99  -- Infinite improvement (went from 0 to something)
    ELSE NULL
  END AS improvement_pct,
  -- Cumulative totals from hour 4 onwards
  SUM(COALESCE(day_1_count, 0)) OVER (ORDER BY hour_of_day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_day_1,
  SUM(COALESCE(day_2_count, 0)) OVER (ORDER BY hour_of_day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_day_2
FROM pivoted_data
ORDER BY hour_of_day;

