const knex = require('knex');

const db = knex({
  client: 'postgresql',
  connection: 'postgresql://admin:admin123@localhost:5432/myapp_db'
});

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    const result = await db.raw('SELECT email, first_name FROM users LIMIT 1');
    console.log('✅ Connection successful!');
    console.log('User found:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

testConnection();