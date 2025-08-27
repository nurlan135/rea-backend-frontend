const Redis = require('redis');
const NodeCache = require('node-cache');

const USE_REDIS = process.env.USE_REDIS === 'true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;
let nodeCache;

if (USE_REDIS) {
  redisClient = Redis.createClient({
    url: REDIS_URL
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    console.log('Falling back to node-cache');
    nodeCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  redisClient.connect();
} else {
  nodeCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  console.log('Using node-cache for caching');
}

class CacheManager {
  async get(key) {
    try {
      if (USE_REDIS && redisClient?.isOpen) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return nodeCache.get(key) || null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 600) {
    try {
      if (USE_REDIS && redisClient?.isOpen) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        nodeCache.set(key, value, ttl);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      if (USE_REDIS && redisClient?.isOpen) {
        await redisClient.del(key);
      } else {
        nodeCache.del(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async delPattern(pattern) {
    try {
      if (USE_REDIS && redisClient?.isOpen) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else {
        const keys = nodeCache.keys();
        const matchingKeys = keys.filter(key => key.includes(pattern.replace('*', '')));
        nodeCache.del(matchingKeys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async flush() {
    try {
      if (USE_REDIS && redisClient?.isOpen) {
        await redisClient.flushAll();
      } else {
        nodeCache.flushAll();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  async keys(pattern = '*') {
    try {
      if (USE_REDIS && redisClient?.isOpen) {
        return await redisClient.keys(pattern);
      } else {
        const keys = nodeCache.keys();
        if (pattern === '*') return keys;
        return keys.filter(key => key.includes(pattern.replace('*', '')));
      }
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }
}

const cache = new CacheManager();

// Cache key generators
const generateCacheKey = {
  properties: (filters = {}) => {
    const key = Object.keys(filters)
      .sort()
      .map(k => `${k}:${filters[k]}`)
      .join('|');
    return `properties:${key || 'all'}`;
  },
  property: (id) => `property:${id}`,
  user: (id) => `user:${id}`,
  analytics: (type, params = {}) => {
    const key = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join('|');
    return `analytics:${type}:${key || 'default'}`;
  },
  search: (query) => `search:${Buffer.from(JSON.stringify(query)).toString('base64')}`,
  notifications: (userId) => `notifications:${userId}`,
  files: (propertyId) => `files:property:${propertyId}`
};

// Cache invalidation helpers
const invalidateCache = {
  properties: async () => {
    await cache.delPattern('properties:*');
    await cache.delPattern('analytics:properties:*');
    await cache.delPattern('search:*');
  },
  property: async (id) => {
    await cache.del(generateCacheKey.property(id));
    await cache.delPattern('properties:*');
    await cache.delPattern('analytics:properties:*');
    await cache.del(generateCacheKey.files(id));
  },
  user: async (id) => {
    await cache.del(generateCacheKey.user(id));
    await cache.del(generateCacheKey.notifications(id));
  },
  analytics: async () => {
    await cache.delPattern('analytics:*');
  },
  all: async () => {
    await cache.flush();
  }
};

module.exports = {
  cache,
  generateCacheKey,
  invalidateCache
};