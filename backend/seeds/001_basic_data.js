const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('users').del();
  await knex('roles').del();

  // Insert roles
  const roleIds = await knex('roles').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'admin',
      description: 'System Administrator',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        properties: ['create', 'read', 'update', 'delete'],
        all: true
      }),
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'), 
      name: 'agent',
      description: 'Real Estate Agent',
      permissions: JSON.stringify({
        properties: ['create', 'read', 'update'],
        customers: ['create', 'read', 'update']
      }),
      is_active: true
    }
  ]).returning('id');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert users
  await knex('users').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'admin@rea-invest.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      phone: '+994501234567',
      role_id: roleIds[0].id,
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'agent@rea-invest.com', 
      password_hash: hashedPassword,
      first_name: 'Agent',
      last_name: 'User',
      phone: '+994501234568',
      role_id: roleIds[1].id,
      is_active: true
    }
  ]);

  console.log('✅ Basic seed data inserted');
};