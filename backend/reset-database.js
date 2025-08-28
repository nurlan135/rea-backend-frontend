require('dotenv').config();
const { Client } = require('pg');

async function resetDatabase() {
  console.log('🗑️  Resetting database...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin123',
    database: 'postgres' // Connect to default database to manage others
  });
  
  try {
    await client.connect();
    
    // Terminate all connections to myapp_db
    console.log('1. Terminating connections to myapp_db...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity 
      WHERE datname = 'myapp_db' AND pid <> pg_backend_pid()
    `);
    
    // Drop database if exists
    console.log('2. Dropping existing database...');
    await client.query('DROP DATABASE IF EXISTS myapp_db');
    console.log('✅ Database dropped');
    
    // Create fresh database
    console.log('3. Creating fresh database...');
    await client.query('CREATE DATABASE myapp_db');
    console.log('✅ Fresh database created');
    
    await client.end();
    
    // Now connect to the fresh database and create tables
    console.log('\n4. Creating new structure...');
    const appClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'admin',
      password: 'admin123',
      database: 'myapp_db'
    });
    
    await appClient.connect();
    
    // Enable UUID extension
    await appClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');
    
    // Create users table
    console.log('5. Creating users table...');
    await appClient.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'director', 'manager', 'vp', 'agent')),
        branch_code VARCHAR(10),
        permissions JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Create properties table
    console.log('6. Creating properties table...');
    await appClient.query(`
      CREATE TABLE properties (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'AZN',
        type VARCHAR(50) NOT NULL CHECK (type IN ('apartment', 'house', 'commercial', 'land', 'office')),
        category VARCHAR(20) NOT NULL CHECK (category IN ('sale', 'rent')),
        bedrooms INTEGER,
        bathrooms INTEGER,
        area DECIMAL(8,2),
        location JSONB NOT NULL,
        features JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'expired')),
        agent_id UUID REFERENCES users(id),
        commission_rate DECIMAL(5,2) DEFAULT 2.5,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Properties table created');
    
    // Create customers table
    console.log('7. Creating customers table...');
    await appClient.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        address JSONB DEFAULT '{}',
        type VARCHAR(20) NOT NULL CHECK (type IN ('buyer', 'seller', 'renter', 'landlord')),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        agent_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Customers table created');
    
    // Create bookings table
    console.log('8. Creating bookings table...');
    await appClient.query(`
      CREATE TABLE bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES users(id),
        booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
        viewing_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Bookings table created');
    
    // Create indexes for better performance
    console.log('9. Creating indexes...');
    const indexes = [
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_users_role ON users(role)',
      'CREATE INDEX idx_properties_status ON properties(status)',
      'CREATE INDEX idx_properties_type ON properties(type)',
      'CREATE INDEX idx_properties_category ON properties(category)',
      'CREATE INDEX idx_properties_agent ON properties(agent_id)',
      'CREATE INDEX idx_customers_phone ON customers(phone)',
      'CREATE INDEX idx_customers_type ON customers(type)',
      'CREATE INDEX idx_bookings_property ON bookings(property_id)',
      'CREATE INDEX idx_bookings_customer ON bookings(customer_id)',
      'CREATE INDEX idx_bookings_status ON bookings(status)'
    ];
    
    for (const index of indexes) {
      await appClient.query(index);
    }
    console.log('✅ Indexes created');
    
    await appClient.end();
    console.log('\n🎉 Database reset and new structure created successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
  }
}

resetDatabase();