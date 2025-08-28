const { Client } = require('pg');

async function testPostgreSQL() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  // First test - basic connection
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin123',
    database: 'postgres' // Connect to default database first
  });
  
  try {
    console.log('1. Testing basic PostgreSQL connection...');
    await client.connect();
    console.log('✅ PostgreSQL connection successful');
    
    // Check if our database exists
    console.log('\n2. Checking if myapp_db database exists...');
    const dbResult = await client.query(`
      SELECT datname FROM pg_database WHERE datname = 'myapp_db'
    `);
    
    if (dbResult.rows.length === 0) {
      console.log('📝 Database myapp_db not found. Creating...');
      await client.query('CREATE DATABASE myapp_db');
      console.log('✅ Database myapp_db created successfully');
    } else {
      console.log('✅ Database myapp_db already exists');
    }
    
    await client.end();
    
    // Now connect to our database
    console.log('\n3. Connecting to myapp_db database...');
    const appClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'admin',
      password: 'admin123',
      database: 'myapp_db'
    });
    
    await appClient.connect();
    console.log('✅ Connected to myapp_db database');
    
    // Test query
    console.log('\n4. Running test query...');
    const testResult = await appClient.query('SELECT version()');
    console.log('🐘 PostgreSQL version:', testResult.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // List tables
    console.log('\n5. Listing existing tables...');
    const tablesResult = await appClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📊 Existing tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('📊 No tables found (fresh database)');
    }
    
    await appClient.end();
    console.log('\n🎉 PostgreSQL connection test passed!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('Details:', error.code, error.detail || '');
    
    // Common solutions
    console.log('\n💡 Common solutions:');
    console.log('1. Make sure PostgreSQL service is running');
    console.log('2. Check username/password (default: postgres/postgres)'); 
    console.log('3. Check if PostgreSQL is listening on port 5432');
    console.log('4. Try different connection settings');
  }
}

testPostgreSQL();