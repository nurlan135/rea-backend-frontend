require('dotenv').config();
const { Client } = require('pg');

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin123',
    database: 'myapp_db'
  });
  
  try {
    await client.connect();
    
    // Check users table structure
    console.log('1. Users table structure:');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Check properties table structure
    console.log('\n2. Properties table structure:');
    const propertiesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      ORDER BY ordinal_position
    `);
    
    propertiesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Check customers table structure
    console.log('\n3. Customers table structure:');
    const customersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    customersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Sample data check
    console.log('\n4. Sample data check:');
    
    // Users sample
    const userSample = await client.query('SELECT email, role, status FROM users LIMIT 3');
    console.log('Users sample:');
    userSample.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role || 'no role'}) - ${user.status || 'no status'}`);
    });
    
    // Properties sample with actual columns
    const propertiesColumns2 = propertiesColumns.rows.map(r => r.column_name);
    const hasTitle = propertiesColumns2.includes('title');
    const hasPropertyName = propertiesColumns2.includes('property_name');
    const hasPrice = propertiesColumns2.includes('price');
    const hasAmount = propertiesColumns2.includes('amount');
    
    let propQuery = 'SELECT ';
    if (hasTitle) propQuery += 'title, ';
    else if (hasPropertyName) propQuery += 'property_name, ';
    
    if (hasPrice) propQuery += 'price, ';
    else if (hasAmount) propQuery += 'amount, ';
    
    propQuery += 'status FROM properties LIMIT 3';
    
    const propSample = await client.query(propQuery);
    console.log('Properties sample:');
    propSample.rows.forEach(prop => {
      const name = prop.title || prop.property_name || 'No name';
      const price = prop.price || prop.amount || 'No price';
      console.log(`  - ${name} - ${price} (${prop.status || 'no status'})`);
    });
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

checkSchema();