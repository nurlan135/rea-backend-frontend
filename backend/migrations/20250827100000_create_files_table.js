exports.up = function(knex) {
  return knex.schema.createTable('files', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('original_name').notNullable();
    table.string('file_name').notNullable();
    table.text('file_path').notNullable();
    table.text('thumbnail_path').nullable();
    table.bigInteger('file_size').notNullable();
    table.string('mime_type').notNullable();
    table.string('category').defaultTo('general');
    table.uuid('property_id').nullable().references('id').inTable('properties').onDelete('SET NULL');
    table.text('description').nullable();
    table.jsonb('tags').nullable();
    table.integer('download_count').defaultTo(0);
    table.uuid('uploaded_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('deleted_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index('property_id');
    table.index('category');
    table.index('mime_type');
    table.index('uploaded_by');
    table.index('created_at');
    table.index(['deleted_at', 'category']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('files');
};