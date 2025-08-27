const { cache, generateCacheKey } = require('../config/cache');

// Response caching middleware
const cacheResponse = (options = {}) => {
  const {
    ttl = 600, // 10 minutes default
    keyGenerator = null,
    condition = null,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    if (skipCache || req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    let cacheKey;
    if (keyGenerator && typeof keyGenerator === 'function') {
      cacheKey = keyGenerator(req);
    } else {
      // Default key generation
      const queryString = Object.keys(req.query)
        .sort()
        .map(k => `${k}=${req.query[k]}`)
        .join('&');
      cacheKey = `response:${req.path}:${queryString}`;
    }

    // Check condition if provided
    if (condition && !condition(req)) {
      return next();
    }

    try {
      // Try to get cached response
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Intercept response
      const originalSend = res.json;
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode === 200 && data) {
          cache.set(cacheKey, data, ttl).catch(console.error);
        }
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const originalSend = res.json;
    
    res.json = async function(data) {
      // Invalidate cache after successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          if (Array.isArray(patterns)) {
            for (const pattern of patterns) {
              await cache.delPattern(pattern);
            }
          } else if (typeof patterns === 'string') {
            await cache.delPattern(patterns);
          }
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

// Property-specific caching
const cacheProperties = (ttl = 300) => {
  return cacheResponse({
    ttl,
    keyGenerator: (req) => generateCacheKey.properties(req.query),
    condition: (req) => {
      // Only cache if not requesting real-time data
      return !req.query.realtime && !req.headers['cache-control']?.includes('no-cache');
    }
  });
};

// Analytics caching (longer TTL)
const cacheAnalytics = (type, ttl = 1800) => {
  return cacheResponse({
    ttl,
    keyGenerator: (req) => generateCacheKey.analytics(type, req.query),
    condition: (req) => !req.query.realtime
  });
};

// Search results caching
const cacheSearch = (ttl = 600) => {
  return cacheResponse({
    ttl,
    keyGenerator: (req) => generateCacheKey.search({
      ...req.query,
      ...req.body
    })
  });
};

// User data caching
const cacheUser = (ttl = 900) => {
  return cacheResponse({
    ttl,
    keyGenerator: (req) => generateCacheKey.user(req.user?.id || 'anonymous')
  });
};

module.exports = {
  cacheResponse,
  invalidateCache,
  cacheProperties,
  cacheAnalytics,
  cacheSearch,
  cacheUser
};