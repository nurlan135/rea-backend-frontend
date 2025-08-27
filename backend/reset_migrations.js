const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function resetMigrations() {
  try {
    console.log('Connecting to database...');
    
    // Drop migration tables to reset state
    await db.raw('DROP TABLE IF EXISTS knex_migrations CASCADE');
    await db.raw('DROP TABLE IF EXISTS knex_migrations_lock CASCADE');
    
    console.log('Migration tables dropped successfully');
    
    // Close connection
    await db.destroy();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetMigrations();