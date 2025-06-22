#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CriticalIndexApplier {
  constructor() {
    this.appliedIndexes = [];
    this.failedIndexes = [];
  }

  async applyAllIndexes() {
    console.log('🚀 Applying Critical Database Indexes for Performance Optimization\n');
    console.log('Target: Reduce query times from 140-800ms to <50ms\n');

    // 1. User table indexes (Dashboard Summary Count: 841ms → target: <50ms)
    await this.applyIndexes('User Table', [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_id_btree ON "User" USING btree (id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_btree ON "User" USING btree (email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_btree ON "User" USING btree ("roleId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_shop_btree ON "User" USING btree ("shopId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_btree ON "User" USING btree ("createdAt")'
    ]);

    // 2. Product table indexes (Product Count: 142ms → target: <20ms)
    await this.applyIndexes('Product Table', [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_id_btree ON "Product" USING btree (id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_name_btree ON "Product" USING btree (name)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_category_btree ON "Product" USING btree ("categoryId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_barcode_btree ON "Product" USING btree (barcode)'
    ]);

    // 3. InventoryItem table indexes (Critical: 154ms → target: <30ms)
    await this.applyIndexes('InventoryItem Table (Critical)', [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_btree ON "InventoryItem" USING btree ("productId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_btree ON "InventoryItem" USING btree ("shopId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_quantity_btree ON "InventoryItem" USING btree (quantity)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_updated_btree ON "InventoryItem" USING btree ("updatedAt")',
      // Composite indexes for common query patterns
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_product ON "InventoryItem" USING btree ("shopId", "productId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_quantity_shop ON "InventoryItem" USING btree (quantity, "shopId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_quantity ON "InventoryItem" USING btree ("productId", quantity)'
    ]);

    // 4. Category and Shop indexes
    await this.applyIndexes('Category & Shop Tables', [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_id_btree ON "Category" USING btree (id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_name_btree ON "Category" USING btree (name)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_id_btree ON "Shop" USING btree (id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_name_btree ON "Shop" USING btree (name)'
    ]);

    // 5. Transfer and Invoice indexes (for future optimization)
    await this.applyIndexes('Transfer & Invoice Tables', [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_created_btree ON "InventoryTransfer" USING btree ("createdAt")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_status_btree ON "InventoryTransfer" USING btree (status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_from_shop_btree ON "InventoryTransfer" USING btree ("fromShopId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_to_shop_btree ON "InventoryTransfer" USING btree ("toShopId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_status_created ON "InventoryTransfer" USING btree (status, "createdAt")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_created_btree ON "Invoice" USING btree ("createdAt")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_customer_btree ON "Invoice" USING btree ("customerId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_shop_btree ON "Invoice" USING btree ("shopId")'
    ]);

    // 6. Update table statistics for better query planning
    await this.updateStatistics();

    // 7. Generate performance report
    this.generateReport();
  }

  async applyIndexes(tableName, indexes) {
    console.log(`📊 ${tableName} Indexes:`);
    
    for (const indexSQL of indexes) {
      try {
        const indexName = this.extractIndexName(indexSQL);
        const startTime = Date.now();
        
        await prisma.$executeRawUnsafe(indexSQL);
        
        const duration = Date.now() - startTime;
        console.log(`   ✅ ${indexName}: ${duration}ms`);
        
        this.appliedIndexes.push({
          name: indexName,
          table: tableName,
          duration,
          sql: indexSQL
        });
        
      } catch (error) {
        const indexName = this.extractIndexName(indexSQL);
        
        // Check if index already exists (this is OK)
        if (error.message.includes('already exists') || error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`   ⚠️  ${indexName}: Already exists (OK)`);
          this.appliedIndexes.push({
            name: indexName,
            table: tableName,
            duration: 0,
            sql: indexSQL,
            status: 'exists'
          });
        } else {
          console.log(`   ❌ ${indexName}: ERROR - ${error.message}`);
          this.failedIndexes.push({
            name: indexName,
            table: tableName,
            error: error.message,
            sql: indexSQL
          });
        }
      }
    }
    console.log('');
  }

  extractIndexName(sql) {
    const match = sql.match(/idx_[a-zA-Z_]+/);
    return match ? match[0] : 'unknown_index';
  }

  async updateStatistics() {
    console.log('📈 Updating Table Statistics:');
    
    const tables = ['User', 'Product', 'InventoryItem', 'Category', 'Shop', 'Invoice', 'InventoryTransfer'];
    
    for (const table of tables) {
      try {
        const startTime = Date.now();
        await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
        const duration = Date.now() - startTime;
        console.log(`   ✅ ${table}: ${duration}ms`);
      } catch (error) {
        console.log(`   ❌ ${table}: ERROR - ${error.message}`);
      }
    }
    console.log('');
  }

  generateReport() {
    console.log('📊 CRITICAL INDEX APPLICATION REPORT');
    console.log('====================================\n');

    const successfulIndexes = this.appliedIndexes.length;
    const failedIndexes = this.failedIndexes.length;
    const totalIndexes = successfulIndexes + failedIndexes;

    console.log(`📈 Summary:`);
    console.log(`   Total Indexes: ${totalIndexes}`);
    console.log(`   Successfully Applied: ${successfulIndexes}`);
    console.log(`   Failed: ${failedIndexes}`);
    console.log(`   Success Rate: ${totalIndexes > 0 ? (successfulIndexes / totalIndexes * 100).toFixed(1) : 0}%\n`);

    if (this.failedIndexes.length > 0) {
      console.log('❌ Failed Indexes:');
      this.failedIndexes.forEach(failed => {
        console.log(`   • ${failed.name} (${failed.table}): ${failed.error}`);
      });
      console.log('');
    }

    console.log('🎯 Expected Performance Improvements:');
    console.log('   • Dashboard Summary Count: 841ms → <50ms (94% improvement)');
    console.log('   • Product Count: 142ms → <20ms (86% improvement)');
    console.log('   • Inventory Queries: 154ms → <30ms (81% improvement)');
    console.log('   • Overall Query Performance: 80% slow queries → <20% slow queries');
    console.log('   • Expected LCP Improvement: 17.4s → <3s (83% improvement)\n');

    console.log('🔄 Next Steps:');
    console.log('   1. Run performance test to verify improvements');
    console.log('   2. Monitor query performance in real-time');
    console.log('   3. Apply bundle optimization for TBT reduction');
    console.log('   4. Consider database migration for further gains\n');

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIndexes,
        successfulIndexes,
        failedIndexes,
        successRate: totalIndexes > 0 ? (successfulIndexes / totalIndexes * 100) : 0
      },
      appliedIndexes: this.appliedIndexes,
      failedIndexes: this.failedIndexes,
      expectedImprovements: {
        dashboardSummary: '841ms → <50ms (94% improvement)',
        productCount: '142ms → <20ms (86% improvement)',
        inventoryQueries: '154ms → <30ms (81% improvement)',
        overallQueries: '80% slow → <20% slow',
        lcpImprovement: '17.4s → <3s (83% improvement)'
      }
    };

    require('fs').writeFileSync(
      require('path').join(process.cwd(), 'critical-indexes-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📄 Detailed report saved to: critical-indexes-report.json');
  }
}

async function main() {
  console.log('🔥 CRITICAL PERFORMANCE FIX: Database Indexes\n');
  console.log('Issue: 80% of queries >100ms causing 17.4s LCP');
  console.log('Solution: Apply targeted indexes for immediate improvement\n');
  
  const applier = new CriticalIndexApplier();
  
  try {
    await applier.applyAllIndexes();
  } catch (error) {
    console.error('❌ Critical index application failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { CriticalIndexApplier }; 