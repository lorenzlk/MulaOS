-- Test Store Clicks Query
-- Description: Checks if mula_store_click events exist in the data
-- Parameters: none
-- Output: count of store click events

SELECT 
  properties['eventName'] as event_name,
  count(*) as event_count
FROM mula.webtag_logs
WHERE properties['eventName'] = 'mula_store_click'
GROUP BY properties['eventName']; 