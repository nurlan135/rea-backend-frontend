const express = require('express');
const Joi = require('joi');
const router = express.Router();
const knex = require('../knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);
const { cacheProperties, invalidateCache } = require('../middleware/cache');
const { invalidateCache: cacheInvalidator } = require('../config/cache');
const { DatabaseOptimizer } = require('../config/database-optimization');

// Validation Schemas
const createPropertySchema = Joi.object({
  property_category: Joi.string().valid('residential', 'commercial').required(),
  property_subcategory: Joi.string().min(1).max(50).required(),
  construction_type: Joi.string().valid('new', 'old', 'under_construction'),
  
  // Physical specs
  area_m2: Joi.number().positive().max(10000).required(),
  floor: Joi.number().integer().min(0).max(100),
  floors_total: Joi.number().integer().min(1).max(100),
  room_count: Joi.string().max(10),
  height: Joi.number().positive().max(10),
  
  // Location
  district_id: Joi.string().uuid(),
  street_id: Joi.string().uuid(),
  complex_id: Joi.string().uuid(),
  complex_manual: Joi.string().max(100),
  building: Joi.string().max(20),
  apt_no: Joi.string().max(10),
  block: Joi.string().max(10),
  entrance_door: Joi.number().integer().min(1),
  address: Joi.string().max(500),
  
  // Business
  category: Joi.string().valid('sale', 'rent').required(),
  listing_type: Joi.string().valid('agency_owned', 'branch_owned', 'brokerage').required(),
  buy_price_azn: Joi.when('listing_type', {
    is: Joi.string().valid('agency_owned', 'branch_owned'),
    then: Joi.number().positive().required(),
    otherwise: Joi.forbidden()
  }),
  sell_price_azn: Joi.number().positive(),
  rent_price_monthly_azn: Joi.when('category', {
    is: 'rent',
    then: Joi.number().positive(),
    otherwise: Joi.forbidden()
  }),
  
  // Brokerage fields
  owner_first_name: Joi.when('listing_type', {
    is: 'brokerage',
    then: Joi.string().min(2).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  owner_last_name: Joi.when('listing_type', {
    is: 'brokerage',
    then: Joi.string().min(2).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  owner_contact: Joi.when('listing_type', {
    is: 'brokerage',
    then: Joi.string().min(5).max(100).required(),
    otherwise: Joi.forbidden()
  }),
  brokerage_commission_percent: Joi.when('listing_type', {
    is: 'brokerage',
    then: Joi.number().min(0.1).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  
  // Features
  is_renovated: Joi.boolean().default(false),
  features: Joi.array().items(Joi.string()),
  description: Joi.string().max(2000),
  
  // Media
  images: Joi.array().items(Joi.object()),
  videos: Joi.array().items(Joi.object()),
  documents: Joi.array().items(Joi.object())
});

const updatePropertySchema = createPropertySchema.fork(
  ['property_category', 'property_subcategory', 'area_m2', 'category', 'listing_type'],
  (schema) => schema.optional()
);

// Middleware to check property permissions
const checkPropertyPermission = async (req, res, next) => {
  const { id } = req.params;
  const { user } = req;
  
  try {
    const property = await db('properties').where('id', id).first();
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Əmlak tapılmadı' }
      });
    }

    // Agents can only access their own properties
    if (user.role === 'agent' && property.assigned_to_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Bu əmlak üçün icazəniz yoxdur' }
      });
    }

    req.property = property;
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
};

// Generate property code
const generatePropertyCode = async (category, subcategory) => {
  const year = new Date().getFullYear();
  const prefix = `${category}-${subcategory}-${year}`;
  
  const lastProperty = await db('properties')
    .where('property_code', 'like', `${prefix}-%`)
    .orderBy('created_at', 'desc')
    .first();
    
  let sequence = 1;
  if (lastProperty && lastProperty.property_code) {
    const lastSequence = parseInt(lastProperty.property_code.split('-').pop()) || 0;
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
};

// Audit logging helper
const auditLog = async (userId, action, entityId, changes, ipAddress) => {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      table_name: 'properties',
      record_id: entityId,
      changes: JSON.stringify(changes),
      ip_address: ipAddress,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

/**
 * @swagger
 * /api/properties:
 *   get:
 *     tags: [Properties]
 *     summary: List properties with filtering and pagination
 *     description: Get a paginated list of properties with various filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, reserved, sold, rented, archived]
 *         description: Filter by property status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sale, rent]
 *         description: Filter by sale or rent category
 *       - in: query
 *         name: listing_type
 *         schema:
 *           type: string
 *           enum: [agency_owned, branch_owned, brokerage]
 *         description: Filter by listing type
 *       - in: query
 *         name: district_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by district ID
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: min_area
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum area filter (square meters)
 *       - in: query
 *         name: max_area
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum area filter (square meters)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, price, area]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         properties:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Property'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/properties - List properties with filtering
router.get('/', cacheProperties(600), async (req, res) => {
  try {
    const { user } = req;
    const {
      page = 1,
      limit = 20,
      status,
      category,
      listing_type,
      district_id,
      min_price,
      max_price,
      min_area,
      max_area,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build base query
    let query = db('properties')
      .select([
        'properties.*',
        'districts.name as district_name',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name'
      ])
      .leftJoin('districts', 'properties.district_id', 'districts.id')
      .leftJoin('users', 'properties.assigned_to_id', 'users.id')
      .where('properties.status', '!=', 'archived');

    // Apply database optimization for filtering
    query = DatabaseOptimizer.optimizePropertyQuery(query, {
      status,
      category,
      listing_type,
      district_id,
      price_min: min_price,
      price_max: max_price,
      area_min: min_area,
      area_max: max_area,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.where('properties.assigned_to_id', user.id);
    } else if (user.role === 'manager') {
      query = query.where('properties.branch_id', user.branch_id);
    }

    // Apply filters
    if (status) query = query.where('properties.status', status);
    if (category) query = query.where('properties.category', category);
    if (listing_type) query = query.where('properties.listing_type', listing_type);
    if (district_id) query = query.where('properties.district_id', district_id);
    
    if (min_price) query = query.where('properties.sell_price_azn', '>=', min_price);
    if (max_price) query = query.where('properties.sell_price_azn', '<=', max_price);
    if (min_area) query = query.where('properties.area_m2', '>=', min_area);
    if (max_area) query = query.where('properties.area_m2', '<=', max_area);

    // Search functionality
    if (search) {
      query = query.where(function() {
        this.where('properties.property_code', 'ilike', `%${search}%`)
          .orWhere('properties.address', 'ilike', `%${search}%`)
          .orWhere('properties.description', 'ilike', `%${search}%`);
      });
    }

    // Count total results
    const countQuery = query.clone();
    const totalCount = await countQuery.count('properties.id as count').first();
    const total = parseInt(totalCount.count);

    // Apply sorting and pagination
    const validSortFields = ['created_at', 'updated_at', 'sell_price_azn', 'area_m2'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    query = query
      .orderBy(`properties.${sortField}`, order)
      .offset((page - 1) * limit)
      .limit(limit);

    const properties = await query;

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Properties list error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// POST /api/properties - Create new property  
/**
 * @swagger
 * /api/properties:
 *   post:
 *     tags: [Properties]
 *     summary: Create a new property
 *     description: Create a new property listing with validation and audit logging
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyCreate'
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Property'
 *       400:
 *         description: Validation error or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', invalidateCache('properties:*'), async (req, res) => {
  try {
    const { error, value } = createPropertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Məlumatlar düzgün deyil',
          details: error.details.map(d => d.message)
        }
      });
    }

    const { user } = req;
    const propertyData = value;

    // Generate property code
    const propertyCode = await generatePropertyCode(
      propertyData.category, 
      propertyData.property_subcategory
    );

    // Prepare data for insertion
    const newProperty = {
      ...propertyData,
      property_code: propertyCode,
      status: 'pending',
      approval_status: 'pending',
      assigned_to_id: user.id,
      created_by_id: user.id,
      branch_id: user.branch_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert property
    const [insertedProperty] = await db('properties')
      .insert(newProperty)
      .returning('*');

    // Audit log
    await auditLog(user.id, 'CREATE', insertedProperty.id, { after: insertedProperty }, req.ip);

    res.status(201).json({
      success: true,
      data: { property: insertedProperty }
    });
  } catch (error) {
    console.error('Property creation error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_PROPERTY_CODE', message: 'Əmlak kodu artıq mövcuddur' }
      });
    }

    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// GET /api/properties/:id - Get property details
router.get('/:id', cacheProperties(300), checkPropertyPermission, async (req, res) => {
  try {
    const { property } = req;
    
    // Get detailed property information with related data
    const propertyDetails = await db('properties')
      .select([
        'properties.*',
        'districts.name as district_name',
        'streets.name as street_name', 
        'complexes.name as complex_name',
        'users.first_name as agent_first_name',
        'users.last_name as agent_last_name',
        'users.email as agent_email',
        'users.phone as agent_phone'
      ])
      .leftJoin('districts', 'properties.district_id', 'districts.id')
      .leftJoin('streets', 'properties.street_id', 'streets.id')
      .leftJoin('complexes', 'properties.complex_id', 'complexes.id')
      .leftJoin('users', 'properties.assigned_to_id', 'users.id')
      .where('properties.id', property.id)
      .first();

    // Get related expenses (if user has permission)
    let expenses = [];
    if (req.user.role !== 'agent' || property.assigned_to_id === req.user.id) {
      expenses = await db('property_expenses')
        .where('property_id', property.id)
        .orderBy('created_at', 'desc');
    }

    // Get active booking (if any)
    const activeBooking = await db('property_bookings')
      .select([
        'property_bookings.*',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name',
        'customers.phone as customer_phone'
      ])
      .leftJoin('customers', 'property_bookings.customer_id', 'customers.id')
      .where('property_bookings.property_id', property.id)
      .where('property_bookings.status', 'ACTIVE')
      .first();

    res.json({
      success: true,
      data: {
        property: propertyDetails,
        expenses,
        activeBooking
      }
    });
  } catch (error) {
    console.error('Property details error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// PATCH /api/properties/:id - Update property
router.patch('/:id', checkPropertyPermission, async (req, res) => {
  try {
    const { error, value } = updatePropertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Məlumatlar düzgün deyil',
          details: error.details.map(d => d.message)
        }
      });
    }

    const { property } = req;
    const { user } = req;
    const updateData = value;

    // Check if property can be updated (business rule)
    if (property.status === 'sold') {
      return res.status(400).json({
        success: false,
        error: { code: 'PROPERTY_SOLD', message: 'Satılmış əmlak redaktə edilə bilməz' }
      });
    }

    // For major changes (price, listing_type), require approval
    const majorChanges = ['sell_price_azn', 'listing_type', 'category'];
    const hasMajorChanges = majorChanges.some(field => field in updateData);
    
    if (hasMajorChanges && property.status === 'active') {
      updateData.approval_status = 'pending';
    }

    // Update the property
    const beforeState = { ...property };
    updateData.updated_at = new Date();
    updateData.updated_by = user.id;

    const [updatedProperty] = await db('properties')
      .where('id', property.id)
      .update(updateData)
      .returning('*');

    // Audit log
    await auditLog(user.id, 'UPDATE', property.id, { 
      before: beforeState, 
      after: updatedProperty 
    }, req.ip);

    res.json({
      success: true,
      data: { property: updatedProperty }
    });
  } catch (error) {
    console.error('Property update error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// DELETE /api/properties/:id - Soft delete property
router.delete('/:id', checkPropertyPermission, async (req, res) => {
  try {
    const { property } = req;
    const { user } = req;

    // Check permissions - only managers+ can delete
    if (!['manager', 'vp', 'director', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Əmlak silmək üçün icazəniz yoxdur' }
      });
    }

    // Check if property has active bookings
    const activeBooking = await db('property_bookings')
      .where('property_id', property.id)
      .where('status', 'ACTIVE')
      .first();

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        error: { code: 'ACTIVE_BOOKING_EXISTS', message: 'Aktiv bronu olan əmlak silinə bilməz' }
      });
    }

    // Soft delete (mark as archived)
    const beforeState = { ...property };
    const archivedProperty = await db('properties')
      .where('id', property.id)
      .update({
        status: 'archived',
        archived_at: new Date(),
        updated_by: user.id
      })
      .returning('*');

    // Audit log
    await auditLog(user.id, 'DELETE', property.id, { 
      before: beforeState, 
      after: archivedProperty[0] 
    }, req.ip);

    res.json({
      success: true,
      message: 'Əmlak uğurla arxivləşdirildi'
    });
  } catch (error) {
    console.error('Property delete error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// POST /api/properties/:id/activate - Activate property (for managers+)
router.post('/:id/activate', checkPropertyPermission, async (req, res) => {
  try {
    const { property } = req;
    const { user } = req;

    // Check permissions
    if (!['manager', 'vp', 'director', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Əmlak aktivləşdirmək üçün icazəniz yoxdur' }
      });
    }

    if (property.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Yalnız gözləyən əmlaklar aktivləşdirilə bilər' }
      });
    }

    // Activate property
    const beforeState = { ...property };
    const [activatedProperty] = await db('properties')
      .where('id', property.id)
      .update({
        status: 'active',
        approval_status: 'approved',
        updated_at: new Date(),
        updated_by: user.id
      })
      .returning('*');

    // Audit log
    await auditLog(user.id, 'ACTIVATE', property.id, { 
      before: beforeState, 
      after: activatedProperty 
    }, req.ip);

    res.json({
      success: true,
      data: { property: activatedProperty },
      message: 'Əmlak uğurla aktivləşdirildi'
    });
  } catch (error) {
    console.error('Property activation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

module.exports = router;