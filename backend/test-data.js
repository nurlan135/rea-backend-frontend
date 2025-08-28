require('dotenv').config();
const db = require('./database');

async function testDatabaseData() {
  console.log('🔍 Testing REA INVEST database data...\n');
  
  try {
    // Test users table
    console.log('1. Testing users table...');
    const users = await db('users').select('*').limit(5);
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
    // Test properties table
    console.log('\n2. Testing properties table...');
    const properties = await db('properties').select('*').limit(5);
    console.log(`✅ Found ${properties.length} properties:`);
    properties.forEach(prop => {
      console.log(`  - ${prop.title} - ${prop.price} ${prop.currency || 'AZN'} (${prop.status})`);
    });
    
    // Test customers table
    console.log('\n3. Testing customers table...');
    const customers = await db('customers').select('*').limit(3);
    console.log(`✅ Found ${customers.length} customers:`);
    customers.forEach(customer => {
      console.log(`  - ${customer.first_name} ${customer.last_name} - ${customer.phone} (${customer.type})`);
    });
    
    // Test bookings table
    console.log('\n4. Testing bookings table...');
    const bookings = await db('bookings').select('*').limit(3);
    console.log(`✅ Found ${bookings.length} bookings:`);
    bookings.forEach(booking => {
      console.log(`  - Booking ${booking.id} - ${booking.status} (${new Date(booking.created_at).toLocaleDateString()})`);
    });
    
    // Test with JOIN
    console.log('\n5. Testing JOIN query (properties with agent info)...');
    const propertiesWithAgents = await db('properties')
      .leftJoin('users', 'properties.agent_id', 'users.id')
      .select(
        'properties.title',
        'properties.price', 
        'properties.status',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name',
        'users.email as agent_email'
      )
      .limit(3);
      
    console.log(`✅ Properties with agent info (${propertiesWithAgents.length}):`);
    propertiesWithAgents.forEach(prop => {
      const agent = prop.agent_first_name ? `${prop.agent_first_name} ${prop.agent_last_name}` : 'No agent';
      console.log(`  - ${prop.title} - ${prop.price} AZN - Agent: ${agent}`);
    });
    
    // Test statistics
    console.log('\n6. Database statistics...');
    const stats = await Promise.all([
      db('users').count('* as count').first(),
      db('properties').count('* as count').first(),
      db('customers').count('* as count').first(),
      db('bookings').count('* as count').first(),
      db('properties').where('status', 'active').count('* as count').first(),
      db('properties').where('category', 'sale').count('* as count').first(),
      db('properties').where('category', 'rent').count('* as count').first()
    ]);
    
    console.log('📊 Database Statistics:');
    console.log(`  - Total Users: ${stats[0].count}`);
    console.log(`  - Total Properties: ${stats[1].count}`);
    console.log(`  - Total Customers: ${stats[2].count}`);
    console.log(`  - Total Bookings: ${stats[3].count}`);
    console.log(`  - Active Properties: ${stats[4].count}`);
    console.log(`  - Properties for Sale: ${stats[5].count}`);
    console.log(`  - Properties for Rent: ${stats[6].count}`);
    
    console.log('\n🎉 Database data test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await db.destroy();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testDatabaseData();