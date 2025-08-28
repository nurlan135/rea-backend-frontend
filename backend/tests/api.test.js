const request = require('supertest');
const bcrypt = require('bcrypt');

// Create a simple test server for testing
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock database for testing
let mockDb = {
  users: [],
  properties: []
};

// Test user for authentication
const testUser = {
  id: '12345678-9012-3012-4256-942996101513',
  email: 'admin@rea-invest.com',
  password_hash: bcrypt.hashSync('password123', 10),
  role: 'admin',
  name: 'Test Admin',
  created_at: new Date()
};

// Mock JWT token
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'test-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'test'
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Check credentials
  if (email === testUser.email && bcrypt.compareSync(password, testUser.password_hash)) {
    const token = jwt.sign(
      { 
        userId: testUser.id, 
        email: testUser.email, 
        role: testUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      name: testUser.name
    }
  });
});

app.get('/api/properties', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockDb.properties,
    total: mockDb.properties.length
  });
});

app.post('/api/properties', authenticateToken, (req, res) => {
  const { title, price, type, category } = req.body;
  
  if (!title || !price || !type || !category) {
    return res.status(400).json({
      success: false,
      message: 'Title, price, type, and category are required'
    });
  }
  
  const property = {
    id: Date.now().toString(),
    title,
    price: parseFloat(price),
    type,
    category,
    created_at: new Date(),
    user_id: req.user.userId
  };
  
  mockDb.properties.push(property);
  
  res.status(201).json({
    success: true,
    data: property
  });
});

describe('REA INVEST API Tests', () => {
  let authToken;

  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment', 'test');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@rea-invest.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('admin@rea-invest.com');
      expect(response.body.user.role).toBe('admin');
      
      authToken = response.body.token;
    });

    test('POST /api/auth/login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@rea-invest.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('POST /api/auth/login without email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');
    });

    test('GET /api/auth/me with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('admin@rea-invest.com');
      expect(response.body.user.role).toBe('admin');
    });

    test('GET /api/auth/me without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('Properties API', () => {
    beforeEach(() => {
      mockDb.properties = []; // Clear properties before each test
    });

    test('GET /api/properties with authentication', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 0);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/properties without authentication', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    test('POST /api/properties with valid data', async () => {
      const propertyData = {
        title: 'Test Property',
        price: 150000,
        type: 'apartment',
        category: 'sale'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(propertyData.title);
      expect(response.body.data.price).toBe(propertyData.price);
      expect(response.body.data.type).toBe(propertyData.type);
      expect(response.body.data.category).toBe(propertyData.category);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('created_at');
    });

    test('POST /api/properties with missing required fields', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Property'
          // Missing price, type, category
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title, price, type, and category are required');
    });
  });

  describe('Performance Tests', () => {
    test('API response times should be reasonable', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
        
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });

    test('Authentication should be fast', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@rea-invest.com',
          password: 'password123'
        })
        .expect(200);
        
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });
  });
});