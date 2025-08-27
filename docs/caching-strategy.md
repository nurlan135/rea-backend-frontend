# Caching Strategy Documentation

## Overview

The REA INVEST property management system implements a comprehensive caching strategy to improve performance, reduce database load, and enhance user experience. The system supports both Redis (production) and node-cache (development/fallback) backends.

## Cache Architecture

### Cache Manager
- **Location**: `backend/config/cache.js`
- **Purpose**: Abstraction layer that handles both Redis and node-cache
- **Features**: Automatic fallback, error handling, pattern matching

### Cache Middleware
- **Location**: `backend/middleware/cache.js`
- **Purpose**: HTTP-level caching middleware for API responses
- **Features**: Response caching, cache invalidation, conditional caching

## Cache Categories

### 1. Properties (`properties:*`)
- **TTL**: 600 seconds (10 minutes)
- **Usage**: Property listings, search results, property details
- **Invalidation**: On property create, update, delete operations
- **Key Pattern**: `properties:{filters}` or `property:{id}`

### 2. Analytics (`analytics:*`)
- **TTL**: 1800 seconds (30 minutes)
- **Usage**: Performance metrics, statistics, reports
- **Invalidation**: On data changes that affect analytics
- **Key Pattern**: `analytics:{type}:{params}`

### 3. Search (`search:*`)
- **TTL**: 600 seconds (10 minutes)
- **Usage**: Search results, search analytics
- **Invalidation**: On property changes or search pattern updates
- **Key Pattern**: `search:{base64-encoded-query}`

### 4. Users (`user:*`)
- **TTL**: 900 seconds (15 minutes)
- **Usage**: User profiles, permissions, preferences
- **Invalidation**: On user updates or role changes
- **Key Pattern**: `user:{id}` or `notifications:{userId}`

### 5. Files (`files:*`)
- **TTL**: 3600 seconds (1 hour)
- **Usage**: File metadata, image optimization results
- **Invalidation**: On file upload, delete, or update
- **Key Pattern**: `files:property:{propertyId}`

## Implementation Details

### Backend Integration

#### 1. Route-Level Caching
```javascript
// Properties list with caching
router.get('/', cacheProperties(600), async (req, res) => {
  // Route handler
});

// Analytics with longer cache
router.get('/analytics', cacheAnalytics('properties', 1800), async (req, res) => {
  // Analytics handler
});
```

#### 2. Cache Invalidation
```javascript
// Automatic invalidation on mutations
router.post('/', invalidateCache('properties:*'), async (req, res) => {
  // Create property handler
});

// Manual invalidation
await invalidateCache.properties();
await invalidateCache.property(propertyId);
```

### Frontend Integration

#### 1. Cache Management Dashboard
- **Location**: `frontend/app/dashboard/admin/cache/page.tsx`
- **Features**: 
  - Real-time cache statistics
  - Key browsing and inspection
  - Category-based invalidation
  - Pattern-based operations
  - Cache warmup functionality

#### 2. SWR Integration
- **Location**: `frontend/lib/hooks/useCache.ts`
- **Features**:
  - Automatic cache synchronization
  - Optimistic updates
  - Error handling and retry logic

## Cache Configuration

### Environment Variables
```bash
# Enable Redis (production)
USE_REDIS=true
REDIS_URL=redis://localhost:6379

# Cache TTL values (seconds)
CACHE_TTL_PROPERTIES=600
CACHE_TTL_USERS=900
CACHE_TTL_ANALYTICS=1800
CACHE_TTL_SEARCH=300
```

### Redis Setup (Production)
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

## Cache Strategies

### 1. Response Caching
- **When**: GET requests for frequently accessed data
- **TTL**: Varies by data type (5-30 minutes)
- **Conditions**: No real-time flag, successful responses only

### 2. Query Result Caching
- **When**: Database-heavy operations (analytics, aggregations)
- **TTL**: Longer (30 minutes to 1 hour)
- **Invalidation**: On relevant data mutations

### 3. Session Caching
- **When**: User authentication, permissions
- **TTL**: Medium (15 minutes)
- **Security**: Automatic cleanup on logout

### 4. Asset Caching
- **When**: File metadata, processed images
- **TTL**: Long (1-24 hours)
- **Storage**: File system + cache metadata

## Performance Optimization

### 1. Cache Warming
- Pre-populate cache with frequently accessed data
- Scheduled during low-traffic periods
- Focus on heavy queries and popular endpoints

### 2. Cache Hierarchy
```
Level 1: HTTP Response Cache (middleware)
Level 2: Query Result Cache (database layer)  
Level 3: Session Cache (authentication)
Level 4: Asset Cache (file system)
```

### 3. Intelligent Invalidation
- Granular cache keys for precise invalidation
- Cascade invalidation for related data
- Batch operations for efficiency

## Monitoring and Management

### 1. Cache Metrics
- Hit/miss ratios
- Memory usage
- Key distribution
- Performance impact

### 2. Admin Interface
- Real-time statistics dashboard
- Cache key browser with search
- Bulk invalidation tools
- Performance monitoring

### 3. Health Checks
- Cache connectivity monitoring
- Automatic fallback detection
- Performance threshold alerts

## Best Practices

### 1. Cache Key Design
- Use consistent naming patterns
- Include relevant parameters in keys
- Avoid overly specific keys that fragment cache

### 2. TTL Strategy
- Short TTL for frequently changing data
- Long TTL for stable reference data
- Consider business requirements for freshness

### 3. Error Handling
- Graceful degradation when cache unavailable
- Automatic fallback to direct database queries
- Proper error logging and monitoring

### 4. Security Considerations
- No sensitive data in cache keys
- Proper access control for cache management
- Regular cache cleanup for expired data

## Testing Strategy

### 1. Unit Tests
- Cache operations (get, set, delete)
- TTL behavior validation
- Error handling scenarios

### 2. Integration Tests
- End-to-end cache workflows
- Performance impact measurement
- Fallback mechanism validation

### 3. Load Testing
- Cache performance under load
- Memory usage patterns
- Hit ratio optimization

## Deployment Considerations

### 1. Development Environment
- Use node-cache for simplicity
- Shorter TTL for rapid development
- Easy cache clearing for testing

### 2. Production Environment
- Use Redis for scalability and persistence
- Configure Redis clustering if needed
- Monitor cache performance metrics

### 3. Scaling Strategy
- Redis Cluster for horizontal scaling
- Cache partitioning by data type
- CDN integration for static assets

## Future Enhancements

### 1. Advanced Features
- Distributed cache invalidation
- Cache compression for large objects
- Advanced cache analytics and insights

### 2. Performance Optimizations
- Cache pre-loading based on usage patterns
- Predictive cache warming
- Dynamic TTL adjustment based on usage

### 3. Integration Opportunities  
- CDN integration for public data
- Browser cache optimization
- Service worker cache coordination