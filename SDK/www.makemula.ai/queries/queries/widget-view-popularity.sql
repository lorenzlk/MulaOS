-- Widget View Popularity Analytics
-- Description: Finds the most popular host & pathnames receiving mula_widget_view events in the past 3 hours, grouped by product_src
-- Parameters: hours_back (default: 3)
-- Output: product_src, host, pathname, view_count

SELECT
  COALESCE(properties['product_src'], 'unknown') AS product_src,
  properties['host'] AS host,
  properties['pathname'] AS pathname,
  count(*) AS view_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_widget_view'
  AND properties['host'] IS NOT NULL
  AND properties['host'] NOT LIKE '%localhost%'
  AND properties['pathname'] IS NOT NULL
  AND datehour >= date_format(current_timestamp - interval '3' hour, '%Y/%m/%d/%H')
GROUP BY 
  COALESCE(properties['product_src'], 'unknown'),
  properties['host'], 
  properties['pathname']
ORDER BY 
  product_src,
  view_count DESC,
  host,
  pathname; 