exports.up = function(knex) {
  return knex.schema.createTable('notification_settings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Notification channels
    table.boolean('email_notifications').defaultTo(true);
    table.boolean('push_notifications').defaultTo(true);
    table.boolean('sms_notifications').defaultTo(false);
    
    // Notification types
    table.boolean('property_updates').defaultTo(true);
    table.boolean('booking_updates').defaultTo(true);
    table.boolean('deal_updates').defaultTo(true);
    table.boolean('system_announcements').defaultTo(true);
    table.boolean('daily_digest').defaultTo(false);
    
    // Timing preferences
    table.time('quiet_hours_start').defaultTo('22:00');
    table.time('quiet_hours_end').defaultTo('08:00');
    
    table.timestamps(true, true);
    
    // Unique constraint
    table.unique('user_id');
    
    // Index
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notification_settings');
};