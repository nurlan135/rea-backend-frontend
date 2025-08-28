require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;

// Production security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - adjust for test environment
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Higher limit for tests
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware with proper error handling
app.use(express.json({ 
  limit: '10mb'
}));
app.use(express.urlencoded({ extended: true }));

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Invalid JSON format' }
    });
  }
  next(err);
});

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Access token required' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Get fresh user data
    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'status')
      .where({ id: decoded.id })
      .first();
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_USER', message: 'User not found or inactive' }
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid access token' }
    });
  }
};

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    // Check if req.body exists and is valid
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST_BODY', message: 'Request body is required' }
      });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password required' }
      });
    }
    
    // Find user
    const user = await db('users')
      .select('*')
      .where({ email })
      .first();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Account is inactive' }
      });
    }
    
    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ 
        last_login_at: new Date(),
        updated_at: new Date()
      });
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          ...userWithoutPassword,
          permissions: typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : user.permissions || []
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'Login failed' }
    });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Properties endpoints
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const { status, category, type, limit = 10, offset = 0 } = req.query;
    
    let query = db('properties')
      .leftJoin('users', 'properties.agent_id', 'users.id')
      .select(
        'properties.*',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name',
        'users.email as agent_email'
      );
    
    // Apply filters
    if (status) query = query.where('properties.status', status);
    if (category) query = query.where('properties.category', category);
    if (type) query = query.where('properties.type', type);
    
    // Pagination
    const properties = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy('properties.created_at', 'desc');
    
    // Get total count
    const totalResult = await db('properties').count('* as total').first();
    
    res.json({
      success: true,
      data: properties,
      meta: {
        total: parseInt(totalResult.total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Properties fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch properties' }
    });
  }
});

app.get('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const property = await db('properties')
      .leftJoin('users', 'properties.agent_id', 'users.id')
      .select(
        'properties.*',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name',
        'users.email as agent_email',
        'users.phone as agent_phone'
      )
      .where('properties.id', req.params.id)
      .first();
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }
      });
    }
    
    res.json({
      success: true,
      data: property
    });
    
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch property' }
    });
  }
});

// Users endpoints
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Only admins can list all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' }
      });
    }
    
    const users = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at')
      .orderBy('created_at', 'desc');
    
    res.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch users' }
    });
  }
});

// Analytics endpoint
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('properties').count('* as count').first(),
      db('properties').where('status', 'active').count('* as count').first(),
      db('properties').where('category', 'sale').count('* as count').first(),
      db('properties').where('category', 'rent').count('* as count').first(),
      db('customers').count('* as count').first(),
      db('bookings').count('* as count').first(),
      db('bookings').where('status', 'confirmed').count('* as count').first(),
      db('users').where('status', 'active').count('* as count').first()
    ]);
    
    // Recent properties
    const recentProperties = await db('properties')
      .select('id', 'title', 'price', 'currency', 'status', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    res.json({
      success: true,
      data: {
        stats: {
          total_properties: parseInt(stats[0].count),
          active_properties: parseInt(stats[1].count),
          properties_for_sale: parseInt(stats[2].count),
          properties_for_rent: parseInt(stats[3].count),
          total_customers: parseInt(stats[4].count),
          total_bookings: parseInt(stats[5].count),
          confirmed_bookings: parseInt(stats[6].count),
          active_users: parseInt(stats[7].count)
        },
        recent_properties: recentProperties
      }
    });
    
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch analytics' }
    });
  }
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route was not found'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections...');
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connections...');
  await db.destroy();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 REA INVEST Production API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});