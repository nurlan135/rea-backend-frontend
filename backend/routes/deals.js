const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const router = express.Router();
const DealService = require('../services/DealService');

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_REQUIRED', message: 'Access token is required' }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'development-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      });
    }
    req.user = user;
    next();
  });
}

const knex = require('../database');

// Validation schemas
const createDealSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  customer_id: Joi.string().uuid().required(),
  type: Joi.string().valid('buy', 'sell', 'rent', 'brokerage').required(),
  sell_price_azn: Joi.number().min(0).when('type', {
    is: Joi.string().valid('sell', 'brokerage'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  buy_price_azn: Joi.number().min(0).optional(),
  deal_type: Joi.string().valid('direct', 'brokerage').default('direct'),
  notes: Joi.string().max(1000).optional()
});

const updateDealSchema = Joi.object({
  sell_price_azn: Joi.number().min(0).optional(),
  buy_price_azn: Joi.number().min(0).optional(),
  brokerage_percent: Joi.number().min(0).max(100).optional(),
  payout_status: Joi.string().valid('pending', 'approved', 'paid').optional(),
  payout_date: Joi.date().optional(),
  invoice_no: Joi.string().max(100).optional(),
  partner_agency: Joi.string().max(200).optional(),
  notes: Joi.string().max(1000).optional()
});

// POST /api/deals - Create new deal with commission calculations
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /deals - Request body:', JSON.stringify(req.body, null, 2));

    // Validate input
    const { error, value } = createDealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }

    await knex.transaction(async (trx) => {
      // Create deal with commission calculations
      const deal = await DealService.createDeal(value, trx);

      // Log audit trail
      await trx('audit_logs').insert({
        user_id: req.user.id,
        action: 'CREATE',
        table_name: 'deals',
        record_id: deal.id,
        changes: {
          after: deal
        },
        ip_address: req.ip
      });

      res.status(201).json({
        success: true,
        data: { deal },
        message: 'Deal created successfully with commission calculations'
      });
    });

  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_DEAL_ERROR', message: error.message || 'Failed to create deal' }
    });
  }
});

// PATCH /api/deals/:id - Update deal and recalculate commissions
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateDealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }

    await knex.transaction(async (trx) => {
      const existingDeal = await trx('deals').where('id', id).first();
      
      if (!existingDeal) {
        return res.status(404).json({
          success: false,
          error: { code: 'DEAL_NOT_FOUND', message: 'Deal not found' }
        });
      }

      // Update deal with recalculated commissions
      const updatedDeal = await DealService.updateDeal(id, value, trx);

      // Log audit trail
      await trx('audit_logs').insert({
        user_id: req.user.id,
        action: 'UPDATE',
        table_name: 'deals',
        record_id: id,
        changes: {
          before: existingDeal,
          after: updatedDeal
        },
        ip_address: req.ip
      });

      res.json({
        success: true,
        data: { deal: updatedDeal },
        message: 'Deal updated successfully'
      });
    });

  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_DEAL_ERROR', message: error.message || 'Failed to update deal' }
    });
  }
});

// PATCH /api/deals/:id/brokerage - Update brokerage-specific fields
router.patch('/:id/brokerage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brokerage_percent,
      partner_agency,
      payout_status,
      payout_date,
      invoice_no
    } = req.body;

    // Validate payout status requirements
    if (payout_status === 'paid') {
      if (!payout_date || !invoice_no) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'PAYOUT_DETAILS_REQUIRED', 
            message: 'Payout date and invoice number are required when status is paid' 
          }
        });
      }
    }

    await knex.transaction(async (trx) => {
      const existingDeal = await trx('deals').where('id', id).first();
      
      if (!existingDeal) {
        return res.status(404).json({
          success: false,
          error: { code: 'DEAL_NOT_FOUND', message: 'Deal not found' }
        });
      }

      if (existingDeal.deal_type !== 'brokerage') {
        return res.status(400).json({
          success: false,
          error: { code: 'NOT_BROKERAGE_DEAL', message: 'This endpoint is only for brokerage deals' }
        });
      }

      const updateData = {
        ...(brokerage_percent && { brokerage_percent }),
        ...(partner_agency && { partner_agency }),
        ...(payout_status && { payout_status }),
        ...(payout_date && { payout_date }),
        ...(invoice_no && { invoice_no })
      };

      // Update with commission recalculation if needed
      const updatedDeal = await DealService.updateDeal(id, updateData, trx);

      // Log audit trail
      await trx('audit_logs').insert({
        user_id: req.user.id,
        action: 'UPDATE_BROKERAGE',
        table_name: 'deals',
        record_id: id,
        changes: {
          before: existingDeal,
          after: updatedDeal
        },
        ip_address: req.ip
      });

      res.json({
        success: true,
        data: { deal: updatedDeal },
        message: 'Brokerage deal updated successfully'
      });
    });

  } catch (error) {
    console.error('Update brokerage deal error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_BROKERAGE_ERROR', message: error.message || 'Failed to update brokerage deal' }
    });
  }
});

// GET /api/deals/commission-summary - Get commission summary for reporting
router.get('/commission-summary', authenticateToken, async (req, res) => {
  try {
    const { from_date, to_date, deal_type, listing_type } = req.query;

    const summary = await DealService.getCommissionSummary({
      from_date,
      to_date,
      deal_type,
      listing_type
    });

    res.json({
      success: true,
      data: { commission_summary: summary },
      message: 'Commission summary retrieved successfully'
    });

  } catch (error) {
    console.error('Get commission summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'COMMISSION_SUMMARY_ERROR', message: 'Failed to get commission summary' }
    });
  }
});

module.exports = router;