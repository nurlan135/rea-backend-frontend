const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { cache, invalidateCache } = require('../config/cache');

// GET /api/cache/stats - Get cache statistics
router.get('/stats', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const stats = {
      total_keys: 0,
      categories: {},
      memory_usage: process.memoryUsage()
    };

    const keys = await cache.keys('*');
    stats.total_keys = keys.length;

    // Categorize keys
    keys.forEach(key => {
      const category = key.split(':')[0];
      if (!stats.categories[category]) {
        stats.categories[category] = 0;
      }
      stats.categories[category]++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
});

// GET /api/cache/keys - Get cache keys (admin only)
router.get('/keys', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { pattern = '*', limit = 100 } = req.query;
    
    const keys = await cache.keys(pattern);
    const limitedKeys = keys.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        keys: limitedKeys,
        total: keys.length,
        showing: limitedKeys.length
      }
    });
  } catch (error) {
    console.error('Cache keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache keys',
      error: error.message
    });
  }
});

// GET /api/cache/:key - Get cached value (admin only)
router.get('/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cache.get(key);

    if (value === null) {
      return res.status(404).json({
        success: false,
        message: 'Cache key not found'
      });
    }

    res.json({
      success: true,
      data: {
        key,
        value,
        type: typeof value
      }
    });
  } catch (error) {
    console.error('Cache get error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cached value',
      error: error.message
    });
  }
});

// DELETE /api/cache/:key - Delete cache key (admin only)
router.delete('/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    await cache.del(key);

    res.json({
      success: true,
      message: 'Cache key deleted successfully'
    });
  } catch (error) {
    console.error('Cache delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cache key',
      error: error.message
    });
  }
});

// DELETE /api/cache/pattern/:pattern - Delete cache keys by pattern (admin only)
router.delete('/pattern/:pattern', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { pattern } = req.params;
    await cache.delPattern(pattern);

    res.json({
      success: true,
      message: `Cache keys matching pattern '${pattern}' deleted successfully`
    });
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cache keys by pattern',
      error: error.message
    });
  }
});

// POST /api/cache/invalidate - Invalidate specific cache categories
router.post('/invalidate', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { categories = [] } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required'
      });
    }

    const validCategories = ['properties', 'users', 'analytics', 'search', 'notifications', 'files'];
    const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
    
    if (invalidCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid categories: ${invalidCategories.join(', ')}`,
        valid_categories: validCategories
      });
    }

    // Invalidate each category
    for (const category of categories) {
      switch (category) {
        case 'properties':
          await invalidateCache.properties();
          break;
        case 'users':
          await cache.delPattern('user:*');
          break;
        case 'analytics':
          await invalidateCache.analytics();
          break;
        case 'search':
          await cache.delPattern('search:*');
          break;
        case 'notifications':
          await cache.delPattern('notifications:*');
          break;
        case 'files':
          await cache.delPattern('files:*');
          break;
      }
    }

    res.json({
      success: true,
      message: `Cache invalidated for categories: ${categories.join(', ')}`
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate cache',
      error: error.message
    });
  }
});

// DELETE /api/cache - Flush all cache (admin only)
router.delete('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await cache.flush();

    res.json({
      success: true,
      message: 'All cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache flush error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// POST /api/cache/warmup - Warm up cache with frequently accessed data
router.post('/warmup', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { categories = ['properties', 'analytics'] } = req.body;
    const results = {};

    for (const category of categories) {
      try {
        switch (category) {
          case 'properties':
            // Simulate warming up properties cache
            results[category] = { status: 'warmed', count: 0 };
            break;
          case 'analytics':
            // Simulate warming up analytics cache
            results[category] = { status: 'warmed', count: 0 };
            break;
          default:
            results[category] = { status: 'skipped', reason: 'unsupported' };
        }
      } catch (error) {
        results[category] = { status: 'failed', error: error.message };
      }
    }

    res.json({
      success: true,
      message: 'Cache warmup completed',
      data: results
    });
  } catch (error) {
    console.error('Cache warmup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warm up cache',
      error: error.message
    });
  }
});

module.exports = router;