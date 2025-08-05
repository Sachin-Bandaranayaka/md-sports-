-- Add public invoice link fields to Invoice table
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "publicToken" TEXT,
ADD COLUMN IF NOT EXISTS "publicTokenExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "publicViewCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "publicLastViewedAt" TIMESTAMP;

-- Create index on publicToken for better performance
CREATE INDEX IF NOT EXISTS "Invoice_publicToken_idx" ON "Invoice"("publicToken");

-- Add comments for documentation
COMMENT ON COLUMN "Invoice"."publicToken" IS 'Secure token for public invoice access';
COMMENT ON COLUMN "Invoice"."publicTokenExpiresAt" IS 'Expiration timestamp for public token (60 days from generation)';
COMMENT ON COLUMN "Invoice"."publicViewCount" IS 'Number of times the public invoice has been viewed';
COMMENT ON COLUMN "Invoice"."publicLastViewedAt" IS 'Timestamp of last public view';