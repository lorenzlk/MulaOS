-- Debug Article Sections for twsn.net
-- Description: Check if article_section data exists for twsn.net
-- Parameters: none
-- Output: sample article section data

SELECT
  properties['article_section'] AS article_section,
  properties['pathname'] AS pathname,
  COUNT(*) AS event_count
FROM mula.webtag_logs
WHERE
  properties['eventName'] != 'bot_view'
  AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
  AND properties['host'] = 'twsn.net'
  AND properties['article_section'] IS NOT NULL
  AND properties['article_section'] != ''
  AND properties['article_section'] != 'null'
GROUP BY properties['article_section'], properties['pathname']
ORDER BY event_count DESC
LIMIT 20;

