-- Search specifically for mula_next_page_click events
-- Parameters: {{days_back}} (default: 30)

SELECT 
    properties['eventName'] as event_name,
    properties['host'] as host,
    properties['sessionId'] as session_id,
    properties['href'] as href,
    datehour
FROM mula.webtag_logs
WHERE datehour >= date_format(current_timestamp - interval '30' day, '%Y/%m/%d/%H')
    AND properties['eventName'] = 'mula_next_page_click'
    AND properties['host'] NOT LIKE '%localhost%'
ORDER BY datehour DESC
LIMIT 100
