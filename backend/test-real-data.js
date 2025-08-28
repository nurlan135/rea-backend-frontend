require('dotenv').config();
const db = require('./database');

async function testRealDatabaseData() {
  console.log('🔍 Testing REA INVEST real database data...\n');
  
  try {
    // Test users table with correct columns
    console.log('1. Testing users table...');
    const users = await db('users').select('email', 'first_name', 'last_name', 'phone', 'is_active').limit(5);
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} - ${user.first_name} ${user.last_name} (${user.is_active ? 'active' : 'inactive'})`);
    });
    
    // Test properties table with correct columns
    console.log('\n2. Testing properties table...');
    const properties = await db('properties')
      .select('code', 'building', 'buy_price_azn', 'sell_price_azn', 'rent_price_monthly_azn', 'status', 'category', 'listing_type')
      .limit(5);
    console.log(`✅ Found ${properties.length} properties:`);
    properties.forEach(prop => {
      const price = prop.buy_price_azn || prop.sell_price_azn || prop.rent_price_monthly_azn;
      console.log(`  - ${prop.code} (${prop.building || 'No building'}) - ${price} AZN - ${prop.status} (${prop.listing_type})`);
    });
    
    // Test customers table
    console.log('\n3. Testing customers table...');
    const customers = await db('customers').select('first_name', 'last_name', 'phone', 'type').limit(3);
    console.log(`✅ Found ${customers.length} customers:`);
    customers.forEach(customer => {
      console.log(`  - ${customer.first_name} ${customer.last_name} - ${customer.phone || 'No phone'} (${customer.type})`);
    });
    
    // Test with JOIN (properties with users)
    console.log('\n4. Testing JOIN query (properties with assigned user)...');
    const propertiesWithUsers = await db('properties')
      .leftJoin('users', 'properties.assigned_to_id', 'users.id')
      .select(
        'properties.code',
        'properties.building', 
        'properties.buy_price_azn',
        'properties.status',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name',
        'users.email as agent_email'
      )
      .limit(3);
      
    console.log(`✅ Properties with agent info (${propertiesWithUsers.length}):`);
    propertiesWithUsers.forEach(prop => {
      const agent = prop.agent_first_name ? `${prop.agent_first_name} ${prop.agent_last_name}` : 'No agent assigned';
      console.log(`  - ${prop.code} (${prop.building || 'No building'}) - ${prop.buy_price_azn} AZN - Agent: ${agent}`);
    });
    
    // Test statistics
    console.log('\n5. Database statistics...');
    const stats = await Promise.all([
      db('users').count('* as count').first(),
      db('properties').count('* as count').first(),
      db('customers').count('* as count').first(),
      db('properties').where('status', 'active').count('* as count').first(),
      db('properties').where('listing_type', 'sale').count('* as count').first(),
      db('properties').where('listing_type', 'rent').count('* as count').first(),
      db('users').where('is_active', true).count('* as count').first()
    ]);
    
    console.log('📊 Database Statistics:');
    console.log(`  - Total Users: ${stats[0].count}`);
    console.log(`  - Total Properties: ${stats[1].count}`);
    console.log(`  - Total Customers: ${stats[2].count}`);
    console.log(`  - Active Properties: ${stats[3].count}`);
    console.log(`  - Properties for Sale: ${stats[4].count}`);
    console.log(`  - Properties for Rent: ${stats[5].count}`);
    console.log(`  - Active Users: ${stats[6].count}`);
    
    // Test a complex query
    console.log('\n6. Complex query test (properties by price range)...');
    const expensiveProperties = await db('properties')
      .where('buy_price_azn', '>', 100000)
      .orWhere('sell_price_azn', '>', 100000)
      .select('code', 'building', 'buy_price_azn', 'sell_price_azn', 'status')
      .limit(3);
      
    console.log(`✅ Found ${expensiveProperties.length} expensive properties (>100k AZN):`);
    expensiveProperties.forEach(prop => {
      const price = prop.buy_price_azn || prop.sell_price_azn;
      console.log(`  - ${prop.code} - ${price} AZN (${prop.status})`);
    });
    
    console.log('\n🎉 Real database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testRealDatabaseData();