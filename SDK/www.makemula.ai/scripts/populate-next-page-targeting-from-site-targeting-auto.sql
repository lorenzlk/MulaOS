-- SQL Script to automatically populate next_page_targeting records from site_targeting records
-- This script reads from site_targeting and creates corresponding next_page_targeting records
-- 
-- Usage: Run this script in your Heroku database
-- It will automatically create NextPageTargeting records for all active SiteTargeting records for www.on3.com

-- Function to generate section name from targeting value (matches JavaScript logic)
CREATE OR REPLACE FUNCTION generate_section_name(targeting_value TEXT)
RETURNS TEXT AS $$
DECLARE
    section TEXT;
BEGIN
    -- Remove leading/trailing slashes and whitespace
    section := TRIM(BOTH '/' FROM TRIM(targeting_value));
    
    -- Replace slashes with hyphens
    section := REPLACE(section, '/', '-');
    
    -- Replace spaces with hyphens
    section := REGEXP_REPLACE(section, '\s+', '-', 'g');
    
    -- Remove special characters except hyphens and alphanumeric
    section := REGEXP_REPLACE(section, '[^a-z0-9-]', '', 'gi');
    
    -- Convert to lowercase
    section := LOWER(section);
    
    -- Remove multiple consecutive hyphens
    section := REGEXP_REPLACE(section, '-+', '-', 'g');
    
    -- Remove leading/trailing hyphens
    section := TRIM(BOTH '-' FROM section);
    
    RETURN section;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Insert NextPageTargeting records from SiteTargeting records
INSERT INTO next_page_targeting (
    "topLevelDomain",
    "targetingType",
    "targetingValue",
    "sectionName",
    "lookbackDays",
    "limit",
    "channelId",
    "channelName",
    "createdAt",
    "updatedAt"
)
SELECT 
    st."topLevelDomain",
    st."targetingType",
    st."targetingValue",
    generate_section_name(st."targetingValue") AS "sectionName",
    7 AS "lookbackDays",  -- Default lookback days
    20 AS "limit",        -- Default limit
    st."channelId",
    st."channelName",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM site_targeting st
WHERE st."topLevelDomain" = 'www.on3.com'
  AND st."deletedAt" IS NULL  -- Only active records
  AND st."targetingType" = 'path_substring'  -- Only path_substring for now
  AND NOT EXISTS (
      -- Skip if section name already exists
      SELECT 1 FROM next_page_targeting npt
      WHERE npt."sectionName" = generate_section_name(st."targetingValue")
  );

-- Clean up the function (optional - you can keep it if you want to reuse it)
DROP FUNCTION IF EXISTS generate_section_name(TEXT);

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

