const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigrations() {
  let prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting manual migration to Supabase...');
    
    // Create _prisma_migrations table first
    console.log('📋 Creating _prisma_migrations table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMP(3),
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP(3),
        "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
      )
    `);
    
    // Read and apply migration files in order
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
    const migrationFolders = fs.readdirSync(migrationsDir)
      .filter(item => fs.statSync(path.join(migrationsDir, item)).isDirectory())
      .sort();
    
    for (const folder of migrationFolders) {
      const migrationPath = path.join(migrationsDir, folder, 'migration.sql');
      
      if (fs.existsSync(migrationPath)) {
        console.log(`📝 Applying migration: ${folder}`);
        
        // Check if migration already applied
        const existing = await prisma.$queryRawUnsafe(`
          SELECT id FROM "_prisma_migrations" WHERE migration_name = '${folder}'
        `);
        
        if (existing.length > 0) {
          console.log(`⏭️  Migration ${folder} already applied, skipping...`);
          continue;
        }
        
        // Read and execute migration SQL
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL into individual statements and execute them
        const statements = migrationSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        const migrationId = require('crypto').randomUUID();
        const startTime = new Date();
        
        try {
          // Execute each statement
          for (const statement of statements) {
            if (statement.trim()) {
              await prisma.$executeRawUnsafe(statement);
            }
          }
          
          // Record successful migration
          await prisma.$executeRawUnsafe(`
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
            VALUES ('${migrationId}', 'manual_migration_checksum', '${new Date().toISOString()}', '${folder}', '${startTime.toISOString()}', ${statements.length})
          `);
          
          console.log(`✅ Migration ${folder} applied successfully`);
          
        } catch (error) {
          console.error(`❌ Error applying migration ${folder}:`, error.message);
          
          // Record failed migration
          await prisma.$executeRawUnsafe(`
            INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count, logs)
            VALUES ('${migrationId}', 'manual_migration_checksum', '${folder}', '${startTime.toISOString()}', 0, '${error.message.replace(/'/g, "''")}')
          `);
          
          throw error;
        }
      }
    }
    
    console.log('🎉 All migrations applied successfully!');
    
    // Verify tables were created
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables created:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

applyMigrations();