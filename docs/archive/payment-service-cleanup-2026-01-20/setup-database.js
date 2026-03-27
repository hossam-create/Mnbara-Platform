const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Mnbarh Payment Database...');
  
  // Connection to PostgreSQL (default postgres database first)
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });

  try {
    // Create the payments database if it doesn't exist
    console.log('📦 Creating payments database...');
    await pool.query('CREATE DATABASE mnbara_payments');
    console.log('✅ Database created successfully');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database already exists');
    } else {
      console.error('❌ Error creating database:', error.message);
      return;
    }
  }

  // Close the connection to postgres database
  await pool.end();

  // Connect to the payments database
  const paymentsPool = new Pool({
    connectionString: 'postgresql://mnbara_user:mnbara_pass@localhost:5432/mnbara_payments'
  });

  try {
    // Run the basic payments schema
    console.log('📋 Running basic payments schema...');
    const basicSchema = fs.readFileSync(
      path.join(__dirname, 'migrations/001_payments_schema.sql'),
      'utf8'
    );
    await paymentsPool.query(basicSchema);
    console.log('✅ Basic payments schema completed');

    // Run the advanced payments schema
    console.log('📋 Running advanced payments schema...');
    const advancedSchema = fs.readFileSync(
      path.join(__dirname, 'migrations/002_advanced_payments_schema.sql'),
      'utf8'
    );
    await paymentsPool.query(advancedSchema);
    console.log('✅ Advanced payments schema completed');

    // Verify tables were created
    console.log('🔍 Verifying database tables...');
    const result = await paymentsPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
  } finally {
    await paymentsPool.end();
  }
}

// Create user if needed
async function createUser() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });

  try {
    console.log('👤 Creating database user...');
    await pool.query(`
      CREATE USER mnbara_user WITH PASSWORD 'mnbara_pass'
    `);
    await pool.query(`
      GRANT ALL PRIVILEGES ON DATABASE mnbara_payments TO mnbara_user
    `);
    console.log('✅ User created successfully');
  } catch (error) {
    if (error.code === '42710') {
      console.log('✅ User already exists');
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    await createUser();
    await setupDatabase();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupDatabase, createUser };
