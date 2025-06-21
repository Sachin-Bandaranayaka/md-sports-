-- Migration: Add missing purchase invoice permissions
-- Date: 2024-12-19
-- Description: Add granular permissions for purchase invoice operations

-- Add purchase invoice specific permissions
INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") VALUES 
('purchase_invoice:view', 'View purchase invoices', NOW(), NOW()),
('purchase_invoice:create', 'Create new purchase invoices', NOW(), NOW()),
('purchase_invoice:update', 'Update existing purchase invoices', NOW(), NOW()),
('purchase_invoice:delete', 'Delete purchase invoices', NOW(), NOW()),
('purchase_invoice:manage', 'Full management of purchase invoices', NOW(), NOW());

-- Add purchase invoice item permissions
INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") VALUES 
('purchase_invoice_item:view', 'View purchase invoice items', NOW(), NOW()),
('purchase_invoice_item:create', 'Create purchase invoice items', NOW(), NOW()),
('purchase_invoice_item:update', 'Update purchase invoice items', NOW(), NOW()),
('purchase_invoice_item:delete', 'Delete purchase invoice items', NOW(), NOW());

-- Add supplier management permissions if not exists
INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") 
SELECT 'supplier:create', 'Create new suppliers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE name = 'supplier:create');

INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") 
SELECT 'supplier:update', 'Update supplier information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE name = 'supplier:update');

INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") 
SELECT 'supplier:delete', 'Delete suppliers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE name = 'supplier:delete');

INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") 
SELECT 'supplier:manage', 'Full supplier management', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE name = 'supplier:manage');