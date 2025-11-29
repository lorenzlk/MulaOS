-- Performance Report Time Series
-- Description: Daily time series of Mula widget metrics over a configurable period
-- Parameters: days_back (default: 7)
-- Output: host, event_date, ad_views, feed_clicks, store_clicks, widget_views, etc.

WITH base_events AS (
  SELECT
    properties['host'] AS host,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['eventValue'] AS eventValue,
    -- Extract date from datehour for daily bucketing
    date_parse(substring(datehour, 1, 10), '%Y/%m/%d') AS event_date
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['eventName'] IN (
      'mula_ad_view',
      'mula_feed_click',
      'mula_store_click',
      'mula_widget_view',
      'load_more_button_clicked',
      'mula_in_view',
      'mula_next_page_click',
      'bot_view'
    )
    AND properties['host'] NOT LIKE '%localhost%'
),

page_view_events AS (
  SELECT
    properties['host'] AS host,
    date_parse(substring(datehour, 1, 10), '%Y/%m/%d') AS event_date,
    COUNT(*) AS page_views
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['eventName'] = 'page_view'
    AND properties['host'] NOT LIKE '%localhost%'
  GROUP BY properties['host'], date_parse(substring(datehour, 1, 10), '%Y/%m/%d')
),

sessions_with_widget_view AS (
  SELECT DISTINCT
    host,
    sessionId,
    event_date
  FROM base_events
  WHERE eventName = 'mula_widget_view'
),

-- Separate bot_view events (not filtered by widget sessions)
bot_view_events AS (
  SELECT
    host,
    sessionId,
    eventName,
    eventValue,
    event_date
  FROM base_events
  WHERE eventName = 'bot_view'
),

filtered_events AS (
  SELECT be.*
  FROM base_events be
  INNER JOIN sessions_with_widget_view swv
    ON be.host = swv.host 
    AND be.sessionId = swv.sessionId
    AND be.event_date = swv.event_date
),

event_counts_by_host_date AS (
  SELECT
    host,
    event_date,
    COUNT_IF(eventName = 'mula_ad_view') AS ad_views,
    COUNT_IF(eventName = 'mula_feed_click') AS feed_clicks,
    COUNT_IF(eventName = 'mula_store_click') AS store_clicks,
    COUNT_IF(eventName = 'mula_widget_view') AS widget_views,
    COUNT_IF(eventName = 'load_more_button_clicked') AS load_more_clicks,
    COUNT_IF(eventName = 'mula_in_view' AND eventValue = 'smartscroll') AS smartscroll_in_views,
    COUNT_IF(eventName = 'mula_in_view' AND eventValue = 'topshelf') AS topshelf_in_views,
    COUNT_IF(eventName = 'mula_next_page_click') AS next_page_clicks,
    COUNT_IF(eventName = 'bot_view') AS bot_views
  FROM filtered_events
  GROUP BY host, event_date
),

-- Count bot views separately (not filtered by widget sessions)
bot_view_counts AS (
  SELECT
    host,
    event_date,
    COUNT(*) AS bot_views
  FROM bot_view_events
  GROUP BY host, event_date
),

-- Combine all event counts
combined_event_counts AS (
  SELECT 
    COALESCE(ec.host, bv.host) AS host,
    COALESCE(ec.event_date, bv.event_date) AS event_date,
    COALESCE(ec.ad_views, 0) AS ad_views,
    COALESCE(ec.feed_clicks, 0) AS feed_clicks,
    COALESCE(ec.store_clicks, 0) AS store_clicks,
    COALESCE(ec.widget_views, 0) AS widget_views,
    COALESCE(ec.load_more_clicks, 0) AS load_more_clicks,
    COALESCE(ec.smartscroll_in_views, 0) AS smartscroll_in_views,
    COALESCE(ec.topshelf_in_views, 0) AS topshelf_in_views,
    COALESCE(ec.next_page_clicks, 0) AS next_page_clicks,
    COALESCE(ec.bot_views, 0) + COALESCE(bv.bot_views, 0) AS bot_views
  FROM event_counts_by_host_date ec
  FULL OUTER JOIN bot_view_counts bv
    ON ec.host = bv.host AND ec.event_date = bv.event_date
),

session_event_counts AS (
  SELECT
    host,
    event_date,
    sessionId,
    COUNT_IF(eventName = 'mula_ad_view') AS ad_views_per_session,
    COUNT_IF(eventName = 'mula_store_click') AS store_clicks_per_session
  FROM filtered_events
  GROUP BY host, event_date, sessionId
),

median_events_by_host_date AS (
  SELECT
    host,
    event_date,
    approx_percentile(ad_views_per_session, 0.5) AS median_ad_views_per_session,
    approx_percentile(store_clicks_per_session, 0.5) AS median_store_clicks_per_session
  FROM session_event_counts
  GROUP BY host, event_date
)

SELECT 
  cec.host,
  cec.event_date,
  cec.ad_views,
  cec.feed_clicks,
  cec.store_clicks,
  cec.widget_views,
  cec.load_more_clicks,
  cec.smartscroll_in_views,
  cec.topshelf_in_views,
  cec.next_page_clicks,
  cec.bot_views,
  cec.feed_clicks + 0 AS total_feed_clicks,  -- Adjust if topshelf feed clicks are tracked separately
  cec.store_clicks + 0 AS total_store_clicks,  -- Adjust if topshelf store clicks are tracked separately
  COALESCE(pv.page_views, 0) AS tag_fires,
  cec.feed_clicks * 1.0 / NULLIF(cec.widget_views, 0) AS mula_feed_click_rate,
  cec.store_clicks * 1.0 / NULLIF(cec.widget_views, 0) AS mula_store_click_rate,
  cec.feed_clicks * 1.0 / NULLIF(cec.smartscroll_in_views, 0) AS smartscroll_feed_click_per_in_view_rate,
  cec.store_clicks * 1.0 / NULLIF(cec.smartscroll_in_views, 0) AS smartscroll_store_click_per_in_view_rate,
  cec.feed_clicks * 1.0 / NULLIF(cec.topshelf_in_views, 0) AS topshelf_feed_click_per_in_view_rate,
  cec.store_clicks * 1.0 / NULLIF(cec.topshelf_in_views, 0) AS topshelf_store_click_per_in_view_rate,
  mebhd.median_ad_views_per_session,
  mebhd.median_store_clicks_per_session,
  1.00 AS cpm_estimate,
  ROUND(cec.ad_views / 1000.0 * 1.00, 2) AS incremental_revenue_estimate
FROM combined_event_counts cec
LEFT JOIN median_events_by_host_date mebhd
  ON cec.host = mebhd.host AND cec.event_date = mebhd.event_date
LEFT JOIN page_view_events pv
  ON cec.host = pv.host AND cec.event_date = pv.event_date
ORDER BY cec.host, cec.event_date; 