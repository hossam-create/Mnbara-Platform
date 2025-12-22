const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the latest migration file
const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
const migrationFolders = fs.readdirSync(migrationsDir)
  .filter(folder => fs.statSync(path.join(migrationsDir, folder)).isDirectory())
  .sort()
  .reverse();

if (migrationFolders.length === 0) {
  console.log('No migration files found');
  process.exit(1);
}

const latestMigration = migrationFolders[0];
const migrationFile = path.join(migrationsDir, latestMigration, 'migration.sql');

console.log(`Applying migration: ${latestMigration}`);

// Read the SQL content
const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log('Migration SQL content loaded');

// Execute the SQL against PostgreSQL using Node.js client
console.log('Executing migration against PostgreSQL database...');

async function applyMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'mnbara_db',
    user: 'mnbara_user',
    password: 'mnbara_pass'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Execute the SQL migration
    console.log('Executing migration SQL...');
    await client.query(sqlContent);
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();