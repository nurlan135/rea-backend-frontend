/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('properties', (table) => {
      // Modify building column to be shorter (for building numbers only)
      table.string('building', 20).alter();
      
      // Add construction_type column for villa/house construction types
      table.enum('construction_type', ['brick', 'monolith', 'panel', 'wood', 'mixed']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('properties', (table) => {
      // Revert building column to original size
      table.string('building', 200).alter();
      
      // Drop construction_type column
      table.dropColumn('construction_type');
    });
};
