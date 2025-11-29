-- Grant jemal@brit.co and matt@brit.co access to www.brit.co domain
-- Using ON CONFLICT to handle existing records gracefully

-- Add jemal@brit.co
INSERT INTO domain_user_permissions (domain, user_email, role, "isActive", "createdAt", "updatedAt")
VALUES ('www.brit.co', 'jemal@brit.co', 'viewer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (domain, user_email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- Add matt@brit.co
INSERT INTO domain_user_permissions (domain, user_email, role, "isActive", "createdAt", "updatedAt")
VALUES ('www.brit.co', 'matt@brit.co', 'viewer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (domain, user_email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- Verify the permissions were added
SELECT domain, user_email, role, "isActive", "createdAt", "updatedAt"
FROM domain_user_permissions
WHERE domain = 'www.brit.co'
ORDER BY user_email;

