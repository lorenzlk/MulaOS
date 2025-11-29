-- Debug Page View Metadata Coverage
-- Description: Check if page_view events have article_section and article_keywords
-- Parameters: none
-- Output: coverage statistics

WITH all_page_views AS (
  SELECT
    COUNT(*) AS total_page_views
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['host'] NOT LIKE '%localhost%'
),

page_views_with_article_section AS (
  SELECT
    COUNT(*) AS page_views_with_section
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['article_section'] IS NOT NULL
    AND properties['article_section'] != ''
    AND properties['article_section'] != 'null'
),

page_views_with_keywords AS (
  SELECT
    COUNT(*) AS page_views_with_keywords
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['article_keywords'] IS NOT NULL
    AND properties['article_keywords'] != ''
    AND properties['article_keywords'] != 'null'
),

page_views_with_either AS (
  SELECT
    COUNT(*) AS page_views_with_either
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['host'] NOT LIKE '%localhost%'
    AND (
      (properties['article_section'] IS NOT NULL AND properties['article_section'] != '' AND properties['article_section'] != 'null')
      OR
      (properties['article_keywords'] IS NOT NULL AND properties['article_keywords'] != '' AND properties['article_keywords'] != 'null')
    )
)

SELECT
  apv.total_page_views,
  pws.page_views_with_section,
  pwk.page_views_with_keywords,
  pwe.page_views_with_either,
  CAST(pws.page_views_with_section AS DOUBLE) / apv.total_page_views * 100 AS percent_with_section,
  CAST(pwk.page_views_with_keywords AS DOUBLE) / apv.total_page_views * 100 AS percent_with_keywords,
  CAST(pwe.page_views_with_either AS DOUBLE) / apv.total_page_views * 100 AS percent_with_either
FROM all_page_views apv
CROSS JOIN page_views_with_article_section pws
CROSS JOIN page_views_with_keywords pwk
CROSS JOIN page_views_with_either pwe;

