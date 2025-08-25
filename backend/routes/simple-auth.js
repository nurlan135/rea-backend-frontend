const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Simple login endpoint
router.post('/login', (req, res) => {
  console.log('Login request:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      }
    });
  }
  
  // Hardcoded admin login
  if (email === 'admin@rea-invest.com' && password === 'password123') {
    const token = jwt.sign(
      {
        id: '4ab61e36-4f90-4f78-94aa-14b2d3a40931',
        email: 'admin@rea-invest.com',
        role: 'admin',
        branch: 'YAS'
      },
      'development-secret',
      { expiresIn: '7d' }
    );
    
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: '4ab61e36-4f90-4f78-94aa-14b2d3a40931',
          email: 'admin@rea-invest.com',
          firstName: 'Admin',
          lastName: 'User',
          phone: '+994505551234',
          role: 'admin',
          permissions: ['*'],
          branch: {
            name: 'Yasamal Filialı',
            code: 'YAS'
          }
        }
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    error: {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    }
  });
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'No token provided' }
    });
  }
  
  try {
    const decoded = jwt.verify(token, 'development-secret');
    
    res.json({
      success: true,
      data: {
        user: {
          id: decoded.id,
          email: decoded.email,
          firstName: 'Admin',
          lastName: 'User',
          phone: '+994505551234',
          role: decoded.role,
          permissions: ['*'],
          branch: {
            name: 'Yasamal Filialı',
            code: decoded.branch
          }
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;