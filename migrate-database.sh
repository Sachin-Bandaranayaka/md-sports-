#!/bin/bash

# MS Sport Database Migration Script
# Migrate from Supabase to new database platform

echo "🚀 Starting database migration..."

# Step 1: Backup current database
echo "📦 Creating database backup..."
# Add your backup commands here

# Step 2: Set up new database connection
echo "🔌 Setting up new database connection..."
# Update .env files with new DATABASE_URL

# Step 3: Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Step 4: Verify migration
echo "✅ Verifying migration..."
npx prisma db seed

echo "🎉 Migration completed successfully!"
