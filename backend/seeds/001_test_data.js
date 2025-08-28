const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  console.log('🌱 Seeding test data...');
  
  // Clear existing entries (in correct order due to foreign keys)
  await knex('bookings').del();
  await knex('properties').del(); 
  await knex('customers').del();
  await knex('users').del();
  
  // Create password hash
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Insert users
  const users = await knex('users').insert([
    {
      email: 'admin@rea-invest.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      phone: '+994505551234',
      role: 'admin',
      branch_code: 'HQ',
      permissions: JSON.stringify(['*']),
      status: 'active'
    },
    {
      email: 'director@rea-invest.com', 
      password_hash: passwordHash,
      first_name: 'Director',
      last_name: 'User',
      phone: '+994505551235',
      role: 'director',
      branch_code: 'YAS',
      permissions: JSON.stringify(['properties:*', 'users:*', 'deals:*']),
      status: 'active'
    },
    {
      email: 'manager@rea-invest.com',
      password_hash: passwordHash,
      first_name: 'Manager', 
      last_name: 'User',
      phone: '+994505551236',
      role: 'manager',
      branch_code: 'YAS',
      permissions: JSON.stringify(['properties:read', 'properties:update', 'customers:*']),
      status: 'active'
    },
    {
      email: 'agent@rea-invest.com',
      password_hash: passwordHash,
      first_name: 'Agent',
      last_name: 'User', 
      phone: '+994505551237',
      role: 'agent',
      branch_code: 'YAS',
      permissions: JSON.stringify(['properties:read', 'properties:create', 'customers:*']),
      status: 'active'
    }
  ]).returning('*');
  
  console.log(`✅ Created ${users.length} users`);
  
  // Get agent ID for properties
  const agent = users.find(u => u.role === 'agent');
  
  // Insert properties
  const properties = await knex('properties').insert([
    {
      title: 'Yasamal rayonunda 3 otaqlı mənzil',
      description: 'Təmir olunmuş, əşyalı mənzil. Metro stansiyasına yaxın.',
      price: 85000,
      currency: 'AZN',
      type: 'apartment',
      category: 'sale',
      bedrooms: 3,
      bathrooms: 2,
      area: 95,
      location: JSON.stringify({
        district: 'Yasamal',
        address: 'Həsən Əliyev küçəsi 25',
        coordinates: { lat: 40.3777, lng: 49.8920 }
      }),
      features: JSON.stringify({
        furnished: true,
        parking: false,
        balcony: true,
        elevator: true
      }),
      status: 'active',
      agent_id: agent.id,
      commission_rate: 2.5
    },
    {
      title: 'Nəsimi rayonunda ofis sahəsi',
      description: 'Biznes mərkəzində ofis. İcarə üçün əlverişli.',
      price: 1200,
      currency: 'AZN', 
      type: 'office',
      category: 'rent',
      area: 150,
      location: JSON.stringify({
        district: 'Nəsimi',
        address: 'Nizami küçəsi 10',
        coordinates: { lat: 40.3847, lng: 49.8920 }
      }),
      features: JSON.stringify({
        furnished: false,
        parking: true,
        elevator: true,
        airConditioner: true
      }),
      status: 'active',
      agent_id: agent.id,
      commission_rate: 10
    },
    {
      title: 'Xətai rayonunda 2 otaqlı mənzil',
      description: 'Yeni tikili, təmir tələb olunmur.',
      price: 65000,
      currency: 'AZN',
      type: 'apartment', 
      category: 'sale',
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      location: JSON.stringify({
        district: 'Xətai',
        address: 'Atatürk prospekti 45',
        coordinates: { lat: 40.3956, lng: 49.8814 }
      }),
      features: JSON.stringify({
        furnished: false,
        parking: true,
        balcony: false,
        elevator: true
      }),
      status: 'pending',
      agent_id: agent.id,
      commission_rate: 2.5
    }
  ]).returning('*');
  
  console.log(`✅ Created ${properties.length} properties`);
  
  // Insert customers
  const customers = await knex('customers').insert([
    {
      first_name: 'Əli',
      last_name: 'Məmmədov',
      email: 'ali.memmedov@gmail.com',
      phone: '+994501234567',
      address: JSON.stringify({
        district: 'Yasamal',
        address: 'Koroğlu küçəsi 12'
      }),
      type: 'buyer',
      notes: 'Yasamalda mənzil axtarır',
      status: 'active',
      agent_id: agent.id
    },
    {
      first_name: 'Günel',
      last_name: 'Əliyeva',
      phone: '+994501234568', 
      address: JSON.stringify({
        district: 'Nəsimi',
        address: 'Füzuli küçəsi 8'
      }),
      type: 'seller',
      notes: 'Nəsimidə mənzil satmaq istəyir',
      status: 'active',
      agent_id: agent.id
    }
  ]).returning('*');
  
  console.log(`✅ Created ${customers.length} customers`);
  
  // Insert bookings
  const bookings = await knex('bookings').insert([
    {
      property_id: properties[0].id,
      customer_id: customers[0].id,
      agent_id: agent.id,
      booking_date: new Date(),
      viewing_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'confirmed',
      notes: 'Müştəri çox maraqlanır'
    }
  ]).returning('*');
  
  console.log(`✅ Created ${bookings.length} bookings`);
  console.log('🎉 Test data seeded successfully!');
};