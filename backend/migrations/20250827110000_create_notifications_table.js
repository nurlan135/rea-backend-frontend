exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sender_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('recipient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    table.enu('type', [
      'property_approved',
      'property_rejected',
      'booking_confirmed', 
      'booking_cancelled',
      'deal_status_change',
      'new_property_assigned',
      'system_announcement',
      'reminder',
      'approval_request'
    ]).notNullable();
    
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.enu('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.text('action_url').nullable();
    
    // Related entities
    table.uuid('related_property_id').nullable().references('id').inTable('properties').onDelete('CASCADE');
    table.uuid('related_deal_id').nullable().references('id').inTable('deals').onDelete('CASCADE');
    table.uuid('related_booking_id').nullable().references('id').inTable('bookings').onDelete('CASCADE');
    
    table.timestamp('read_at').nullable();
    table.timestamp('expires_at').nullable();
    table.jsonb('metadata').nullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('recipient_id');
    table.index('sender_id');
    table.index('type');
    table.index('priority');
    table.index('read_at');
    table.index('created_at');
    table.index(['recipient_id', 'read_at']);
    table.index(['recipient_id', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};