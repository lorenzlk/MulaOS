-- Site Taxonomy Analysis Query
-- Description: Analyzes site structure and content organization by extracting URL path taxonomy and JSON-LD article sections
-- Parameters: domain (required), days_back (default: 7)
-- Output: URL path structure (up to 3 levels), article sections, unique session counts, and targeting opportunities

WITH page_views AS (
  SELECT
    properties['host'] AS host,
    properties['pathname'] AS pathname,
    COUNT(DISTINCT properties['sessionId']) AS unique_sessions
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] = 'page_view'
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['host'] = '{{domain}}'
    AND properties['host'] NOT LIKE '%localhost%'
    AND properties['pathname'] IS NOT NULL
    AND properties['pathname'] != '/'
    AND properties['pathname'] != ''
    AND properties['pathname'] NOT LIKE '/wp-%'
    AND properties['pathname'] NOT LIKE '/admin%'
    AND properties['pathname'] NOT LIKE '/assets%'
    AND properties['pathname'] NOT LIKE '/css%'
    AND properties['pathname'] NOT LIKE '/js%'
    AND properties['pathname'] NOT LIKE '/images%'
    AND properties['pathname'] NOT LIKE '/api%'
    AND properties['pathname'] NOT LIKE '/%/%/%/%/%'
    AND properties['pathname'] NOT LIKE '/2024/%'
    AND properties['pathname'] NOT LIKE '/2023/%'
    AND properties['pathname'] NOT LIKE '/2022/%'
    AND properties['pathname'] NOT LIKE '/2021/%'
    AND properties['pathname'] NOT LIKE '/2020/%'
    AND properties['sessionId'] IS NOT NULL
    AND properties['sessionId'] != ''
  GROUP BY properties['host'], properties['pathname']
),

article_sections_raw AS (
  SELECT
    properties['host'] AS host,
    properties['pathname'] AS pathname,
    properties['article_section'] AS article_section,
    COUNT(DISTINCT properties['sessionId']) AS event_count
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] != 'bot_view'
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['host'] = '{{domain}}'
    AND properties['article_section'] IS NOT NULL
    AND properties['article_section'] != ''
    AND properties['article_section'] != 'null'
    AND properties['sessionId'] IS NOT NULL
    AND properties['sessionId'] != ''
  GROUP BY properties['host'], properties['pathname'], properties['article_section']
),

url_taxonomy AS (
  SELECT
    host,
    pathname,
    unique_sessions,
    CASE 
      WHEN split_part(ltrim(pathname, '/'), '/', 1) != '' 
      THEN split_part(ltrim(pathname, '/'), '/', 1)
      ELSE NULL 
    END AS level1,
    CASE 
      WHEN split_part(ltrim(pathname, '/'), '/', 2) != '' 
      THEN split_part(ltrim(pathname, '/'), '/', 2)
      ELSE NULL 
    END AS level2,
    CASE 
      WHEN split_part(ltrim(pathname, '/'), '/', 3) != '' 
      THEN split_part(ltrim(pathname, '/'), '/', 3)
      ELSE NULL 
    END AS level3
  FROM page_views
  WHERE pathname != '/'
),

url_taxonomy_aggregated AS (
  SELECT
    host,
    level1,
    level2,
    level3,
    SUM(unique_sessions) AS total_views,
    COUNT(DISTINCT pathname) AS unique_paths
  FROM url_taxonomy
  WHERE level1 IS NOT NULL
  GROUP BY host, level1, level2, level3
),

url_hierarchy AS (
  SELECT
    host,
    level1,
    level2,
    level3,
    total_views,
    unique_paths,
    CASE 
      WHEN level3 IS NOT NULL THEN CONCAT('/', level1, '/', level2, '/', level3, '/')
      WHEN level2 IS NOT NULL THEN CONCAT('/', level1, '/', level2, '/')
      ELSE CONCAT('/', level1, '/')
    END AS display_path,
    CASE 
      WHEN level3 IS NOT NULL THEN 3
      WHEN level2 IS NOT NULL THEN 2
      ELSE 1
    END AS hierarchy_level
  FROM url_taxonomy_aggregated
),

article_sections AS (
  SELECT
    host,
    article_section AS category,
    SUM(event_count) AS total_views,
    COUNT(DISTINCT pathname) AS unique_paths
  FROM article_sections_raw
  GROUP BY host, article_section
),

article_keywords_raw AS (
  SELECT
    properties['host'] AS host,
    properties['pathname'] AS pathname,
    properties['article_keywords'] AS article_keywords,
    COUNT(DISTINCT properties['sessionId']) AS event_count
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] != 'bot_view'
    AND datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['host'] = '{{domain}}'
    AND properties['article_keywords'] IS NOT NULL
    AND properties['article_keywords'] != ''
    AND properties['article_keywords'] != 'null'
    AND properties['sessionId'] IS NOT NULL
    AND properties['sessionId'] != ''
  GROUP BY properties['host'], properties['pathname'], properties['article_keywords']
),

article_keywords_unnested AS (
  SELECT
    host,
    pathname,
    keyword,
    event_count
  FROM article_keywords_raw
  CROSS JOIN UNNEST(CAST(json_extract(article_keywords, '$') AS ARRAY<VARCHAR>)) AS t(keyword)
  WHERE CAST(json_extract(article_keywords, '$') AS ARRAY<VARCHAR>) IS NOT NULL
),

article_keywords AS (
  SELECT
    host,
    keyword AS category,
    SUM(event_count) AS total_views,
    COUNT(DISTINCT pathname) AS unique_paths
  FROM article_keywords_unnested
  GROUP BY host, keyword
),

targeting_opportunities AS (
  SELECT
    'url_path' AS taxonomy_type,
    host,
    display_path AS taxonomy_value,
    total_views,
    unique_paths,
    hierarchy_level,
    CASE 
      WHEN total_views >= 1000 THEN 'High Reach'
      WHEN total_views >= 500 THEN 'Medium Reach'
      ELSE 'Low Reach'
    END AS reach_category
  FROM (
    SELECT * FROM url_hierarchy
    ORDER BY total_views DESC, hierarchy_level ASC
    LIMIT 20
  )
  
  UNION ALL
  
  SELECT
    'article_section' AS taxonomy_type,
    host,
    category AS taxonomy_value,
    total_views,
    unique_paths,
    0 AS hierarchy_level,
    CASE 
      WHEN total_views >= 1000 THEN 'High Reach'
      WHEN total_views >= 500 THEN 'Medium Reach'
      ELSE 'Low Reach'
    END AS reach_category
  FROM (
    SELECT * FROM article_sections
    ORDER BY total_views DESC
    LIMIT 1000
  )
  
  UNION ALL
  
  SELECT
    'article_keywords' AS taxonomy_type,
    host,
    category AS taxonomy_value,
    total_views,
    unique_paths,
    0 AS hierarchy_level,
    CASE 
      WHEN total_views >= 1000 THEN 'High Reach'
      WHEN total_views >= 500 THEN 'Medium Reach'
      ELSE 'Low Reach'
    END AS reach_category
  FROM (
    SELECT * FROM article_keywords
    ORDER BY total_views DESC
    LIMIT 1000
  )
)

SELECT
  taxonomy_type,
  host,
  taxonomy_value,
  total_views,
  unique_paths,
  hierarchy_level,
  reach_category,
  CASE 
    WHEN total_views >= 1000000 THEN CONCAT(CAST(total_views / 1000000 AS VARCHAR), 'M')
    WHEN total_views >= 1000 THEN CONCAT(CAST(total_views / 1000 AS VARCHAR), 'K')
    ELSE CAST(total_views AS VARCHAR)
  END AS formatted_views,
  CASE 
    WHEN taxonomy_type = 'url_path' AND hierarchy_level = 1 THEN CONCAT('Main category: ', taxonomy_value, ' - High-level content area')
    WHEN taxonomy_type = 'url_path' AND hierarchy_level = 2 THEN CONCAT('Subcategory: ', taxonomy_value, ' - Specific content focus')
    WHEN taxonomy_type = 'url_path' AND hierarchy_level = 3 THEN CONCAT('Detailed section: ', taxonomy_value, ' - Niche content area')
    WHEN taxonomy_type = 'article_section' THEN CONCAT('Content category: ', taxonomy_value, ' - Semantic classification')
    WHEN taxonomy_type = 'article_keywords' THEN CONCAT('Popular keyword: ', taxonomy_value, ' - Content topic tag')
    ELSE 'Unknown taxonomy type'
  END AS targeting_insight
FROM targeting_opportunities
ORDER BY 
  taxonomy_type ASC,
  total_views DESC,
  hierarchy_level ASC
