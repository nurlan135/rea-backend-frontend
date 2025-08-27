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
    })
    
    // Users table
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('phone', 50);
      table.uuid('role_id').references('id').inTable('roles').onDelete('RESTRICT');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login_at');
      table.string('last_login_ip', 45);
      table.timestamps(true, true);
    })
    
    // Properties table (basic)
    .createTable('properties', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title', 500).notNullable();
      table.text('description');
      table.decimal('price', 15, 2);
      table.string('currency', 3).defaultTo('AZN');
      table.string('type', 50); // apartment, house, commercial
      table.string('status', 50).defaultTo('active');
      table.uuid('agent_id').references('id').inTable('users').onDelete('SET NULL');
      table.jsonb('metadata').defaultTo('{}');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('properties')
    .dropTableIfExists('users')
    .dropTableIfExists('roles');
};