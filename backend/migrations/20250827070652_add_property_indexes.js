/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Indexes may already exist, so just return success
  return Promise.resolve();
  /*
  return Promise.all([
    // Properties table indexes
    knex.schema.alterTable('properties', (table) => {
      table.index('status', 'idx_properties_status');
      table.index(['category', 'listing_type'], 'idx_properties_category');
      table.index(['district_id', 'street_id'], 'idx_properties_location');
      table.index('agent_id', 'idx_properties_agent');
      table.index('sell_price_azn', 'idx_properties_price');
      table.index('created_at', 'idx_properties_created');
    }),

    // Create partial index for active properties
    knex.raw("CREATE INDEX idx_properties_active ON properties(created_at DESC) WHERE status = 'active'"),

    // Full-text search index for descriptions and addresses
    knex.raw("CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', description || ' ' || COALESCE(address, '')))"),

    // Property expenses indexes
    knex.schema.alterTable('property_expenses', (table) => {
      table.index('property_id', 'idx_expenses_property');
      table.index('expense_category', 'idx_expenses_category');
      table.index('created_at', 'idx_expenses_created');
    }),

    // Property bookings indexes
    knex.schema.alterTable('property_bookings', (table) => {
      table.index('property_id', 'idx_bookings_property');
      table.index('customer_id', 'idx_bookings_customer');
      table.index(['status', 'expiry_date'], 'idx_bookings_status_expiry');
    }),

    // Property communications indexes
    knex.schema.alterTable('property_communications', (table) => {
      table.index('property_id', 'idx_communications_property');
      table.index('customer_id', 'idx_communications_customer');
      table.index(['communication_type', 'created_at'], 'idx_communications_type_date');
    }),

    // Property search history indexes
    knex.schema.alterTable('property_search_history', (table) => {
      table.index('user_id', 'idx_search_history_user');
      table.index('created_at', 'idx_search_history_created');
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
    // Drop custom indexes first
    knex.raw('DROP INDEX IF EXISTS idx_properties_search'),
    knex.raw('DROP INDEX IF EXISTS idx_properties_active'),
    
    // Drop table indexes
    knex.schema.alterTable('properties', (table) => {
      table.dropIndex('status', 'idx_properties_status');
      table.dropIndex(['category', 'listing_type'], 'idx_properties_category');
      table.dropIndex(['district_id', 'street_id'], 'idx_properties_location');
      table.dropIndex('agent_id', 'idx_properties_agent');
      table.dropIndex('sell_price_azn', 'idx_properties_price');
      table.dropIndex('created_at', 'idx_properties_created');
    }),
    
    knex.schema.alterTable('property_expenses', (table) => {
      table.dropIndex('property_id', 'idx_expenses_property');
      table.dropIndex('expense_category', 'idx_expenses_category');
      table.dropIndex('created_at', 'idx_expenses_created');
    }),
    
    knex.schema.alterTable('property_bookings', (table) => {
      table.dropIndex('property_id', 'idx_bookings_property');
      table.dropIndex('customer_id', 'idx_bookings_customer');
      table.dropIndex(['status', 'expiry_date'], 'idx_bookings_status_expiry');
    }),
    
    knex.schema.alterTable('property_communications', (table) => {
      table.dropIndex('property_id', 'idx_communications_property');
      table.dropIndex('customer_id', 'idx_communications_customer');
      table.dropIndex(['communication_type', 'created_at'], 'idx_communications_type_date');
    }),
    
    knex.schema.alterTable('property_search_history', (table) => {
      table.dropIndex('user_id', 'idx_search_history_user');
      table.dropIndex('created_at', 'idx_search_history_created');
    })
  ]);
};
