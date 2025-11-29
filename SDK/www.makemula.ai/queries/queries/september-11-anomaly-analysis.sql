-- September 11, 2025 Anomaly Analysis
-- Description: Analyzes the 10x spike in mula_store_click events on September 11, 2025
-- Parameters: none
-- Output: host, click_count, comparison to normal days

WITH daily_clicks AS (
  SELECT
    properties['host'] AS host,
    date_format(timestamp, '%Y-%m-%d') AS event_date,
    count(*) AS click_count
  FROM mula.webtag_logs
  WHERE properties['eventName'] = 'mula_store_click'
    AND properties['host'] IS NOT NULL
    AND properties['host'] != ''
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['host'] NOT LIKE '%makemula.ai%'
    AND datehour >= '2025/09/01/00'
    AND datehour < '2025/09/15/00'
  GROUP BY properties['host'], date_format(timestamp, '%Y-%m-%d')
),

anomaly_day AS (
  SELECT
    host,
    click_count
  FROM daily_clicks
  WHERE event_date = '2025-09-11'
),

normal_days AS (
  SELECT
    host,
    avg(click_count) AS avg_daily_clicks,
    max(click_count) AS max_daily_clicks,
    min(click_count) AS min_daily_clicks
  FROM daily_clicks
  WHERE event_date != '2025-09-11'
    AND event_date >= '2025-09-01'
    AND event_date < '2025-09-11'
  GROUP BY host
)

SELECT
  a.host,
  a.click_count AS anomaly_day_clicks,
  COALESCE(n.avg_daily_clicks, 0) AS normal_avg_clicks,
  COALESCE(n.max_daily_clicks, 0) AS normal_max_clicks,
  COALESCE(n.min_daily_clicks, 0) AS normal_min_clicks,
  CASE 
    WHEN n.avg_daily_clicks > 0 THEN round((a.click_count / n.avg_daily_clicks), 2)
    ELSE NULL
  END AS multiplier_vs_avg,
  CASE 
    WHEN n.max_daily_clicks > 0 THEN round((a.click_count / n.max_daily_clicks), 2)
    ELSE NULL
  END AS multiplier_vs_max
FROM anomaly_day a
LEFT JOIN normal_days n ON a.host = n.host
ORDER BY a.click_count DESC;
