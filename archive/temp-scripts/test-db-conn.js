const { Client } = require('pg');

async function test() {
  const connString = 'postgresql://mnbara_user:mnbara_pass@localhost:5432/mnbara_db';
  console.log(`Testing connection: ${connString}`);
  
  const client = new Client({ connectionString: connString });
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL version:', res.rows[0].version);
    
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();
