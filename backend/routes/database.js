const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { DatabaseOptimizer } = require('../config/database-optimization');
const db = require('../database');

const dbOptimizer = new DatabaseOptimizer(db);

// GET /api/database/stats - Get database performance statistics
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const stats = await dbOptimizer.getDatabaseStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics',
      error: error.message
    });
  }
});

// GET /api/database/pool - Get connection pool information
router.get('/pool', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const poolInfo = await dbOptimizer.getPoolInfo();
    
    res.json({
      success: true,
      data: poolInfo
    });
  } catch (error) {
    console.error('Pool info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pool information',
      error: error.message
    });
  }
});

// GET /api/database/slow-queries - Get slow query analysis
router.get('/slow-queries', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { min_duration = 1000 } = req.query;
    const slowQueries = await dbOptimizer.getSlowQueries(parseInt(min_duration));
    
    res.json({
      success: true,
      data: slowQueries
    });
  } catch (error) {
    console.error('Slow queries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slow queries',
      error: error.message
    });
  }
});

// POST /api/database/analyze-query - Analyze a specific query
router.post('/analyze-query', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Build the query using Knex for safety
    let queryBuilder;
    try {
      queryBuilder = db.raw(query);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query syntax',
        error: error.message
      });
    }

    const analysis = await dbOptimizer.analyzeQuery(queryBuilder);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Query analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze query',
      error: error.message
    });
  }
});

// GET /api/database/suggestions/:table - Get optimization suggestions
router.get('/suggestions/:table', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { table } = req.params;
    const { filters } = req.query;
    
    let commonFilters = {};
    if (filters) {
      try {
        commonFilters = JSON.parse(filters);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filters JSON format'
        });
      }
    }

    const suggestions = await dbOptimizer.getSuggestions(table, commonFilters);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Optimization suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimization suggestions',
      error: error.message
    });
  }
});

// POST /api/database/analyze-tables - Analyze table statistics
router.post('/analyze-tables', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tables = [] } = req.body;
    
    await dbOptimizer.analyzeTables(tables);
    
    res.json({
      success: true,
      message: `Analyzed ${tables.length === 0 ? 'all' : tables.length} tables`
    });
  } catch (error) {
    console.error('Table analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze tables',
      error: error.message
    });
  }
});

// POST /api/database/vacuum-tables - Vacuum tables
router.post('/vacuum-tables', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tables = [] } = req.body;
    
    await dbOptimizer.vacuumTables(tables);
    
    res.json({
      success: true,
      message: `Vacuumed ${tables.length === 0 ? 'all' : tables.length} tables`
    });
  } catch (error) {
    console.error('Table vacuum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vacuum tables',
      error: error.message
    });
  }
});

// GET /api/database/table-stats/:table - Get specific table statistics
router.get('/table-stats/:table', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { table } = req.params;
    
    // Get table size and row count
    const sizeResult = await db.raw(`
      SELECT 
        pg_size_pretty(pg_total_relation_size(?)) as total_size,
        pg_size_pretty(pg_relation_size(?)) as table_size,
        pg_size_pretty(pg_total_relation_size(?) - pg_relation_size(?)) as indexes_size,
        (SELECT count(*) FROM ${table}) as row_count
    `, [table, table, table, table]);

    // Get column statistics
    const columnStats = await db.raw(`
      SELECT 
        attname as column_name,
        n_distinct,
        correlation,
        null_frac,
        avg_width,
        most_common_vals,
        most_common_freqs
      FROM pg_stats 
      WHERE tablename = ?
      ORDER BY attname
    `, [table]);

    // Get index information
    const indexes = await dbOptimizer.getIndexesForTable(table);

    res.json({
      success: true,
      data: {
        table_name: table,
        size: sizeResult.rows[0],
        columns: columnStats.rows,
        indexes
      }
    });
  } catch (error) {
    console.error('Table stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table statistics',
      error: error.message
    });
  }
});

// GET /api/database/health - Database health check
router.get('/health', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    await db.raw('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    const poolInfo = await dbOptimizer.getPoolInfo();
    
    // Determine health status
    let status = 'healthy';
    const issues = [];

    if (responseTime > 1000) {
      issues.push('Slow database response time');
      status = 'degraded';
    }

    if (poolInfo.used / poolInfo.max > 0.8) {
      issues.push('High connection pool usage');
      status = status === 'healthy' ? 'warning' : status;
    }

    if (poolInfo.pending > 5) {
      issues.push('High number of pending connections');
      status = 'degraded';
    }

    res.json({
      success: true,
      data: {
        status,
        response_time_ms: responseTime,
        pool_info: poolInfo,
        issues,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/database/performance-report - Comprehensive performance report
router.get('/performance-report', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    const [
      dbStats,
      poolInfo,
      slowQueries,
      tableStats
    ] = await Promise.all([
      dbOptimizer.getDatabaseStats(),
      dbOptimizer.getPoolInfo(),
      dbOptimizer.getSlowQueries(500),
      dbOptimizer.getTableStats()
    ]);

    // Generate recommendations
    const recommendations = [];
    
    // Check for tables without proper indexes
    const tablesWithoutIndexes = tableStats.filter(table => 
      !dbStats.indexes.some(index => index.table_name === table.name)
    );
    
    if (tablesWithoutIndexes.length > 0) {
      recommendations.push({
        type: 'indexing',
        priority: 'high',
        message: `Tables missing indexes: ${tablesWithoutIndexes.map(t => t.name).join(', ')}`
      });
    }

    // Check pool utilization
    if (poolInfo.used / poolInfo.max > 0.7) {
      recommendations.push({
        type: 'connection_pool',
        priority: 'medium',
        message: 'Consider increasing connection pool size'
      });
    }

    // Check for slow queries
    if (slowQueries.length > 0) {
      recommendations.push({
        type: 'query_performance',
        priority: 'high',
        message: `Found ${slowQueries.length} slow queries that need optimization`
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          total_tables: tableStats.length,
          total_indexes: dbStats.indexes.length,
          slow_queries_count: slowQueries.length,
          pool_utilization: (poolInfo.used / poolInfo.max * 100).toFixed(1) + '%'
        },
        database_stats: dbStats,
        pool_info: poolInfo,
        slow_queries: slowQueries.slice(0, 10), // Top 10 slow queries
        recommendations,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error.message
    });
  }
});

module.exports = router;