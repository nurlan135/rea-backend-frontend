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

// Simple approve endpoint for testing
router.post('/approve/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log('=== APPROVAL TEST ===');
  console.log('Property ID:', id);
  console.log('User:', req.user.email, req.user.role);
  
  try {
    // Get property
    const property = await knex('properties').where('id', id).first();
    console.log('Property found:', property ? `${property.code} - ${property.status}` : 'NOT FOUND');
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }
      });
    }

    if (property.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Property status is ${property.status}, not pending` }
      });
    }

    // Check permissions
    if (!['manager', 'vp', 'director', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Not authorized to approve' }
      });
    }

    // Update status
    console.log('Updating property status...');
    const result = await knex('properties')
      .where('id', id)
      .update({ 
        status: 'active',
        updated_at: knex.fn.now()
      });
    
    console.log('Update result:', result);

    res.json({
      success: true,
      data: { 
        message: 'Property approved successfully',
        propertyId: id,
        newStatus: 'active'
      }
    });

  } catch (error) {
    console.error('=== APPROVAL ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: { 
        code: 'SERVER_ERROR', 
        message: 'Failed to approve property',
        details: error.message 
      }
    });
  }
});

// Get property status
router.get('/status/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const property = await knex('properties')
      .select('id', 'code', 'status', 'created_at', 'updated_at')
      .where('id', id)
      .first();

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }
      });
    }

    res.json({
      success: true,
      data: { property }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get status' }
    });
  }
});

module.exports = router;