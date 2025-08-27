const { execSync } = require('child_process');
const knex = require('knex');
const config = require('../knexfile');

// Test database configuration
const testConfig = {
  ...config.development,
  connection: {
    ...config.development.connection,
    database: 'rea_invest_test'
  }
};

let db;

const setupTestDatabase = async () => {
  try {
    // Create test database if it doesn't exist
    const adminDb = knex({
      ...testConfig,
      connection: {
        ...testConfig.connection,
        database: 'postgres'
      }
    });

    try {
      await adminDb.raw('CREATE DATABASE rea_invest_test');
    } catch (error) {
      // Database already exists, ignore error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
    
    await adminDb.destroy();

    // Connect to test database
    db = knex(testConfig);

    // Run migrations
    await db.migrate.latest();

    // Run seeds for test data
    await db.seed.run();

    console.log('Test database setup completed');
    
    return db;
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};

const teardownTestDatabase = async () => {
  if (db) {
    await db.destroy();
  }
};

const clearTestData = async () => {
  if (db) {
    // Clear all tables in reverse order to avoid foreign key constraints
    const tables = [
      'notification_settings',
      'notifications',
      'files',
      'bookings',
      'deals',
      'properties',
      'customers',
      'users'
    ];

    for (const table of tables) {
      try {
        await db(table).del();
      } catch (error) {
        // Table might not exist, continue
        console.warn(`Warning: Could not clear table ${table}:`, error.message);
      }
    }

    // Reset auto-increment sequences if using PostgreSQL
    for (const table of tables) {
      try {
        await db.raw(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
      } catch (error) {
        // Ignore sequence reset errors
      }
    }
  }
};

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestDb: () => db
};