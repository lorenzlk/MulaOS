-- Grant logan@lorenz.work access to www.on3.com domain
INSERT INTO domain_user_permissions (domain, user_email, role, "isActive", "createdAt", "updatedAt")
VALUES ('www.on3.com', 'logan.lorenz@gmail.com', 'editor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (domain, user_email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

