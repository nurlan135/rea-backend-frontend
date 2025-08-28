/**
 * Admin Security Middleware
 * Provides enhanced security measures for admin operations
 */

const rateLimit = require('express-rate-limit');

// Admin-specific rate limiting
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.' }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for whitelisted IPs
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
    return allowedIPs.includes(req.ip);
  }
});

// Require admin role middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { 
        code: 'ADMIN_REQUIRED', 
        message: 'Bu əməliyyat üçün admin icazəsi tələb olunur' 
      }
    });
  }

  next();
};

// IP Whitelist middleware for admin operations
const requireWhitelistIP = (req, res, next) => {
  // Skip in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    // If no whitelist configured, allow all (with warning)
    console.warn('Warning: No admin IP whitelist configured. All IPs allowed for admin operations.');
    return next();
  }

  if (!allowedIPs.includes(req.ip)) {
    console.warn(`Blocked admin access attempt from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: { 
        code: 'IP_NOT_ALLOWED', 
        message: 'Bu IP ünvanından admin əməliyyatlarına icazə verilmir' 
      }
    });
  }

  next();
};

// Enhanced audit logging for user management actions
const auditUserAction = (action) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request data
    const auditData = {
      actor_id: req.user?.id,
      action,
      entity_type: 'user',
      entity_id: req.params.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_data: req.body,
      before_state: null,
      timestamp: new Date()
    };

    // Get before state for updates/deletes
    if (['UPDATE', 'DELETE', 'RESET_PASSWORD', 'UNLOCK'].includes(action) && req.params.id) {
      try {
        const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
        const beforeState = await knex('users')
          .select(['id', 'email', 'first_name', 'last_name', 'role', 'status', 'permissions', 'login_attempts', 'locked_until'])
          .where('id', req.params.id)
          .first();
        auditData.before_state = beforeState;
      } catch (error) {
        console.error('Error getting before state for audit:', error);
      }
    }

    // Override response methods to capture response
    res.send = function(data) {
      auditData.response_data = data;
      auditData.status_code = res.statusCode;
      auditData.success = res.statusCode >= 200 && res.statusCode < 300;
      
      // Write audit log
      writeAuditLog(auditData);
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      auditData.response_data = data;
      auditData.status_code = res.statusCode;
      auditData.success = res.statusCode >= 200 && res.statusCode < 300;
      
      // Write audit log
      writeAuditLog(auditData);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Write audit log to database
async function writeAuditLog(auditData) {
  try {
    const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
    
    await knex('audit_logs').insert({
      actor_id: auditData.actor_id,
      entity_type: auditData.entity_type,
      entity_id: auditData.entity_id,
      action: auditData.action,
      before_state: auditData.before_state ? JSON.stringify(auditData.before_state) : null,
      after_state: auditData.response_data ? JSON.stringify(auditData.response_data) : null,
      metadata: JSON.stringify({
        status_code: auditData.status_code,
        success: auditData.success,
        request_data: auditData.request_data,
        ip_address: auditData.ip_address,
        user_agent: auditData.user_agent
      }),
      ip_address: auditData.ip_address,
      user_agent: auditData.user_agent,
      created_at: auditData.timestamp
    });
    
    console.log(`Audit log written: ${auditData.action} by user ${auditData.actor_id} on ${auditData.entity_type} ${auditData.entity_id}`);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

// Comprehensive request logging
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip} - User: ${req.user?.id || 'anonymous'} (${req.user?.role || 'no-role'})`);
  next();
};

// Brute force protection for admin operations
const brutForceProtection = (req, res, next) => {
  // This will be enhanced with Redis/memory store for failed attempts
  // For now, using basic in-memory tracking
  if (!global.adminFailedAttempts) {
    global.adminFailedAttempts = new Map();
  }

  const clientKey = `${req.ip}_${req.user?.id || 'anonymous'}`;
  const attempts = global.adminFailedAttempts.get(clientKey) || { count: 0, lastAttempt: null };

  // Reset counter if last attempt was more than 1 hour ago
  if (attempts.lastAttempt && Date.now() - attempts.lastAttempt > 60 * 60 * 1000) {
    global.adminFailedAttempts.delete(clientKey);
    attempts.count = 0;
  }

  // Check if blocked
  if (attempts.count >= 5) {
    const blockTimeRemaining = 60 * 60 * 1000 - (Date.now() - attempts.lastAttempt);
    if (blockTimeRemaining > 0) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'BRUTE_FORCE_PROTECTION',
          message: 'Çox sayda uğursuz cəhd. Zəhmət olmasa bir saat sonra yenidən cəhd edin.',
          blockTimeRemaining: Math.ceil(blockTimeRemaining / 1000 / 60) // minutes
        }
      });
    }
  }

  next();
};

// Enhanced session validation
const validateSession = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    // Check if user still exists and is active
    const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
    const user = await knex('users')
      .select('id', 'status', 'last_password_change', 'force_password_change')
      .where('id', req.user.id)
      .first();

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: { code: 'SESSION_INVALID', message: 'Sessiyanız artıq keçərli deyil' }
      });
    }

    // Check if password was changed after token issuance
    const tokenIssuedAt = req.user.iat * 1000; // Convert to milliseconds
    if (user.last_password_change && new Date(user.last_password_change).getTime() > tokenIssuedAt) {
      return res.status(401).json({
        success: false,
        error: { code: 'PASSWORD_CHANGED', message: 'Parol dəyişdirildiyi üçün yenidən daxil olmalısınız' }
      });
    }

    // Check if forced password change is required
    if (user.force_password_change) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'PASSWORD_CHANGE_REQUIRED', 
          message: 'Davam etmək üçün parol dəyişdirməlisiniz'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_VALIDATION_ERROR', message: 'Session doğrulanmasında xəta' }
    });
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Additional security headers for admin operations
  res.setHeader('X-Admin-Request', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// Audit critical admin actions
const auditCriticalAction = (action, entityType = 'system') => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    const auditData = {
      actor_id: req.user?.id,
      action: `CRITICAL_${action}`,
      entity_type: entityType,
      entity_id: req.params.id || 'system',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_data: req.body,
      timestamp: new Date(),
      severity: 'HIGH'
    };

    // Override response methods to capture response
    res.send = function(data) {
      auditData.response_data = data;
      auditData.status_code = res.statusCode;
      auditData.success = res.statusCode >= 200 && res.statusCode < 300;
      
      // Write to audit log with high priority
      writeCriticalAuditLog(auditData);
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      auditData.response_data = data;
      auditData.status_code = res.statusCode;
      auditData.success = res.statusCode >= 200 && res.statusCode < 300;
      
      // Write to audit log with high priority
      writeCriticalAuditLog(auditData);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Write critical audit log
async function writeCriticalAuditLog(auditData) {
  try {
    const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
    
    await knex('audit_logs').insert({
      actor_id: auditData.actor_id,
      entity_type: auditData.entity_type,
      entity_id: auditData.entity_id,
      action: auditData.action,
      before_state: null,
      after_state: auditData.response_data ? JSON.stringify(auditData.response_data) : null,
      metadata: JSON.stringify({
        status_code: auditData.status_code,
        success: auditData.success,
        request_data: auditData.request_data,
        ip_address: auditData.ip_address,
        user_agent: auditData.user_agent,
        severity: auditData.severity
      }),
      ip_address: auditData.ip_address,
      user_agent: auditData.user_agent,
      created_at: auditData.timestamp
    });
    
    // Also log to console for immediate visibility
    console.warn(`🚨 CRITICAL ACTION: ${auditData.action} by user ${auditData.actor_id} from ${auditData.ip_address}`);
    
    // TODO: Send alert to administrators if needed
    
  } catch (error) {
    console.error('Failed to write critical audit log:', error);
  }
}

module.exports = {
  adminRateLimit,
  requireAdmin,
  requireWhitelistIP,
  auditUserAction,
  logRequest,
  brutForceProtection,
  validateSession,
  securityHeaders,
  auditCriticalAction
};