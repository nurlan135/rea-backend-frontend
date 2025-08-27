const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../database');
const router = express.Router();

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Approval routes working!' });
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

    // For now, return empty list - we'll populate this with actual pending properties
    const pendingProperties = await knex('properties')
      .select(
        'id',
        'code',
        'property_category',
        'property_subcategory',
        'area_m2',
        'buy_price_azn',
        'status',
        'created_at',
        'listing_type'
      )
      .where('status', 'pending')
      .orderBy('created_at', 'asc')
      .limit(20);

    res.json({
      success: true,
      data: { approvals: pendingProperties }
    });

  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get pending approvals' }
    });
  }
});

// Start approval process for a property
router.post('/properties/:propertyId/start', authenticateToken, async (req, res) => {
  const { propertyId } = req.params;

  try {
    // For now, just return success - we'll implement full approval logic later
    res.json({
      success: true,
      data: { message: 'Approval process started', propertyId }
    });

  } catch (error) {
    console.error('Error starting approval:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to start approval process' }
    });
  }
});

// Approve or reject property (simplified)
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
    if (action === 'approve') {
      // Update property status to active
      await knex('properties')
        .where('id', propertyId)
        .update({ status: 'active' });
    } else {
      // Keep as pending for rejection - can be improved later
    }

    res.json({
      success: true,
      data: { message: `Property ${action}d successfully`, propertyId, comments }
    });

  } catch (error) {
    console.error(`Error ${action}ing property:`, error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: `Failed to ${action} property` }
    });
  }
});

module.exports = router;