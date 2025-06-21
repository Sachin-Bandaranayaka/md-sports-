# Purchase Invoice Permissions Implementation Guide

## Overview
This guide explains the implementation of granular permissions for purchase invoice operations and the addition of missing database indexes for optimal performance.

## Files Created

### 1. Permission Migration
**File:** `prisma/migrations/add_purchase_invoice_permissions.sql`

Adds the following new permissions:
- `purchase_invoice:view` - View purchase invoices
- `purchase_invoice:create` - Create new purchase invoices
- `purchase_invoice:update` - Update existing purchase invoices
- `purchase_invoice:delete` - Delete purchase invoices
- `purchase_invoice:manage` - Full management of purchase invoices
- `purchase_invoice_item:view` - View purchase invoice items
- `purchase_invoice_item:create` - Create purchase invoice items
- `purchase_invoice_item:update` - Update purchase invoice items
- `purchase_invoice_item:delete` - Delete purchase invoice items
- `supplier:create` - Create new suppliers (if not exists)
- `supplier:update` - Update supplier information (if not exists)
- `supplier:delete` - Delete suppliers (if not exists)
- `supplier:manage` - Full supplier management (if not exists)

### 2. Database Indexes Migration
**File:** `prisma/migrations/add_purchase_invoice_indexes.sql`

Adds performance indexes for:

**PurchaseInvoice table:**
- `supplierId` (foreign key lookups)
- `createdAt` (date-based filtering)
- `status` (status filtering)
- `updatedAt` (recent changes)
- Composite indexes for common query patterns

**PurchaseInvoiceItem table:**
- `purchaseInvoiceId` (foreign key relationship)
- `productId` (product-based queries)
- `createdAt` and `updatedAt` (temporal queries)
- Composite indexes for complex queries

## Implementation Steps

### Step 1: Apply Database Migrations
```bash
# Apply the permissions migration
psql -d your_database -f prisma/migrations/add_purchase_invoice_permissions.sql

# Apply the indexes migration
psql -d your_database -f prisma/migrations/add_purchase_invoice_indexes.sql
```

### Step 2: Update Permission Checks in Components

Update the following files to use the new granular permissions:

#### Purchase List Components
- `src/components/purchases/PurchaseListClient.tsx`
- `src/components/purchases/PurchaseListClientOptimized.tsx`

Add permission checks:
```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { hasPermission } = usePermissions();

// Check permissions before rendering actions
const canViewPurchaseInvoices = hasPermission('purchase_invoice:view');
const canCreatePurchaseInvoices = hasPermission('purchase_invoice:create');
const canUpdatePurchaseInvoices = hasPermission('purchase_invoice:update');
const canDeletePurchaseInvoices = hasPermission('purchase_invoice:delete');
```

#### Purchase Form Components
- `src/components/purchases/NewPurchaseInvoiceForm.tsx`
- `src/components/purchases/EditPurchaseInvoiceForm.tsx`
- `src/components/purchases/PurchaseInvoiceFormOptimized.tsx`

Add permission validation:
```typescript
// In form components, check create/update permissions
if (mode === 'create' && !hasPermission('purchase_invoice:create')) {
  return <div>You don't have permission to create purchase invoices.</div>;
}

if (mode === 'edit' && !hasPermission('purchase_invoice:update')) {
  return <div>You don't have permission to update purchase invoices.</div>;
}
```

#### API Route Protection
- `src/app/api/purchases/route.ts`
- `src/app/api/purchases/[id]/route.ts`
- `src/app/api/purchases/optimized/route.ts`

Add middleware or permission checks:
```typescript
import { checkPermission } from '@/lib/auth/permissions';

// In GET endpoints
if (!await checkPermission(req, 'purchase_invoice:view')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}

// In POST endpoints
if (!await checkPermission(req, 'purchase_invoice:create')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}

// In PUT endpoints
if (!await checkPermission(req, 'purchase_invoice:update')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}

// In DELETE endpoints
if (!await checkPermission(req, 'purchase_invoice:delete')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

### Step 3: Update Role Assignments

Assign the new permissions to appropriate roles:

```sql
-- Example: Assign permissions to Manager role
INSERT INTO "RolePermission" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT 
  r.id as "roleId",
  p.id as "permissionId",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'Manager'
AND p.name IN (
  'purchase_invoice:view',
  'purchase_invoice:create',
  'purchase_invoice:update',
  'purchase_invoice:delete',
  'supplier:view',
  'supplier:create',
  'supplier:update'
);

-- Example: Assign view-only permissions to Employee role
INSERT INTO "RolePermission" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT 
  r.id as "roleId",
  p.id as "permissionId",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'Employee'
AND p.name IN (
  'purchase_invoice:view',
  'supplier:view'
);
```

## Benefits

### Security Improvements
- **Granular Access Control**: Fine-grained permissions for different purchase invoice operations
- **Principle of Least Privilege**: Users only get the minimum permissions needed
- **Audit Trail**: Clear permission structure for compliance and auditing

### Performance Improvements
- **Faster Queries**: Indexes on frequently queried columns (supplierId, status, dates)
- **Optimized Joins**: Foreign key indexes improve join performance
- **Composite Indexes**: Support for complex filtering scenarios

### Expected Performance Gains
- **Supplier-based filtering**: 10-100x faster with supplierId index
- **Status filtering**: 5-50x faster with status index
- **Date range queries**: 10-100x faster with createdAt/updatedAt indexes
- **Complex filters**: 5-20x faster with composite indexes

## Testing

After implementation, test the following scenarios:

1. **Permission Enforcement**:
   - Users without permissions cannot access purchase invoice features
   - API endpoints return 403 for unauthorized access
   - UI elements are hidden/disabled based on permissions

2. **Performance Validation**:
   - Run EXPLAIN ANALYZE on common purchase invoice queries
   - Verify indexes are being used
   - Monitor query execution times

3. **Functional Testing**:
   - Create, read, update, delete operations work correctly
   - Role-based access works as expected
   - No regression in existing functionality

## Migration Rollback

If needed, rollback can be performed:

```sql
-- Remove permissions
DELETE FROM "Permission" WHERE name LIKE 'purchase_invoice%' OR name LIKE 'supplier:%';

-- Remove indexes
DROP INDEX IF EXISTS "PurchaseInvoice_supplierId_idx";
DROP INDEX IF EXISTS "PurchaseInvoice_createdAt_idx";
-- ... (drop all created indexes)
```

## Next Steps

1. Apply the database migrations
2. Update components with permission checks
3. Configure role assignments
4. Test thoroughly
5. Monitor performance improvements
6. Update documentation and training materials