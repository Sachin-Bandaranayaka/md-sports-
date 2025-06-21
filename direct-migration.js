const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('🚀 Starting direct migration to Supabase...');
    
    // Create _prisma_migrations table first
    console.log('📋 Creating _prisma_migrations table...');
    await client.query(`
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
    
    console.log(`📁 Found ${migrationFolders.length} migration folders`);
    
    for (const folder of migrationFolders) {
      try {
        console.log(`🔄 Processing migration: ${folder}`);
        
        // Check if migration already applied
        const existing = await client.query(
          'SELECT id FROM "_prisma_migrations" WHERE migration_name = $1',
          [folder]
        );
        
        if (existing.rows.length > 0) {
          console.log(`⏭️  Migration ${folder} already applied, skipping...`);
          continue;
        }
        
        const migrationFile = path.join(migrationsDir, folder, 'migration.sql');
        
        if (!fs.existsSync(migrationFile)) {
          console.log(`⚠️  No migration.sql found in ${folder}, skipping...`);
          continue;
        }
        
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');
        const migrationId = require('crypto').randomUUID();
        const startTime = new Date();
        
        try {
          // Split SQL into individual statements and execute them
          const statements = migrationSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
          
          console.log(`📝 Executing ${statements.length} SQL statements...`);
          
          for (const statement of statements) {
            if (statement.trim()) {
              await client.query(statement);
            }
          }
          
          // Record successful migration
          await client.query(`
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [migrationId, 'manual_migration_checksum', new Date(), folder, startTime, statements.length]);
          
          console.log(`✅ Migration ${folder} applied successfully`);
          
        } catch (error) {
          console.error(`❌ Migration ${folder} failed:`, error.message);
          
          // Record failed migration
          await client.query(`
            INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count, logs)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [migrationId, 'manual_migration_checksum', folder, startTime, 0, error.message]);
          
          throw error;
        }
        
      } catch (error) {
        console.error(`💥 Error processing migration ${folder}:`, error.message);
      }
    }
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables created:', tables.rows.map(t => t.table_name));
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();