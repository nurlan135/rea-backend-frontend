require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function seedFreshData() {
  console.log('🌱 Seeding fresh test data...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin123',
    database: 'myapp_db'
  });
  
  try {
    await client.connect();
    
    // Create password hash
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Insert users
    console.log('1. Creating users...');
    const usersResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, branch_code, permissions, status)
      VALUES 
        ('admin@rea-invest.com', $1, 'Admin', 'User', '+994505551234', 'admin', 'HQ', '["*"]', 'active'),
        ('director@rea-invest.com', $1, 'Director', 'User', '+994505551235', 'director', 'YAS', '["properties:*", "users:*", "deals:*"]', 'active'),
        ('manager@rea-invest.com', $1, 'Manager', 'User', '+994505551236', 'manager', 'YAS', '["properties:read", "properties:update", "customers:*"]', 'active'),
        ('agent@rea-invest.com', $1, 'Agent', 'User', '+994505551237', 'agent', 'YAS', '["properties:read", "properties:create", "customers:*"]', 'active')
      RETURNING id, email, role
    `, [passwordHash]);
    
    console.log(`✅ Created ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    // Get agent ID for properties
    const agent = usersResult.rows.find(u => u.role === 'agent');
    const manager = usersResult.rows.find(u => u.role === 'manager');
    
    // Insert properties
    console.log('\n2. Creating properties...');
    const propertiesResult = await client.query(`
      INSERT INTO properties (title, description, price, currency, type, category, bedrooms, bathrooms, area, location, features, status, agent_id, commission_rate)
      VALUES 
        (
          'Yasamal rayonunda 3 otaqlı mənzil', 
          'Təmir olunmuş, əşyalı mənzil. Metro stansiyasına yaxın.',
          85000, 'AZN', 'apartment', 'sale', 3, 2, 95,
          '{"district": "Yasamal", "address": "Həsən Əliyev küçəsi 25", "coordinates": {"lat": 40.3777, "lng": 49.8920}}',
          '{"furnished": true, "parking": false, "balcony": true, "elevator": true}',
          'active', $1, 2.5
        ),
        (
          'Nəsimi rayonunda ofis sahəsi',
          'Biznes mərkəzində ofis. İcarə üçün əlverişli.',
          1200, 'AZN', 'office', 'rent', null, null, 150,
          '{"district": "Nəsimi", "address": "Nizami küçəsi 10", "coordinates": {"lat": 40.3847, "lng": 49.8920}}',
          '{"furnished": false, "parking": true, "elevator": true, "airConditioner": true}',
          'active', $1, 10.0
        ),
        (
          'Xətai rayonunda 2 otaqlı mənzil',
          'Yeni tikili, təmir tələb olunmur.',
          65000, 'AZN', 'apartment', 'sale', 2, 1, 75,
          '{"district": "Xətai", "address": "Atatürk prospekti 45", "coordinates": {"lat": 40.3956, "lng": 49.8814}}',
          '{"furnished": false, "parking": true, "balcony": false, "elevator": true}',
          'pending', $2, 2.5
        ),
        (
          'Səbail rayonunda villa',
          'Dəniz kənarında lüks villa.',
          250000, 'AZN', 'house', 'sale', 5, 3, 300,
          '{"district": "Səbail", "address": "Dənizçilər küçəsi 8", "coordinates": {"lat": 40.3656, "lng": 49.8484}}',
          '{"furnished": true, "parking": true, "garden": true, "pool": true}',
          'active', $1, 3.0
        ),
        (
          'Nərimanov rayonunda kiçik ofis',
          'Startaplar üçün əlverişli.',
          800, 'AZN', 'office', 'rent', null, null, 80,
          '{"district": "Nərimanov", "address": "Təbriz küçəsi 12", "coordinates": {"lat": 40.4093, "lng": 49.8671}}',
          '{"furnished": true, "parking": false, "elevator": false, "internet": true}',
          'active', $2, 8.0
        )
      RETURNING id, title, price, currency, status
    `, [agent.id, manager.id]);
    
    console.log(`✅ Created ${propertiesResult.rows.length} properties:`);
    propertiesResult.rows.forEach(prop => {
      console.log(`  - ${prop.title} - ${prop.price} ${prop.currency} (${prop.status})`);
    });
    
    // Insert customers
    console.log('\n3. Creating customers...');
    const customersResult = await client.query(`
      INSERT INTO customers (first_name, last_name, email, phone, address, type, notes, status, agent_id)
      VALUES 
        (
          'Əli', 'Məmmədov', 'ali.memmedov@gmail.com', '+994501234567',
          '{"district": "Yasamal", "address": "Koroğlu küçəsi 12"}',
          'buyer', 'Yasamalda mənzil axtarır', 'active', $1
        ),
        (
          'Günel', 'Əliyeva', 'gunel.aliyeva@gmail.com', '+994501234568',
          '{"district": "Nəsimi", "address": "Füzuli küçəsi 8"}',
          'seller', 'Nəsimidə mənzil satmaq istəyir', 'active', $1
        ),
        (
          'Rəşad', 'Quliyev', null, '+994501234569',
          '{"district": "Xətai", "address": "Müstəqillik küçəsi 15"}',
          'renter', 'Ofis icarəyə götürmək istəyir', 'active', $2
        ),
        (
          'Nigar', 'Həsənova', 'nigar.hasanова@gmail.com', '+994501234570',
          '{"district": "Səbail", "address": "Bulbul prospekti 22"}',
          'buyer', 'Villa axtarır', 'active', $1
        )
      RETURNING id, first_name, last_name, phone, type
    `, [agent.id, manager.id]);
    
    console.log(`✅ Created ${customersResult.rows.length} customers:`);
    customersResult.rows.forEach(customer => {
      console.log(`  - ${customer.first_name} ${customer.last_name} - ${customer.phone} (${customer.type})`);
    });
    
    // Insert bookings
    console.log('\n4. Creating bookings...');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const bookingsResult = await client.query(`
      INSERT INTO bookings (property_id, customer_id, agent_id, booking_date, viewing_date, status, notes)
      VALUES 
        ($1, $2, $3, NOW(), $4, 'confirmed', 'Müştəri çox maraqlanır'),
        ($5, $6, $3, NOW(), $7, 'pending', 'Ofis baxışı planlaşdırılıb')
      RETURNING id, status
    `, [
      propertiesResult.rows[0].id, // Yasamal mənzili
      customersResult.rows[0].id,  // Əli Məmmədov
      agent.id,
      tomorrow,
      propertiesResult.rows[1].id, // Nəsimi ofisi
      customersResult.rows[2].id,  // Rəşad Quliyev
      nextWeek
    ]);
    
    console.log(`✅ Created ${bookingsResult.rows.length} bookings:`);
    bookingsResult.rows.forEach(booking => {
      console.log(`  - Booking ${booking.id} (${booking.status})`);
    });
    
    await client.end();
    console.log('\n🎉 Fresh test data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Data seeding failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

seedFreshData();