-- Migration: Add missing purchase invoice performance indexes
-- Date: 2024-12-19
-- Description: Add performance indexes for PurchaseInvoice and PurchaseInvoiceItem tables

-- Add performance indexes for PurchaseInvoice table
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_supplierId_idx" ON public."PurchaseInvoice" USING btree ("supplierId");
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_createdAt_idx" ON public."PurchaseInvoice" USING btree ("createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_status_idx" ON public."PurchaseInvoice" USING btree (status);
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_updatedAt_idx" ON public."PurchaseInvoice" USING btree ("updatedAt");

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_status_createdAt_idx" ON public."PurchaseInvoice" USING btree (status, "createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_supplierId_status_idx" ON public."PurchaseInvoice" USING btree ("supplierId", status);
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_supplierId_createdAt_idx" ON public."PurchaseInvoice" USING btree ("supplierId", "createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_updatedAt_status_idx" ON public."PurchaseInvoice" USING btree ("updatedAt", status);

-- Add performance indexes for PurchaseInvoiceItem table
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_purchaseInvoiceId_idx" ON public."PurchaseInvoiceItem" USING btree ("purchaseInvoiceId");
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_productId_idx" ON public."PurchaseInvoiceItem" USING btree ("productId");
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_createdAt_idx" ON public."PurchaseInvoiceItem" USING btree ("createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_updatedAt_idx" ON public."PurchaseInvoiceItem" USING btree ("updatedAt");

-- Add composite indexes for purchase invoice items
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_purchaseInvoiceId_productId_idx" ON public."PurchaseInvoiceItem" USING btree ("purchaseInvoiceId", "productId");
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceItem_productId_createdAt_idx" ON public."PurchaseInvoiceItem" USING btree ("productId", "createdAt");