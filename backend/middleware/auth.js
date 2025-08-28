const jwt = require('jsonwebtoken');

// JWT token verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_MISSING',
        message: 'Giriş tokeni tələb olunur'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      let errorCode = 'INVALID_TOKEN';
      let errorMessage = 'Yanlış token';

      if (err.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Token vaxtı bitib. Yenidən giriş edin';
      } else if (err.name === 'JsonWebTokenError') {
        errorCode = 'INVALID_TOKEN';
        errorMessage = 'Yanlış token formatı';
      }

      return res.status(403).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        }
      });
    }

    req.user = user;
    next();
  });
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'İstifadəçi giriş etməyib'
        }
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Bu əməliyyat üçün icazəniz yoxdur'
        }
      });
    }

    next();
  };
};

// Permission-based access control middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'İstifadəçi giriş etməyib'
        }
      });
    }

    const userPermissions = req.user.permissions || [];
    
    // Admin users have all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check specific permission or wildcard
    const hasPermission = userPermissions.some(userPerm => {
      if (userPerm === permission) return true;
      if (userPerm.endsWith('*')) {
        const prefix = userPerm.slice(0, -1);
        return permission.startsWith(prefix);
      }
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Bu əməliyyat üçün '${permission}' icazəsi tələb olunur`
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission
};