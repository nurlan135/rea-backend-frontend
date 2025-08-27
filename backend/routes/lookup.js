const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../database');
const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'ACCESS_TOKEN_REQUIRED',
        message: 'Access token is required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'development-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = user;
    next();
  });
}

// Get all districts
router.get('/districts', authenticateToken, async (req, res) => {
  try {
    const districts = await knex('districts')
      .select('id', 'name', 'city')
      .orderBy('name');
    
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get streets by district
router.get('/streets', authenticateToken, async (req, res) => {
  try {
    const { district_id } = req.query;
    
    let query = knex('streets')
      .select('streets.id', 'streets.name', 'districts.name as district_name')
      .leftJoin('districts', 'streets.district_id', 'districts.id')
      .orderBy('streets.name');
    
    if (district_id) {
      query = query.where('streets.district_id', district_id);
    }
    
    const streets = await query;
    
    res.json({
      success: true,
      data: streets
    });
  } catch (error) {
    console.error('Error fetching streets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all complexes
router.get('/complexes', authenticateToken, async (req, res) => {
  try {
    const complexes = await knex('complexes')
      .select('id', 'name', 'location', 'type')
      .orderBy('name');
    
    res.json({
      success: true,
      data: complexes
    });
  } catch (error) {
    console.error('Error fetching complexes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all document types
router.get('/document-types', authenticateToken, async (req, res) => {
  try {
    const documentTypes = await knex('document_types')
      .select('id', 'name', 'code')
      .orderBy('name');
    
    res.json({
      success: true,
      data: documentTypes
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new complex (for manual entry)
router.post('/complexes', authenticateToken, async (req, res) => {
  try {
    const { name, location, type = 'residential' } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Complex name is required'
      });
    }
    
    // Check if complex already exists
    const existing = await knex('complexes')
      .where('name', 'ilike', name)
      .first();
    
    if (existing) {
      return res.json({
        success: true,
        data: existing
      });
    }
    
    const [complex] = await knex('complexes')
      .insert({
        name,
        location,
        type
      })
      .returning('*');
    
    res.status(201).json({
      success: true,
      data: complex
    });
  } catch (error) {
    console.error('Error creating complex:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;