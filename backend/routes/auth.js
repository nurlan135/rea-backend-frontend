const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authService = require('../lib/auth-service');

const router = express.Router();

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    const user = await authService.findUserByEmail('admin@rea-invest.com');
    
    res.json({
      success: true,
      message: 'Database connection successful via auth service',
      userFound: !!user,
      userEmail: user ? user.email : null
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Failed to connect to database',
        details: error.message
      }
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required'
        }
      });
    }

    // Simple hardcoded login for development
    let user;
    if (email === 'admin@rea-invest.com' && password === 'password123') {
      user = {
        id: '4ab61e36-4f90-4f78-94aa-14b2d3a40931',
        email: 'admin@rea-invest.com',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+994505551234',
        role_name: 'admin',
        permissions: ['*'],
        branch_name: 'Yasamal Filialı',
        branch_code: 'YAS'
      };
      
      console.log('Admin login successful');
    } else {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_name,
        branch: user.branch_code
      },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user info (without password)
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role_name,
          permissions: user.permissions,
          branch: {
            name: user.branch_name,
            code: user.branch_code
          }
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role_name,
          permissions: user.permissions,
          branch: {
            name: user.branch_name,
            code: user.branch_code
          }
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: 'An error occurred while fetching user info'
      }
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'ACCESS_TOKEN_REQUIRED',
        message: 'Access token is required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = user;
    next();
  });
}

module.exports = router;