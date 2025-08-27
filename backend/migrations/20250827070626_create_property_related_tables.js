/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Tables already exist, so just return success
  return Promise.resolve();
  /*
  return Promise.all([
    // Property Expenses Table
    knex.schema.createTable('property_expenses', (table) => {
      table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
      table.enu('expense_category', ['repair', 'docs', 'tax', 'agent_comm', 'admin', 'other']).notNullable();
      table.decimal('amount_azn', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('AZN');
      table.decimal('exchange_rate', 10, 4).defaultTo(1.0);
      table.text('description');
      table.string('receipt_url');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.uuid('approved_by').references('id').inTable('users');
      table.timestamp('approved_at');
    }),

    // Property Bookings Table (with unique constraint)
    knex.schema.createTable('property_bookings', (table) => {
      table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
      table.uuid('customer_id').references('id').inTable('customers');
      table.enu('status', ['ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED']).defaultTo('ACTIVE');
      table.date('booking_date').notNullable().defaultTo(knex.fn.now());
      table.date('expiry_date').notNullable();
      table.decimal('deposit_amount_azn', 10, 2);
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Unique constraint: only one active booking per property
      table.unique(['property_id'], {predicate: knex.whereRaw("status = 'ACTIVE'")});
    }),

    // Property Communications Log
    knex.schema.createTable('property_communications', (table) => {
      table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
      table.uuid('customer_id').references('id').inTable('customers');
      table.enu('communication_type', ['call', 'sms', 'whatsapp', 'email', 'visit']).notNullable();
      table.string('direction', 10).notNullable(); // inbound/outbound
      table.text('content');
      table.integer('duration_seconds'); // for calls
      table.string('status', 20); // delivered/read/failed
      table.string('external_id', 100); // provider message ID
      table.uuid('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    }),

    // Property Search History (for analytics)
    knex.schema.createTable('property_search_history', (table) => {
      table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      table.uuid('user_id').references('id').inTable('users');
      table.text('search_query');
      table.jsonb('filters'); // search criteria
      table.integer('results_count');
      table.integer('search_duration_ms');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
  ]);
  */
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('property_search_history'),
    knex.schema.dropTableIfExists('property_communications'),
    knex.schema.dropTableIfExists('property_bookings'),
    knex.schema.dropTableIfExists('property_expenses')
  ]);
};
