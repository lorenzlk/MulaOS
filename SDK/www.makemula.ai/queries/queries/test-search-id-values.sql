-- Test Search ID Values Query
-- Description: Checks if there are any records with non-empty search_id values
-- Parameters: none
-- Output: search_id values and their counts

SELECT 
  properties['search_id'] as search_id,
  count(*) as record_count
FROM mula.webtag_logs
WHERE properties['search_id'] IS NOT NULL
  AND properties['search_id'] != ''
GROUP BY properties['search_id']
ORDER BY record_count DESC
LIMIT 20; 