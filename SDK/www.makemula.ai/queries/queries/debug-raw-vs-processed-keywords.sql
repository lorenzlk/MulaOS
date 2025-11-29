-- Debug Raw vs Processed Keywords
-- Description: Compare raw keyword strings with parsed keywords
-- Parameters: none
-- Output: comparison of raw and parsed data

WITH raw_keywords AS (
  SELECT
    properties['article_keywords'] AS raw_keywords_string,
    COUNT(*) AS count
  FROM mula.webtag_logs
  WHERE
    properties['eventName'] != 'bot_view'
    AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
    AND properties['host'] = 'twsn.net'
    AND properties['article_keywords'] IS NOT NULL
    AND properties['article_keywords'] != ''
    AND properties['article_keywords'] != 'null'
  GROUP BY properties['article_keywords']
),

parsed_keywords AS (
  SELECT
    raw_keywords_string,
    count,
    CAST(json_extract(raw_keywords_string, '$') AS ARRAY<VARCHAR>) AS parsed_array
  FROM raw_keywords
)

SELECT
  raw_keywords_string,
  count,
  parsed_array,
  CASE 
    WHEN parsed_array IS NOT NULL THEN 'Parsed Successfully'
    ELSE 'Failed to Parse'
  END AS parse_status
FROM parsed_keywords
ORDER BY count DESC
LIMIT 20;

