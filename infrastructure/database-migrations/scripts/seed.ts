#!/usr/bin/env ts-node
/**
 * Mnbara Platform Database Seed Runner
 * 
 * Seeds reference data for countries, currencies, categories, etc.
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';

dotenv.config();

// Types
interface Seed {
  category: string;
  filename: string;
  description: string;
  sql: string;
}

interface SeedCategory {
  name: string;
  description: string;
  seeds: Seed[];
}

// Configuration
const SEEDS_PATH = path.join(__dirname, '..', 'seeds');
const DEFAULT_SEEDS_TABLE = 'seed_logs';
const DEFAULT_CATEGORIES = ['countries', 'currencies', 'categories', 'payment_methods', 'delivery_statuses', 'order_statuses'];

// Color helpers
const colors = {
  info: chalk.blue,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  seed: chalk.magenta,
  dim: chalk.dim,
  bold: chalk.bold,
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const yargs = require('yargs');
  return yargs(hideBin(process.argv))
    .option('category', {
      type: 'string',
      description: 'Specific category to seed',
    })
    .option('all', {
      type: 'boolean',
      default: false,
      description: 'Seed all categories',
    })
    .option('verbose', {
      type: 'boolean',
      default: true,
      description: 'Enable verbose output',
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Show what would be done without making changes',
    })
    .help()
    .parseSync();
}

// Helper function for yargs
function hideBin(argv: string[]) {
  return argv.slice(2);
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

  pool.on('error', (err) => {
    console.error(colors.error('Unexpected error on idle client'), err);
  });

  return pool;
}

/**
 * Initialize seed logs table
 */
async function initSeedLogsTable(pool: Pool, tableName: string): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id UUID PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      description TEXT,
      rows_inserted INTEGER DEFAULT 0,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      UNIQUE(category, filename)
    );
    
    CREATE INDEX IF NOT EXISTS idx_${tableName.replace(/[^a-zA-Z0-9]/g, '_')}_category 
    ON ${tableName} (category);
    
    CREATE INDEX IF NOT EXISTS idx_${tableName.replace(/[^a-zA-Z0-9]/g, '_')}_executed 
    ON ${tableName} (executed_at DESC);
  `;

  await pool.query(createTableSQL);
}

/**
 * Check if seed has already been applied
 */
async function isSeedApplied(pool: Pool, tableName: string, category: string, filename: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM ${tableName} WHERE category = $1 AND filename = $2 AND success = true`,
    [category, filename]
  );
  return result.rows.length > 0;
}

/**
 * Read seed files from disk
 */
async function readSeedFiles(): Promise<Map<string, Seed[]>> {
  const seedsByCategory = new Map<string, Seed[]>();

  try {
    const categories = await fs.promises.readdir(SEEDS_PATH);

    for (const category of categories) {
      const categoryPath = path.join(SEEDS_PATH, category);
      const stat = await fs.promises.stat(categoryPath);

      if (!stat.isDirectory()) continue;

      const files = await fs.promises.readdir(categoryPath);
      const seeds: Seed[] = [];

      for (const file of files) {
        if (!file.endsWith('.sql')) continue;

        const content = await fs.promises.readFile(path.join(categoryPath, file), 'utf-8');
        
        seeds.push({
          category,
          filename: file,
          description: extractDescription(content),
          sql: content.trim(),
        });
      }

      // Sort by filename
      seeds.sort((a, b) => a.filename.localeCompare(b.filename));
      seedsByCategory.set(category, seeds);
    }
  } catch (error) {
    // Seeds directory may not exist
    console.log(colors.warning('⚠ Seeds directory not found'));
  }

  return seedsByCategory;
}

/**
 * Extract description from seed file
 */
function extractDescription(content: string): string {
  const match = content.match(/--\s*Description:\s*(.+)/i);
  return match ? match[1].trim() : 'No description';
}

/**
 * Apply a single seed
 */
async function applySeed(
  pool: Pool,
  seed: Seed,
  logsTableName: string,
  verbose: boolean,
  isDryRun: boolean
): Promise<{ success: boolean; rowsInserted: number; error?: string }> {
  const startTime = Date.now();

  // Check if already applied
  const alreadyApplied = await isSeedApplied(pool, logsTableName, seed.category, seed.filename);
  if (alreadyApplied && !isDryRun) {
    if (verbose) {
      console.log(colors.dim(`  ○ ${seed.category}/${seed.filename} (already applied)`));
    }
    return { success: true, rowsInserted: 0 };
  }

  if (isDryRun) {
    console.log(colors.dim(`[DRY-RUN] Would apply ${seed.category}/${seed.filename}`));
    console.log(colors.dim(`SQL:\n${seed.sql.substring(0, 150)}...`));
    return { success: true, rowsInserted: 0 };
  }

  try {
    // Execute the seed
    await pool.query(seed.sql);

    // Count affected rows (approximation based on INSERT statements)
    const insertMatch = seed.sql.match(/INSERT\s+INTO\s+\w+\s*\([^)]+\)\s*VALUES/gi);
    const rowsInserted = insertMatch ? countValues(seed.sql) : 0;

    // Log the seed
    await pool.query(
      `INSERT INTO ${logsTableName} (id, category, filename, description, rows_inserted, execution_time_ms, success)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true)
       ON CONFLICT (category, filename) DO UPDATE SET 
         rows_inserted = EXCLUDED.rows_inserted,
         executed_at = EXCLUDED.executed_at,
         execution_time_ms = EXCLUDED.execution_time_ms,
         success = EXCLUDED.success,
         error_message = NULL`,
      [seed.category, seed.filename, seed.description, rowsInserted, Date.now() - startTime]
    );

    if (verbose) {
      console.log(colors.success(`  ✓ ${seed.category}/${seed.filename} (${rowsInserted} rows, ${Date.now() - startTime}ms)`));
    }

    return { success: true, rowsInserted };
  } catch (error: any) {
    // Log failed seed
    await pool.query(
      `INSERT INTO ${logsTableName} (id, category, filename, description, execution_time_ms, success, error_message)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, false, $5)
       ON CONFLICT (category, filename) DO UPDATE SET 
         executed_at = EXCLUDED.executed_at,
         success = EXCLUDED.success,
         error_message = EXCLUDED.error_message`,
      [seed.category, seed.filename, seed.description, Date.now() - startTime, error.message]
    );

    return { success: false, rowsInserted: 0, error: error.message };
  }
}

/**
 * Count values in INSERT statement
 */
function countValues(sql: string): number {
  // Simple regex to count value groups
  const valueGroups = sql.match(/\([^)]+\)(?=\s*(?:,|\;))/g);
  if (!valueGroups) return 0;
  return valueGroups.length;
}

/**
 * Run seeds
 */
async function runSeeds(
  pool: Pool,
  verbose: boolean = true,
  category?: string,
  isDryRun: boolean = false
): Promise<{ success: boolean; categoriesSeeded: number; seedsApplied: number; errors: string[] }> {
  const logsTable = process.env.SEEDS_TABLE || DEFAULT_SEEDS_TABLE;
  const errors: string[] = [];
  let seedsApplied = 0;
  let categoriesSeeded = 0;

  // Initialize seed logs table
  await initSeedLogsTable(pool, logsTable);

  // Read seed files
  const seedsByCategory = await readSeedFiles();

  // Determine which categories to seed
  const categoriesToSeed = category 
    ? [[category, seedsByCategory.get(category) || []]]
    : Array.from(seedsByCategory.entries());

  for (const [cat, seeds] of categoriesToSeed) {
    if (seeds.length === 0) continue;

    console.log(colors.seed(`\n🌱 Seeding ${cat}...`));
    categoriesSeeded++;

    for (const seed of seeds) {
      const result = await applySeed(pool, seed, logsTable, verbose, isDryRun);
      
      if (result.success) {
        if (result.rowsInserted > 0) seedsApplied++;
      } else {
        errors.push(`${cat}/${seed.filename}: ${result.error}`);
        console.log(colors.error(`  ✗ ${seed.category}/${seed.filename}: ${result.error}`));
      }
    }
  }

  if (seedsApplied === 0 && errors.length === 0) {
    console.log(colors.info('✓ All seeds are up to date'));
  }

  return {
    success: errors.length === 0,
    categoriesSeeded,
    seedsApplied,
    errors,
  };
}

/**
 * Print seed status
 */
async function printSeedStatus(pool: Pool): Promise<void> {
  const logsTable = process.env.SEEDS_TABLE || DEFAULT_SEEDS_TABLE;

  console.log('\n' + colors.bold('═══════════════════════════════════════════════════════'));
  console.log(colors.bold('              SEED STATUS'));
  console.log(colors.bold('═══════════════════════════════════════════════════════\n'));

  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count, SUM(rows_inserted) as total_rows, 
              MAX(executed_at) as last_run
       FROM ${logsTable}
       WHERE success = true
       GROUP BY category
       ORDER BY category`
    );

    if (result.rows.length === 0) {
      console.log(colors.warning('No seeds have been applied yet'));
      return;
    }

    console.log(colors.bold('Categories:'));
    console.log('─'.repeat(60));

    let totalRows = 0;
    for (const row of result.rows) {
      totalRows += parseInt(row.total_rows) || 0;
      console.log(`${colors.success('✓')} ${row.category.padEnd(25)} ${row.count.padStart(3)} seed(s)  ${row.total_rows} rows`);
    }

    console.log('─'.repeat(60));
    console.log(`Total: ${result.rows.length} categories, ${totalRows} rows\n`);
  } catch (error) {
    console.log(colors.warning('Could not retrieve seed status'));
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log(
    chalk.magenta(
      figlet.textSync('SEEDS', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.dim('═'.repeat(50)));
  console.log(chalk.dim('Mnbara Platform Database Seed Runner'));
  console.log(chalk.dim('═'.repeat(50) + '\n'));

  const args = parseArgs();

  if (args.dryRun) {
    console.log(colors.warning('⚠ DRY RUN MODE - No changes will be made\n'));
  }

  try {
    // Connect to database
    console.log(colors.info('Connecting to database...'));
    const pool = await getPool();
    await pool.query('SELECT NOW()');
    console.log(colors.success('✓ Connected to database\n'));

    // Show status if no specific action
    if (!args.category && !args.all) {
      await printSeedStatus(pool);
      
      const seedsByCategory = await readSeedFiles();
      console.log('\n' + colors.bold('Available seed categories:'));
      console.log('─'.repeat(50));
      
      for (const [category, seeds] of seedsByCategory) {
        console.log(`  ${category.padEnd(25)} ${seeds.length} seed file(s)`);
      }
      
      console.log('\n' + colors.info('Usage: npm run seed -- --all    # Seed all categories'));
      console.log(colors.info('       npm run seed -- --category=countries  # Specific category'));
      
      await pool.end();
      return;
    }

    // Run seeds
    const result = await runSeeds(
      pool,
      args.verbose !== false,
      args.category,
      args.dryRun || false
    );

    console.log('\n' + colors.bold('═'.repeat(50)));
    console.log(colors.bold('                    SUMMARY'));
    console.log(colors.bold('═'.repeat(50)));
    console.log(`Categories seeded: ${result.categoriesSeeded}`);
    console.log(`Seeds applied: ${result.seedsApplied}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n' + colors.error('Errors:'));
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

    await pool.end();

    if (!result.success) {
      process.exit(1);
    }

    console.log(colors.success('\n✓ Seeding complete\n'));
  } catch (error: any) {
    console.error(colors.error(`\n✗ Seeding failed: ${error.message}`));
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { runSeeds, applySeed, readSeedFiles };
