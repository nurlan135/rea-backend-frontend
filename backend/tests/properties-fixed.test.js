const request = require('supertest');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Create a test server with properties endpoints
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  const JWT_SECRET = 'rea-invest-test-secret-key';

  // Mock properties data
  let mockProperties = [
    {
      id: uuidv4(),
      title: 'Beautiful 3-bedroom apartment',
      description: 'Spacious apartment in city center',
      price: 250000,
      currency: 'AZN',
      type: 'apartment',
      category: 'sale',
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      location: 'Baku, Yasamal district',
      latitude: 40.4093,
      longitude: 49.8671,
      status: 'active',
      listing_type: 'agency_owned',
      user_id: '12345678-9012-3012-4256-942996101513',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      title: 'Modern villa with garden',
      description: 'Luxury villa in suburban area',
      price: 450000,
      currency: 'AZN',
      type: 'villa',
      category: 'sale',
      bedrooms: 4,
      bathrooms: 3,
      area: 300,
      location: 'Baku, Binagadi district',
      latitude: 40.3780,
      longitude: 49.8420,
      status: 'active',
      listing_type: 'branch_owned',
      user_id: '87654321-9012-3012-4256-942996101513',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Authentication middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };

  // Properties routes
  app.get('/api/properties', authenticateToken, (req, res) => {
    try {
      const { page = 1, limit = 10, type, category, minPrice, maxPrice, search } = req.query;
      
      let filteredProperties = [...mockProperties];

      // Apply filters
      if (type) {
        filteredProperties = filteredProperties.filter(p => p.type === type);
      }
      
      if (category) {
        filteredProperties = filteredProperties.filter(p => p.category === category);
      }
      
      if (minPrice) {
        filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
      }
      
      if (maxPrice) {
        filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProperties = filteredProperties.filter(p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.location.toLowerCase().includes(searchLower)
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedProperties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredProperties.length,
          totalPages: Math.ceil(filteredProperties.length / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  app.get('/api/properties/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const property = mockProperties.find(p => p.id === id);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      res.json({
        success: true,
        data: property
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  app.post('/api/properties', authenticateToken, (req, res) => {
    try {
      const {
        title,
        description,
        price,
        currency = 'AZN',
        type,
        category,
        bedrooms,
        bathrooms,
        area,
        location,
        latitude,
        longitude,
        listing_type = 'agency_owned'
      } = req.body;

      // Validation
      if (!title || !price || !type || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, price, type, and category are required'
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0'
        });
      }

      const validTypes = ['apartment', 'house', 'villa', 'office', 'commercial', 'land'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Type must be one of: ${validTypes.join(', ')}`
        });
      }

      const validCategories = ['sale', 'rent', 'lease'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${validCategories.join(', ')}`
        });
      }

      const newProperty = {
        id: uuidv4(),
        title,
        description: description || '',
        price: parseFloat(price),
        currency,
        type,
        category,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseFloat(area) : null,
        location: location || '',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: 'active',
        listing_type,
        user_id: req.user.userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockProperties.push(newProperty);

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: newProperty
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  app.put('/api/properties/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const propertyIndex = mockProperties.findIndex(p => p.id === id);

      if (propertyIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const property = mockProperties[propertyIndex];

      // Check if user owns the property or is admin
      if (property.user_id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own properties'
        });
      }

      const {
        title,
        description,
        price,
        currency,
        type,
        category,
        bedrooms,
        bathrooms,
        area,
        location,
        latitude,
        longitude,
        status
      } = req.body;

      // Update property
      const updatedProperty = {
        ...property,
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(currency && { currency }),
        ...(type && { type }),
        ...(category && { category }),
        ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
        ...(bathrooms && { bathrooms: parseInt(bathrooms) }),
        ...(area && { area: parseFloat(area) }),
        ...(location && { location }),
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
        ...(status && { status }),
        updated_at: new Date()
      };

      mockProperties[propertyIndex] = updatedProperty;

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: updatedProperty
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  app.delete('/api/properties/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const propertyIndex = mockProperties.findIndex(p => p.id === id);

      if (propertyIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const property = mockProperties[propertyIndex];

      // Check if user owns the property or is admin
      if (property.user_id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own properties'
        });
      }

      mockProperties.splice(propertyIndex, 1);

      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  // Search endpoint
  app.get('/api/properties/search/advanced', authenticateToken, (req, res) => {
    try {
      const {
        query,
        type,
        category,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        minArea,
        maxArea,
        location,
        radius = 10
      } = req.query;

      let filteredProperties = [...mockProperties];

      if (query) {
        const queryLower = query.toLowerCase();
        filteredProperties = filteredProperties.filter(p =>
          p.title.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower)
        );
      }

      if (type) {
        filteredProperties = filteredProperties.filter(p => p.type === type);
      }

      if (category) {
        filteredProperties = filteredProperties.filter(p => p.category === category);
      }

      if (minPrice) {
        filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
      }

      if (maxPrice) {
        filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
      }

      if (minBedrooms) {
        filteredProperties = filteredProperties.filter(p => p.bedrooms >= parseInt(minBedrooms));
      }

      if (maxBedrooms) {
        filteredProperties = filteredProperties.filter(p => p.bedrooms <= parseInt(maxBedrooms));
      }

      if (minArea) {
        filteredProperties = filteredProperties.filter(p => p.area >= parseFloat(minArea));
      }

      if (maxArea) {
        filteredProperties = filteredProperties.filter(p => p.area <= parseFloat(maxArea));
      }

      if (location) {
        const locationLower = location.toLowerCase();
        filteredProperties = filteredProperties.filter(p =>
          p.location.toLowerCase().includes(locationLower)
        );
      }

      res.json({
        success: true,
        data: filteredProperties,
        total: filteredProperties.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });

  return app;
};

describe('Properties API Tests', () => {
  let app;
  let authToken;
  let testPropertyId;

  beforeAll(() => {
    app = createTestApp();

    // Generate a test token
    authToken = jwt.sign(
      {
        userId: '12345678-9012-3012-4256-942996101513',
        email: 'admin@rea-invest.com',
        role: 'admin'
      },
      'rea-invest-test-secret-key',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/properties', () => {
    test('should get all properties with valid token', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    test('should filter properties by type', async () => {
      const response = await request(app)
        .get('/api/properties?type=apartment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(p => p.type === 'apartment')).toBe(true);
    });

    test('should filter properties by price range', async () => {
      const response = await request(app)
        .get('/api/properties?minPrice=200000&maxPrice=300000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(p => p.price >= 200000 && p.price <= 300000)).toBe(true);
    });

    test('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/properties?search=apartment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(p =>
        p.title.toLowerCase().includes('apartment') ||
        p.description.toLowerCase().includes('apartment') ||
        p.location.toLowerCase().includes('apartment')
      )).toBe(true);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/properties?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/properties/:id', () => {
    test('should get specific property by ID', async () => {
      // First get all properties to get an ID
      const propertiesResponse = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const propertyId = propertiesResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(propertyId);
    });

    test('should return 404 for non-existent property', async () => {
      const response = await request(app)
        .get('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });
  });

  describe('POST /api/properties', () => {
    test('should create new property with valid data', async () => {
      const newProperty = {
        title: 'Test Property',
        description: 'Test description',
        price: 150000,
        currency: 'AZN',
        type: 'apartment',
        category: 'sale',
        bedrooms: 2,
        bathrooms: 1,
        area: 80,
        location: 'Test location'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProperty)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property created successfully');
      expect(response.body.data.title).toBe(newProperty.title);
      expect(response.body.data.price).toBe(newProperty.price);
      expect(response.body.data.id).toBeDefined();
      
      testPropertyId = response.body.data.id;
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Property'
          // Missing price, type, category
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title, price, type, and category are required');
    });

    test('should fail with invalid property type', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Property',
          price: 100000,
          type: 'invalid-type',
          category: 'sale'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Type must be one of');
    });

    test('should fail with invalid price', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Property',
          price: -1000,
          type: 'apartment',
          category: 'sale'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Price must be greater than 0');
    });
  });

  describe('PUT /api/properties/:id', () => {
    test('should update property with valid data', async () => {
      const updateData = {
        title: 'Updated Test Property',
        price: 180000
      };

      const response = await request(app)
        .put(`/api/properties/${testPropertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property updated successfully');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.price).toBe(updateData.price);
    });

    test('should return 404 for non-existent property', async () => {
      const response = await request(app)
        .put('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    test('should delete property successfully', async () => {
      const response = await request(app)
        .delete(`/api/properties/${testPropertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Property deleted successfully');
    });

    test('should return 404 for already deleted property', async () => {
      const response = await request(app)
        .delete(`/api/properties/${testPropertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Property not found');
    });
  });

  describe('GET /api/properties/search/advanced', () => {
    test('should perform advanced search', async () => {
      const response = await request(app)
        .get('/api/properties/search/advanced?query=apartment&minPrice=100000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeDefined();
    });

    test('should filter by multiple criteria', async () => {
      const response = await request(app)
        .get('/api/properties/search/advanced?type=villa&category=sale&minBedrooms=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(p =>
        p.type === 'villa' &&
        p.category === 'sale' &&
        p.bedrooms >= 3
      )).toBe(true);
    });
  });

  describe('Authorization Tests', () => {
    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    test('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});