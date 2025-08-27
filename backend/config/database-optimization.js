const knex = require('knex');

class DatabaseOptimizer {
  constructor(db) {
    this.db = db;
  }

  // Query optimization helpers
  static optimizePropertyQuery(query, filters = {}) {
    const {
      status,
      category,
      listing_type,
      property_category,
      district_id,
      agent_id,
      price_min,
      price_max,
      area_min,
      area_max,
      limit = 20,
      offset = 0
    } = filters;

    // Use indexes for filtering
    if (status) {
      query = query.where('properties.status', status);
    }

    if (category) {
      query = query.where('properties.category', category);
    }

    if (listing_type) {
      query = query.where('properties.listing_type', listing_type);
    }

    if (property_category) {
      query = query.where('properties.property_category', property_category);
    }

    if (district_id) {
      query = query.where('properties.district_id', district_id);
    }

    if (agent_id) {
      query = query.where('properties.agent_id', agent_id);
    }

    // Price range filtering with proper indexing
    if (price_min || price_max) {
      if (category === 'sale') {
        if (price_min) query = query.where('properties.sell_price_azn', '>=', price_min);
        if (price_max) query = query.where('properties.sell_price_azn', '<=', price_max);
      } else if (category === 'rent') {
        if (price_min) query = query.where('properties.rent_price_monthly_azn', '>=', price_min);
        if (price_max) query = query.where('properties.rent_price_monthly_azn', '<=', price_max);
      }
    }

    // Area filtering
    if (area_min) {
      query = query.where('properties.area_m2', '>=', area_min);
    }

    if (area_max) {
      query = query.where('properties.area_m2', '<=', area_max);
    }

    // Pagination
    query = query.limit(limit).offset(offset);

    // Order by created_at for consistent pagination
    query = query.orderBy('properties.created_at', 'desc');

    return query;
  }

  // Batch operations for better performance
  async batchInsert(tableName, data, batchSize = 100) {
    const chunks = [];
    for (let i = 0; i < data.length; i += batchSize) {
      chunks.push(data.slice(i, i + batchSize));
    }

    const results = [];
    for (const chunk of chunks) {
      const result = await this.db(tableName).insert(chunk).returning('*');
      results.push(...result);
    }

    return results;
  }

  async batchUpdate(tableName, updates, keyColumn = 'id', batchSize = 100) {
    const chunks = [];
    for (let i = 0; i < updates.length; i += batchSize) {
      chunks.push(updates.slice(i, i + batchSize));
    }

    for (const chunk of chunks) {
      const trx = await this.db.transaction();
      try {
        for (const update of chunk) {
          const { [keyColumn]: key, ...updateData } = update;
          await trx(tableName).where(keyColumn, key).update(updateData);
        }
        await trx.commit();
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    }
  }

  // Connection pool management
  async getPoolInfo() {
    const pool = this.db.client.pool;
    return {
      used: pool.numUsed(),
      free: pool.numFree(),
      pending: pool.numPendingAcquires(),
      pendingCreates: pool.numPendingCreates(),
      size: pool.size,
      max: pool.max,
      min: pool.min
    };
  }

  // Query performance analysis
  async analyzeQuery(queryBuilder) {
    const query = queryBuilder.toString();
    console.log('Analyzing query:', query);

    // Execute EXPLAIN for PostgreSQL
    if (this.db.client.config.client === 'pg') {
      const explainResult = await this.db.raw(`EXPLAIN ANALYZE ${query}`);
      return {
        query,
        plan: explainResult.rows,
        performance: this.parseExplainPlan(explainResult.rows)
      };
    }

    return { query, plan: null, performance: null };
  }

  parseExplainPlan(planRows) {
    const totalCost = planRows[0]?.['QUERY PLAN'] || '';
    const costMatch = totalCost.match(/cost=[\d.]+\.\.([\d.]+)/);
    const timeMatch = totalCost.match(/actual time=[\d.]+\.\.([\d.]+)/);
    const rowsMatch = totalCost.match(/rows=([\d.]+)/);

    return {
      estimatedCost: costMatch ? parseFloat(costMatch[1]) : null,
      actualTime: timeMatch ? parseFloat(timeMatch[1]) : null,
      estimatedRows: rowsMatch ? parseInt(rowsMatch[1]) : null,
      fullPlan: planRows
    };
  }

  // Database statistics
  async getDatabaseStats() {
    if (this.db.client.config.client === 'pg') {
      const [tablesInfo, indexInfo, connectionInfo] = await Promise.all([
        this.getTableStats(),
        this.getIndexStats(),
        this.getConnectionStats()
      ]);

      return {
        tables: tablesInfo,
        indexes: indexInfo,
        connections: connectionInfo,
        poolInfo: await this.getPoolInfo()
      };
    }

    return null;
  }

  async getTableStats() {
    const result = await this.db.raw(`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation,
        null_frac,
        avg_width
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
    `);

    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.tablename]) {
        tables[row.tablename] = {
          name: row.tablename,
          columns: []
        };
      }
      tables[row.tablename].columns.push({
        name: row.column_name,
        distinct_values: row.n_distinct,
        correlation: row.correlation,
        null_fraction: row.null_frac,
        avg_width: row.avg_width
      });
    });

    return Object.values(tables);
  }

  async getIndexStats() {
    const result = await this.db.raw(`
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        pg_size_pretty(pg_relation_size(i.oid)) as index_size
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relkind = 'r' AND t.relname NOT LIKE 'pg_%'
      ORDER BY t.relname, i.relname
    `);

    const indexes = {};
    result.rows.forEach(row => {
      const key = `${row.table_name}.${row.index_name}`;
      if (!indexes[key]) {
        indexes[key] = {
          table_name: row.table_name,
          index_name: row.index_name,
          columns: [],
          is_unique: row.is_unique,
          is_primary: row.is_primary,
          size: row.index_size
        };
      }
      indexes[key].columns.push(row.column_name);
    });

    return Object.values(indexes);
  }

  async getConnectionStats() {
    const result = await this.db.raw(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    return result.rows[0];
  }

  // Query optimization suggestions
  async getSuggestions(tableName, commonFilters = {}) {
    const suggestions = [];

    // Check for missing indexes based on common filters
    const existingIndexes = await this.getIndexesForTable(tableName);
    const commonFilterColumns = Object.keys(commonFilters);

    for (const column of commonFilterColumns) {
      const hasIndex = existingIndexes.some(idx => 
        idx.columns.includes(column) || idx.columns[0] === column
      );

      if (!hasIndex) {
        suggestions.push({
          type: 'missing_index',
          message: `Consider adding an index on ${tableName}.${column}`,
          sql: `CREATE INDEX idx_${tableName}_${column} ON ${tableName} (${column});`
        });
      }
    }

    // Check for composite index opportunities
    if (commonFilterColumns.length > 1) {
      const compositeKey = commonFilterColumns.sort().join('_');
      const hasCompositeIndex = existingIndexes.some(idx => 
        JSON.stringify(idx.columns.sort()) === JSON.stringify(commonFilterColumns.sort())
      );

      if (!hasCompositeIndex) {
        suggestions.push({
          type: 'composite_index',
          message: `Consider adding a composite index for common filter combination`,
          sql: `CREATE INDEX idx_${tableName}_${compositeKey} ON ${tableName} (${commonFilterColumns.join(', ')});`
        });
      }
    }

    return suggestions;
  }

  async getIndexesForTable(tableName) {
    const result = await this.db.raw(`
      SELECT 
        i.relname as index_name,
        array_agg(a.attname ORDER BY a.attnum) as columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = ? AND t.relkind = 'r'
      GROUP BY i.relname
    `, [tableName]);

    return result.rows;
  }

  // Maintenance operations
  async analyzeTables(tableNames = []) {
    const tables = tableNames.length > 0 ? tableNames : await this.getAllTableNames();
    
    for (const tableName of tables) {
      await this.db.raw(`ANALYZE ${tableName}`);
      console.log(`Analyzed table: ${tableName}`);
    }
  }

  async vacuumTables(tableNames = []) {
    const tables = tableNames.length > 0 ? tableNames : await this.getAllTableNames();
    
    for (const tableName of tables) {
      await this.db.raw(`VACUUM ${tableName}`);
      console.log(`Vacuumed table: ${tableName}`);
    }
  }

  async getAllTableNames() {
    const result = await this.db.raw(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    return result.rows.map(row => row.tablename);
  }

  // Slow query detection
  async getSlowQueries(minDuration = 1000) {
    if (this.db.client.config.client === 'pg') {
      const result = await this.db.raw(`
        SELECT 
          query,
          mean_time,
          calls,
          total_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements
        WHERE mean_time > ?
        ORDER BY mean_time DESC
        LIMIT 20
      `, [minDuration]);

      return result.rows;
    }

    return [];
  }
}

// Connection pooling configuration
const optimizeConnectionPool = (config) => {
  return {
    ...config,
    pool: {
      min: 2,
      max: 20,
      createTimeoutMillis: 3000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false,
      ...config.pool
    }
  };
};

// Query building helpers
const QueryBuilder = {
  // Paginated query with total count
  async paginateQuery(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const [results, totalCount] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().clearSelect().clearOrder().count('* as count').first()
    ]);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.count),
        pages: Math.ceil(parseInt(totalCount.count) / limit)
      }
    };
  },

  // Batch query with chunking
  async batchQuery(queries, chunkSize = 5) {
    const results = [];
    
    for (let i = 0; i < queries.length; i += chunkSize) {
      const chunk = queries.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);
    }

    return results;
  }
};

module.exports = {
  DatabaseOptimizer,
  optimizeConnectionPool,
  QueryBuilder
};