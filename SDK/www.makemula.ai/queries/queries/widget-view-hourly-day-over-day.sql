-- Widget View Hourly Day-over-Day Analysis
-- Description: Hour-cohorted view of mula_widget_view events over the past 3 days for a specific host
-- Parameters: {{host}} (required) - The host domain to analyze (e.g., 'www.on3.com')
-- Output: hour, day_1_count, day_2_count, day_3_count, day_1_date, day_2_date, day_3_date
-- 
-- This query shows widget views grouped by hour of day (0-23) with separate columns
-- for each of the past 3 days, making it easy to compare day-over-day patterns.

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
  WHERE datehour >= date_format(current_timestamp - interval '3' day, '%Y/%m/%d/%H')
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
  WHERE days_ago IN (0, 1, 2)  -- Only include last 3 days
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
    MAX(CASE WHEN hc.days_ago = 2 THEN hc.widget_views END) AS day_3_count,
    MAX(CASE WHEN hc.days_ago = 0 THEN dl.date_label END) AS day_1_date,
    MAX(CASE WHEN hc.days_ago = 1 THEN dl.date_label END) AS day_2_date,
    MAX(CASE WHEN hc.days_ago = 2 THEN dl.date_label END) AS day_3_date
  FROM hourly_counts hc
  LEFT JOIN day_labels dl ON hc.days_ago = dl.days_ago AND hc.event_date = dl.event_date
  GROUP BY hc.hour_of_day
)

SELECT
  hour_of_day AS hour,
  COALESCE(day_1_count, 0) AS day_1_count,
  COALESCE(day_2_count, 0) AS day_2_count,
  COALESCE(day_3_count, 0) AS day_3_count,
  day_1_date,
  day_2_date,
  day_3_date,
  -- Calculate day-over-day changes
  CASE 
    WHEN day_2_count > 0 
    THEN ROUND(CAST((COALESCE(day_1_count, 0) - COALESCE(day_2_count, 0)) AS DOUBLE) / CAST(day_2_count AS DOUBLE) * 100, 2)
    ELSE NULL
  END AS day_1_vs_day_2_pct_change,
  CASE 
    WHEN day_3_count > 0 
    THEN ROUND(CAST((COALESCE(day_2_count, 0) - COALESCE(day_3_count, 0)) AS DOUBLE) / CAST(day_3_count AS DOUBLE) * 100, 2)
    ELSE NULL
  END AS day_2_vs_day_3_pct_change
FROM pivoted_data
ORDER BY hour_of_day;

