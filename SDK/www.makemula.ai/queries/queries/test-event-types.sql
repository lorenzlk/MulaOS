-- Test Event Types Query
-- Description: Shows all event types and their counts in the webtag_logs table
-- Parameters: none
-- Output: event types and counts

SELECT 
  properties['eventName'] as event_name,
  count(*) as event_count
FROM mula.webtag_logs
WHERE properties['eventName'] IS NOT NULL
GROUP BY properties['eventName']
ORDER BY event_count DESC; 