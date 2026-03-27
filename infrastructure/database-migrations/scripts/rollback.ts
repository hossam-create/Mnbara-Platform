#!/usr/bin/env ts-node
/**
 * Mnbara Platform Database Rollback Runner
 * 
 * Dedicated rollback tool for controlled database rollbacks.
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config();

// Types
interface RollbackOptions {
  step?: number;
  to?: string;
  all?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
}

// Configuration
const MIGRATIONS_PATH = path.join(__dirname, '..', 'migrations');
const DEFAULT_MIGRATIONS_TABLE = 'schema_migrations';
const DEFAULT_LOCK_TABLE = 'schema_migrations_lock';

// Color helpers
const colors = {
  info: chalk.blue,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  bold: chalk.bold,
  dim: chalk.dim,
};

/**
 * Parse command line arguments
 */
function parseArgs(): RollbackOptions {
  return yargs(hideBin(process.argv))
    .option('step', {
      type: 'number',
      description: 'Number of migrations to rollback',
    })
    .option('to', {
      type: 'string',
      description: 'Rollback to specific migration number',
    })
    .option('all', {
      type: 'boolean',
      default: false,
      description: 'Rollback all migrations',
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Show what would be done without making changes',
    })
    .option('verbose', {
      type: 'boolean',
      default: true,
      description: 'Enable verbose output',
    })
    .option('force', {
      type: 'boolean',
      default: false,
      description: 'Skip safety confirmations',
    })
    .conflicts('step', ['to', 'all'])
    .conflicts('to', ['step', 'all'])
    .help()
    .parseSync();
}

/**
 * Get database connection pool
 */
async function getPool(): Promise<Pool> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'mnbara_dev',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mnbara_development',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err: Error) => {
    console.error(colors.error('Unexpected error on idle client'), err);
  });

  return pool;
}

/**
 * Parse migration filename
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
async function readMigrationFiles(): Promise<Map<string, { upSql: string; downSql: string; name: string }>> {
  const migrations = new Map();
  
  try {
    const files = await fs.promises.readdir(MIGRATIONS_PATH);

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      const parsed = parseMigrationFilename(file);
      if (!parsed) continue;

      const content = await fs.promises.readFile(path.join(MIGRATIONS_PATH, file), 'utf-8');
      const sections = content.split(/--\s*DOWN\s*--\n/i);
      
      migrations.set(parsed.number, {
        name: parsed.name,
        upSql: sections[0].replace(/--\s*UP\s*--\n?/i, '').trim(),
        downSql: sections[1]?.trim() || '-- No rollback available',
      });
    }
  } catch (error) {
    console.log(colors.warning('⚠ Could not read migration files'));
  }

  return migrations;
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations(pool: Pool, tableName: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT number, name, down_sql, applied_at, execution_time_ms 
     FROM ${tableName} 
     WHERE success = true 
     ORDER BY number ASC`
  );
  return result.rows;
}

/**
 * Rollback a single migration
 */
async function rollbackMigration(
  pool: Pool,
  migration: { number: string; name: string; downSql: string },
  tableName: string,
  options: RollbackOptions
): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();

  if (options.dryRun) {
    console.log(colors.dim(`[DRY-RUN] Would rollback migration ${migration.number}_${migration.name}`));
    console.log(colors.dim(`DOWN SQL:\n${migration.downSql.substring(0, 200)}...`));
    return { success: true };
  }

  if (migration.downSql.includes('No rollback available')) {
    console.log(colors.warning(`⚠ Skipping ${migration.number}_${migration.name}: No rollback available`));
    // Still remove the migration record
    await pool.query(`DELETE FROM ${tableName} WHERE number = $1`, [migration.number]);
    return { success: true };
  }

  try {
    await pool.query('BEGIN');
    await pool.query(migration.downSql);
    await pool.query(`DELETE FROM ${tableName} WHERE number = $1`, [migration.number]);
    await pool.query('COMMIT');

    console.log(colors.success(`  ✓ ${migration.number}_${migration.name} (${Date.now() - startTime}ms)`));
    return { success: true };
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.log(colors.error(`  ✗ ${migration.number}_${migration.name}: ${error.message}`));
    return { success: false, error: error.message };
  }
}

/**
 * Acquire lock
 */
async function acquireLock(pool: Pool, tableName: string): Promise<boolean> {
  const { v4: uuidv4 } = require('uuid');
  const lockId = uuidv4();
  const expiresAt = new Date(Date.now() + 120000); // 2 minutes for rollback
  
  try {
    await pool.query(
      `DELETE FROM ${tableName} WHERE expires_at < NOW() OR is_active = false`
    );
    await pool.query(
      `INSERT INTO ${tableName} (id, expires_at, process_id) VALUES ($1, $2, $3)`,
      [lockId, expiresAt, process.pid?.toString() || 'unknown']
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Release lock
 */
async function releaseLock(pool: Pool, tableName: string): Promise<void> {
  await pool.query(
    `DELETE FROM ${tableName} WHERE process_id = $1`,
    [process.pid?.toString() || 'unknown']
  );
}

/**
 * Show preview of what will be rolled back
 */
async function showPreview(
  pool: Pool,
  tableName: string,
  migrations: Map<string, { name: string; downSql: string }>,
  options: RollbackOptions
): Promise<void> {
  const applied = await getAppliedMigrations(pool, tableName);
  
  console.log(colors.bold('\n═══════════════════════════════════════════════════════'));
  console.log(colors.bold('                 ROLLBACK PREVIEW'));
  console.log(colors.bold('═══════════════════════════════════════════════════════\n'));

  // Determine which migrations will be rolled back
  let toRollback = applied;
  
  if (options.all) {
    toRollback = applied;
  } else if (options.step) {
    toRollback = applied.slice(-options.step);
  } else if (options.to) {
    const targetIndex = applied.findIndex(m => m.number === options.to);
    if (targetIndex >= 0) {
      toRollback = applied.slice(targetIndex + 1);
    }
  }

  console.log(`Migrations to rollback: ${toRollback.length}\n`);
  console.log(colors.bold('─'.repeat(60)));
  
  for (const m of toRollback) {
    const hasRollback = !m.down_sql.includes('No rollback available');
    const status = hasRollback ? colors.success('✓') : colors.warning('⚠');
    console.log(`${status}  ${m.number}  ${m.name}`);
    
    if (!hasRollback) {
      console.log(colors.dim(`     No rollback SQL available - migration record will be removed`));
    }
  }
  
  console.log(colors.bold('─'.repeat(60)));
}

/**
 * Main entry point
 */
async function main() {
  console.log(
    chalk.red(
      figlet.textSync('ROLLBACK', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.dim('═'.repeat(50)));
  console.log(chalk.dim('Mnbara Platform Database Rollback Tool'));
  console.log(chalk.dim('═'.repeat(50) + '\n'));

  const options = parseArgs();
  const tableName = process.env.MIGRATIONS_TABLE || DEFAULT_MIGRATIONS_TABLE;
  const lockTable = process.env.LOCK_TABLE || DEFAULT_LOCK_TABLE;

  if (options.dryRun) {
    console.log(colors.warning('⚠ DRY RUN MODE - No changes will be made\n'));
  }

  try {
    // Connect to database
    console.log(colors.info('Connecting to database...'));
    const pool = await getPool();
    await pool.query('SELECT NOW()');
    console.log(colors.success('✓ Connected to database\n'));

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(pool, tableName);
    const migrationFiles = await readMigrationFiles();

    if (appliedMigrations.length === 0) {
      console.log(colors.info('No migrations have been applied'));
      await pool.end();
      return;
    }

    // Show preview
    await showPreview(pool, tableName, migrationFiles, options);

    // Confirmation
    if (!options.force && !options.dryRun) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(colors.warning('\n⚠ Are you sure you want to proceed? [y/N] '), (answer) => {
          rl.close();
          resolve(answer.toLowerCase());
        });
      });

      if (answer !== 'y' && answer !== 'yes') {
        console.log(colors.info('Rollback cancelled'));
        await pool.end();
        return;
      }
    }

    // Acquire lock
    const lockAcquired = await acquireLock(pool, lockTable);
    if (!lockAcquired && !options.dryRun) {
      console.log(colors.error('Could not acquire rollback lock. Another operation may be running.'));
      await pool.end();
      process.exit(1);
    }

    try {
      // Determine migrations to rollback
      let toRollback = appliedMigrations;
      
      if (options.all) {
        toRollback = appliedMigrations;
      } else if (options.step) {
        toRollback = appliedMigrations.slice(-options.step);
      } else if (options.to) {
        const targetIndex = appliedMigrations.findIndex(m => m.number === options.to);
        if (targetIndex >= 0) {
          toRollback = appliedMigrations.slice(targetIndex + 1);
        }
      }

      console.log(colors.bold('\n🚀 Starting rollback...\n'));

      let successCount = 0;
      let errorCount = 0;

      for (const migration of toRollback) {
        const result = await rollbackMigration(pool, migration, tableName, options);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      console.log('\n' + colors.bold('═'.repeat(50)));
      console.log(colors.bold('                   SUMMARY'));
      console.log(colors.bold('═'.repeat(50)));
      console.log(`Rolled back: ${successCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log(`Remaining migrations: ${appliedMigrations.length - successCount}\n`);

      if (errorCount > 0) {
        console.log(colors.error('⚠ Some rollbacks may have failed. Check logs for details.'));
      }
    } finally {
      await releaseLock(pool, lockTable);
    }

    await pool.end();

    console.log(colors.success('\n✓ Rollback complete\n'));
  } catch (error: any) {
    console.error(colors.error(`\n✗ Rollback failed: ${error.message}`));
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { main, rollbackMigration };
