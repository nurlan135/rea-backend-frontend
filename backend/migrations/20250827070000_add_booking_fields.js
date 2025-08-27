exports.up = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    // Add missing fields for booking conversion and cancellation
    table.timestamp('converted_at').nullable();
    table.timestamp('cancelled_at').nullable();
    table.uuid('deal_id').references('id').inTable('deals').onDelete('SET NULL').nullable();
    table.text('cancel_reason').nullable();
    // notes field already exists, skip it
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    table.dropColumn('converted_at');
    table.dropColumn('cancelled_at'); 
    table.dropColumn('deal_id');
    table.dropColumn('cancel_reason');
    // notes field was already there, don't drop it
  });
};