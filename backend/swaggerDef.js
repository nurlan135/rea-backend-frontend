const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'REA INVEST API',
    version: '1.0.0',
    description: 'REA INVEST Property Management System API Documentation',
    contact: {
      name: 'REA INVEST Development Team',
      email: 'dev@rea-invest.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
    {
      url: 'https://api.rea-invest.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from login endpoint',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          error: {
            type: 'string',
            example: 'Detailed error message',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'first_name', 'last_name', 'role'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'agent@rea-invest.com',
          },
          first_name: {
            type: 'string',
            example: 'John',
          },
          last_name: {
            type: 'string',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['agent', 'manager', 'admin'],
            example: 'agent',
          },
          phone: {
            type: 'string',
            example: '+994501234567',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended'],
            example: 'active',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      Property: {
        type: 'object',
        required: ['id', 'property_category', 'area_m2', 'category', 'listing_type'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          },
          property_category: {
            type: 'string',
            enum: ['residential', 'commercial'],
            example: 'residential',
          },
          property_subcategory: {
            type: 'string',
            example: 'apartment',
          },
          construction_type: {
            type: 'string',
            enum: ['new', 'old', 'under_construction'],
            example: 'new',
          },
          area_m2: {
            type: 'number',
            format: 'float',
            example: 120.5,
          },
          floor: {
            type: 'integer',
            example: 3,
          },
          floors_total: {
            type: 'integer',
            example: 12,
          },
          room_count: {
            type: 'string',
            example: '2+1',
          },
          height: {
            type: 'number',
            format: 'float',
            example: 2.8,
          },
          district_id: {
            type: 'string',
            format: 'uuid',
            example: 'c3d4e5f6-g7h8-9012-cdef-g34567890123',
          },
          address: {
            type: 'string',
            example: 'Nizami street 123, Baku',
          },
          category: {
            type: 'string',
            enum: ['sale', 'rent'],
            example: 'sale',
          },
          listing_type: {
            type: 'string',
            enum: ['agency_owned', 'branch_owned', 'brokerage'],
            example: 'agency_owned',
          },
          buy_price_azn: {
            type: 'number',
            format: 'float',
            example: 250000.00,
          },
          sell_price_azn: {
            type: 'number',
            format: 'float',
            example: 300000.00,
          },
          rent_price_monthly_azn: {
            type: 'number',
            format: 'float',
            example: 1500.00,
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'reserved', 'sold', 'rented', 'archived'],
            example: 'active',
          },
          agent_id: {
            type: 'string',
            format: 'uuid',
            example: 'd4e5f6g7-h8i9-0123-defg-h45678901234',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      PropertyCreate: {
        type: 'object',
        required: ['property_category', 'area_m2', 'category', 'listing_type'],
        properties: {
          property_category: {
            type: 'string',
            enum: ['residential', 'commercial'],
            example: 'residential',
          },
          property_subcategory: {
            type: 'string',
            example: 'apartment',
          },
          construction_type: {
            type: 'string',
            enum: ['new', 'old', 'under_construction'],
            example: 'new',
          },
          area_m2: {
            type: 'number',
            format: 'float',
            minimum: 0.1,
            maximum: 10000,
            example: 120.5,
          },
          floor: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            example: 3,
          },
          floors_total: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            example: 12,
          },
          room_count: {
            type: 'string',
            maxLength: 10,
            example: '2+1',
          },
          height: {
            type: 'number',
            format: 'float',
            maximum: 10,
            example: 2.8,
          },
          district_id: {
            type: 'string',
            format: 'uuid',
            example: 'c3d4e5f6-g7h8-9012-cdef-g34567890123',
          },
          address: {
            type: 'string',
            maxLength: 500,
            example: 'Nizami street 123, Baku',
          },
          category: {
            type: 'string',
            enum: ['sale', 'rent'],
            example: 'sale',
          },
          listing_type: {
            type: 'string',
            enum: ['agency_owned', 'branch_owned', 'brokerage'],
            example: 'agency_owned',
          },
          buy_price_azn: {
            type: 'number',
            format: 'float',
            minimum: 1,
            example: 250000.00,
          },
          sell_price_azn: {
            type: 'number',
            format: 'float',
            example: 300000.00,
          },
          rent_price_monthly_azn: {
            type: 'number',
            format: 'float',
            example: 1500.00,
          },
        },
      },
      Booking: {
        type: 'object',
        required: ['id', 'property_id', 'customer_id', 'booking_date'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'e5f6g7h8-i9j0-1234-efgh-i56789012345',
          },
          property_id: {
            type: 'string',
            format: 'uuid',
            example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          },
          customer_id: {
            type: 'string',
            format: 'uuid',
            example: 'f6g7h8i9-j0k1-2345-fghi-j67890123456',
          },
          agent_id: {
            type: 'string',
            format: 'uuid',
            example: 'd4e5f6g7-h8i9-0123-defg-h45678901234',
          },
          booking_date: {
            type: 'string',
            format: 'date-time',
            example: '2024-02-15T14:30:00.000Z',
          },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'completed', 'cancelled'],
            example: 'confirmed',
          },
          notes: {
            type: 'string',
            example: 'Client interested in viewing the property',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      Notification: {
        type: 'object',
        required: ['id', 'user_id', 'title', 'message', 'type'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'g7h8i9j0-k1l2-3456-ghij-k78901234567',
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          title: {
            type: 'string',
            example: 'New property booking',
          },
          message: {
            type: 'string',
            example: 'You have a new booking request for property ABC123',
          },
          type: {
            type: 'string',
            enum: ['info', 'success', 'warning', 'error', 'booking', 'property', 'system'],
            example: 'booking',
          },
          is_read: {
            type: 'boolean',
            example: false,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
          },
          limit: {
            type: 'integer',
            example: 20,
          },
          total: {
            type: 'integer',
            example: 150,
          },
          pages: {
            type: 'integer',
            example: 8,
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Properties',
      description: 'Property management endpoints',
    },
    {
      name: 'Bookings',
      description: 'Booking management endpoints',
    },
    {
      name: 'Notifications',
      description: 'Notification system endpoints',
    },
    {
      name: 'Files',
      description: 'File upload and management endpoints',
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints',
    },
    {
      name: 'Cache',
      description: 'Cache management endpoints',
    },
    {
      name: 'Database',
      description: 'Database optimization and monitoring endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API files
};

module.exports = swaggerJSDoc(options);