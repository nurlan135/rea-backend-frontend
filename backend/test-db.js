const db = require('./database');

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await db.raw('SELECT 1 as test');
    console.log('✅ Database connection successful:', result);
    
    // Run migrations
    console.log('\n2. Running migrations...');
    await db.migrate.latest();
    console.log('✅ Migrations completed successfully');
    
    // List tables
    console.log('\n3. Listing tables...');
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name");
    console.log('📊 Available tables:', tables.map(t => t.name));
    
    // Seed some test data if properties table exists
    const hasPropertiesTable = tables.some(t => t.name === 'properties');
    if (hasPropertiesTable) {
      console.log('\n4. Testing properties table...');
      
      // Insert test property
      const [propertyId] = await db('properties').insert({
        title: 'Test Property - Yasamal',
        description: 'Test description for database check',
        price: 75000,
        currency: 'AZN',
        type: 'apartment',
        category: 'sale',
        bedrooms: 2,
        bathrooms: 1,
        area: 85,
        location: JSON.stringify({
          district: 'Yasamal',
          address: 'Test küçəsi 1'
        }),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');
      
      console.log('✅ Test property inserted with ID:', propertyId);
      
      // Query properties
      const properties = await db('properties').select('*').limit(5);
      console.log('🏠 Sample properties:', properties.length);
      properties.forEach(p => {
        console.log(`  - ${p.title} (${p.price} ${p.currency}) - ${p.status}`);
      });
      
      // Update test
      await db('properties').where('id', propertyId).update({
        status: 'sold',
        updated_at: new Date()
      });
      console.log('✅ Property status updated to sold');
      
      // Delete test property
      await db('properties').where('id', propertyId).del();
      console.log('✅ Test property deleted');
    }
    
    // Test users table if exists
    const hasUsersTable = tables.some(t => t.name === 'users');
    if (hasUsersTable) {
      console.log('\n5. Testing users table...');
      const users = await db('users').select('*').limit(3);
      console.log('👥 Sample users:', users.length);
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - ${u.status}`);
      });
    }
    
    console.log('\n🎉 All database tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testDatabase();