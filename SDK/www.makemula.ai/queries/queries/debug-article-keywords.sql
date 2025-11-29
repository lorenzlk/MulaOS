-- Debug Article Keywords for twsn.net
-- Description: Check if article_keywords data exists and what it looks like
-- Parameters: none
-- Output: sample article keywords data

SELECT
  properties['pathname'] AS pathname,
  properties['article_keywords'] AS article_keywords,
  COUNT(*) AS event_count,
  LENGTH(properties['article_keywords']) AS keyword_length
FROM mula.webtag_logs
WHERE
  properties['eventName'] != 'bot_view'
  AND datehour >= date_format(current_timestamp - interval '7' day, '%Y/%m/%d/%H')
  AND properties['host'] = 'twsn.net'
  AND properties['article_keywords'] IS NOT NULL
  AND properties['article_keywords'] != ''
  AND properties['article_keywords'] != 'null'
GROUP BY properties['pathname'], properties['article_keywords']
ORDER BY event_count DESC
LIMIT 20;

