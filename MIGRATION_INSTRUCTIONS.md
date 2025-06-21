# How to Apply Purchase Invoice Migrations

## Database Status
Your Supabase database is currently in **read-only mode**, which prevents direct migration application through the MCP server.

## Migration Files Created
1. `prisma/migrations/add_purchase_invoice_permissions.sql` - Adds granular permissions
2. `prisma/migrations/add_purchase_invoice_indexes.sql` - Adds performance indexes

## Application Methods

### Method 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://wcgkldgalyezswksrwud.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Execute them one by one

### Method 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref wcgkldgalyezswksrwud

# Apply migrations
supabase db push
```

### Method 3: Direct SQL Execution
If you have direct database access:
```bash
# Apply permissions migration
psql -h your-db-host -U your-username -d your-database -f prisma/migrations/add_purchase_invoice_permissions.sql

# Apply indexes migration
psql -h your-db-host -U your-username -d your-database -f prisma/migrations/add_purchase_invoice_indexes.sql
```

## Migration Contents

### Permissions Migration
```sql
-- Add granular permissions for purchase invoices
INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") VALUES
('purchase_invoice:view', 'View purchase invoices', NOW(), NOW()),
('purchase_invoice:create', 'Create new purchase invoices', NOW(), NOW()),
('purchase_invoice:update', 'Update existing purchase invoices', NOW(), NOW()),
('purchase_invoice:delete', 'Delete purchase invoices', NOW(), NOW()),
('purchase_invoice:manage', 'Full management of purchase invoices', NOW(), NOW()),
('purchase_invoice_item:view', 'View purchase invoice items', NOW(), NOW()),
('purchase_invoice_item:create', 'Create purchase invoice items', NOW(), NOW()),
('purchase_invoice_item:update', 'Update purchase invoice items', NOW(), NOW()),
('purchase_invoice_item:delete', 'Delete purchase invoice items', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Add supplier permissions if they don't exist
INSERT INTO "Permission" (name, description, "createdAt", "updatedAt") VALUES
('supplier:create', 'Create new suppliers', NOW(), NOW()),
('supplier:update', 'Update supplier information', NOW(), NOW()),
('supplier:delete', 'Delete suppliers', NOW(), NOW()),
('supplier:manage', 'Full supplier management', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
```

### Indexes Migration
```sql
-- Performance indexes for PurchaseInvoice table
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_createdAt_idx" ON "PurchaseInvoice"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_status_idx" ON "PurchaseInvoice"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_updatedAt_idx" ON "PurchaseInvoice"("updatedAt");

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_supplierId_status_idx" ON "PurchaseInvoice"("supplierId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_status_createdAt_idx" ON "PurchaseInvoice"("status", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoice_supplierId_createdAt_idx" ON "PurchaseInvoice"("supplierId", "createdAt");

-- Performance indexes for PurchaseInvoiceItem table
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoiceItem_purchaseInvoiceId_idx" ON "PurchaseInvoiceItem"("purchaseInvoiceId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoiceItem_productId_idx" ON "PurchaseInvoiceItem"("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoiceItem_createdAt_idx" ON "PurchaseInvoiceItem"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoiceItem_updatedAt_idx" ON "PurchaseInvoiceItem"("updatedAt");

-- Composite indexes for PurchaseInvoiceItem
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoiceItem_purchaseInvoiceId_productId_idx" ON "PurchaseInvoiceItem"("purchaseInvoiceId", "productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PurchaseInvoiceItem_productId_createdAt_idx" ON "PurchaseInvoiceItem"("productId", "createdAt");
```

## Verification
After applying the migrations, verify they were successful:

```sql
-- Check permissions were added
SELECT name FROM "Permission" WHERE name LIKE 'purchase_invoice%' OR name LIKE 'supplier:%';

-- Check indexes were created
SELECT indexname FROM pg_indexes WHERE tablename IN ('PurchaseInvoice', 'PurchaseInvoiceItem') AND schemaname = 'public';
```

## Next Steps
1. Apply the migrations using one of the methods above
2. Update your application code to use the new permissions (see PURCHASE_INVOICE_PERMISSIONS_GUIDE.md)
3. Assign permissions to appropriate roles
4. Test the functionality

## Troubleshooting
- If you get permission errors, ensure you have admin access to the database
- If indexes fail to create, check for existing indexes with similar names
- Use `CONCURRENTLY` option for index creation to avoid locking tables in production