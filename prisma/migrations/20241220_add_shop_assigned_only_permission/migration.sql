-- Migration: Add shop:assigned_only permission
-- This permission is required for shop staff users to restrict their access to only their assigned shop

INSERT INTO "Permission" (id, name, description) 
VALUES (21, 'shop:assigned_only', 'Restricts user access to only their assigned shop')
ON CONFLICT (id) DO NOTHING;

-- Update existing shop staff users to include the shop:assigned_only permission
-- This will fix users created with the shop staff template who are missing this permission
UPDATE "User" 
SET permissions = array_append(permissions, '21')
WHERE permissions @> ARRAY['7']  -- users with inventory:transfer permission
AND NOT permissions @> ARRAY['21']  -- who don't already have shop:assigned_only
AND "roleName" IS NULL;  -- and don't have a specific role name set