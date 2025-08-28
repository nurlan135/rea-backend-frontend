/**
 * Initial database schema for REA INVEST
 * Creates basic tables: users, properties, customers, bookings
 */

exports.up = function(knex) {
  return knex.schema
    // Users table
    .createTable('users', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone');
      table.enu('role', ['admin', 'director', 'manager', 'vp', 'agent']).notNullable();
      table.string('branch_code', 10);
      table.jsonb('permissions').defaultTo('[]');
      table.enu('status', ['active', 'inactive', 'suspended']).defaultTo('active');
      table.timestamp('last_login_at');
      table.timestamps(true, true);
      
      table.index(['email']);
      table.index(['role']);
      table.index(['status']);
    })
    
    // Properties table  
    .createTable('properties', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('description');
      table.decimal('price', 12, 2).notNullable();
      table.string('currency', 3).defaultTo('AZN');
      table.enu('type', ['apartment', 'house', 'commercial', 'land', 'office']).notNullable();
      table.enu('category', ['sale', 'rent']).notNullable();
      table.integer('bedrooms');
      table.integer('bathrooms');
      table.decimal('area', 8, 2);
      table.jsonb('location').notNullable(); // {district, address, coordinates}
      table.jsonb('features').defaultTo('{}'); // amenities, extras
      table.enu('status', ['active', 'pending', 'sold', 'rented', 'expired']).defaultTo('active');
      table.uuid('agent_id').references('id').inTable('users');
      table.decimal('commission_rate', 5, 2).defaultTo(2.5);
      table.timestamps(true, true);
      
      table.index(['status']);
      table.index(['type']);
      table.index(['category']);
      table.index(['agent_id']);
      table.index(['price']);
    })
    
    // Customers table
    .createTable('customers', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('email');
      table.string('phone').notNullable();
      table.jsonb('address').defaultTo('{}');
      table.enu('type', ['buyer', 'seller', 'renter', 'landlord']).notNullable();
      table.text('notes');
      table.enu('status', ['active', 'inactive']).defaultTo('active');
      table.uuid('agent_id').references('id').inTable('users');
      table.timestamps(true, true);
      
      table.index(['phone']);
      table.index(['email']);
      table.index(['type']);
      table.index(['agent_id']);
    })
    
    // Bookings table
    .createTable('bookings', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
      table.uuid('customer_id').references('id').inTable('customers').onDelete('CASCADE');
      table.uuid('agent_id').references('id').inTable('users');
      table.timestamp('booking_date').notNullable();
      table.timestamp('viewing_date');
      table.enu('status', ['pending', 'confirmed', 'completed', 'cancelled']).defaultTo('pending');
      table.text('notes');
      table.timestamps(true, true);
      
      table.index(['property_id']);
      table.index(['customer_id']);
      table.index(['agent_id']);
      table.index(['status']);
      table.index(['booking_date']);
      
      // Ensure only one active booking per property
      table.unique(['property_id'], {
        predicate: knex.whereIn('status', ['pending', 'confirmed'])
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('bookings')
    .dropTableIfExists('customers') 
    .dropTableIfExists('properties')
    .dropTableIfExists('users');
};