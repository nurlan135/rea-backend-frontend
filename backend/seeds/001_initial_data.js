const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('audit_logs').del();
  await knex('approvals').del();
  await knex('communications').del();
  await knex('expenses').del();
  await knex('deals').del();
  await knex('bookings').del();
  await knex('properties').del();
  await knex('customers').del();
  await knex('users').del();
  await knex('branches').del();
  await knex('roles').del();

  // Insert roles
  const roles = [
    {
      id: uuidv4(),
      name: 'admin',
      description: 'System Administrator',
      permissions: JSON.stringify({
        all: true
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'director',
      description: 'Company Director',
      permissions: JSON.stringify({
        properties: ['read', 'create', 'update', 'delete'],
        deals: ['read', 'create', 'update', 'approve'],
        reports: ['read', 'export'],
        users: ['read', 'create', 'update']
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'manager',
      description: 'Branch Manager',
      permissions: JSON.stringify({
        properties: ['read', 'create', 'update'],
        deals: ['read', 'create', 'update'],
        customers: ['read', 'create', 'update'],
        bookings: ['read', 'create', 'update'],
        expenses: ['read', 'approve'],
        reports: ['read']
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'agent',
      description: 'Real Estate Agent',
      permissions: JSON.stringify({
        properties: ['read', 'create', 'update'],
        customers: ['read', 'create', 'update'],
        bookings: ['read', 'create', 'update'],
        communications: ['read', 'create'],
        expenses: ['read', 'create']
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'accountant',
      description: 'Accountant',
      permissions: JSON.stringify({
        properties: ['read'],
        deals: ['read'],
        expenses: ['read', 'create', 'update'],
        reports: ['read', 'export']
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'vp',
      description: 'Vice President',
      permissions: JSON.stringify({
        properties: ['read', 'create', 'update'],
        deals: ['read', 'create', 'update', 'approve'],
        expenses: ['read', 'approve'],
        reports: ['read', 'export'],
        budget: ['approve']
      }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('roles').insert(roles);
  
  // Get role IDs for user creation
  const adminRole = await knex('roles').where('name', 'admin').first();
  const directorRole = await knex('roles').where('name', 'director').first();
  const managerRole = await knex('roles').where('name', 'manager').first();
  const agentRole = await knex('roles').where('name', 'agent').first();

  // Insert branches
  const branches = [
    {
      id: uuidv4(),
      name: 'Yasamal Filialı',
      code: 'YAS',
      address: 'Yasamal rayonu, Həsən Əliyev küçəsi 123',
      phone: '+994125551234',
      email: 'yasamal@rea-invest.com',
      is_active: true,
      commission_percent_rea: 2.5,
      commission_percent_branch: 2.5,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Nəsimi Filialı',
      code: 'NAS',
      address: 'Nəsimi rayonu, Azadlıq prospekti 456',
      phone: '+994125551235',
      email: 'nasimi@rea-invest.com',
      is_active: true,
      commission_percent_rea: 2.5,
      commission_percent_branch: 2.5,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('branches').insert(branches);
  
  const yasamalBranch = await knex('branches').where('code', 'YAS').first();
  const nasimiBranch = await knex('branches').where('code', 'NAS').first();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Insert users
  const users = [
    {
      id: uuidv4(),
      email: 'admin@rea-invest.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'İstifadəçi',
      phone: '+994501234567',
      role_id: adminRole.id,
      branch_id: yasamalBranch.id,
      is_active: true,
      preferences: JSON.stringify({
        language: 'az',
        theme: 'light'
      }),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'director@rea-invest.com',
      password_hash: hashedPassword,
      first_name: 'Rəşad',
      last_name: 'Məmmədov',
      father_name: 'Həsən',
      phone: '+994501234568',
      role_id: directorRole.id,
      branch_id: yasamalBranch.id,
      is_active: true,
      preferences: JSON.stringify({
        language: 'az',
        theme: 'light'
      }),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'manager@rea-invest.com',
      password_hash: hashedPassword,
      first_name: 'Leyla',
      last_name: 'Əliyeva',
      father_name: 'Mübariz',
      phone: '+994501234569',
      role_id: managerRole.id,
      branch_id: yasamalBranch.id,
      is_active: true,
      preferences: JSON.stringify({
        language: 'az',
        theme: 'light'
      }),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      email: 'agent@rea-invest.com',
      password_hash: hashedPassword,
      first_name: 'Əli',
      last_name: 'Həsənov',
      father_name: 'Vüsal',
      phone: '+994501234570',
      role_id: agentRole.id,
      branch_id: yasamalBranch.id,
      is_active: true,
      preferences: JSON.stringify({
        language: 'az',
        theme: 'light'
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('users').insert(users);

  // Insert sample customers
  const agent = await knex('users').where('email', 'agent@rea-invest.com').first();
  
  const customers = [
    {
      id: uuidv4(),
      first_name: 'Nigar',
      last_name: 'Quliyeva',
      father_name: 'Ramiz',
      phone: '+994701234567',
      email: 'nigar@example.com',
      type: 'buyer',
      address: 'Yasamal rayonu, Şərifzadə küçəsi 15',
      city: 'Bakı',
      notes: 'İki otaqlı mənzil axtarır',
      created_by_id: agent.id,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      first_name: 'Cavid',
      last_name: 'Rəhimov',
      father_name: 'Əkbər',
      phone: '+994701234568',
      type: 'seller',
      address: 'Nəsimi rayonu, 28 May küçəsi 89',
      city: 'Bakı',
      notes: 'Mənzil satmaq istəyir',
      created_by_id: agent.id,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('customers').insert(customers);

  // Insert sample property
  const properties = [
    {
      id: uuidv4(),
      code: 'REA-2024-001',
      project: 'Yeni Yasamal Kompleksi',
      building: 'A Blok',
      apt_no: '45',
      floor: 5,
      floors_total: 12,
      area_m2: 85.50,
      rooms_count: 2,
      status: 'active',
      category: 'sale',
      docs_type: 'Çıxarış',
      address: 'Yasamal rayonu, Həsən Əliyev küçəsi 123',
      district: 'Yasamal',
      street: 'Həsən Əliyev küçəsi',
      features: JSON.stringify(['balkon', 'təmir edilmiş', 'mərkəzi istilik']),
      images: JSON.stringify([]),
      buy_price_azn: 120000,
      target_price_azn: 150000,
      sell_price_azn: 145000,
      is_renovated: true,
      listing_type: 'agency_owned',
      branch_id: yasamalBranch.id,
      created_by_id: agent.id,
      assigned_to_id: agent.id,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('properties').insert(properties);

  console.log('Seed data inserted successfully!');
  console.log('Test users created:');
  console.log('- admin@rea-invest.com (password: password123)');
  console.log('- director@rea-invest.com (password: password123)'); 
  console.log('- manager@rea-invest.com (password: password123)');
  console.log('- agent@rea-invest.com (password: password123)');
};