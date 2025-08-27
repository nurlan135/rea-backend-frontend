/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create districts table
    .createTable('districts', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.string('city', 50).defaultTo('Baku');
      table.timestamps(true, true);
    })
    
    // Create streets table
    .createTable('streets', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 200).notNullable();
      table.uuid('district_id').references('id').inTable('districts').onDelete('CASCADE');
      table.timestamps(true, true);
    })
    
    // Create complexes table
    .createTable('complexes', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 200).notNullable();
      table.string('location', 300);
      table.enum('type', ['residential', 'commercial', 'mixed']).defaultTo('residential');
      table.timestamps(true, true);
    })
    
    // Create document_types table
    .createTable('document_types', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.string('code', 20).unique();
      table.timestamps(true, true);
    })
    
    // Add new columns to properties table
    .alterTable('properties', (table) => {
      table.enum('property_category', ['residential', 'commercial']).defaultTo('residential');
      table.uuid('complex_id').references('id').inTable('complexes').onDelete('SET NULL');
      table.string('complex_manual', 200); // Manual entry if complex not in list
      // Skip floor column - already exists
      table.string('block', 10); // A, B, C etc.
      table.decimal('height', 4, 2); // 4.1, 3.2 etc.
      table.integer('entrance_door');
      table.uuid('district_id').references('id').inTable('districts').onDelete('SET NULL');
      table.uuid('street_id').references('id').inTable('streets').onDelete('SET NULL');
      table.enum('room_count', ['1', '2', '2st', '3', '3st', '4', '5']);
      table.uuid('document_type_id').references('id').inTable('document_types').onDelete('SET NULL');
    })
    
    // Remove target_price_azn column from properties
    .alterTable('properties', (table) => {
      table.dropColumn('target_price_azn');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    // Add back target_price_azn column to properties
    .alterTable('properties', (table) => {
      table.decimal('target_price_azn', 12, 2);
    })
    
    // Remove new columns from properties table
    .alterTable('properties', (table) => {
      table.dropColumn('property_category');
      table.dropColumn('complex_id');
      table.dropColumn('complex_manual');
      // Skip floor column - keep original
      table.dropColumn('block');
      table.dropColumn('height');
      table.dropColumn('entrance_door');
      table.dropColumn('district_id');
      table.dropColumn('street_id');
      table.dropColumn('room_count');
      table.dropColumn('document_type_id');
    })
    
    // Drop new tables in reverse order
    .dropTableIfExists('document_types')
    .dropTableIfExists('complexes')
    .dropTableIfExists('streets')
    .dropTableIfExists('districts');
};
