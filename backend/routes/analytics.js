const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { cacheAnalytics } = require('../middleware/cache');
const Joi = require('joi');

// Analytics endpoint for properties
router.get('/', authenticate, cacheAnalytics('properties', 1800), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Build query based on user role
    let baseQuery = db('properties').select('*');
    
    // Agents can only see their own properties analytics
    if (userRole === 'agent') {
      baseQuery = baseQuery.where('agent_id', userId);
    }
    
    const properties = await baseQuery;
    
    // Calculate basic analytics
    const analytics = {
      total_properties: properties.length,
      by_status: {},
      by_category: {},
      by_listing_type: {},
      by_district: {},
      price_analytics: {},
      area_analytics: {},
      recent_activity: {},
      performance_metrics: {}
    };
    
    // Group by status
    analytics.by_status = properties.reduce((acc, prop) => {
      const status = prop.approval_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Group by category
    analytics.by_category = properties.reduce((acc, prop) => {
      const category = prop.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Group by listing type
    analytics.by_listing_type = properties.reduce((acc, prop) => {
      const type = prop.listing_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Price analytics
    const sellPrices = properties
      .map(p => p.sell_price_azn)
      .filter(p => p && p > 0);
      
    const rentPrices = properties
      .map(p => p.rent_price_monthly_azn)
      .filter(p => p && p > 0);
    
    if (sellPrices.length > 0) {
      analytics.price_analytics.sell = {
        avg: Math.round(sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length),
        min: Math.min(...sellPrices),
        max: Math.max(...sellPrices),
        count: sellPrices.length
      };
    }
    
    if (rentPrices.length > 0) {
      analytics.price_analytics.rent = {
        avg: Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length),
        min: Math.min(...rentPrices),
        max: Math.max(...rentPrices),
        count: rentPrices.length
      };
    }
    
    // Area analytics
    const areas = properties
      .map(p => p.area_m2)
      .filter(a => a && a > 0);
      
    if (areas.length > 0) {
      analytics.area_analytics = {
        avg: Math.round(areas.reduce((a, b) => a + b, 0) / areas.length),
        min: Math.min(...areas),
        max: Math.max(...areas),
        count: areas.length
      };
    }
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProperties = properties.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    );
    
    analytics.recent_activity = {
      new_properties_30d: recentProperties.length,
      avg_per_day: Math.round(recentProperties.length / 30 * 10) / 10
    };
    
    // Performance metrics
    const activeProperties = properties.filter(p => p.approval_status === 'approved');
    const pendingProperties = properties.filter(p => p.approval_status === 'pending');
    
    analytics.performance_metrics = {
      active_properties: activeProperties.length,
      pending_properties: pendingProperties.length,
      approval_rate: properties.length > 0 ? 
        Math.round((activeProperties.length / properties.length) * 100) : 0
    };
    
    // Days on market (for active properties)
    const daysOnMarket = activeProperties.map(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return Math.floor((now - created) / (1000 * 60 * 60 * 24));
    });
    
    if (daysOnMarket.length > 0) {
      analytics.performance_metrics.avg_days_on_market = Math.round(
        daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length
      );
    }
    
    res.json({
      success: true,
      data: {
        analytics,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Analytics məlumatları alınarkən xəta baş verdi',
        code: 'ANALYTICS_ERROR'
      }
    });
  }
});

// Search analytics endpoint
router.get('/search', authenticate, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // For now, return mock data since we don't track search history in DB yet
    // In production, this would query search_logs table
    const mockSearchAnalytics = {
      total_searches: 0,
      avg_results_per_search: 0,
      avg_search_time_ms: 0,
      most_common_filters: [],
      search_trends: [],
      performance_metrics: {
        fast_searches: 0,
        slow_searches: 0,
        empty_results: 0
      }
    };
    
    res.json({
      success: true,
      data: {
        search_analytics: mockSearchAnalytics,
        timeframe,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Axtarış analitikası alınarkən xəta baş verdi',
        code: 'SEARCH_ANALYTICS_ERROR'
      }
    });
  }
});

// Agent performance analytics
router.get('/agents', authenticate, authorize(['manager', 'admin']), async (req, res) => {
  try {
    const agentPerformance = await db('properties')
      .select(
        'agent_id',
        'users.first_name',
        'users.last_name',
        db.raw('COUNT(*) as total_properties'),
        db.raw('COUNT(CASE WHEN approval_status = ? THEN 1 END) as active_properties', ['approved']),
        db.raw('COUNT(CASE WHEN approval_status = ? THEN 1 END) as pending_properties', ['pending']),
        db.raw('AVG(sell_price_azn) as avg_sell_price'),
        db.raw('AVG(area_m2) as avg_area')
      )
      .leftJoin('users', 'properties.agent_id', 'users.id')
      .groupBy('agent_id', 'users.first_name', 'users.last_name')
      .orderBy('total_properties', 'desc');
    
    const formattedPerformance = agentPerformance.map(agent => ({
      agent_id: agent.agent_id,
      agent_name: `${agent.first_name} ${agent.last_name}`,
      total_properties: parseInt(agent.total_properties),
      active_properties: parseInt(agent.active_properties || 0),
      pending_properties: parseInt(agent.pending_properties || 0),
      approval_rate: agent.total_properties > 0 ? 
        Math.round((agent.active_properties / agent.total_properties) * 100) : 0,
      avg_sell_price: Math.round(agent.avg_sell_price || 0),
      avg_area: Math.round(agent.avg_area || 0)
    }));
    
    res.json({
      success: true,
      data: {
        agent_performance: formattedPerformance,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Agent analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Agent performans analitikası alınarkən xəta baş verdi',
        code: 'AGENT_ANALYTICS_ERROR'
      }
    });
  }
});

// Market trends analytics
router.get('/market-trends', authenticate, async (req, res) => {
  try {
    const { period = '6m' } = req.query;
    
    // Calculate monthly trends for the specified period
    let monthsBack = 6;
    if (period === '3m') monthsBack = 3;
    if (period === '12m') monthsBack = 12;
    
    const trends = [];
    
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthlyData = await db('properties')
        .select(
          db.raw('COUNT(*) as total_listings'),
          db.raw('AVG(sell_price_azn) as avg_sell_price'),
          db.raw('AVG(rent_price_monthly_azn) as avg_rent_price'),
          db.raw('AVG(area_m2) as avg_area')
        )
        .whereBetween('created_at', [monthStart.toISOString(), monthEnd.toISOString()])
        .first();
      
      trends.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        month_name: date.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' }),
        total_listings: parseInt(monthlyData.total_listings || 0),
        avg_sell_price: Math.round(monthlyData.avg_sell_price || 0),
        avg_rent_price: Math.round(monthlyData.avg_rent_price || 0),
        avg_area: Math.round(monthlyData.avg_area || 0)
      });
    }
    
    res.json({
      success: true,
      data: {
        market_trends: trends,
        period,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bazar trendləri alınarkən xəta baş verdi',
        code: 'MARKET_TRENDS_ERROR'
      }
    });
  }
});

module.exports = router;