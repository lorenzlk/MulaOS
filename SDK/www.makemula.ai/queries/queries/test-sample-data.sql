-- Test Sample Data Query
-- Description: Shows sample data from the webtag_logs table
-- Parameters: none
-- Output: sample records

SELECT 
  timestamp,
  properties['eventName'] as event_name,
  properties['host'] as host,
  properties['pathname'] as pathname,
  properties['searchId'] as search_id
FROM mula.webtag_logs
LIMIT 10; 