require('dotenv').config();
const db = require('./database');

async function testNewStructure() {
  console.log('🔍 Testing NEW database structure...\n');
  
  try {
    // Test users table
    console.log('1. Testing users table...');
    const users = await db('users').select('email', 'first_name', 'last_name', 'phone', 'role', 'status').limit(5);
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} - ${user.first_name} ${user.last_name} (${user.role}) - ${user.status}`);
    });
    
    // Test properties table
    console.log('\n2. Testing properties table...');
    const properties = await db('properties')
      .select('title', 'price', 'currency', 'type', 'category', 'status', 'bedrooms', 'area')
      .limit(5);
    console.log(`✅ Found ${properties.length} properties:`);
    properties.forEach(prop => {
      console.log(`  - ${prop.title} - ${prop.price} ${prop.currency} (${prop.type}/${prop.category}) - ${prop.status}`);
    });
    
    // Test customers table
    console.log('\n3. Testing customers table...');
    const customers = await db('customers').select('first_name', 'last_name', 'phone', 'email', 'type', 'status').limit(5);
    console.log(`✅ Found ${customers.length} customers:`);
    customers.forEach(customer => {
      console.log(`  - ${customer.first_name} ${customer.last_name} - ${customer.phone} (${customer.type}) - ${customer.status}`);
    });
    
    // Test bookings table
    console.log('\n4. Testing bookings table...');
    const bookings = await db('bookings')
      .select('id', 'booking_date', 'viewing_date', 'status', 'notes')
      .limit(5);
    console.log(`✅ Found ${bookings.length} bookings:`);
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.booking_date).toLocaleDateString();
      const viewingDate = booking.viewing_date ? new Date(booking.viewing_date).toLocaleDateString() : 'Not set';
      console.log(`  - Booking ${booking.id.slice(0,8)}... - ${bookingDate} → ${viewingDate} (${booking.status})`);
    });
    
    // Test with JOIN (properties with agents)
    console.log('\n5. Testing JOIN query (properties with agents)...');
    const propertiesWithAgents = await db('properties')
      .leftJoin('users', 'properties.agent_id', 'users.id')
      .select(
        'properties.title',
        'properties.price',
        'properties.currency',
        'properties.status',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name',
        'users.email as agent_email'
      )
      .limit(3);
      
    console.log(`✅ Properties with agent info (${propertiesWithAgents.length}):`);
    propertiesWithAgents.forEach(prop => {
      const agent = prop.agent_first_name ? `${prop.agent_first_name} ${prop.agent_last_name}` : 'No agent assigned';
      console.log(`  - ${prop.title} - ${prop.price} ${prop.currency} - Agent: ${agent}`);
    });
    
    // Test complex query with bookings
    console.log('\n6. Complex query (bookings with property and customer info)...');
    const fullBookings = await db('bookings')
      .leftJoin('properties', 'bookings.property_id', 'properties.id')
      .leftJoin('customers', 'bookings.customer_id', 'customers.id')
      .leftJoin('users', 'bookings.agent_id', 'users.id')
      .select(
        'bookings.id',
        'bookings.status as booking_status',
        'bookings.viewing_date',
        'properties.title as property_title',
        'properties.price',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name',
        'users.first_name as agent_first_name'
      )
      .limit(3);
      
    console.log(`✅ Full booking details (${fullBookings.length}):`);
    fullBookings.forEach(booking => {
      const customer = `${booking.customer_first_name} ${booking.customer_last_name}`;
      const agent = booking.agent_first_name || 'No agent';
      const viewing = booking.viewing_date ? new Date(booking.viewing_date).toLocaleDateString() : 'TBA';
      console.log(`  - ${customer} → ${booking.property_title} (${booking.price} AZN) - Agent: ${agent} - Viewing: ${viewing}`);
    });
    
    // Test statistics
    console.log('\n7. Database statistics...');
    const stats = await Promise.all([
      db('users').count('* as count').first(),
      db('properties').count('* as count').first(),
      db('customers').count('* as count').first(),
      db('bookings').count('* as count').first(),
      db('properties').where('status', 'active').count('* as count').first(),
      db('properties').where('category', 'sale').count('* as count').first(),
      db('properties').where('category', 'rent').count('* as count').first(),
      db('users').where('status', 'active').count('* as count').first(),
      db('bookings').where('status', 'confirmed').count('* as count').first()
    ]);
    
    console.log('📊 Database Statistics:');
    console.log(`  - Total Users: ${stats[0].count}`);
    console.log(`  - Total Properties: ${stats[1].count}`);
    console.log(`  - Total Customers: ${stats[2].count}`);
    console.log(`  - Total Bookings: ${stats[3].count}`);
    console.log(`  - Active Properties: ${stats[4].count}`);
    console.log(`  - Properties for Sale: ${stats[5].count}`);
    console.log(`  - Properties for Rent: ${stats[6].count}`);
    console.log(`  - Active Users: ${stats[7].count}`);
    console.log(`  - Confirmed Bookings: ${stats[8].count}`);
    
    console.log('\n🎉 New database structure test completed successfully!');
    
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
testNewStructure();