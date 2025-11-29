WITH base_events AS (
  SELECT
    properties['host'] AS host,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['eventValue'] AS eventValue
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
    AND properties['eventName'] IN (
      'page_view',
      'mula_ad_view',
      'mula_feed_click',
      'mula_store_click',
      'mula_widget_view',
      'load_more_button_clicked',
      'mula_in_view'
    )
    AND properties['host'] NOT LIKE '%localhost%'
),

all_page_views AS (
  SELECT COUNT(*) AS total_page_views
  FROM base_events
  WHERE eventName = 'page_view'
),

sessions_with_widget_view AS (
  SELECT DISTINCT
    sessionId
  FROM base_events
  WHERE eventName = 'mula_widget_view'
),

filtered_events AS (
  SELECT be.*
  FROM base_events be
  INNER JOIN sessions_with_widget_view swv
    ON be.sessionId = swv.sessionId
),

event_counts AS (
  SELECT
    COUNT_IF(eventName = 'page_view') AS page_views,
    COUNT_IF(eventName = 'mula_ad_view') AS ad_views,
    COUNT_IF(eventName = 'mula_feed_click') AS feed_clicks,
    COUNT_IF(eventName = 'mula_store_click') AS store_clicks,
    COUNT_IF(eventName = 'mula_widget_view') AS widget_views,
    COUNT_IF(eventName = 'load_more_button_clicked') AS load_more_clicks,
    COUNT_IF(eventName = 'mula_in_view' AND eventValue = 'smartscroll') AS smartscroll_in_views,
    COUNT_IF(eventName = 'mula_in_view' AND eventValue = 'topshelf') AS topshelf_in_views
  FROM filtered_events
),

session_event_counts AS (
  SELECT
    sessionId,
    COUNT_IF(eventName = 'mula_ad_view') AS ad_views_per_session,
    COUNT_IF(eventName = 'mula_store_click') AS store_clicks_per_session
  FROM filtered_events
  GROUP BY sessionId
),

median_events AS (
  SELECT
    approx_percentile(ad_views_per_session, 0.5) AS median_ad_views_per_session,
    approx_percentile(store_clicks_per_session, 0.5) AS median_store_clicks_per_session
  FROM session_event_counts
)

SELECT 
  apv.total_page_views AS tag_fires,
  ec.widget_views,
  ec.smartscroll_in_views,
  ec.topshelf_in_views,
  ec.ad_views,
  ec.feed_clicks,
  ec.store_clicks,
  ec.load_more_clicks,
  ec.feed_clicks + 0 AS total_feed_clicks,  -- Placeholder if topshelf clicks tracked separately
  ec.store_clicks + 0 AS total_store_clicks,
  ec.feed_clicks * 1.0 / NULLIF(ec.widget_views, 0) AS mula_feed_click_rate,
  ec.store_clicks * 1.0 / NULLIF(ec.widget_views, 0) AS mula_store_click_rate,
  ec.feed_clicks * 1.0 / NULLIF(ec.smartscroll_in_views, 0) AS smartscroll_feed_click_per_in_view_rate,
  ec.store_clicks * 1.0 / NULLIF(ec.smartscroll_in_views, 0) AS smartscroll_store_click_per_in_view_rate,
  ec.feed_clicks * 1.0 / NULLIF(ec.topshelf_in_views, 0) AS topshelf_feed_click_per_in_view_rate,
  ec.store_clicks * 1.0 / NULLIF(ec.topshelf_in_views, 0) AS topshelf_store_click_per_in_view_rate,
  ec.ad_views * 1.0 / NULLIF(apv.total_page_views, 0) AS ad_view_per_page_view_rate,
  ec.store_clicks * 1.0 / NULLIF(apv.total_page_views, 0) AS store_click_per_page_view_rate,
  me.median_ad_views_per_session,
  me.median_store_clicks_per_session,
  1.00 AS cpm_estimate,
  ROUND(ec.ad_views / 1000.0 * 1.00, 2) AS incremental_revenue_estimate
FROM event_counts ec
CROSS JOIN median_events me
CROSS JOIN all_page_views apv;
