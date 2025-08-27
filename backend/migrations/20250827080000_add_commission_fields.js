exports.up = function(knex) {
  return knex.schema.alterTable('deals', function(table) {
    // Add commission calculation fields
    table.decimal('profit_azn', 12, 2).nullable();
    table.decimal('rea_commission_azn', 10, 2).nullable();
    table.decimal('branch_commission_azn', 10, 2).nullable();
    // notes field already exists, skip it
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('deals', function(table) {
    table.dropColumn('profit_azn');
    table.dropColumn('rea_commission_azn');
    table.dropColumn('branch_commission_azn');
    // notes field was already there, don't drop it
  });
};