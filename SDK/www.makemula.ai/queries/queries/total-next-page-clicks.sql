-- Total count of mula_next_page_click events
-- Parameters: {{days_back}} (default: 30)

SELECT 
    COUNT(*) as total_next_page_clicks,
    COUNT(DISTINCT properties['sessionId']) as unique_sessions_with_clicks,
    COUNT(DISTINCT properties['host']) as unique_hosts,
    MIN(datehour) as earliest_click,
    MAX(datehour) as latest_click
FROM mula.webtag_logs
WHERE datehour >= date_format(current_timestamp - interval '30' day, '%Y/%m/%d/%H')
    AND properties['eventName'] = 'mula_next_page_click'
    AND properties['host'] NOT LIKE '%localhost%'
