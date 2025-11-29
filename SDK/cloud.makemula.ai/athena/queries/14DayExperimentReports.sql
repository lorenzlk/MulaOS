WITH base_events AS (
  SELECT
    properties['host'] AS host,
    CASE 
      WHEN properties['host'] = 'www.brit.co' AND properties['queryString'] LIKE '%mulaAuto%' THEN 'test'
      WHEN properties['host'] = 'www.brit.co' THEN 'control'
      ELSE properties['mulaVariant']
    END AS mulaVariant,
    CASE 
      WHEN properties['host'] = 'www.brit.co' THEN 'beta'
      ELSE properties['mulaExperiment']
    END AS mulaExperiment,
    properties['pathname'] AS pathname,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['queryString'] AS queryString,
    properties['eventValue'] AS eventValue
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '14' day, '%Y/%m/%d/%H')
    AND properties['queryString'] LIKE '%utm%'
    AND properties['queryString'] LIKE '%mulaLogLevel%'
),

max_time_on_page AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname, sessionId,
    MAX(CAST(eventValue AS DOUBLE)) AS max_time_on_page
  FROM base_events
  WHERE eventName = 'time_on_page'
    AND mulaVariant IS NOT NULL
  GROUP BY host, mulaVariant, mulaExperiment, pathname, sessionId
),

max_scroll_depth AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname, sessionId,
    MAX(CAST(eventValue AS DOUBLE)) AS max_scroll_depth
  FROM base_events
  WHERE eventName = 'scroll_depth_percent'
    AND mulaVariant IS NOT NULL
  GROUP BY host, mulaVariant, mulaExperiment, pathname, sessionId
),

clicks AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname,
    COUNT_IF(eventName = 'click') AS click_count,
    COUNT_IF(eventName = 'mula_store_click') AS mula_store_click_count
  FROM base_events
  WHERE eventName IN ('click', 'mula_store_click')
    AND mulaVariant IS NOT NULL
  GROUP BY host, mulaVariant, mulaExperiment, pathname
),

page_views AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname,
    COUNT(*) AS page_view_count
  FROM base_events
  WHERE eventName = 'page_view'
    AND mulaVariant IS NOT NULL
  GROUP BY host, mulaVariant, mulaExperiment, pathname
),

mula_feed_clicks AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname,
    COUNT(*) AS mula_feed_click_count
  FROM base_events
  WHERE eventName = 'mula_feed_click'
    AND mulaVariant IS NOT NULL
  GROUP BY host, mulaVariant, mulaExperiment, pathname
),

mula_like_clicks AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname,
    COUNT(*) AS mula_like_click_count
  FROM base_events
  WHERE eventName = 'mula_like_click'
    AND mulaVariant IS NOT NULL
  GROUP BY host, mulaVariant, mulaExperiment, pathname
),

page_height_map AS (
  SELECT * FROM (
    VALUES 
      ('www.brit.co', 'test', 42096),
      ('www.brit.co', 'control', 19545),
      ('spotcovery.com', 'test', 39798),
      ('spotcovery.com', 'control', 17466),
      ('www.gadgetreview.com', 'test', 52174),
      ('www.gadgetreview.com', 'control', 22302)
  ) AS t(host, mulaVariant, page_height)
),

median_time AS (
  SELECT
    host, mulaVariant, mulaExperiment, pathname,
    approx_percentile(max_time_on_page, 0.5) AS median_time_on_page
  FROM max_time_on_page
  GROUP BY host, mulaVariant, mulaExperiment, pathname
),

avg_scroll AS (
  SELECT
    msd.host, msd.mulaVariant, msd.mulaExperiment, msd.pathname,
    AVG(msd.max_scroll_depth) AS average_scroll_depth_percent
  FROM max_scroll_depth msd
  GROUP BY msd.host, msd.mulaVariant, msd.mulaExperiment, msd.pathname
),

scroll_depth_px AS (
  SELECT
    a.host, a.mulaVariant, a.mulaExperiment, a.pathname,
    a.average_scroll_depth_percent,
    (a.average_scroll_depth_percent / 100) * ph.page_height AS scroll_depth_px
  FROM avg_scroll a
  LEFT JOIN page_height_map ph
    ON a.host = ph.host AND a.mulaVariant = ph.mulaVariant
)

SELECT
  COALESCE(mt.host, sdp.host, c.host, pv.host, mfc.host, mlc.host) AS host,
  COALESCE(mt.mulaVariant, sdp.mulaVariant, c.mulaVariant, pv.mulaVariant, mfc.mulaVariant, mlc.mulaVariant) AS mulaVariant,
  COALESCE(mt.mulaExperiment, sdp.mulaExperiment, c.mulaExperiment, pv.mulaExperiment, mfc.mulaExperiment, mlc.mulaExperiment) AS mulaExperiment,
  COALESCE(mt.pathname, sdp.pathname, c.pathname, pv.pathname, mfc.pathname, mlc.pathname) AS pathname,
  mt.median_time_on_page,
  --sdp.average_scroll_depth_percent,
  sdp.scroll_depth_px as scroll_depth,
  c.click_count,
  c.mula_store_click_count,
  pv.page_view_count,
  COALESCE(mfc.mula_feed_click_count, 0),
  COALESCE(mlc.mula_like_click_count, 0),
  COALESCE(mfc.mula_feed_click_count, 0) + COALESCE(mlc.mula_like_click_count, 0) AS mula_engagement
FROM median_time mt
FULL OUTER JOIN scroll_depth_px sdp
  ON mt.host = sdp.host 
  AND mt.mulaVariant = sdp.mulaVariant 
  AND mt.mulaExperiment = sdp.mulaExperiment
  AND mt.pathname = sdp.pathname
FULL OUTER JOIN clicks c
  ON COALESCE(mt.host, sdp.host) = c.host
  AND COALESCE(mt.mulaVariant, sdp.mulaVariant) = c.mulaVariant
  AND COALESCE(mt.mulaExperiment, sdp.mulaExperiment) = c.mulaExperiment
  AND COALESCE(mt.pathname, sdp.pathname) = c.pathname
FULL OUTER JOIN page_views pv
  ON COALESCE(mt.host, sdp.host, c.host) = pv.host
  AND COALESCE(mt.mulaVariant, sdp.mulaVariant, c.mulaVariant) = pv.mulaVariant
  AND COALESCE(mt.mulaExperiment, sdp.mulaExperiment, c.mulaExperiment) = pv.mulaExperiment
  AND COALESCE(mt.pathname, sdp.pathname, c.pathname) = pv.pathname
FULL OUTER JOIN mula_feed_clicks mfc
  ON COALESCE(mt.host, sdp.host, c.host, pv.host) = mfc.host
  AND COALESCE(mt.mulaVariant, sdp.mulaVariant, c.mulaVariant, pv.mulaVariant) = mfc.mulaVariant
  AND COALESCE(mt.mulaExperiment, sdp.mulaExperiment, c.mulaExperiment, pv.mulaExperiment) = mfc.mulaExperiment
  AND COALESCE(mt.pathname, sdp.pathname, c.pathname, pv.pathname) = mfc.pathname
FULL OUTER JOIN mula_like_clicks mlc
  ON COALESCE(mt.host, sdp.host, c.host, pv.host, mfc.host) = mlc.host
  AND COALESCE(mt.mulaVariant, sdp.mulaVariant, c.mulaVariant, pv.mulaVariant, mfc.mulaVariant) = mlc.mulaVariant
  AND COALESCE(mt.mulaExperiment, sdp.mulaExperiment, c.mulaExperiment, pv.mulaExperiment, mfc.mulaExperiment) = mlc.mulaExperiment
  AND COALESCE(mt.pathname, sdp.pathname, c.pathname, pv.pathname, mfc.pathname) = mlc.pathname
ORDER BY host, mulaExperiment, mulaVariant DESC, pathname;
