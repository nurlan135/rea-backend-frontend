exports.up = function(knex) {
  return knex.schema
    // Update approvals table - add property_id column
    .alterTable('approvals', table => {
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE').notNullable();
      table.uuid('started_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('started_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.dropColumn('deal_id'); // Remove deal_id as we're focusing on properties first
    })
    
    // Create approval_steps table
    .createTable('approval_steps', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('approval_id').references('id').inTable('approvals').onDelete('CASCADE').notNullable();
      table.string('step').notNullable(); // manager, vp_budget, director, manager_publish
      table.integer('step_order').notNullable();
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
      table.string('required_role').notNullable(); // manager, vp, director
      table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('approved_at');
      table.text('comments');
      table.timestamps(true, true);
      
      table.index(['approval_id', 'step_order']);
      table.index(['status', 'required_role']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('approval_steps')
    .alterTable('approvals', table => {
      table.dropColumn('property_id');
      table.dropColumn('started_by');
      table.dropColumn('started_at');
      table.dropColumn('completed_at');
      table.uuid('deal_id').references('id').inTable('deals').onDelete('CASCADE').notNullable();
    });
};