/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('Adding performance indexes...');

  // Properties table indexes
  await knex.schema.alterTable('properties', table => {
    // Search and filtering indexes
    table.index(['status'], 'idx_properties_status');
    table.index(['category'], 'idx_properties_category'); 
    table.index(['listing_type'], 'idx_properties_listing_type');
    table.index(['property_category'], 'idx_properties_property_category');
    table.index(['district_id'], 'idx_properties_district_id');
    table.index(['agent_id'], 'idx_properties_agent_id');
    table.index(['created_at'], 'idx_properties_created_at');
    table.index(['updated_at'], 'idx_properties_updated_at');
    
    // Price range indexes
    table.index(['sell_price_azn'], 'idx_properties_sell_price');
    table.index(['rent_price_monthly_azn'], 'idx_properties_rent_price');
    table.index(['area_m2'], 'idx_properties_area');
    
    // Composite indexes for common queries
    table.index(['status', 'category'], 'idx_properties_status_category');
    table.index(['listing_type', 'status'], 'idx_properties_listing_type_status');
    table.index(['agent_id', 'status'], 'idx_properties_agent_status');
    table.index(['district_id', 'category'], 'idx_properties_district_category');
    table.index(['property_category', 'status'], 'idx_properties_prop_category_status');
    
    // Price range with category
    table.index(['category', 'sell_price_azn'], 'idx_properties_category_sell_price');
    table.index(['category', 'rent_price_monthly_azn'], 'idx_properties_category_rent_price');
  });

  // Users table indexes
  await knex.schema.alterTable('users', table => {
    table.index(['role'], 'idx_users_role');
    table.index(['status'], 'idx_users_status');
    table.index(['created_at'], 'idx_users_created_at');
    table.index(['last_login_at'], 'idx_users_last_login');
  });

  // Bookings table indexes
  if (await knex.schema.hasTable('bookings')) {
    await knex.schema.alterTable('bookings', table => {
      table.index(['property_id'], 'idx_bookings_property_id');
      table.index(['customer_id'], 'idx_bookings_customer_id');
      table.index(['agent_id'], 'idx_bookings_agent_id');
      table.index(['status'], 'idx_bookings_status');
      table.index(['booking_date'], 'idx_bookings_date');
      table.index(['created_at'], 'idx_bookings_created_at');
      
      // Composite indexes
      table.index(['property_id', 'status'], 'idx_bookings_property_status');
      table.index(['agent_id', 'booking_date'], 'idx_bookings_agent_date');
    });
  }

  // Files table indexes
  if (await knex.schema.hasTable('files')) {
    await knex.schema.alterTable('files', table => {
      table.index(['property_id'], 'idx_files_property_id');
      table.index(['file_type'], 'idx_files_file_type');
      table.index(['uploaded_by'], 'idx_files_uploaded_by');
      table.index(['created_at'], 'idx_files_created_at');
      table.index(['is_primary'], 'idx_files_is_primary');
      
      // Composite indexes
      table.index(['property_id', 'file_type'], 'idx_files_property_type');
      table.index(['property_id', 'is_primary'], 'idx_files_property_primary');
    });
  }

  // Notifications table indexes
  if (await knex.schema.hasTable('notifications')) {
    await knex.schema.alterTable('notifications', table => {
      table.index(['user_id'], 'idx_notifications_user_id');
      table.index(['type'], 'idx_notifications_type');
      table.index(['is_read'], 'idx_notifications_is_read');
      table.index(['created_at'], 'idx_notifications_created_at');
      
      // Composite indexes for common queries
      table.index(['user_id', 'is_read'], 'idx_notifications_user_read');
      table.index(['user_id', 'created_at'], 'idx_notifications_user_created');
      table.index(['type', 'created_at'], 'idx_notifications_type_created');
    });
  }

  // Audit logs table indexes (if exists)
  if (await knex.schema.hasTable('audit_logs')) {
    await knex.schema.alterTable('audit_logs', table => {
      table.index(['table_name'], 'idx_audit_logs_table_name');
      table.index(['action'], 'idx_audit_logs_action');
      table.index(['user_id'], 'idx_audit_logs_user_id');
      table.index(['created_at'], 'idx_audit_logs_created_at');
      
      // Composite indexes
      table.index(['table_name', 'action'], 'idx_audit_logs_table_action');
      table.index(['table_name', 'record_id'], 'idx_audit_logs_table_record');
      table.index(['user_id', 'created_at'], 'idx_audit_logs_user_created');
    });
  }

  console.log('Performance indexes added successfully');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('Removing performance indexes...');

  // Properties table indexes
  await knex.schema.alterTable('properties', table => {
    table.dropIndex([], 'idx_properties_status');
    table.dropIndex([], 'idx_properties_category');
    table.dropIndex([], 'idx_properties_listing_type');
    table.dropIndex([], 'idx_properties_property_category');
    table.dropIndex([], 'idx_properties_district_id');
    table.dropIndex([], 'idx_properties_agent_id');
    table.dropIndex([], 'idx_properties_created_at');
    table.dropIndex([], 'idx_properties_updated_at');
    table.dropIndex([], 'idx_properties_sell_price');
    table.dropIndex([], 'idx_properties_rent_price');
    table.dropIndex([], 'idx_properties_area');
    table.dropIndex([], 'idx_properties_status_category');
    table.dropIndex([], 'idx_properties_listing_type_status');
    table.dropIndex([], 'idx_properties_agent_status');
    table.dropIndex([], 'idx_properties_district_category');
    table.dropIndex([], 'idx_properties_prop_category_status');
    table.dropIndex([], 'idx_properties_category_sell_price');
    table.dropIndex([], 'idx_properties_category_rent_price');
  });

  // Users table indexes
  await knex.schema.alterTable('users', table => {
    table.dropIndex([], 'idx_users_role');
    table.dropIndex([], 'idx_users_status');
    table.dropIndex([], 'idx_users_created_at');
    table.dropIndex([], 'idx_users_last_login');
  });

  // Other table indexes (conditional)
  if (await knex.schema.hasTable('bookings')) {
    await knex.schema.alterTable('bookings', table => {
      table.dropIndex([], 'idx_bookings_property_id');
      table.dropIndex([], 'idx_bookings_customer_id');
      table.dropIndex([], 'idx_bookings_agent_id');
      table.dropIndex([], 'idx_bookings_status');
      table.dropIndex([], 'idx_bookings_date');
      table.dropIndex([], 'idx_bookings_created_at');
      table.dropIndex([], 'idx_bookings_property_status');
      table.dropIndex([], 'idx_bookings_agent_date');
    });
  }

  if (await knex.schema.hasTable('files')) {
    await knex.schema.alterTable('files', table => {
      table.dropIndex([], 'idx_files_property_id');
      table.dropIndex([], 'idx_files_file_type');
      table.dropIndex([], 'idx_files_uploaded_by');
      table.dropIndex([], 'idx_files_created_at');
      table.dropIndex([], 'idx_files_is_primary');
      table.dropIndex([], 'idx_files_property_type');
      table.dropIndex([], 'idx_files_property_primary');
    });
  }

  if (await knex.schema.hasTable('notifications')) {
    await knex.schema.alterTable('notifications', table => {
      table.dropIndex([], 'idx_notifications_user_id');
      table.dropIndex([], 'idx_notifications_type');
      table.dropIndex([], 'idx_notifications_is_read');
      table.dropIndex([], 'idx_notifications_created_at');
      table.dropIndex([], 'idx_notifications_user_read');
      table.dropIndex([], 'idx_notifications_user_created');
      table.dropIndex([], 'idx_notifications_type_created');
    });
  }

  if (await knex.schema.hasTable('audit_logs')) {
    await knex.schema.alterTable('audit_logs', table => {
      table.dropIndex([], 'idx_audit_logs_table_name');
      table.dropIndex([], 'idx_audit_logs_action');
      table.dropIndex([], 'idx_audit_logs_user_id');
      table.dropIndex([], 'idx_audit_logs_created_at');
      table.dropIndex([], 'idx_audit_logs_table_action');
      table.dropIndex([], 'idx_audit_logs_table_record');
      table.dropIndex([], 'idx_audit_logs_user_created');
    });
  }

  console.log('Performance indexes removed successfully');
};