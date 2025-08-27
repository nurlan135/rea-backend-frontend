/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Update existing properties table to add missing fields
  return knex.schema.alterTable('properties', (table) => {
    // Add new fields that don't exist yet
    table.string('property_code', 50).unique();
    table.decimal('rent_price_monthly_azn', 10, 2);
    table.jsonb('documents');
    table.enu('approval_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.uuid('agent_id').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('archived_at');
    table.timestamp('sold_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('properties', (table) => {
    table.dropColumn('property_code');
    table.dropColumn('rent_price_monthly_azn');
    table.dropColumn('documents');
    table.dropColumn('approval_status');
    table.dropColumn('agent_id');
    table.dropColumn('updated_by');
    table.dropColumn('archived_at');
    table.dropColumn('sold_at');
  });
};
