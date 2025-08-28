const express = require('express');
const Joi = require('joi');
const router = express.Router();
const knex = require('../knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);

// Validation Schemas
const createBookingSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  booking_date: Joi.date().default(new Date()),
  expiry_date: Joi.date().min('now').required(),
  deposit_amount_azn: Joi.number().min(0),
  notes: Joi.string().max(1000)
});

const updateBookingSchema = Joi.object({
  expiry_date: Joi.date().min('now'),
  deposit_amount_azn: Joi.number().min(0),
  notes: Joi.string().max(1000)
});

// Middleware to check booking permissions
const checkBookingPermission = async (req, res, next) => {
  const { id } = req.params;
  const { user } = req;
  
  try {
    const booking = await db('property_bookings')
      .select([
        'property_bookings.*',
        'properties.agent_id'
      ])
      .leftJoin('properties', 'property_bookings.property_id', 'properties.id')
      .where('property_bookings.id', id)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Bron tapılmadı' }
      });
    }

    // Agents can only access bookings for their own properties
    if (user.role === 'agent' && booking.agent_id !== user.id && booking.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Bu bron üçün icazəniz yoxdur' }
      });
    }

    req.booking = booking;
    next();
  } catch (error) {
    console.error('Booking permission check error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
};

// Audit logging helper
const auditLog = async (userId, action, entityId, changes, ipAddress) => {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      table_name: 'property_bookings',
      record_id: entityId,
      changes: JSON.stringify(changes),
      ip_address: ipAddress,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// POST /api/properties/:propertyId/bookings - Create booking for property
router.post('/properties/:propertyId/bookings', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { user } = req;

    // Validate input
    const { error, value } = createBookingSchema.validate(req.body);
    
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

    const bookingData = value;

    // Check if property exists and is active
    const property = await db('properties').where('id', propertyId).first();
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Əmlak tapılmadı' }
      });
    }

    if (property.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: { code: 'PROPERTY_NOT_ACTIVE', message: 'Yalnız aktiv əmlaklar üçün bron edilə bilər' }
      });
    }

    // Check if customer exists
    const customer = await db('customers').where('id', bookingData.customer_id).first();
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: 'Müştəri tapılmadı' }
      });
    }

    // Check for existing active booking (unique constraint)
    const existingBooking = await db('property_bookings')
      .where('property_id', propertyId)
      .where('status', 'ACTIVE')
      .first();

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: { code: 'ACTIVE_BOOKING_EXISTS', message: 'Bu əmlak üçün artıq aktiv bron mövcuddur' }
      });
    }

    // Create booking
    const newBooking = {
      property_id: propertyId,
      ...bookingData,
      status: 'ACTIVE',
      created_by: user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Use transaction for data consistency
    const [createdBooking] = await db.transaction(async (trx) => {
      const [booking] = await trx('property_bookings')
        .insert(newBooking)
        .returning('*');

      // Log communication
      await trx('property_communications').insert({
        property_id: propertyId,
        customer_id: bookingData.customer_id,
        communication_type: 'system',
        direction: 'outbound',
        content: `Bron yaradıldı: ${booking.id}`,
        created_by: user.id,
        created_at: new Date()
      });

      return [booking];
    });

    // Audit log
    await auditLog(user.id, 'CREATE_BOOKING', createdBooking.id, { after: createdBooking }, req.ip);

    res.status(201).json({
      success: true,
      data: { booking: createdBooking },
      message: 'Bron uğurla yaradıldı'
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: { code: 'ACTIVE_BOOKING_EXISTS', message: 'Bu əmlak üçün artıq aktiv bron mövcuddur' }
      });
    }

    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// GET /api/bookings - List all bookings with filtering
router.get('/', async (req, res) => {
  try {
    const { user } = req;
    const {
      page = 1,
      limit = 20,
      status,
      property_id,
      customer_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build base query
    let query = db('property_bookings')
      .select([
        'property_bookings.*',
        'properties.property_code',
        'properties.address as property_address',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name',
        'customers.phone as customer_phone'
      ])
      .leftJoin('properties', 'property_bookings.property_id', 'properties.id')
      .leftJoin('customers', 'property_bookings.customer_id', 'customers.id');

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.where('properties.agent_id', user.id);
    } else if (user.role === 'manager') {
      query = query.where('properties.branch_id', user.branch_id);
    }

    // Apply filters
    if (status) query = query.where('property_bookings.status', status);
    if (property_id) query = query.where('property_bookings.property_id', property_id);
    if (customer_id) query = query.where('property_bookings.customer_id', customer_id);

    // Count total results
    const countQuery = query.clone();
    const totalCount = await countQuery.count('property_bookings.id as count').first();
    const total = parseInt(totalCount.count);

    // Apply sorting and pagination
    const validSortFields = ['created_at', 'updated_at', 'booking_date', 'expiry_date'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    query = query
      .orderBy(`property_bookings.${sortField}`, order)
      .offset((page - 1) * limit)
      .limit(limit);

    const bookings = await query;

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Bookings list error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', checkBookingPermission, async (req, res) => {
  try {
    const { booking } = req;
    
    // Get detailed booking information
    const bookingDetails = await db('property_bookings')
      .select([
        'property_bookings.*',
        'properties.property_code',
        'properties.address as property_address',
        'properties.sell_price_azn',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name',
        'customers.phone as customer_phone',
        'customers.email as customer_email'
      ])
      .leftJoin('properties', 'property_bookings.property_id', 'properties.id')
      .leftJoin('customers', 'property_bookings.customer_id', 'customers.id')
      .where('property_bookings.id', booking.id)
      .first();

    res.json({
      success: true,
      data: { booking: bookingDetails }
    });
  } catch (error) {
    console.error('Booking details error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// PATCH /api/bookings/:id - Update booking
router.patch('/:id', checkBookingPermission, async (req, res) => {
  try {
    const { error, value } = updateBookingSchema.validate(req.body);
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

    const { booking } = req;
    const { user } = req;
    const updateData = value;

    if (booking.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { code: 'BOOKING_NOT_ACTIVE', message: 'Yalnız aktiv bronlar redaktə edilə bilər' }
      });
    }

    // Update booking
    const beforeState = { ...booking };
    updateData.updated_at = new Date();

    const [updatedBooking] = await db('property_bookings')
      .where('id', booking.id)
      .update(updateData)
      .returning('*');

    // Audit log
    await auditLog(user.id, 'UPDATE_BOOKING', booking.id, { 
      before: beforeState, 
      after: updatedBooking 
    }, req.ip);

    res.json({
      success: true,
      data: { booking: updatedBooking },
      message: 'Bron uğurla yeniləndi'
    });
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// POST /api/bookings/:id/convert - Convert booking to transaction (idempotent)
router.post('/:id/convert', checkBookingPermission, async (req, res) => {
  try {
    const { booking } = req;
    const { user } = req;
    const { sale_price_azn, notes } = req.body;

    // Validate sale price
    if (!sale_price_azn || sale_price_azn <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SALE_PRICE', message: 'Keçərli satış qiyməti tələb olunur' }
      });
    }

    // Check if already converted (idempotent behavior)
    if (booking.status === 'CONVERTED') {
      return res.json({
        success: true,
        data: { booking },
        message: 'Bron artıq sövdələşməyə çevrilib'
      });
    }

    if (booking.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { code: 'BOOKING_NOT_ACTIVE', message: 'Yalnız aktiv bronlar çevrilə bilər' }
      });
    }

    const result = await db.transaction(async (trx) => {
      // Update booking status to converted
      const [convertedBooking] = await trx('property_bookings')
        .where('id', booking.id)
        .update({
          status: 'CONVERTED',
          updated_at: new Date()
        })
        .returning('*');

      // Update property status to sold
      await trx('properties')
        .where('id', booking.property_id)
        .update({
          status: 'sold',
          sell_price_azn: sale_price_azn,
          sold_at: new Date(),
          updated_at: new Date(),
          updated_by: user.id
        });

      return convertedBooking;
    });

    // Audit log
    await auditLog(user.id, 'CONVERT_BOOKING', booking.id, { 
      before: booking, 
      after: result,
      sale_price_azn,
      notes
    }, req.ip);

    res.json({
      success: true,
      data: { booking: result },
      message: 'Bron uğurla sövdələşməyə çevrildi'
    });

  } catch (error) {
    console.error('Convert booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/:id/cancel', checkBookingPermission, async (req, res) => {
  try {
    const { booking } = req;
    const { user } = req;
    const { reason } = req.body;

    if (booking.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { code: 'BOOKING_NOT_ACTIVE', message: 'Yalnız aktiv bronlar ləğv edilə bilər' }
      });
    }

    // Cancel booking
    const [cancelledBooking] = await db('property_bookings')
      .where('id', booking.id)
      .update({
        status: 'CANCELLED',
        updated_at: new Date()
      })
      .returning('*');

    // Audit log
    await auditLog(user.id, 'CANCEL_BOOKING', booking.id, { 
      before: booking, 
      after: cancelledBooking,
      reason
    }, req.ip);

    res.json({
      success: true,
      data: { booking: cancelledBooking },
      message: 'Bron uğurla ləğv edildi'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası' }
    });
  }
});

module.exports = router;