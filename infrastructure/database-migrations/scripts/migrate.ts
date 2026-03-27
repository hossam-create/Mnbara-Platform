#!/usr/bin/env ts-node
/**
 * Mnbara Platform Database Migration Runner
 * 
 * A centralized migration system for all microservices.
 * Supports up/down migrations, dry-run mode, and environment-specific configurations.
 */

import fs from 'fs';
import path from 'path';
import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Types
interface Migration {
  id: string;
  number: string;
  name: string;
  filename: string;
  upSql: string;
  downSql: string;
  appliedAt?: Date;
  checksum?: string;
}

interface MigrationConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  schema: string;
  migrationsTable: string;
  lockTableName: string;
  dryRun: boolean;
  verbose: boolean;
  transactional: boolean;
  migrationsPath: string;
}

interface Seed {
  category: string;
  filename: string;
  sql: string;
  description: string;
}

// Configuration
const MIGRATIONS_PATH = path.join(__dirname, '..', 'migrations');
const SEEDS_PATH = path.join(__dirname, '..', 'seeds');
const DEFAULT_MIGRATIONS_TABLE = 'schema_migrations';
const DEFAULT_LOCK_TABLE = 'schema_migrations_lock';

// Color helpers
const colors = {
  info: chalk.blue,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  migration: chalk.cyan,
  dim: chalk.dim,
  bold: chalk.bold,
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  return yargs(hideBin(process.argv))
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Show what would be done without making changes',
    })
    .option('direction', {
      type: 'string',
      choices: ['up', 'down'],
      default: 'up',
      description: 'Migration direction (up or down)',
    })
    .option('step', {
      type: 'number',
      default: null,
      description: 'Number of migrations to apply/rollback',
    })
    .option('to', {
      type: 'string',
      description: 'Migrate to specific migration number',
    })
    .option('env', {
      type: 'string',
      default: 'development',
      description: 'Environment configuration to use',
    })
    .option('verbose', {
      type: 'boolean',
      default: true,
      description: 'Enable verbose output',
    })
    .option('status', {
      type: 'boolean',
      default: false,
      description: 'Show migration status only',
    })
    .option('seed', {
      type: 'boolean',
      default: false,
      description: 'Run seeds after migration',
    })
    .help()
    .parseSync();
}

/**
 * Get database connection pool
 */
async function getPool(config: MigrationConfig): Promise<Pool> {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.name,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error(colors.error('Unexpected error on idle client'), err);
  });

  return pool;
}

/**
 * Initialize migrations table
 */
async function initMigrationsTable(pool: Pool, tableName: string): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id UUID PRIMARY KEY,
      number VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      up_sql TEXT NOT NULL,
      down_sql TEXT NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      success BOOLEAN DEFAULT true,
      error_message TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_${tableName.replace(/[^a-zA-Z0-9]/g, '_')}_number 
    ON ${tableName} (number);
    
    CREATE INDEX IF NOT EXISTS idx_${tableName.replace(/[^a-zA-Z0-9]/g, '_')}_applied 
    ON ${tableName} (applied_at DESC);
  `;

  await pool.query(createTableSQL);
}

/**
 * Initialize lock table for distributed locking
 */
async function initLockTable(pool: Pool, tableName: string): Promise<void> {
  const createLockTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id UUID PRIMARY KEY,
      acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE,
      process_id VARCHAR(255),
      is_active BOOLEAN DEFAULT true
    );
  `;

  await pool.query(createLockTableSQL);
}

/**
 * Acquire migration lock
 */
async function acquireLock(pool: Pool, tableName: string): Promise<boolean> {
  const lockId = uuidv4();
  const expiresAt = new Date(Date.now() + 60000); // 1 minute expiry
  
  try {
    // Clean up expired locks first
    await pool.query(
      `DELETE FROM ${tableName} WHERE expires_at < NOW() OR is_active = false`
    );

    // Try to acquire lock
    await pool.query(
      `INSERT INTO ${tableName} (id, expires_at, process_id) VALUES ($1, $2, $3)`,
      [lockId, expiresAt, process.pid?.toString() || 'unknown']
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Release migration lock
 */
async function releaseLock(pool: Pool, tableName: string): Promise<void> {
  await pool.query(
    `DELETE FROM ${tableName} WHERE process_id = $1`,
    [process.pid?.toString() || 'unknown']
  );
}

/**
 * Parse migration filename to extract number and name
 */
function parseMigrationFilename(filename: string): { number: string; name: string } | null {
  const match = filename.match(/^(\d+)_(.+)\.sql$/);
  if (!match) return null;
  return {
    number: match[1].padStart(3, '0'),
    name: match[2],
  };
}

/**
 * Read migration files from disk
 */
async function readMigrationFiles(): Promise<Migration[]> {
  const files = await fs.promises.readdir(MIGRATIONS_PATH);
  const migrations: Migration[] = [];

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;

    const parsed = parseMigrationFilename(file);
    if (!parsed) continue;

    const content = await fs.promises.readFile(path.join(MIGRATIONS_PATH, file), 'utf-8');
    
    // Split content into UP and DOWN sections
    const sections = content.split(/--\s*DOWN\s*--\n/i);
    
    if (sections.length === 2) {
      migrations.push({
        id: uuidv4(),
        number: parsed.number,
        name: parsed.name,
        filename: file,
        upSql: sections[0].replace(/--\s*UP\s*--\n?/i, '').trim(),
        downSql: sections[1].trim(),
      });
    } else {
      // Single migration file without DOWN section
      migrations.push({
        id: uuidv4(),
        number: parsed.number,
        name: parsed.name,
        filename: file,
        upSql: content.replace(/--\s*UP\s*--\n?/i, '').trim(),
        downSql: '-- No rollback available for this migration',
      });
    }
  }

  // Sort by migration number
  migrations.sort((a, b) => a.number.localeCompare(b.number));
  return migrations;
}

/**
 * Get applied migrations from database
 */
async function getAppliedMigrations(pool: Pool, tableName: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT number FROM ${tableName} WHERE success = true ORDER BY number ASC`
  );
  return result.rows.map(row => row.number);
}

/**
 * Calculate checksum for migration content
 */
function calculateChecksum(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Apply a single migration
 */
async function applyMigration(
  pool: Pool,
  migration: Migration,
  tableName: string,
  isDryRun: boolean
): Promise<{ success: boolean; error?: string; executionTime: number }> {
  const startTime = Date.now();
  const checksum = calculateChecksum(migration.upSql);

  if (isDryRun) {
    console.log(colors.dim(`[DRY-RUN] Would apply migration ${migration.number}_${migration.name}`));
    console.log(colors.dim(`SQL:\n${migration.upSql.substring(0, 200)}...`));
    return { success: true, executionTime: Date.now() - startTime };
  }

  try {
    // Begin transaction if configured
    if (transactionalMode) {
      await pool.query('BEGIN');
    }

    // Execute the migration
    await pool.query(migration.upSql);

    // Record the migration
    await pool.query(
      `INSERT INTO ${tableName} (id, number, name, filename, up_sql, down_sql, checksum, execution_time_ms, success)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [migration.id, migration.number, migration.name, migration.filename, migration.upSql, migration.downSql, checksum, Date.now() - startTime]
    );

    if (transactionalMode) {
      await pool.query('COMMIT');
    }

    return { success: true, executionTime: Date.now() - startTime };
  } catch (error: any) {
    if (transactionalMode) {
      await pool.query('ROLLBACK');
    }

    // Record failed migration
    await pool.query(
      `INSERT INTO ${tableName} (id, number, name, filename, up_sql, down_sql, checksum, execution_time_ms, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)`,
      [migration.id, migration.number, migration.name, migration.filename, migration.upSql, migration.downSql, checksum, Date.now() - startTime, error.message]
    );

    return { success: false, error: error.message, executionTime: Date.now() - startTime };
  }
}

/**
 * Rollback a single migration
 */
async function rollbackMigration(
  pool: Pool,
  migration: Migration,
  tableName: string,
  isDryRun: boolean
): Promise<{ success: boolean; error?: string; executionTime: number }> {
  const startTime = Date.now();

  if (isDryRun) {
    console.log(colors.dim(`[DRY-RUN] Would rollback migration ${migration.number}_${migration.name}`));
    console.log(colors.dim(`SQL:\n${migration.downSql.substring(0, 200)}...`));
    return { success: true, executionTime: Date.now() - startTime };
  }

  if (migration.downSql.includes('No rollback available')) {
    console.log(colors.warning(`⚠ Skipping rollback for ${migration.number}_${migration.name}: No rollback available`));
    return { success: true, executionTime: Date.now() - startTime };
  }

  try {
    if (transactionalMode) {
      await pool.query('BEGIN');
    }

    // Execute the rollback
    await pool.query(migration.downSql);

    // Remove the migration record
    await pool.query(
      `DELETE FROM ${tableName} WHERE number = $1`,
      [migration.number]
    );

    if (transactionalMode) {
      await pool.query('COMMIT');
    }

    return { success: true, executionTime: Date.now() - startTime };
  } catch (error: any) {
    if (transactionalMode) {
      await pool.query('ROLLBACK');
    }

    return { success: false, error: error.message, executionTime: Date.now() - startTime };
  }
}

/**
 * Print migration status
 */
async function printMigrationStatus(pool: Pool, tableName: string, migrations: Migration[]): Promise<void> {
  const applied = await getAppliedMigrations(pool, tableName);
  
  console.log('\n' + colors.bold('═══════════════════════════════════════════════════════'));
  console.log(colors.bold('           DATABASE MIGRATION STATUS'));
  console.log(colors.bold('═══════════════════════════════════════════════════════\n'));

  console.log(`Total migrations: ${migrations.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${migrations.length - applied.length}\n`);

  console.log(colors.bold('Migrations:'));
  console.log('─'.repeat(60));

  for (const migration of migrations) {
    const isApplied = applied.includes(migration.number);
    const status = isApplied 
      ? colors.success('✓ APPLIED')
      : colors.warning('○ PENDING');
    const number = migration.number.padStart(3, '0');
    console.log(`${status}  ${number}  ${migration.name}`);
  }

  console.log('─'.repeat(60));
}

/**
 * Run migrations
 */
async function runMigrations(
  pool: Pool,
  config: MigrationConfig,
  direction: 'up' | 'down',
  options: {
    step?: number;
    to?: string;
    dryRun?: boolean;
    verbose?: boolean;
    runSeeds?: boolean;
  }
): Promise<void> {
  const tableName = config.migrationsTable;
  const migrations = await readMigrationFiles();
  const applied = await getAppliedMigrations(pool, tableName);

  // Acquire lock
  if (!options.dryRun) {
    const lockAcquired = await acquireLock(pool, config.lockTableName);
    if (!lockAcquired) {
      console.log(colors.error('Could not acquire migration lock. Another migration may be running.'));
      process.exit(1);
    }
  }

  try {
    if (direction === 'up') {
      // Get pending migrations
      const pending = migrations.filter(m => !applied.includes(m.number));
      
      if (pending.length === 0) {
        console.log(colors.info('✓ All migrations are up to date'));
        return;
      }

      // Determine which migrations to apply
      let migrationsToRun = pending;
      if (options.step) {
        migrationsToRun = pending.slice(0, options.step);
      } else if (options.to) {
        const targetIndex = pending.findIndex(m => m.number === options.to);
        if (targetIndex >= 0) {
          migrationsToRun = pending.slice(0, targetIndex + 1);
        }
      }

      console.log(colors.migration(`\n🚀 Applying ${migrationsToRun.length} migration(s)...\n`));

      for (const migration of migrationsToRun) {
        console.log(colors.migration(`  → ${migration.number}_${migration.name}`));
        
        const result = await applyMigration(pool, migration, tableName, options.dryRun || false);
        
        if (result.success) {
          console.log(colors.success(`    ✓ Applied successfully (${result.executionTime}ms)`));
          if (options.verbose) {
            console.log(colors.dim(`    SQL: ${migration.upSql.substring(0, 80)}...`));
          }
        } else {
          console.log(colors.error(`    ✗ Failed: ${result.error}`));
          throw new Error(`Migration ${migration.number} failed`);
        }
      }

      console.log(colors.success(`\n✓ Applied ${migrationsToRun.length} migration(s)`));
    } else {
      // Rollback direction
      const appliedMigrations = migrations.filter(m => applied.includes(m.number));
      
      if (appliedMigrations.length === 0) {
        console.log(colors.warning('No migrations to rollback'));
        return;
      }

      // Get migrations to rollback (most recent first)
      let migrationsToRollback = appliedMigrations.reverse();
      if (options.step) {
        migrationsToRollback = migrationsToRollback.slice(0, options.step);
      }

      console.log(colors.migration(`\n🔄 Rolling back ${migrationsToRollback.length} migration(s)...\n`));

      for (const migration of migrationsToRollback) {
        console.log(colors.migration(`  ← ${migration.number}_${migration.name}`));
        
        const result = await rollbackMigration(pool, migration, tableName, options.dryRun || false);
        
        if (result.success) {
          console.log(colors.success(`    ✓ Rolled back successfully (${result.executionTime}ms)`));
        } else {
          console.log(colors.error(`    ✗ Failed: ${result.error}`));
          throw new Error(`Rollback of ${migration.number} failed`);
        }
      }

      console.log(colors.success(`\n✓ Rolled back ${migrationsToRollback.length} migration(s)`));
    }

    // Run seeds if requested
    if (options.runSeeds && direction === 'up' && !options.dryRun) {
      console.log(colors.info('\n🌱 Running seeds...'));
      // Import and run seed function
      const { runSeeds } = await import('./seed.js');
      await runSeeds(pool, options.verbose || false);
    }
  } finally {
    // Release lock
    if (!options.dryRun) {
      await releaseLock(pool, config.lockTableName);
    }
  }
}

// Global flag for transactional mode
let transactionalMode = true;

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();
  
  // Display banner
  console.log(
    chalk.cyan(
      figlet.textSync('MIGRATE', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.dim('═'.repeat(50)));
  console.log(chalk.dim('Mnbara Platform Database Migration System'));
  console.log(chalk.dim('═'.repeat(50) + '\n'));

  // Get environment from args or default
  const env = args.env || process.env.NODE_ENV || 'development';
  console.log(colors.info(`Environment: ${env}`));

  // Build configuration
  const config: MigrationConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'mnbara_dev',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'mnbara_development',
    schema: 'public',
    migrationsTable: process.env.MIGRATIONS_TABLE || DEFAULT_MIGRATIONS_TABLE,
    lockTableName: process.env.LOCK_TABLE || DEFAULT_LOCK_TABLE,
    dryRun: args.dryRun || false,
    verbose: args.verbose !== false,
    transactional: true,
    migrationsPath: MIGRATIONS_PATH,
  };

  if (config.dryRun) {
    console.log(colors.warning('⚠ DRY RUN MODE - No changes will be made\n'));
  }

  transactionalMode = config.transactional;

  try {
    // Connect to database
    console.log(colors.info('Connecting to database...'));
    const pool = await getPool(config);
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log(colors.success('✓ Connected to database\n'));

    // Initialize tables
    console.log(colors.info('Initializing migration tables...'));
    await initMigrationsTable(pool, config.migrationsTable);
    await initLockTable(pool, config.lockTableName);
    console.log(colors.success('✓ Tables initialized\n'));

    // Get all migrations
    const migrations = await readMigrationFiles();
    
    // If status only mode
    if (args.status) {
      await printMigrationStatus(pool, config.migrationsTable, migrations);
      await pool.end();
      return;
    }

    // Run migrations
    await runMigrations(pool, config, args.direction || 'up', {
      step: args.step,
      to: args.to,
      dryRun: args.dryRun || false,
      verbose: args.verbose !== false,
      runSeeds: args.seed,
    });

    // Close connection
    await pool.end();
    
    console.log(colors.success('\n✓ Migration complete\n'));
  } catch (error: any) {
    console.error(colors.error(`\n✗ Migration failed: ${error.message}`));
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { runMigrations, applyMigration, rollbackMigration, readMigrationFiles };
