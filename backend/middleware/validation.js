// Input validation middleware

const validateRequired = (fields) => {
  return (req, res, next) => {
    const errors = {};
    
    fields.forEach(field => {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        errors[field] = `${field} tələb olunur`;
      }
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tələb olunan sahələr dolğurulmayıb',
          errors
        }
      });
    }

    next();
  };
};

const validateEmail = (field = 'email') => {
  return (req, res, next) => {
    const email = req.body[field];
    
    if (!email) {
      return next();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Düzgün email formatı daxil edin',
          errors: {
            [field]: 'Email formatı yanlışdır'
          }
        }
      });
    }

    next();
  };
};

const sanitizeInput = (req, res, next) => {
  // Basic input sanitization
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        // Remove potential script tags
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }
  
  next();
};

module.exports = {
  validateRequired,
  validateEmail,
  sanitizeInput
};