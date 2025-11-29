-- All events grouped and counted by name
-- Parameters: {{days_back}} (default: 30)

SELECT 
    properties['eventName'] as event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT properties['sessionId']) as unique_sessions,
    COUNT(DISTINCT properties['host']) as unique_hosts,
    MIN(datehour) as earliest_event,
    MAX(datehour) as latest_event
FROM mula.webtag_logs
WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['eventName'] IS NOT NULL
    AND properties['host'] NOT LIKE '%localhost%'
GROUP BY properties['eventName']
ORDER BY event_count DESC
