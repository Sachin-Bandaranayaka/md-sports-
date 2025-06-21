#!/usr/bin/env node

/**
 * NeonDB to Supabase Migration Script (Prisma-based)
 * 
 * This script uses Prisma to export data without requiring pg_dump
 * 
 * Usage:
 * node scripts/migrate-to-supabase-prisma.js [options]
 * 
 * Options:
 * --export-only    Only export data from NeonDB
 * --dry-run        Show what would be done without executing
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

class PrismaMigrationTool {
    constructor() {
        this.prisma = new PrismaClient();
        this.backupDir = path.join(__dirname, '..', 'migration-backup');
        this.dataFile = path.join(this.backupDir, `neon-data-${Date.now()}.json`);
        this.sqlFile = path.join(this.backupDir, `neon-data-${Date.now()}.sql`);
        
        // Ensure backup directory exists
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async validateEnvironment() {
        console.log('🔍 Validating environment...');
        
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL not found in environment variables');
        }
        
        if (!dbUrl.includes('neon.tech')) {
            console.warn('⚠️  DATABASE_URL does not appear to be a Neon database');
        }
        
        try {
            await this.prisma.$connect();
            console.log('✅ Database connection successful');
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
        
        console.log('✅ Environment validation passed');
    }

    async exportSchema() {
        console.log('📋 Exporting database schema using Prisma...');
        
        try {
            // Get schema information from information_schema
            const tables = await this.prisma.$queryRaw`
                SELECT 
                    table_name,
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name NOT LIKE '_prisma%'
                ORDER BY table_name, ordinal_position
            `;
            
            const constraints = await this.prisma.$queryRaw`
                SELECT 
                    tc.table_name,
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                LEFT JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                LEFT JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.table_schema = 'public'
                AND tc.table_name NOT LIKE '_prisma%'
                ORDER BY tc.table_name, tc.constraint_name
            `;
            
            const schemaInfo = {
                tables,
                constraints,
                exportedAt: new Date().toISOString(),
                source: 'NeonDB via Prisma'
            };
            
            const schemaFile = path.join(this.backupDir, 'schema-info.json');
            fs.writeFileSync(schemaFile, JSON.stringify(schemaInfo, null, 2));
            console.log(`✅ Schema information exported to: ${schemaFile}`);
            
            return schemaFile;
        } catch (error) {
            console.error('❌ Schema export failed:', error.message);
            throw error;
        }
    }

    async exportData() {
        console.log('📦 Exporting database data...');
        
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                source: 'NeonDB',
                tool: 'Prisma Migration Script'
            },
            data: {}
        };
        
        try {
            // Define tables in dependency order (to avoid foreign key issues during import)
            const tables = [
                { name: 'Role', model: 'role' },
                { name: 'Permission', model: 'permission' },
                { name: 'Shop', model: 'shop' },
                { name: 'User', model: 'user' },
                { name: 'RefreshToken', model: 'refreshToken' },
                { name: 'Category', model: 'category' },
                { name: 'Supplier', model: 'supplier' },
                { name: 'Customer', model: 'customer' },
                { name: 'Product', model: 'product' },
                { name: 'InventoryItem', model: 'inventoryItem' },
                { name: 'Account', model: 'account' },
                { name: 'Invoice', model: 'invoice' },
                { name: 'InvoiceItem', model: 'invoiceItem' },
                { name: 'PurchaseInvoice', model: 'purchaseInvoice' },
                { name: 'PurchaseInvoiceItem', model: 'purchaseInvoiceItem' },
                { name: 'Quotation', model: 'quotation' },
                { name: 'QuotationItem', model: 'quotationItem' },
                { name: 'Receipt', model: 'receipt' },
                { name: 'Payment', model: 'payment' },
                { name: 'Transaction', model: 'transaction' },
                { name: 'InventoryTransfer', model: 'inventoryTransfer' },
                { name: 'TransferItem', model: 'transferItem' },
                { name: 'Notification', model: 'notification' },
                { name: 'AuditLog', model: 'auditLog' },
                { name: 'SystemSettings', model: 'systemSettings' },
                { name: '_PermissionToRole', model: null } // Many-to-many relation table
            ];

            let totalRecords = 0;
            
            for (const table of tables) {
                try {
                    let data = [];
                    
                    if (table.model && this.prisma[table.model]) {
                        data = await this.prisma[table.model].findMany();
                    } else if (table.name === '_PermissionToRole') {
                        // Handle many-to-many relation table
                        data = await this.prisma.$queryRaw`SELECT * FROM "_PermissionToRole"`;
                    }
                    
                    exportData.data[table.name] = data;
                    totalRecords += data.length;
                    console.log(`  ✅ ${table.name}: ${data.length} records`);
                } catch (error) {
                    console.log(`  ⚠️  ${table.name}: Error - ${error.message}`);
                    exportData.data[table.name] = [];
                }
            }
            
            // Save as JSON
            fs.writeFileSync(this.dataFile, JSON.stringify(exportData, null, 2));
            console.log(`✅ JSON data exported to: ${this.dataFile}`);
            console.log(`📊 Total records exported: ${totalRecords}`);
            
            // Generate SQL INSERT statements
            await this.generateSQLInserts(exportData.data);
            
            return this.dataFile;
        } catch (error) {
            console.error('❌ Data export failed:', error.message);
            throw error;
        }
    }

    async generateSQLInserts(data) {
        console.log('📝 Generating SQL INSERT statements...');
        
        let sqlContent = `-- NeonDB to Supabase Data Migration\n-- Generated on: ${new Date().toISOString()}\n\n`;
        sqlContent += `-- Disable triggers and constraints during import\n`;
        sqlContent += `SET session_replication_role = replica;\n\n`;
        
        for (const [tableName, records] of Object.entries(data)) {
            if (records.length === 0) continue;
            
            sqlContent += `-- Importing ${tableName} (${records.length} records)\n`;
            
            for (const record of records) {
                const columns = Object.keys(record);
                const values = columns.map(col => {
                    const value = record[col];
                    if (value === null) return 'NULL';
                    if (typeof value === 'string') {
                        return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
                    }
                    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                    if (value instanceof Date) return `'${value.toISOString()}'`;
                    if (Array.isArray(value)) return `'{${value.join(',')}}'`;
                    return value;
                });
                
                sqlContent += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
            }
            
            sqlContent += `\n`;
        }
        
        sqlContent += `-- Re-enable triggers and constraints\n`;
        sqlContent += `SET session_replication_role = DEFAULT;\n\n`;
        sqlContent += `-- Update sequences to current max values\n`;
        
        // Add sequence updates for auto-increment fields
        const sequenceUpdates = [
            `SELECT setval('"Notification_id_seq"', COALESCE((SELECT MAX(id) FROM "Notification"), 1));`,
            `SELECT setval('"AuditLog_id_seq"', COALESCE((SELECT MAX(id) FROM "AuditLog"), 1));`,
            // Add more sequences as needed
        ];
        
        for (const update of sequenceUpdates) {
            sqlContent += `${update}\n`;
        }
        
        fs.writeFileSync(this.sqlFile, sqlContent);
        console.log(`✅ SQL INSERT statements generated: ${this.sqlFile}`);
    }

    async generateMigrationReport() {
        console.log('📊 Generating migration report...');
        
        const reportFile = path.join(this.backupDir, 'migration-report.md');
        const report = `# Migration Report\n\n## Export Details\n- **Date**: ${new Date().toISOString()}\n- **Source**: NeonDB\n- **Method**: Prisma-based export\n- **JSON File**: ${path.basename(this.dataFile)}\n- **SQL File**: ${path.basename(this.sqlFile)}\n\n## Files Created\n1. \`schema-info.json\` - Database schema information\n2. \`${path.basename(this.dataFile)}\` - Complete data export (JSON)\n3. \`${path.basename(this.sqlFile)}\` - SQL INSERT statements\n4. \`migration-report.md\` - This report\n\n## Next Steps\n\n### 1. Set up Supabase Project\n1. Go to [Supabase Dashboard](https://supabase.com/dashboard)\n2. Create a new project\n3. Note your project URL and database password\n\n### 2. Update Environment\n1. Copy \`.env.supabase.example\` to \`.env.local\`\n2. Update with your Supabase credentials\n\n### 3. Deploy Schema\n\`\`\`bash\nnpx prisma migrate deploy\n\`\`\`\n\n### 4. Import Data\n\`\`\`bash\n# Using psql (if available)\npsql "$DATABASE_URL" < ${path.basename(this.sqlFile)}\n\n# Or using the verification script\nnode scripts/import-to-supabase.js\n\`\`\`\n\n### 5. Verify Migration\n\`\`\`bash\nnode scripts/verify-migration.js\n\`\`\`\n\n## Rollback Plan\nKeep your NeonDB project active until migration is verified.\nTo rollback: Update \`DATABASE_URL\` back to NeonDB URL.\n\n---\n*Generated by Prisma Migration Tool*\n`;
        
        fs.writeFileSync(reportFile, report);
        console.log(`✅ Migration report created: ${reportFile}`);
    }

    async run(options = {}) {
        try {
            console.log('🚀 Starting NeonDB to Supabase migration (Prisma-based)...');
            console.log('=' .repeat(60));
            
            await this.validateEnvironment();
            
            if (!options.importOnly) {
                await this.exportSchema();
                await this.exportData();
                await this.generateMigrationReport();
            }
            
            console.log('\n' + '=' .repeat(60));
            console.log('✅ Migration export completed successfully!');
            console.log('\n📁 Files created in:', this.backupDir);
            console.log('\n📖 Next steps:');
            console.log('1. Set up your Supabase project');
            console.log('2. Copy .env.supabase.example to .env.local and update credentials');
            console.log('3. Run: npx prisma migrate deploy');
            console.log('4. Import data using the generated SQL file');
            console.log('5. Run: node scripts/verify-migration.js');
            console.log('\n📚 See NEON_TO_SUPABASE_MIGRATION.md for detailed instructions');
            
        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            process.exit(1);
        } finally {
            await this.prisma.$disconnect();
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
    
    const migrationTool = new PrismaMigrationTool();
    migrationTool.run(options);
}

module.exports = PrismaMigrationTool;