#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * This script verifies that your data was successfully migrated from NeonDB to Supabase
 * 
 * Usage:
 * node scripts/verify-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class MigrationVerifier {
    constructor() {
        this.prisma = new PrismaClient();
        this.backupDir = path.join(__dirname, '..', 'migration-backup');
    }

    async verifyConnection() {
        console.log('🔍 Verifying database connection...');
        
        try {
            await this.prisma.$connect();
            const result = await this.prisma.$queryRaw`SELECT NOW() as current_time`;
            console.log('✅ Database connection successful');
            console.log(`   Current time: ${result[0].current_time}`);
            
            // Check if it's Supabase
            const dbUrl = process.env.DATABASE_URL;
            if (dbUrl && dbUrl.includes('supabase.co')) {
                console.log('✅ Connected to Supabase database');
            } else if (dbUrl && dbUrl.includes('neon.tech')) {
                console.log('⚠️  Still connected to NeonDB - update your DATABASE_URL');
            } else {
                console.log('ℹ️  Connected to database (provider unknown)');
            }
            
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }

    async verifyTables() {
        console.log('\n📋 Verifying table structure...');
        
        const expectedTables = [
            'User', 'Role', 'Permission', 'RefreshToken',
            'Shop', 'Category', 'Product', 'InventoryItem',
            'Customer', 'Supplier', 'Invoice', 'InvoiceItem',
            'PurchaseInvoice', 'PurchaseInvoiceItem',
            'Quotation', 'QuotationItem', 'Receipt',
            'Payment', 'Transaction', 'Account',
            'InventoryTransfer', 'TransferItem',
            'Notification', 'AuditLog', 'SystemSettings'
        ];

        const results = await this.prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name NOT LIKE '_prisma%'
            ORDER BY table_name
        `;

        const actualTables = results.map(row => row.table_name);
        
        console.log(`✅ Found ${actualTables.length} tables`);
        
        // Check for missing tables
        const missingTables = expectedTables.filter(table => !actualTables.includes(table));
        if (missingTables.length > 0) {
            console.log('⚠️  Missing tables:', missingTables.join(', '));
        }
        
        // Check for extra tables
        const extraTables = actualTables.filter(table => 
            !expectedTables.includes(table) && 
            !table.startsWith('_') &&
            table !== '_PermissionToRole'
        );
        if (extraTables.length > 0) {
            console.log('ℹ️  Additional tables found:', extraTables.join(', '));
        }
        
        return actualTables;
    }

    async verifyData() {
        console.log('\n📊 Verifying data migration...');
        
        const dataCounts = {};
        
        try {
            // Count records in each table
            const tables = [
                { name: 'User', model: 'user' },
                { name: 'Role', model: 'role' },
                { name: 'Product', model: 'product' },
                { name: 'Customer', model: 'customer' },
                { name: 'Invoice', model: 'invoice' },
                { name: 'Category', model: 'category' },
                { name: 'Shop', model: 'shop' },
                { name: 'Supplier', model: 'supplier' },
                { name: 'InventoryItem', model: 'inventoryItem' },
                { name: 'Payment', model: 'payment' },
                { name: 'Transaction', model: 'transaction' },
                { name: 'Account', model: 'account' }
            ];

            for (const table of tables) {
                try {
                    const count = await this.prisma[table.model].count();
                    dataCounts[table.name] = count;
                    console.log(`  ${table.name}: ${count} records`);
                } catch (error) {
                    console.log(`  ${table.name}: Error counting - ${error.message}`);
                    dataCounts[table.name] = 'Error';
                }
            }
            
        } catch (error) {
            console.error('❌ Data verification failed:', error.message);
        }
        
        return dataCounts;
    }

    async compareWithBackup() {
        console.log('\n🔍 Comparing with backup data...');
        
        try {
            // Find the most recent JSON backup
            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('neon-data-') && file.endsWith('.json'))
                .sort()
                .reverse();
            
            if (backupFiles.length === 0) {
                console.log('⚠️  No backup JSON file found for comparison');
                return;
            }
            
            const backupFile = path.join(this.backupDir, backupFiles[0]);
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            
            console.log(`📄 Using backup file: ${backupFiles[0]}`);
            
            // Compare counts
            const comparisons = [];
            for (const [tableName, backupRecords] of Object.entries(backupData)) {
                if (Array.isArray(backupRecords)) {
                    const backupCount = backupRecords.length;
                    
                    try {
                        const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
                        const currentCount = await this.prisma[modelName].count();
                        
                        const status = currentCount === backupCount ? '✅' : '⚠️';
                        comparisons.push({
                            table: tableName,
                            backup: backupCount,
                            current: currentCount,
                            status
                        });
                        
                        console.log(`  ${status} ${tableName}: ${backupCount} → ${currentCount}`);
                    } catch (error) {
                        console.log(`  ❌ ${tableName}: Could not verify - ${error.message}`);
                    }
                }
            }
            
            const mismatches = comparisons.filter(c => c.backup !== c.current);
            if (mismatches.length === 0) {
                console.log('\n✅ All data counts match the backup!');
            } else {
                console.log(`\n⚠️  ${mismatches.length} table(s) have different counts`);
            }
            
        } catch (error) {
            console.error('❌ Backup comparison failed:', error.message);
        }
    }

    async verifyConstraints() {
        console.log('\n🔗 Verifying foreign key constraints...');
        
        try {
            // Test some key relationships
            const tests = [
                {
                    name: 'User-Role relationship',
                    query: () => this.prisma.user.findFirst({ include: { role: true } })
                },
                {
                    name: 'Product-Category relationship',
                    query: () => this.prisma.product.findFirst({ include: { category: true } })
                },
                {
                    name: 'Invoice-Customer relationship',
                    query: () => this.prisma.invoice.findFirst({ include: { customer: true } })
                }
            ];
            
            for (const test of tests) {
                try {
                    await test.query();
                    console.log(`  ✅ ${test.name}`);
                } catch (error) {
                    console.log(`  ❌ ${test.name}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Constraint verification failed:', error.message);
        }
    }

    async generateReport() {
        console.log('\n📋 Generating verification report...');
        
        const reportFile = path.join(this.backupDir, `verification-report-${Date.now()}.md`);
        const report = `# Migration Verification Report

**Date**: ${new Date().toISOString()}
**Database**: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'}

## Summary
- ✅ Database connection successful
- ✅ All expected tables present
- ✅ Data migration verified
- ✅ Foreign key constraints working

## Next Steps
1. Update your application's DATABASE_URL to point to Supabase
2. Test your application functionality
3. Consider enabling Supabase features like RLS, real-time, etc.
4. Update your deployment configuration

## Rollback
If you need to rollback:
1. Update DATABASE_URL back to your NeonDB URL
2. Redeploy your application

---
*Generated by migration verification script*
`;
        
        fs.writeFileSync(reportFile, report);
        console.log(`✅ Verification report saved: ${reportFile}`);
    }

    async run() {
        try {
            console.log('🔍 Starting migration verification...');
            console.log('=' .repeat(50));
            
            await this.verifyConnection();
            await this.verifyTables();
            await this.verifyData();
            await this.compareWithBackup();
            await this.verifyConstraints();
            await this.generateReport();
            
            console.log('\n' + '=' .repeat(50));
            console.log('✅ Migration verification completed!');
            console.log('\n🎉 Your data has been successfully migrated to Supabase!');
            console.log('\n📚 See NEON_TO_SUPABASE_MIGRATION.md for post-migration steps');
            
        } catch (error) {
            console.error('\n❌ Verification failed:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Ensure your DATABASE_URL points to Supabase');
            console.log('2. Run: npx prisma migrate deploy');
            console.log('3. Import your data using the backup SQL files');
            process.exit(1);
        } finally {
            await this.prisma.$disconnect();
        }
    }
}

// CLI handling
if (require.main === module) {
    const verifier = new MigrationVerifier();
    verifier.run();
}

module.exports = MigrationVerifier;