require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'REA INVEST Test Server is running'
  });
});

// Test Auth
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CREDENTIALS', message: 'Email and password required' }
    });
  }
  
  // Test users
  const testUsers = {
    'admin@rea-invest.com': { role: 'admin', name: 'Admin User' },
    'agent@rea-invest.com': { role: 'agent', name: 'Agent User' },
    'manager@rea-invest.com': { role: 'manager', name: 'Manager User' }
  };
  
  if (testUsers[email] && password === 'password123') {
    const user = testUsers[email];
    const token = jwt.sign(
      { id: Math.random().toString(), email, role: user.role },
      'test-secret',
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      data: {
        token,
        user: {
          email,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ')[1],
          role: user.role,
          permissions: user.role === 'admin' ? ['*'] : ['properties:read']
        }
      }
    });
  }
  
  res.status(401).json({
    success: false,
    error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
  });
});

// Test Properties
app.get('/api/properties', (req, res) => {
  const sampleProperties = [
    {
      id: '1',
      title: 'Yasamal rayonunda 3 otaqlı mənzil',
      description: 'Təmir olunmuş, əşyalı mənzil',
      price: 85000,
      currency: 'AZN',
      type: 'apartment',
      category: 'sale',
      bedrooms: 3,
      bathrooms: 2,
      area: 95,
      location: { district: 'Yasamal', address: 'Həsən Əliyev küçəsi 25' },
      status: 'active',
      agent_id: 'agent1',
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      title: 'Nəsimi rayonunda ofis sahəsi',
      description: 'Biznes mərkəzində ofis',
      price: 120000,
      currency: 'AZN',
      type: 'commercial',
      category: 'sale',
      area: 150,
      location: { district: 'Nəsimi', address: 'Nizami küçəsi 10' },
      status: 'pending',
      agent_id: 'agent2',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: sampleProperties,
    meta: { total: sampleProperties.length }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 REA INVEST Test Server running on port', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('✅ Test login: admin@rea-invest.com / password123');
  console.log('✅ API: http://localhost:' + PORT + '/api/properties');
});