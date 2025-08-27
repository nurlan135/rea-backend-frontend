const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function dropAllTables() {
  try {
    console.log('Connecting to database...');
    
    // Drop all tables in correct order (reverse dependency order)
    const tables = [
      'audit_logs',
      'approvals',
      'communications', 
      'expenses',
      'deals',
      'bookings',
      'properties',
      'customers',
      'users',
      'branches',
      'roles',
      'knex_migrations',
      'knex_migrations_lock'
    ];
    
    for (const table of tables) {
      try {
        await db.raw(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.log(`Table ${table} not found, skipping...`);
      }
    }
    
    console.log('All tables dropped successfully');
    
    // Close connection
    await db.destroy();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropAllTables();