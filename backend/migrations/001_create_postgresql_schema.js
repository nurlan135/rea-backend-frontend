/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Roles table
    .createTable('roles', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 50).notNullable().unique();
      table.text('description');
      table.jsonb('permissions').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      // Indexes
      table.index('name');
      table.index('is_active');
    })
    
    // Branches table
    .createTable('branches', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 200).notNullable();
      table.string('code', 20).notNullable().unique();
      table.text('address');
      table.string('phone', 50);
      table.string('email', 255);
      table.uuid('manager_id').references('id').inTable('users').onDelete('SET NULL');
      table.boolean('is_active').defaultTo(true);
      table.decimal('commission_percent_rea', 5, 2).defaultTo(2.5);
      table.decimal('commission_percent_branch', 5, 2).defaultTo(2.5);
      table.timestamps(true, true);
      
      // Indexes
      table.index('code');
      table.index('manager_id');
      table.index('is_active');
    })
    
    // Users table
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('father_name', 100);
      table.string('phone', 50);
      table.uuid('role_id').references('id').inTable('roles').onDelete('RESTRICT');
      table.uuid('branch_id').references('id').inTable('branches').onDelete('SET NULL');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login_at');
      table.inet('last_login_ip');
      table.jsonb('preferences').defaultTo('{}');
      table.timestamps(true, true);
      
      // Indexes
      table.index('email');
      table.index('role_id');
      table.index('branch_id');
      table.index('is_active');
      table.index(['first_name', 'last_name']);
    })
    
    // Customers table
    .createTable('customers', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('father_name', 100);
      table.string('phone', 50);
      table.string('email', 255);
      table.enum('type', ['seller', 'buyer', 'tenant']).notNullable();
      table.text('address');
      table.string('city', 100);
      table.jsonb('kyc').defaultTo('{}');
      table.text('notes');
      table.uuid('created_by_id').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      
      // Indexes
      table.index(['first_name', 'last_name']);
      table.index('phone');
      table.index('email');
      table.index('type');
      table.index('created_by_id');
      
      // Constraints
      table.check('length(trim(first_name)) > 0');
      table.check('length(trim(last_name)) > 0');
      table.check('phone IS NOT NULL OR email IS NOT NULL');
    })
    
    // Properties table  
    .createTable('properties', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('code', 50).notNullable().unique();
      table.string('project', 200);
      table.string('building', 200);
      table.string('apt_no', 20);
      table.integer('floor').defaultTo(0);
      table.integer('floors_total');
      table.decimal('area_m2', 8, 2);
      table.integer('rooms_count');
      table.enum('status', ['pending', 'active', 'sold', 'archived']).defaultTo('pending');
      table.enum('category', ['sale', 'rent']).notNullable();
      table.string('docs_type', 100);
      table.text('address');
      table.string('district', 100);
      table.string('street', 200);
      table.jsonb('features').defaultTo('[]');
      table.jsonb('images').defaultTo('[]');
      table.jsonb('videos').defaultTo('[]');
      table.decimal('buy_price_azn', 12, 2);
      table.decimal('target_price_azn', 12, 2);
      table.decimal('sell_price_azn', 12, 2);
      table.boolean('is_renovated').defaultTo(false);
      table.enum('listing_type', ['agency_owned', 'branch_owned', 'brokerage']).notNullable();
      table.string('owner_first_name', 100);
      table.string('owner_last_name', 100);
      table.string('owner_father_name', 100);
      table.string('owner_contact', 200);
      table.decimal('brokerage_commission_percent', 5, 2);
      table.uuid('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
      table.uuid('created_by_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('assigned_to_id').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      
      // Indexes
      table.index('code');
      table.index('status');
      table.index('category');
      table.index('listing_type');
      table.index('branch_id');
      table.index('created_by_id');
      table.index('assigned_to_id');
      table.index(['district', 'street']);
      
      // Constraints
      table.check('area_m2 > 0');
      table.check('floor >= 0');
      table.check('floors_total >= floor');
      table.check('target_price_azn >= 0');
      table.check('sell_price_azn >= 0');
    })
    
    // Bookings table
    .createTable('bookings', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE').notNullable();
      table.uuid('customer_id').references('id').inTable('customers').onDelete('CASCADE').notNullable();
      table.decimal('deposit_amount', 10, 2);
      table.timestamp('end_date').notNullable();
      table.enum('status', ['ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED']).notNullable();
      table.text('notes');
      table.uuid('created_by_id').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      
      // Indexes
      table.index('property_id');
      table.index('customer_id');
      table.index('status');
      table.index('created_by_id');
      table.index('end_date');
    })
    .then(() => {
      // Add unique constraint for active bookings after table creation
      return knex.schema.raw(`
        CREATE UNIQUE INDEX booking_active_unique 
        ON bookings (property_id) WHERE status = 'ACTIVE'
      `);
    })
    .then(() => {
      return knex.schema
        // Deals table
        .createTable('deals', table => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('property_id').references('id').inTable('properties').onDelete('RESTRICT').notNullable();
          table.uuid('customer_id').references('id').inTable('customers').onDelete('RESTRICT');
          table.enum('type', ['buy', 'sell', 'rent', 'brokerage']).notNullable();
          table.uuid('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
          table.decimal('buy_price_azn', 12, 2);
          table.decimal('sell_price_azn', 12, 2);
          table.timestamp('closed_at');
          table.enum('deal_type', ['direct', 'brokerage']);
          table.decimal('brokerage_percent', 5, 2);
          table.decimal('brokerage_amount', 10, 2);
          table.enum('payout_status', ['pending', 'approved', 'paid']).defaultTo('pending');
          table.timestamp('payout_date');
          table.string('invoice_no', 100);
          table.string('partner_agency', 200);
          table.text('notes');
          table.uuid('created_by_id').references('id').inTable('users').onDelete('SET NULL');
          table.timestamps(true, true);
          
          // Indexes
          table.index('property_id');
          table.index('customer_id');
          table.index('type');
          table.index('branch_id');
          table.index('payout_status');
          table.index('closed_at');
        })
        
        // Expenses table
        .createTable('expenses', table => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('deal_id').references('id').inTable('deals').onDelete('CASCADE');
          table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
          table.enum('category', ['repair', 'docs', 'tax', 'agent_comm', 'admin', 'other']).notNullable();
          table.decimal('amount_azn', 10, 2).notNullable();
          table.enum('currency', ['AZN', 'USD', 'EUR']).defaultTo('AZN');
          table.decimal('fx_rate', 8, 4).defaultTo(1.0);
          table.decimal('original_amount', 10, 2);
          table.text('note');
          table.timestamp('spent_at').defaultTo(knex.fn.now());
          table.jsonb('receipt_files').defaultTo('[]');
          table.uuid('created_by_id').references('id').inTable('users').onDelete('SET NULL');
          table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
          table.timestamps(true, true);
          
          // Indexes
          table.index('deal_id');
          table.index('property_id');
          table.index('category');
          table.index('created_by_id');
          table.index('spent_at');
          
          // Constraints
          table.check('amount_azn > 0');
          table.check('spent_at <= NOW()');
        })
        
        // Communications table
        .createTable('communications', table => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('customer_id').references('id').inTable('customers').onDelete('CASCADE');
          table.uuid('property_id').references('id').inTable('properties').onDelete('SET NULL');
          table.uuid('deal_id').references('id').inTable('deals').onDelete('SET NULL');
          table.enum('type', ['call', 'sms', 'whatsapp']).notNullable();
          table.enum('direction', ['in', 'out']).notNullable();
          table.enum('status', ['logged', 'sent', 'delivered', 'failed', 'read']).defaultTo('logged');
          table.string('caller_id', 50);
          table.string('recipient', 100);
          table.integer('duration_sec').defaultTo(0);
          table.text('message');
          table.string('template_id', 36);
          table.string('provider', 50);
          table.jsonb('meta').defaultTo('{}');
          table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
          table.timestamps(true, true);
          
          // Indexes
          table.index('customer_id');
          table.index('property_id');
          table.index('deal_id');
          table.index('type');
          table.index('created_by');
          table.index('created_at');
          
          // Constraints
          table.check('duration_sec >= 0');
          table.check('customer_id IS NOT NULL OR property_id IS NOT NULL OR deal_id IS NOT NULL');
        })
        
        // Approvals table
        .createTable('approvals', table => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('deal_id').references('id').inTable('deals').onDelete('CASCADE').notNullable();
          table.enum('step', ['manager', 'vp', 'director']).notNullable();
          table.enum('status', ['pending', 'approved', 'rejected']).notNullable();
          table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
          table.text('note');
          table.timestamp('approved_at');
          table.timestamps(true, true);
          
          // Indexes
          table.index('deal_id');
          table.index('step');
          table.index('status');
          table.index('user_id');
        })
        
        // Audit logs table
        .createTable('audit_logs', table => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('actor_id').references('id').inTable('users').onDelete('SET NULL');
          table.string('entity', 50).notNullable();
          table.uuid('entity_id').notNullable();
          table.enum('action', ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'CONVERT', 'CANCEL']).notNullable();
          table.jsonb('before');
          table.jsonb('after');
          table.inet('ip');
          table.string('user_agent', 500);
          table.jsonb('meta').defaultTo('{}');
          table.timestamps(true, true);
          
          // Indexes
          table.index('actor_id');
          table.index('entity');
          table.index('entity_id');
          table.index('action');
          table.index('created_at');
          table.index(['entity', 'entity_id']);
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('approvals')  
    .dropTableIfExists('communications')
    .dropTableIfExists('expenses')
    .dropTableIfExists('deals')
    .dropTableIfExists('bookings')
    .dropTableIfExists('properties')
    .dropTableIfExists('customers')
    .dropTableIfExists('users')
    .dropTableIfExists('branches')
    .dropTableIfExists('roles');
};