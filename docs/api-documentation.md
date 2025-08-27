# REA INVEST API Documentation

## Overview

The REA INVEST API is a comprehensive property management system API built with Node.js, Express.js, and PostgreSQL. It provides endpoints for managing properties, users, bookings, notifications, files, and system administration.

## Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://api.rea-invest.com/api`

## Interactive Documentation

Access the interactive Swagger UI documentation at:
- **Development**: `http://localhost:8000/api/docs`
- **Production**: `https://api.rea-invest.com/api/docs`

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "agent"
    }
  }
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List users (admin/manager only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin/manager only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Properties
- `GET /api/properties` - List properties with filtering
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/search` - Advanced property search

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Notifications
- `GET /api/notifications` - List user notifications
- `POST /api/notifications/mark-read/:id` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings

### Files
- `POST /api/files/upload` - Upload file
- `POST /api/files/upload/chunk` - Chunked file upload
- `GET /api/files/property/:id` - Get property files
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/:id/download` - Download file

### Analytics
- `GET /api/analytics` - Get system analytics
- `GET /api/analytics/properties` - Property analytics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/performance` - Performance metrics

### Cache Management (Admin Only)
- `GET /api/cache/stats` - Cache statistics
- `GET /api/cache/keys` - List cache keys
- `DELETE /api/cache/:key` - Delete cache key
- `POST /api/cache/invalidate` - Invalidate cache categories
- `DELETE /api/cache` - Flush all cache

### Database Management (Admin Only)
- `GET /api/database/stats` - Database statistics
- `GET /api/database/health` - Database health check
- `GET /api/database/slow-queries` - Slow query analysis
- `POST /api/database/analyze-query` - Analyze specific query
- `POST /api/database/analyze-tables` - Analyze table statistics
- `POST /api/database/vacuum-tables` - Vacuum tables

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 5 failed login attempts per 15 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED"
    }
  ]
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Invalid or expired token"
  }
}
```

## Property Search Parameters

### Basic Filters
- `category` - sale/rent
- `property_category` - residential/commercial
- `listing_type` - agency_owned/branch_owned/brokerage
- `status` - draft/active/reserved/sold/rented/archived
- `district_id` - District UUID
- `agent_id` - Agent UUID

### Range Filters
- `min_price` / `max_price` - Price range
- `min_area` / `max_area` - Area range (m²)
- `min_rooms` / `max_rooms` - Room count range
- `min_floor` / `max_floor` - Floor range

### Sorting
- `sort_by` - created_at/updated_at/price/area
- `sort_order` - asc/desc

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

## Data Models

### User
```javascript
{
  id: "uuid",
  email: "string",
  first_name: "string", 
  last_name: "string",
  phone: "string",
  role: "agent|manager|admin",
  status: "active|inactive|suspended",
  created_at: "datetime",
  updated_at: "datetime"
}
```

### Property
```javascript
{
  id: "uuid",
  property_category: "residential|commercial",
  property_subcategory: "string",
  construction_type: "new|old|under_construction",
  area_m2: "number",
  floor: "integer",
  floors_total: "integer",
  room_count: "string",
  height: "number",
  district_id: "uuid",
  address: "string",
  category: "sale|rent",
  listing_type: "agency_owned|branch_owned|brokerage",
  buy_price_azn: "number",
  sell_price_azn: "number", 
  rent_price_monthly_azn: "number",
  status: "draft|active|reserved|sold|rented|archived",
  agent_id: "uuid",
  created_at: "datetime",
  updated_at: "datetime"
}
```

### Booking
```javascript
{
  id: "uuid",
  property_id: "uuid",
  customer_id: "uuid",
  agent_id: "uuid",
  booking_date: "datetime",
  status: "pending|confirmed|completed|cancelled",
  notes: "string",
  created_at: "datetime",
  updated_at: "datetime"
}
```

## Security

### HTTPS
All production API calls must use HTTPS.

### CORS
CORS is configured to allow requests from authorized domains only.

### Input Validation
All inputs are validated using Joi schemas before processing.

### SQL Injection Prevention
All database queries use parameterized statements.

### XSS Prevention
All outputs are properly escaped and sanitized.

### Rate Limiting
Implemented to prevent abuse and DDoS attacks.

## Caching

The API implements intelligent caching:

### Cache Types
- **Response Cache**: HTTP responses cached for 5-30 minutes
- **Query Cache**: Database query results cached for 10-60 minutes
- **Session Cache**: User session data cached for 15 minutes

### Cache Headers
- `Cache-Control` - Caching directives
- `ETag` - Entity tag for conditional requests
- `Last-Modified` - Last modification time

### Cache Invalidation
- Automatic invalidation on data mutations
- Manual invalidation via admin endpoints
- Time-based expiration

## Performance

### Database Optimization
- Comprehensive indexing strategy
- Query optimization
- Connection pooling
- Automated maintenance

### Response Times
- **Target**: < 200ms for cached responses
- **Target**: < 500ms for uncached responses
- **Target**: < 1000ms for complex queries

### Monitoring
- Response time monitoring
- Error rate tracking
- Cache hit ratio analysis
- Database performance metrics

## Webhook Support

### Property Status Updates
```
POST /webhooks/property-status
Content-Type: application/json
X-Signature: HMAC-SHA256

{
  "event": "property.status.changed",
  "data": {
    "property_id": "uuid",
    "old_status": "active",
    "new_status": "sold",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Booking Events
```
POST /webhooks/booking-events
Content-Type: application/json
X-Signature: HMAC-SHA256

{
  "event": "booking.created",
  "data": {
    "booking_id": "uuid",
    "property_id": "uuid",
    "agent_id": "uuid",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## SDK and Libraries

### JavaScript/Node.js
```bash
npm install rea-invest-sdk
```

```javascript
import REAInvest from 'rea-invest-sdk';

const client = new REAInvest({
  baseURL: 'https://api.rea-invest.com/api',
  token: 'your-jwt-token'
});

const properties = await client.properties.list({
  category: 'sale',
  min_price: 100000,
  max_price: 500000
});
```

### Python
```bash
pip install rea-invest-python
```

```python
from rea_invest import Client

client = Client(
    base_url='https://api.rea-invest.com/api',
    token='your-jwt-token'
)

properties = client.properties.list(
    category='sale',
    min_price=100000,
    max_price=500000
)
```

## Testing

### Test Environment
- **Base URL**: `https://api-test.rea-invest.com/api`
- **Documentation**: `https://api-test.rea-invest.com/api/docs`

### Test Data
The test environment includes sample data for testing:
- 1000+ test properties
- 50+ test users (various roles)
- 200+ test bookings
- Complete audit trail

### Test Credentials
```
Admin: admin@test.rea-invest.com / testpass123
Manager: manager@test.rea-invest.com / testpass123  
Agent: agent@test.rea-invest.com / testpass123
```

## Support

### Documentation
- API Docs: `/api/docs`
- SDK Docs: `https://docs.rea-invest.com/sdk`
- Integration Guide: `https://docs.rea-invest.com/integration`

### Contact
- Technical Support: `api-support@rea-invest.com`
- Business Development: `partnerships@rea-invest.com`
- General Inquiries: `info@rea-invest.com`

### Status Page
Monitor API status and uptime: `https://status.rea-invest.com`

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Core property management features
- User authentication and authorization
- File upload and management
- Notification system
- Analytics and reporting
- Cache management
- Database optimization tools

### Upcoming Features
- Real-time notifications via WebSocket
- Advanced analytics dashboard
- Third-party integrations (CRM, accounting)
- Mobile app API enhancements
- Multi-language support