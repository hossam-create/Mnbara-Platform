const { Client } = require('pg');

const passwords = [
  'mnbara_pass',
  'postgres',
  'admin',
  'password',
  '123456',
  'mnbara',
  'root',
  ''
];

const usernames = ['mnbara_user', 'postgres'];

async function testConnection(user, password) {
  const connectionString = `postgresql://${user}:${password}@localhost:5432/mnbara_db`;
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function findPassword() {
  console.log('🔍 Testing database credentials...\n');
  
  for (const user of usernames) {
    for (const pass of passwords) {
      process.stdout.write(`Testing ${user}:${pass || '(empty)'}... `);
      const works = await testConnection(user, pass);
      
      if (works) {
        console.log('✅ SUCCESS!\n');
        console.log('========================================');
        console.log('✅ Found working credentials:');
        console.log(`   User: ${user}`);
        console.log(`   Password: ${pass || '(empty)'}`);
        console.log('========================================');
        console.log('\nConnection string:');
        console.log(`postgresql://${user}:${pass}@localhost:5432/mnbara_db`);
        return { user, pass };
      } else {
        console.log('❌');
      }
    }
  }
  
  console.log('\n❌ No working credentials found!');
  console.log('This means Docker Desktop might not be running.');
  return null;
}

findPassword();
