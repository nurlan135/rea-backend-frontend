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
  
  // Simple check
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
    res.json({
      success: true,
      data: {
        user: {
          id: decoded.id,
          email: decoded.email,
          firstName: 'Admin',
          lastName: 'User',
          role: decoded.role,
          permissions: ['*'],
          branch: { name: 'Yasamal Filialı', code: decoded.branch }
        }
      }
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