/**
 * User Management Schema Enhancements
 * Adds necessary fields and indexes for admin user management functionality
 */

exports.up = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      // Check and add new columns for enhanced user management
      table.timestamp('last_password_change').defaultTo(knex.fn.now());
      table.integer('login_attempts').defaultTo(0);
      table.timestamp('locked_until').nullable();
      table.boolean('force_password_change').defaultTo(false);
    })
    .then(() => {
      // Create indexes for performance (one by one to avoid conflicts)
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_code)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL');
    })
    .then(() => {
      // Create email case-insensitive index
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email))');
    })
    .then(() => {
      // Enable pg_trgm extension for full-text search
      return knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    })
    .then(() => {
      // Create full-text search index
      return knex.raw(`
        CREATE INDEX IF NOT EXISTS idx_users_search 
        ON users USING GIN ((first_name || ' ' || last_name || ' ' || email) gin_trgm_ops)
      `);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      // Remove added columns
      table.dropColumn('last_password_change');
      table.dropColumn('login_attempts');
      table.dropColumn('locked_until');
      table.dropColumn('force_password_change');
      
      // Drop indexes (they will be dropped automatically with column drops)
    })
    .then(() => {
      // Drop custom indexes
      return knex.raw('DROP INDEX IF EXISTS idx_users_email_lower');
    })
    .then(() => {
      return knex.raw('DROP INDEX IF EXISTS idx_users_search');
    });
};