WITH base_events AS (
  SELECT
    properties['host'] AS host,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['eventValue'] AS eventValue,
    -- Extract date from datehour for daily bucketing
    date_parse(substring(datehour, 1, 10), '%Y/%m/%d') AS event_date
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '14' day, '%Y/%m/%d/%H')
    AND properties['eventName'] IN (
      'mula_ad_view',
      'mula_feed_click',
      'mula_store_click',
      'mula_widget_view',
      'load_more_button_clicked',
      'mula_in_view'
    )
    AND properties['host'] NOT LIKE '%localhost%'
),

page_view_events AS (
  SELECT
    properties['host'] AS host,
    date_parse(substring(datehour, 1, 10), '%Y/%m/%d') AS event_date,
    COUNT(*) AS page_views
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '14' day, '%Y/%m/%d/%H')
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
    COUNT_IF(eventName = 'mula_in_view' AND eventValue = 'topshelf') AS topshelf_in_views
  FROM filtered_events
  GROUP BY host, event_date
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
  ec.host,
  ec.event_date,
  ec.ad_views,
  ec.feed_clicks,
  ec.store_clicks,
  ec.widget_views,
  ec.load_more_clicks,
  ec.smartscroll_in_views,
  ec.topshelf_in_views,
  ec.feed_clicks + 0 AS total_feed_clicks,  -- Adjust if topshelf feed clicks are tracked separately
  ec.store_clicks + 0 AS total_store_clicks,  -- Adjust if topshelf store clicks are tracked separately
  COALESCE(pv.page_views, 0) AS tag_fires,
  ec.feed_clicks * 1.0 / NULLIF(ec.widget_views, 0) AS mula_feed_click_rate,
  ec.store_clicks * 1.0 / NULLIF(ec.widget_views, 0) AS mula_store_click_rate,
  ec.feed_clicks * 1.0 / NULLIF(ec.smartscroll_in_views, 0) AS smartscroll_feed_click_per_in_view_rate,
  ec.store_clicks * 1.0 / NULLIF(ec.smartscroll_in_views, 0) AS smartscroll_store_click_per_in_view_rate,
  ec.feed_clicks * 1.0 / NULLIF(ec.topshelf_in_views, 0) AS topshelf_feed_click_per_in_view_rate,
  ec.store_clicks * 1.0 / NULLIF(ec.topshelf_in_views, 0) AS topshelf_store_click_per_in_view_rate,
  mebhd.median_ad_views_per_session,
  mebhd.median_store_clicks_per_session,
  1.00 AS cpm_estimate,
  ROUND(ec.ad_views / 1000.0 * 1.00, 2) AS incremental_revenue_estimate
FROM event_counts_by_host_date ec
LEFT JOIN median_events_by_host_date mebhd
  ON ec.host = mebhd.host AND ec.event_date = mebhd.event_date
LEFT JOIN page_view_events pv
  ON ec.host = pv.host AND ec.event_date = pv.event_date
ORDER BY ec.host, ec.event_date; 