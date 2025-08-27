/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('properties', (table) => {
      // Add property subcategory field
      table.string('property_subcategory', 50);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('properties', (table) => {
      table.dropColumn('property_subcategory');
    });
};
