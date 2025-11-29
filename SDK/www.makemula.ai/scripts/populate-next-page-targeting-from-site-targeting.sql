-- SQL Script to populate next_page_targeting records from site_targeting records
-- Based on the 10 SiteTargeting records for www.on3.com
-- 
-- Usage: Run this script in your Heroku database to create NextPageTargeting records
-- 
-- Note: Update the channelId and channelName values below to match your Slack channel
--       You can find these by running: SELECT id, channelId, channelName FROM site_targeting WHERE topLevelDomain = 'www.on3.com' LIMIT 1;

-- Set default values (update these if needed)
-- You can get channelId and channelName from an existing site_targeting record:
-- SELECT channelId, channelName FROM site_targeting WHERE id = 171;
DO $$
DECLARE
    default_channel_id TEXT := 'C0000000000';  -- UPDATE THIS with actual channelId from site_targeting
    default_channel_name TEXT := '#proj-mula-on3';  -- UPDATE THIS with actual channelName from site_targeting
    now_timestamp TIMESTAMP := NOW();
BEGIN
    -- Insert NextPageTargeting records based on SiteTargeting records
    -- Using WHERE NOT EXISTS to avoid duplicates
    
    -- Penn State Nittany Lions
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/penn-state-nittany-lions/news',
        'teams-penn-state-nittany-lions-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-penn-state-nittany-lions-news'
    );
    
    -- LSU Tigers
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/lsu-tigers/news',
        'teams-lsu-tigers-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-lsu-tigers-news'
    );
    
    -- Florida Gators
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/florida-gators/news',
        'teams-florida-gators-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-florida-gators-news'
    );
    
    -- Ole Miss Rebels
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/ole-miss-rebels/',
        'teams-ole-miss-rebels', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-ole-miss-rebels'
    );
    
    -- NC State Wolfpack
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/nc-state-wolfpack/news',
        'teams-nc-state-wolfpack-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-nc-state-wolfpack-news'
    );
    
    -- USC Trojans
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/usc-trojans/news',
        'teams-usc-trojans-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-usc-trojans-news'
    );
    
    -- Notre Dame Fighting Irish
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/notre-dame-fighting-irish/news/',
        'teams-notre-dame-fighting-irish-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-notre-dame-fighting-irish-news'
    );
    
    -- Auburn Tigers
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/auburn-tigers/news/',
        'teams-auburn-tigers-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-auburn-tigers-news'
    );
    
    -- Ohio State Buckeyes
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/ohio-state-buckeyes/news',
        'teams-ohio-state-buckeyes-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-ohio-state-buckeyes-news'
    );
    
    -- Michigan Wolverines
    INSERT INTO next_page_targeting (
        "topLevelDomain", "targetingType", "targetingValue", "sectionName",
        "lookbackDays", "limit", "channelId", "channelName", "createdAt", "updatedAt"
    )
    SELECT 
        'www.on3.com', 'path_substring', '/teams/michigan-wolverines/news/',
        'teams-michigan-wolverines-news', 7, 20,
        default_channel_id, default_channel_name, now_timestamp, now_timestamp
    WHERE NOT EXISTS (
        SELECT 1 FROM next_page_targeting WHERE "sectionName" = 'teams-michigan-wolverines-news'
    );
    
    RAISE NOTICE 'Successfully inserted/updated next_page_targeting records for www.on3.com';
END $$;

-- Verify the inserts
SELECT 
    id,
    "topLevelDomain",
    "targetingType",
    "targetingValue",
    "sectionName",
    "lookbackDays",
    "limit",
    "channelName",
    "createdAt"
FROM next_page_targeting
WHERE "topLevelDomain" = 'www.on3.com'
ORDER BY id;

