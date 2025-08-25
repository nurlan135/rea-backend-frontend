const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CREDENTIALS', message: 'Email and password required' }
    });
  }
  
  // Simple check - Admin
  if (email === 'admin@rea-invest.com' && password === 'password123') {
    const token = jwt.sign(
      { id: '1', email, role: 'admin', branch: 'YAS' },
      'dev-secret',
      { expiresIn: '7d' }
    );
    
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: '1',
          email: 'admin@rea-invest.com',
          firstName: 'Admin',
          lastName: 'User',
          phone: '+994505551234',
          role: 'admin',
          permissions: ['*'],
          branch: { name: 'Yasamal Filialı', code: 'YAS' }
        }
      }
    });
  }
  
  // Simple check - Agent
  if (email === 'agent@rea-invest.com' && password === 'password123') {
    const token = jwt.sign(
      { id: '2', email, role: 'agent', branch: 'YAS' },
      'dev-secret',
      { expiresIn: '7d' }
    );
    
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: '2',
          email: 'agent@rea-invest.com',
          firstName: 'Agent',
          lastName: 'User',
          phone: '+994505551235',
          role: 'agent',
          permissions: ['properties:read', 'properties:create', 'customers:read', 'customers:create'],
          branch: { name: 'Yasamal Filialı', code: 'YAS' }
        }
      }
    });
  }
  
  res.status(401).json({
    success: false,
    error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
  });
});

// Me endpoint
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'NO_TOKEN' } });
  }
  
  try {
    const decoded = jwt.verify(token, 'dev-secret');
    
    // Build user data based on role
    let userData = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      branch: { name: 'Yasamal Filialı', code: decoded.branch }
    };
    
    if (decoded.role === 'admin') {
      userData.firstName = 'Admin';
      userData.lastName = 'User';
      userData.permissions = ['*'];
    } else if (decoded.role === 'agent') {
      userData.firstName = 'Agent';
      userData.lastName = 'User';
      userData.permissions = ['properties:read', 'properties:create', 'customers:read', 'customers:create'];
    }
    
    res.json({
      success: true,
      data: { user: userData }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN' } });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload routes  
try {
  const uploadRouter = require('./routes/upload-local');
  app.use('/api/uploads', uploadRouter);
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.error('❌ Upload routes error:', error.message);
}

app.listen(8000, () => {
  console.log('🚀 Simple REA INVEST Server on port 8000');
  console.log('✅ Login: admin@rea-invest.com / password123');
});