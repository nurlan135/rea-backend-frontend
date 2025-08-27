const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Approval routes working!' });
});

// Start approval process for a property
router.post('/properties/:propertyId/start', authenticateToken, async (req, res) => {
    const { propertyId } = req.params;

    try {
      const property = await knex('properties').where('id', propertyId).first();
      
      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }
        });
      }

      if (property.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Property is not in pending status' }
        });
      }

      // Check if user can start approval (agent or higher)
      if (!['agent', 'manager', 'director', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Not authorized to start approval' }
        });
      }

      // Check if approval already exists
      const existingApproval = await knex('approvals')
        .where({ property_id: propertyId })
        .whereIn('status', ['pending', 'in_progress'])
        .first();

      if (existingApproval) {
        return res.status(400).json({
          success: false,
          error: { code: 'APPROVAL_EXISTS', message: 'Approval process already started' }
        });
      }

      // Create approval steps based on listing type
      const approvalSteps = [];
      
      // All properties go through manager approval first
      approvalSteps.push({
        step: 'manager',
        step_order: 1,
        status: 'pending',
        required_role: 'manager'
      });

      // For agency_owned properties, add budget (VP) step
      if (property.listing_type === 'agency_owned') {
        approvalSteps.push({
          step: 'vp_budget',
          step_order: 2,
          status: 'pending',
          required_role: 'vp'
        });
      }

      // All properties need director approval
      const directorOrder = property.listing_type === 'agency_owned' ? 3 : 2;
      approvalSteps.push({
        step: 'director',
        step_order: directorOrder,
        status: 'pending',
        required_role: 'director'
      });

      // Final manager publish step
      const publishOrder = property.listing_type === 'agency_owned' ? 4 : 3;
      approvalSteps.push({
        step: 'manager_publish',
        step_order: publishOrder,
        status: 'pending',
        required_role: 'manager'
      });

      await knex.transaction(async (trx) => {
        // Create main approval record
        const [approvalId] = await trx('approvals').insert({
          property_id: propertyId,
          status: 'in_progress',
          started_by: req.user.id,
          started_at: new Date()
        }).returning('id');

        // Create approval steps
        for (const step of approvalSteps) {
          await trx('approval_steps').insert({
            approval_id: approvalId,
            ...step
          });
        }

        // Log audit trail
        await trx('audit_logs').insert({
          user_id: req.user.id,
          action: 'approval_started',
          table_name: 'properties',
          record_id: propertyId,
          changes: { approval_id: approvalId },
          ip_address: req.ip
        });

        // Log budget skip for branch_owned and brokerage
        if (property.listing_type !== 'agency_owned') {
          await trx('audit_logs').insert({
            user_id: req.user.id,
            action: 'budget_step_skipped',
            table_name: 'properties',
            record_id: propertyId,
            changes: { 
              reason: `SKIPPED_BY_RULE(listing_type=${property.listing_type})`,
              step: 'vp_budget'
            },
            ip_address: req.ip
          });
        }
      });

      res.json({
        success: true,
        data: { message: 'Approval process started' }
      });

    } catch (error) {
      console.error('Error starting approval:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to start approval process' }
      });
    }
  });

  // Approve or reject an approval step
router.post('/properties/:propertyId/:action', authenticateToken, async (req, res) => {
    const { propertyId, action } = req.params;
    const { comments } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Action must be approve or reject' }
      });
    }

    try {
      const approval = await knex('approvals')
        .where({ property_id: propertyId, status: 'in_progress' })
        .first();

      if (!approval) {
        return res.status(404).json({
          success: false,
          error: { code: 'APPROVAL_NOT_FOUND', message: 'No active approval found for this property' }
        });
      }

      // Get current pending step
      const currentStep = await knex('approval_steps')
        .where({ approval_id: approval.id, status: 'pending' })
        .orderBy('step_order', 'asc')
        .first();

      if (!currentStep) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_PENDING_STEPS', message: 'No pending approval steps' }
        });
      }

      // Check if user has permission for this step
      if (!['admin'].includes(req.user.role) && req.user.role !== currentStep.required_role) {
        return res.status(403).json({
          success: false,
          error: { code: 'INSUFFICIENT_PERMISSIONS', message: `This step requires ${currentStep.required_role} role` }
        });
      }

      await knex.transaction(async (trx) => {
        // Update the current step
        await trx('approval_steps')
          .where({ id: currentStep.id })
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: req.user.id,
            approved_at: new Date(),
            comments: comments || null
          });

        if (action === 'reject') {
          // If rejected, mark entire approval as rejected
          await trx('approvals')
            .where({ id: approval.id })
            .update({ status: 'rejected' });

          // Log audit
          await trx('audit_logs').insert({
            user_id: req.user.id,
            action: 'approval_rejected',
            table_name: 'properties',
            record_id: propertyId,
            changes: { step: currentStep.step, comments },
            ip_address: req.ip
          });

        } else {
          // Check if there are more pending steps
          const nextStep = await trx('approval_steps')
            .where({ approval_id: approval.id, status: 'pending' })
            .orderBy('step_order', 'asc')
            .first();

          if (!nextStep) {
            // All steps approved - activate property
            await trx('approvals')
              .where({ id: approval.id })
              .update({ 
                status: 'approved',
                completed_at: new Date()
              });

            await trx('properties')
              .where({ id: propertyId })
              .update({ status: 'active' });

            // Log audit
            await trx('audit_logs').insert({
              user_id: req.user.id,
              action: 'property_approved',
              table_name: 'properties',
              record_id: propertyId,
              changes: { status: 'active' },
              ip_address: req.ip
            });
          } else {
            // Log step approval
            await trx('audit_logs').insert({
              user_id: req.user.id,
              action: 'approval_step_approved',
              table_name: 'properties',
              record_id: propertyId,
              changes: { step: currentStep.step, comments },
              ip_address: req.ip
            });
          }
        }
      });

      res.json({
        success: true,
        data: { message: `Property ${action}d successfully` }
      });

    } catch (error) {
      console.error(`Error ${action}ing property:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: `Failed to ${action} property` }
      });
    }
  });

  // Get approval status for a property
router.get('/properties/:propertyId', authenticateToken, async (req, res) => {
    const { propertyId } = req.params;

    try {
      const approval = await knex('approvals')
        .select('approvals.*')
        .where({ property_id: propertyId })
        .orderBy('created_at', 'desc')
        .first();

      if (!approval) {
        return res.json({
          success: true,
          data: { approval: null, steps: [] }
        });
      }

      const steps = await knex('approval_steps')
        .select('approval_steps.*', 'users.first_name', 'users.last_name')
        .leftJoin('users', 'approval_steps.approved_by', 'users.id')
        .where({ approval_id: approval.id })
        .orderBy('step_order', 'asc');

      res.json({
        success: true,
        data: { approval, steps }
      });

    } catch (error) {
      console.error('Error getting approval:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get approval status' }
      });
    }
  });

  // Get all pending approvals for current user
router.get('/pending', authenticateToken, async (req, res) => {
    try {
      const userRole = req.user.role;
      
      if (!['manager', 'vp', 'director', 'admin'].includes(userRole)) {
        return res.json({
          success: true,
          data: { approvals: [] }
        });
      }

      const query = knex('approval_steps')
        .select(
          'approval_steps.*',
          'properties.code as property_code',
          'properties.area_m2',
          'properties.buy_price_azn',
          'properties.property_category',
          'properties.property_subcategory',
          'properties.created_at as property_created_at',
          'creator.first_name as created_by_first_name',
          'creator.last_name as created_by_last_name'
        )
        .join('approvals', 'approval_steps.approval_id', 'approvals.id')
        .join('properties', 'approvals.property_id', 'properties.id')
        .join('users as creator', 'properties.created_by_id', 'creator.id')
        .where('approval_steps.status', 'pending')
        .where('approvals.status', 'in_progress');

      // Filter by user role
      if (userRole !== 'admin') {
        query.where('approval_steps.required_role', userRole);
      }

      const approvals = await query.orderBy('properties.created_at', 'asc');

      res.json({
        success: true,
        data: { approvals }
      });

    } catch (error) {
      console.error('Error getting pending approvals:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get pending approvals' }
      });
    }
  });

module.exports = router;