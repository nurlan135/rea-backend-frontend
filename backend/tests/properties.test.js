const request = require('supertest');
const app = require('../index');
const { setupTestDatabase, teardownTestDatabase, clearTestData, getTestDb } = require('./setup');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Properties Routes', () => {
  let db;
  let agentToken, managerToken, adminToken;
  let agentId, managerId, adminId;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    agentId = '550e8400-e29b-41d4-a716-446655440001';
    managerId = '550e8400-e29b-41d4-a716-446655440002';
    adminId = '550e8400-e29b-41d4-a716-446655440003';

    await db('users').insert([
      {
        id: agentId,
        email: 'agent@example.com',
        password: hashedPassword,
        first_name: 'Agent',
        last_name: 'User',
        role: 'agent',
        is_active: true
      },
      {
        id: managerId,
        email: 'manager@example.com',
        password: hashedPassword,
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
        is_active: true
      },
      {
        id: adminId,
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true
      }
    ]);

    // Generate auth tokens
    agentToken = jwt.sign(
      { id: agentId, email: 'agent@example.com', role: 'agent' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    managerToken = jwt.sign(
      { id: managerId, email: 'manager@example.com', role: 'manager' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    adminToken = jwt.sign(
      { id: adminId, email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/properties', () => {
    const validPropertyData = {
      title: 'Test Property',
      description: 'A test property description',
      category: 'sale',
      property_category: 'residential',
      listing_type: 'agency_owned',
      sell_price_azn: 150000,
      area_m2: 100,
      room_count: 3,
      floor: 5,
      total_floors: 10,
      address: 'Test Address, Baku',
      district_id: 1
    };

    it('should create property successfully as agent', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(validPropertyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.property).toHaveProperty('id');
      expect(response.body.data.property.title).toBe(validPropertyData.title);
      expect(response.body.data.property.agent_id).toBe(agentId);
      expect(response.body.data.property.approval_status).toBe('pending');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send(validPropertyData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Test Property'
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate property category enum', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          ...validPropertyData,
          property_category: 'invalid_category'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate numeric fields', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          ...validPropertyData,
          sell_price_azn: 'not-a-number'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should set approval status based on user role', async () => {
      // Manager can create pre-approved properties
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          ...validPropertyData,
          agent_id: agentId
        });

      expect(response.status).toBe(201);
      expect(response.body.data.property.approval_status).toBe('approved');
    });
  });

  describe('GET /api/properties', () => {
    beforeEach(async () => {
      // Create test properties
      await db('properties').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          title: 'Property 1',
          description: 'Description 1',
          category: 'sale',
          property_category: 'residential',
          listing_type: 'agency_owned',
          sell_price_azn: 100000,
          area_m2: 80,
          room_count: 2,
          floor: 3,
          total_floors: 8,
          address: 'Address 1',
          district_id: 1,
          agent_id: agentId,
          approval_status: 'approved',
          created_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          title: 'Property 2',
          description: 'Description 2',
          category: 'rent',
          property_category: 'commercial',
          listing_type: 'brokerage',
          rent_price_monthly_azn: 2000,
          area_m2: 120,
          floor: 1,
          total_floors: 5,
          address: 'Address 2',
          district_id: 2,
          agent_id: agentId,
          approval_status: 'pending',
          created_at: new Date()
        }
      ]);
    });

    it('should get all approved properties for public access', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(1); // Only approved properties
      expect(response.body.data.properties[0].approval_status).toBe('approved');
    });

    it('should get all properties for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(2); // All properties
    });

    it('should filter properties by category', async () => {
      const response = await request(app)
        .get('/api/properties?category=sale');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0].category).toBe('sale');
    });

    it('should filter properties by price range', async () => {
      const response = await request(app)
        .get('/api/properties?min_price=50000&max_price=120000');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(1);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/properties?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    it('should search properties by title', async () => {
      const response = await request(app)
        .get('/api/properties?search=Property 1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0].title).toContain('Property 1');
    });
  });

  describe('GET /api/properties/:id', () => {
    let propertyId;

    beforeEach(async () => {
      propertyId = '550e8400-e29b-41d4-a716-446655440020';
      await db('properties').insert({
        id: propertyId,
        title: 'Test Property',
        description: 'Test Description',
        category: 'sale',
        property_category: 'residential',
        listing_type: 'agency_owned',
        sell_price_azn: 150000,
        area_m2: 100,
        room_count: 3,
        floor: 5,
        total_floors: 10,
        address: 'Test Address',
        district_id: 1,
        agent_id: agentId,
        approval_status: 'approved',
        created_at: new Date()
      });
    });

    it('should get property by ID', async () => {
      const response = await request(app)
        .get(`/api/properties/${propertyId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.property.id).toBe(propertyId);
      expect(response.body.data.property.title).toBe('Test Property');
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .get(`/api/properties/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROPERTY_NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/properties/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should increment view count', async () => {
      // First request
      await request(app).get(`/api/properties/${propertyId}`);
      
      // Second request
      const response = await request(app)
        .get(`/api/properties/${propertyId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.property.view_count).toBe(2);
    });
  });

  describe('PUT /api/properties/:id', () => {
    let propertyId;

    beforeEach(async () => {
      propertyId = '550e8400-e29b-41d4-a716-446655440030';
      await db('properties').insert({
        id: propertyId,
        title: 'Original Title',
        description: 'Original Description',
        category: 'sale',
        property_category: 'residential',
        listing_type: 'agency_owned',
        sell_price_azn: 150000,
        area_m2: 100,
        room_count: 3,
        floor: 5,
        total_floors: 10,
        address: 'Original Address',
        district_id: 1,
        agent_id: agentId,
        approval_status: 'approved',
        created_at: new Date()
      });
    });

    it('should update property as owner', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        sell_price_azn: 200000
      };

      const response = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.property.title).toBe('Updated Title');
      expect(response.body.data.property.sell_price_azn).toBe(200000);
      expect(response.body.data.property.approval_status).toBe('pending'); // Reset to pending after update
    });

    it('should update property as manager/admin', async () => {
      const updateData = {
        title: 'Manager Updated Title'
      };

      const response = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.property.title).toBe('Manager Updated Title');
    });

    it('should fail to update property as different agent', async () => {
      // Create another agent
      const otherAgentId = '550e8400-e29b-41d4-a716-446655440004';
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await db('users').insert({
        id: otherAgentId,
        email: 'other@example.com',
        password: hashedPassword,
        first_name: 'Other',
        last_name: 'Agent',
        role: 'agent',
        is_active: true
      });

      const otherAgentToken = jwt.sign(
        { id: otherAgentId, email: 'other@example.com', role: 'agent' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${otherAgentToken}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          sell_price_azn: 'not-a-number'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    let propertyId;

    beforeEach(async () => {
      propertyId = '550e8400-e29b-41d4-a716-446655440040';
      await db('properties').insert({
        id: propertyId,
        title: 'To Be Deleted',
        description: 'This will be deleted',
        category: 'sale',
        property_category: 'residential',
        listing_type: 'agency_owned',
        sell_price_azn: 150000,
        area_m2: 100,
        room_count: 3,
        floor: 5,
        total_floors: 10,
        address: 'Delete Address',
        district_id: 1,
        agent_id: agentId,
        approval_status: 'approved',
        created_at: new Date()
      });
    });

    it('should soft delete property as owner', async () => {
      const response = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete
      const property = await db('properties').where('id', propertyId).first();
      expect(property.deleted_at).not.toBeNull();
      expect(property.deleted_by).toBe(agentId);
    });

    it('should soft delete property as admin', async () => {
      const response = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail to delete property as unauthorized agent', async () => {
      // Create another agent
      const otherAgentId = '550e8400-e29b-41d4-a716-446655440005';
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await db('users').insert({
        id: otherAgentId,
        email: 'other2@example.com',
        password: hashedPassword,
        first_name: 'Other',
        last_name: 'Agent',
        role: 'agent',
        is_active: true
      });

      const otherAgentToken = jwt.sign(
        { id: otherAgentId, email: 'other2@example.com', role: 'agent' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${otherAgentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('Property Statistics', () => {
    beforeEach(async () => {
      // Create test properties for statistics
      await db('properties').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440050',
          title: 'Stat Property 1',
          description: 'For stats',
          category: 'sale',
          property_category: 'residential',
          listing_type: 'agency_owned',
          sell_price_azn: 100000,
          area_m2: 80,
          room_count: 2,
          floor: 1,
          total_floors: 5,
          address: 'Stat Address 1',
          district_id: 1,
          agent_id: agentId,
          approval_status: 'approved',
          view_count: 10,
          created_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440051',
          title: 'Stat Property 2',
          description: 'For stats',
          category: 'rent',
          property_category: 'commercial',
          listing_type: 'brokerage',
          rent_price_monthly_azn: 1500,
          area_m2: 150,
          floor: 2,
          total_floors: 8,
          address: 'Stat Address 2',
          district_id: 2,
          agent_id: agentId,
          approval_status: 'approved',
          view_count: 25,
          created_at: new Date()
        }
      ]);
    });

    it('should calculate correct property statistics', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.totalProperties).toBe(2);
      
      // Verify properties are returned
      expect(response.body.data.properties).toHaveLength(2);
    });
  });
});