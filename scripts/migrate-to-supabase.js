#!/usr/bin/env node

/**
 * NeonDB to Supabase Migration Script
 * 
 * This script helps migrate your MD Sports inventory data from NeonDB to Supabase
 * 
 * Usage:
 * node scripts/migrate-to-supabase.js [options]
 * 
 * Options:
 * --export-only    Only export data from NeonDB
 * --import-only    Only import data to Supabase (requires backup file)
 * --dry-run        Show what would be done without executing
 */

require('dotenv').config({ path: '.env.local' });
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

class MigrationTool {
    constructor() {
        this.neonUrl = process.env.DATABASE_URL;
        this.backupDir = path.join(__dirname, '..', 'migration-backup');
        this.backupFile = path.join(this.backupDir, `neon-backup-${Date.now()}.sql`);
        this.dataFile = path.join(this.backupDir, `neon-data-${Date.now()}.json`);
        
        // Ensure backup directory exists
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async validateEnvironment() {
        console.log('🔍 Validating environment...');
        
        if (!this.neonUrl) {
            throw new Error('DATABASE_URL not found in environment variables');
        }
        
        if (!this.neonUrl.includes('neon.tech')) {
            console.warn('⚠️  DATABASE_URL does not appear to be a Neon database');
        }
        
        console.log('✅ Environment validation passed');
    }

    async exportSchema() {
        console.log('📋 Exporting database schema...');
        
        try {
            const schemaFile = path.join(this.backupDir, 'schema.sql');
            const command = `pg_dump "${this.neonUrl}" --schema-only --no-owner --no-privileges > "${schemaFile}"`;
            
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ Schema exported to: ${schemaFile}`);
            return schemaFile;
        } catch (error) {
            console.error('❌ Schema export failed:', error.message);
            throw error;
        }
    }

    async exportData() {
        console.log('📦 Exporting database data...');
        
        try {
            // Export using pg_dump for complete backup
            const command = `pg_dump "${this.neonUrl}" --data-only --no-owner --no-privileges > "${this.backupFile}"`;
            execSync(command, { stdio: 'inherit' });
            console.log(`✅ Data exported to: ${this.backupFile}`);
            
            // Also export as JSON for easier inspection
            await this.exportDataAsJson();
            
            return this.backupFile;
        } catch (error) {
            console.error('❌ Data export failed:', error.message);
            throw error;
        }
    }

    async exportDataAsJson() {
        console.log('📄 Exporting data as JSON...');
        
        const prisma = new PrismaClient();
        const exportData = {};
        
        try {
            // Export all tables
            const tables = [
                'User', 'Role', 'Permission', 'RefreshToken',
                'Shop', 'Category', 'Product', 'InventoryItem',
                'Customer', 'Supplier', 'Invoice', 'InvoiceItem',
                'PurchaseInvoice', 'PurchaseInvoiceItem',
                'Quotation', 'QuotationItem', 'Receipt',
                'Payment', 'Transaction', 'Account',
                'InventoryTransfer', 'TransferItem',
                'Notification', 'AuditLog', 'SystemSettings'
            ];

            for (const table of tables) {
                try {
                    const modelName = table.charAt(0).toLowerCase() + table.slice(1);
                    if (prisma[modelName]) {
                        const data = await prisma[modelName].findMany();
                        exportData[table] = data;
                        console.log(`  ✅ ${table}: ${data.length} records`);
                    }
                } catch (error) {
                    console.log(`  ⚠️  ${table}: Error - ${error.message}`);
                    exportData[table] = [];
                }
            }
            
            fs.writeFileSync(this.dataFile, JSON.stringify(exportData, null, 2));
            console.log(`✅ JSON data exported to: ${this.dataFile}`);
            
        } catch (error) {
            console.error('❌ JSON export failed:', error.message);
        } finally {
            await prisma.$disconnect();
        }
    }

    async generateMigrationReport() {
        console.log('📊 Generating migration report...');
        
        const reportFile = path.join(this.backupDir, 'migration-report.md');
        const report = `# Migration Report

## Export Details
- **Date**: ${new Date().toISOString()}
- **Source**: NeonDB (${this.neonUrl.split('@')[1]?.split('/')[0] || 'Unknown'})
- **Backup File**: ${path.basename(this.backupFile)}
- **JSON File**: ${path.basename(this.dataFile)}

## Files Created
1. \`schema.sql\` - Database schema
2. \`${path.basename(this.backupFile)}\` - Complete data backup
3. \`${path.basename(this.dataFile)}\` - JSON data export
4. \`migration-report.md\` - This report

## Next Steps
1. Set up your Supabase project
2. Update your \`.env.local\` with Supabase credentials
3. Run \`npx prisma migrate deploy\` to create schema in Supabase
4. Import the data using the provided SQL file

## Import Commands for Supabase
\`\`\`bash
# After setting up Supabase and updating DATABASE_URL
psql "$DATABASE_URL" < schema.sql
psql "$DATABASE_URL" < ${path.basename(this.backupFile)}
\`\`\`

## Verification
After import, verify your data:
\`\`\`bash
node scripts/verify-migration.js
\`\`\`
`;
        
        fs.writeFileSync(reportFile, report);
        console.log(`✅ Migration report created: ${reportFile}`);
    }

    async run(options = {}) {
        try {
            console.log('🚀 Starting NeonDB to Supabase migration...');
            console.log('=' .repeat(50));
            
            await this.validateEnvironment();
            
            if (!options.importOnly) {
                await this.exportSchema();
                await this.exportData();
                await this.generateMigrationReport();
            }
            
            console.log('\n' + '=' .repeat(50));
            console.log('✅ Migration export completed successfully!');
            console.log('\n📁 Files created in:', this.backupDir);
            console.log('\n📖 Next steps:');
            console.log('1. Set up your Supabase project');
            console.log('2. Update .env.local with Supabase DATABASE_URL');
            console.log('3. Run: npx prisma migrate deploy');
            console.log('4. Import data using the generated SQL files');
            console.log('\n📚 See NEON_TO_SUPABASE_MIGRATION.md for detailed instructions');
            
        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

// CLI handling
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        exportOnly: args.includes('--export-only'),
        importOnly: args.includes('--import-only'),
        dryRun: args.includes('--dry-run')
    };
    
    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No actual changes will be made');
        console.log('Would export data from:', process.env.DATABASE_URL);
        process.exit(0);
    }
    
    const migrationTool = new MigrationTool();
    migrationTool.run(options);
}

module.exports = MigrationTool;