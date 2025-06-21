-- Supabase Post-Migration Setup
-- Run these commands after migrating your data to Supabase
-- to take advantage of Supabase-specific features

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE RLS POLICIES
-- ============================================================================

-- User policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Invoice policies (shop-based access)
CREATE POLICY "Users can view shop invoices" ON "Invoice"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND ("User"."shopId" = "Invoice"."shopId" OR "User"."roleName" = 'admin')
    )
  );

-- Product policies (shop-based access)
CREATE POLICY "Users can view shop products" ON "Product"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND ("User"."shopId" = "Product"."shopId" OR "User"."roleName" = 'admin')
    )
  );

-- ============================================================================
-- 3. ENABLE REAL-TIME SUBSCRIPTIONS
-- ============================================================================

-- Enable real-time for inventory management
ALTER PUBLICATION supabase_realtime ADD TABLE "Product";
ALTER PUBLICATION supabase_realtime ADD TABLE "InventoryItem";
ALTER PUBLICATION supabase_realtime ADD TABLE "Invoice";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
ALTER PUBLICATION supabase_realtime ADD TABLE "InventoryTransfer";

-- ============================================================================
-- 4. CREATE STORAGE BUCKETS
-- ============================================================================

-- Create bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create bucket for invoice documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-documents', 
  'invoice-documents', 
  false, -- private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CREATE STORAGE POLICIES
-- ============================================================================

-- Product images - public read, authenticated write
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own uploaded images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = owner
  );

-- Invoice documents - private access
CREATE POLICY "Users can view shop invoice documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoice-documents'
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND ("User"."roleName" = 'admin' OR "User"."shopId" IS NOT NULL)
    )
  );

-- ============================================================================
-- 6. CREATE USEFUL FUNCTIONS
-- ============================================================================

-- Function to get current user's shop
CREATE OR REPLACE FUNCTION get_current_user_shop()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "shopId" FROM "User" WHERE id = auth.uid()::text;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "roleName" = 'admin' FROM "User" WHERE id = auth.uid()::text;
$$;

-- ============================================================================
-- 7. CREATE TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Function to log changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO "AuditLog" (
    "tableName",
    "recordId",
    "action",
    "userId",
    "changes",
    "timestamp"
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    auth.uid()::text,
    CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for important tables
CREATE TRIGGER audit_product_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER audit_invoice_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Invoice"
  FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER audit_inventory_changes
  AFTER INSERT OR UPDATE OR DELETE ON "InventoryItem"
  FOR EACH ROW EXECUTE FUNCTION log_changes();

-- ============================================================================
-- 8. CREATE VIEWS FOR REPORTING
-- ============================================================================

-- Sales summary view
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  DATE_TRUNC('month', "createdAt") as month,
  "shopId",
  COUNT(*) as invoice_count,
  SUM("total") as total_sales,
  AVG("total") as average_sale
FROM "Invoice"
WHERE "status" = 'paid'
GROUP BY DATE_TRUNC('month', "createdAt"), "shopId";

-- Inventory status view
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
  p."name" as product_name,
  p."sku",
  p."shopId",
  COALESCE(SUM(i."quantity"), 0) as total_quantity,
  p."minStockLevel",
  CASE 
    WHEN COALESCE(SUM(i."quantity"), 0) <= p."minStockLevel" THEN 'Low Stock'
    WHEN COALESCE(SUM(i."quantity"), 0) = 0 THEN 'Out of Stock'
    ELSE 'In Stock'
  END as stock_status
FROM "Product" p
LEFT JOIN "InventoryItem" i ON p.id = i."productId"
GROUP BY p.id, p."name", p."sku", p."shopId", p."minStockLevel";

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to service role (for admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- 10. OPTIMIZATION INDEXES
-- ============================================================================

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_shop_status ON "Invoice"("shopId", "status");
CREATE INDEX IF NOT EXISTS idx_product_shop_active ON "Product"("shopId", "isActive");
CREATE INDEX IF NOT EXISTS idx_inventory_product_shop ON "InventoryItem"("productId", "shopId");
CREATE INDEX IF NOT EXISTS idx_user_shop_role ON "User"("shopId", "roleName");
CREATE INDEX IF NOT EXISTS idx_audit_table_time ON "AuditLog"("tableName", "timestamp");

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify setup
SELECT 'Supabase setup completed successfully!' as status;

-- Show enabled features
SELECT 
  'RLS Enabled' as feature,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND row_security = 'YES'

UNION ALL

SELECT 
  'Storage Buckets' as feature,
  COUNT(*) as table_count
FROM storage.buckets

UNION ALL

SELECT 
  'Real-time Tables' as feature,
  COUNT(*) as table_count
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';