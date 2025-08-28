require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const path = require('path');

const db = require('./database');
const authRoutes = require('./routes/simple-auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const propertyRoutes = require('./routes/properties');
const customerRoutes = require('./routes/customers');
const bookingRoutes = require('./routes/bookings');
const filesRoutes = require('./routes/files');
const notificationsRoutes = require('./routes/notifications');
const cacheRoutes = require('./routes/cache');
const analyticsRoutes = require('./routes/analytics');
const databaseRoutes = require('./routes/database');
const swaggerRoutes = require('./routes/swagger');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Debug middleware
app.use('/api/auth', (req, res, next) => {
  console.log('Auth route hit:', req.method, req.path, req.body);
  next();
});

// Admin debug middleware
app.use('/api/admin', (req, res, next) => {
  console.log('Admin route hit:', req.method, req.originalUrl, req.path);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/database', databaseRoutes);

// API Documentation
app.use('/api/docs', swaggerRoutes);

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
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An internal server error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 REA INVEST API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});