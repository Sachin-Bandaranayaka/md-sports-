# NeonDB to Supabase Migration Guide

## Overview
This guide will help you migrate your MD Sports inventory management system from NeonDB to Supabase while preserving all your data and maintaining the same database schema.

## Current Database Analysis
- **NeonDB Project**: md-sports-inventory (aged-sun-36987799)
- **Database Tables**: 27 tables including User, Product, Invoice, Customer, etc.
- **Current Data Volume**: 
  - Users: 3
  - Products: 1
  - Invoices: 0
  - Customers: 1

## Migration Steps

### Step 1: Set Up Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Choose your region (preferably close to your users)
4. Note down your project URL and anon key

### Step 2: Export Data from NeonDB
We'll create a comprehensive backup of your current database:

```sql
-- This will be generated automatically by our migration script
pg_dump $NEON_DATABASE_URL > neon_backup.sql
```

### Step 3: Update Environment Variables
Update your `.env.local` file with Supabase credentials:

```env
# Replace with your Supabase database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase specific (optional for additional features)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### Step 4: Schema Migration
Since you're using Prisma, the schema migration is straightforward:

1. Update your database URL in `.env.local`
2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Step 5: Data Migration
Use our automated migration script (see below)

## Migration Benefits

### Why Migrate to Supabase?
1. **Real-time Features**: Built-in real-time subscriptions
2. **Authentication**: Integrated auth system
3. **Storage**: Built-in file storage
4. **Edge Functions**: Serverless functions
5. **Dashboard**: User-friendly admin interface
6. **Pricing**: Generous free tier
7. **Backup**: Automated daily backups

### Supabase Additional Features You Can Use
1. **Row Level Security (RLS)**: Enhanced security
2. **Real-time Subscriptions**: Live updates for inventory
3. **Storage Buckets**: For product images
4. **Edge Functions**: For complex business logic

## Post-Migration Steps

### 1. Enable Row Level Security (Optional)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- Create policies (example for User table)
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT USING (auth.uid()::text = id);
```

### 2. Set Up Real-time (Optional)
```sql
-- Enable real-time for inventory updates
ALTER PUBLICATION supabase_realtime ADD TABLE "Product";
ALTER PUBLICATION supabase_realtime ADD TABLE "InventoryItem";
```

### 3. Configure Storage (Optional)
```sql
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
```

## Rollback Plan
If you need to rollback to NeonDB:
1. Keep your NeonDB project active during migration
2. Update `.env.local` back to NeonDB URL
3. Redeploy your application

## Testing Checklist
After migration, test these features:
- [ ] User authentication
- [ ] Product management
- [ ] Invoice creation
- [ ] Inventory tracking
- [ ] Reports generation
- [ ] Dashboard functionality

## Support
If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify database connections
3. Ensure all environment variables are correct
4. Test with a small dataset first

---

**Next**: Run the automated migration script to begin the process.