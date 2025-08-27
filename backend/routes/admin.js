const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
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

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin role required'
      }
    });
  }
  next();
}

// Validation schemas
const complexSchema = Joi.object({
  name: Joi.string().max(200).required(),
  location: Joi.string().allow('').max(300),
  type: Joi.string().valid('residential', 'commercial', 'mixed').required()
});

const districtSchema = Joi.object({
  name: Joi.string().max(100).required(),
  city: Joi.string().max(50).default('Baku')
});

const streetSchema = Joi.object({
  name: Joi.string().max(200).required(),
  district_id: Joi.string().uuid().required()
});

const documentTypeSchema = Joi.object({
  name: Joi.string().max(100).required(),
  code: Joi.string().max(20).required()
});

const branchSchema = Joi.object({
  name: Joi.string().max(100).required(),
  code: Joi.string().max(10).required(),
  address: Joi.string().allow('').max(300),
  phone: Joi.string().allow('').max(20),
  email: Joi.string().email().allow('')
});

// ==== COMPLEXES ROUTES ====

// GET /api/admin/complexes - List all complexes
router.get('/complexes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('complexes').select('*');

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    if (type) {
      query = query.where('type', type);
    }

    const [complexes, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy('name'),
      knex('complexes').count('* as count').first()
    ]);

    const total = parseInt(totalResult.count);

    res.json({
      success: true,
      data: {
        complexes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get complexes error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_COMPLEXES_ERROR', message: 'Failed to fetch complexes' }
    });
  }
});

// POST /api/admin/complexes - Create new complex
router.post('/complexes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = complexSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    // Check if name already exists
    const existing = await knex('complexes').where('name', 'ilike', value.name).first();
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'COMPLEX_EXISTS', message: 'Complex with this name already exists' }
      });
    }

    const [complex] = await knex('complexes').insert(value).returning('*');

    res.status(201).json({
      success: true,
      data: { complex }
    });
  } catch (error) {
    console.error('Create complex error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_COMPLEX_ERROR', message: 'Failed to create complex' }
    });
  }
});

// PATCH /api/admin/complexes/:id - Update complex
router.patch('/complexes/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = complexSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const existing = await knex('complexes').where('id', id).first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPLEX_NOT_FOUND', message: 'Complex not found' }
      });
    }

    // Check name uniqueness (exclude current record)
    const nameExists = await knex('complexes')
      .where('name', 'ilike', value.name)
      .where('id', '!=', id)
      .first();
    
    if (nameExists) {
      return res.status(400).json({
        success: false,
        error: { code: 'COMPLEX_EXISTS', message: 'Complex with this name already exists' }
      });
    }

    const [complex] = await knex('complexes')
      .where('id', id)
      .update(value)
      .returning('*');

    res.json({
      success: true,
      data: { complex }
    });
  } catch (error) {
    console.error('Update complex error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_COMPLEX_ERROR', message: 'Failed to update complex' }
    });
  }
});

// DELETE /api/admin/complexes/:id - Delete complex
router.delete('/complexes/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if complex is used in any property
    const usedInProperty = await knex('properties').where('complex_id', id).first();
    if (usedInProperty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COMPLEX_IN_USE',
          message: 'Cannot delete complex that is used in properties'
        }
      });
    }

    const deleted = await knex('complexes').where('id', id).del();
    
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMPLEX_NOT_FOUND', message: 'Complex not found' }
      });
    }

    res.json({
      success: true,
      message: 'Complex deleted successfully'
    });
  } catch (error) {
    console.error('Delete complex error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_COMPLEX_ERROR', message: 'Failed to delete complex' }
    });
  }
});

// ==== DISTRICTS ROUTES ====

// GET /api/admin/districts - List all districts
router.get('/districts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('districts').select('*');

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    const [districts, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy('name'),
      knex('districts').count('* as count').first()
    ]);

    const total = parseInt(totalResult.count);

    res.json({
      success: true,
      data: {
        districts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_DISTRICTS_ERROR', message: 'Failed to fetch districts' }
    });
  }
});

// POST /api/admin/districts - Create new district
router.post('/districts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = districtSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const existing = await knex('districts').where('name', 'ilike', value.name).first();
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISTRICT_EXISTS', message: 'District with this name already exists' }
      });
    }

    const [district] = await knex('districts').insert(value).returning('*');

    res.status(201).json({
      success: true,
      data: { district }
    });
  } catch (error) {
    console.error('Create district error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_DISTRICT_ERROR', message: 'Failed to create district' }
    });
  }
});

// PATCH /api/admin/districts/:id - Update district
router.patch('/districts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = districtSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const existing = await knex('districts').where('id', id).first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'DISTRICT_NOT_FOUND', message: 'District not found' }
      });
    }

    const nameExists = await knex('districts')
      .where('name', 'ilike', value.name)
      .where('id', '!=', id)
      .first();
    
    if (nameExists) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISTRICT_EXISTS', message: 'District with this name already exists' }
      });
    }

    const [district] = await knex('districts')
      .where('id', id)
      .update(value)
      .returning('*');

    res.json({
      success: true,
      data: { district }
    });
  } catch (error) {
    console.error('Update district error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_DISTRICT_ERROR', message: 'Failed to update district' }
    });
  }
});

// DELETE /api/admin/districts/:id - Delete district
router.delete('/districts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if district is used in any property or street
    const [usedInProperty, usedInStreet] = await Promise.all([
      knex('properties').where('district_id', id).first(),
      knex('streets').where('district_id', id).first()
    ]);

    if (usedInProperty || usedInStreet) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DISTRICT_IN_USE',
          message: 'Cannot delete district that is used in properties or streets'
        }
      });
    }

    const deleted = await knex('districts').where('id', id).del();
    
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'DISTRICT_NOT_FOUND', message: 'District not found' }
      });
    }

    res.json({
      success: true,
      message: 'District deleted successfully'
    });
  } catch (error) {
    console.error('Delete district error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_DISTRICT_ERROR', message: 'Failed to delete district' }
    });
  }
});

// ==== STREETS ROUTES ====

// GET /api/admin/streets - List all streets
router.get('/streets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, district_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('streets as s')
      .leftJoin('districts as d', 's.district_id', 'd.id')
      .select('s.*', 'd.name as district_name');

    if (search) {
      query = query.where('s.name', 'ilike', `%${search}%`);
    }

    if (district_id) {
      query = query.where('s.district_id', district_id);
    }

    const [streets, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy('s.name'),
      knex('streets').count('* as count').first()
    ]);

    const total = parseInt(totalResult.count);

    res.json({
      success: true,
      data: {
        streets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get streets error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_STREETS_ERROR', message: 'Failed to fetch streets' }
    });
  }
});

// POST /api/admin/streets - Create new street
router.post('/streets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = streetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    // Check if district exists
    const district = await knex('districts').where('id', value.district_id).first();
    if (!district) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISTRICT_NOT_FOUND', message: 'District not found' }
      });
    }

    // Check if street name already exists in this district
    const existing = await knex('streets')
      .where('name', 'ilike', value.name)
      .where('district_id', value.district_id)
      .first();
    
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'STREET_EXISTS', message: 'Street with this name already exists in this district' }
      });
    }

    const [street] = await knex('streets').insert(value).returning('*');

    res.status(201).json({
      success: true,
      data: { street }
    });
  } catch (error) {
    console.error('Create street error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_STREET_ERROR', message: 'Failed to create street' }
    });
  }
});

// PATCH /api/admin/streets/:id - Update street
router.patch('/streets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = streetSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const existing = await knex('streets').where('id', id).first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'STREET_NOT_FOUND', message: 'Street not found' }
      });
    }

    // Check if district exists
    const district = await knex('districts').where('id', value.district_id).first();
    if (!district) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISTRICT_NOT_FOUND', message: 'District not found' }
      });
    }

    // Check name uniqueness in district (exclude current record)
    const nameExists = await knex('streets')
      .where('name', 'ilike', value.name)
      .where('district_id', value.district_id)
      .where('id', '!=', id)
      .first();
    
    if (nameExists) {
      return res.status(400).json({
        success: false,
        error: { code: 'STREET_EXISTS', message: 'Street with this name already exists in this district' }
      });
    }

    const [street] = await knex('streets')
      .where('id', id)
      .update(value)
      .returning('*');

    res.json({
      success: true,
      data: { street }
    });
  } catch (error) {
    console.error('Update street error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_STREET_ERROR', message: 'Failed to update street' }
    });
  }
});

// DELETE /api/admin/streets/:id - Delete street
router.delete('/streets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if street is used in any property
    const usedInProperty = await knex('properties').where('street_id', id).first();
    if (usedInProperty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'STREET_IN_USE',
          message: 'Cannot delete street that is used in properties'
        }
      });
    }

    const deleted = await knex('streets').where('id', id).del();
    
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'STREET_NOT_FOUND', message: 'Street not found' }
      });
    }

    res.json({
      success: true,
      message: 'Street deleted successfully'
    });
  } catch (error) {
    console.error('Delete street error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_STREET_ERROR', message: 'Failed to delete street' }
    });
  }
});

// ==== DOCUMENT TYPES ROUTES ====

// GET /api/admin/document-types - List all document types
router.get('/document-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('document_types').select('*');

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('code', 'ilike', `%${search}%`);
      });
    }

    const [documentTypes, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy('name'),
      knex('document_types').count('* as count').first()
    ]);

    const total = parseInt(totalResult.count);

    res.json({
      success: true,
      data: {
        documentTypes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_DOCUMENT_TYPES_ERROR', message: 'Failed to fetch document types' }
    });
  }
});

// POST /api/admin/document-types - Create new document type
router.post('/document-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = documentTypeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    // Check if name or code already exists
    const existing = await knex('document_types')
      .where('name', 'ilike', value.name)
      .orWhere('code', 'ilike', value.code)
      .first();
    
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'DOCUMENT_TYPE_EXISTS', message: 'Document type with this name or code already exists' }
      });
    }

    const [documentType] = await knex('document_types').insert(value).returning('*');

    res.status(201).json({
      success: true,
      data: { documentType }
    });
  } catch (error) {
    console.error('Create document type error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_DOCUMENT_TYPE_ERROR', message: 'Failed to create document type' }
    });
  }
});

// PATCH /api/admin/document-types/:id - Update document type
router.patch('/document-types/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = documentTypeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const existing = await knex('document_types').where('id', id).first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_TYPE_NOT_FOUND', message: 'Document type not found' }
      });
    }

    // Check name and code uniqueness (exclude current record)
    const nameOrCodeExists = await knex('document_types')
      .where(function() {
        this.where('name', 'ilike', value.name)
            .orWhere('code', 'ilike', value.code);
      })
      .where('id', '!=', id)
      .first();
    
    if (nameOrCodeExists) {
      return res.status(400).json({
        success: false,
        error: { code: 'DOCUMENT_TYPE_EXISTS', message: 'Document type with this name or code already exists' }
      });
    }

    const [documentType] = await knex('document_types')
      .where('id', id)
      .update(value)
      .returning('*');

    res.json({
      success: true,
      data: { documentType }
    });
  } catch (error) {
    console.error('Update document type error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_DOCUMENT_TYPE_ERROR', message: 'Failed to update document type' }
    });
  }
});

// DELETE /api/admin/document-types/:id - Delete document type
router.delete('/document-types/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if document type is used in any property
    const usedInProperty = await knex('properties').where('document_type_id', id).first();
    if (usedInProperty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOCUMENT_TYPE_IN_USE',
          message: 'Cannot delete document type that is used in properties'
        }
      });
    }

    const deleted = await knex('document_types').where('id', id).del();
    
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_TYPE_NOT_FOUND', message: 'Document type not found' }
      });
    }

    res.json({
      success: true,
      message: 'Document type deleted successfully'
    });
  } catch (error) {
    console.error('Delete document type error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_DOCUMENT_TYPE_ERROR', message: 'Failed to delete document type' }
    });
  }
});

// ==== BRANCHES ROUTES ====

// GET /api/admin/branches - List all branches
router.get('/branches', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('branches').select('*');

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('code', 'ilike', `%${search}%`);
      });
    }

    const [branches, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy('name'),
      knex('branches').count('* as count').first()
    ]);

    const total = parseInt(totalResult.count);

    res.json({
      success: true,
      data: {
        branches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_BRANCHES_ERROR', message: 'Failed to fetch branches' }
    });
  }
});

// POST /api/admin/branches - Create new branch
router.post('/branches', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error, value } = branchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    // Check if name or code already exists
    const existing = await knex('branches')
      .where('name', 'ilike', value.name)
      .orWhere('code', 'ilike', value.code)
      .first();
    
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'BRANCH_EXISTS', message: 'Branch with this name or code already exists' }
      });
    }

    const [branch] = await knex('branches').insert(value).returning('*');

    res.status(201).json({
      success: true,
      data: { branch }
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_BRANCH_ERROR', message: 'Failed to create branch' }
    });
  }
});

// PATCH /api/admin/branches/:id - Update branch
router.patch('/branches/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = branchSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const existing = await knex('branches').where('id', id).first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'BRANCH_NOT_FOUND', message: 'Branch not found' }
      });
    }

    // Check name and code uniqueness (exclude current record)
    const nameOrCodeExists = await knex('branches')
      .where(function() {
        this.where('name', 'ilike', value.name)
            .orWhere('code', 'ilike', value.code);
      })
      .where('id', '!=', id)
      .first();
    
    if (nameOrCodeExists) {
      return res.status(400).json({
        success: false,
        error: { code: 'BRANCH_EXISTS', message: 'Branch with this name or code already exists' }
      });
    }

    const [branch] = await knex('branches')
      .where('id', id)
      .update(value)
      .returning('*');

    res.json({
      success: true,
      data: { branch }
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_BRANCH_ERROR', message: 'Failed to update branch' }
    });
  }
});

// DELETE /api/admin/branches/:id - Delete branch
router.delete('/branches/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if branch is used in any property or user
    const [usedInProperty, usedInUser] = await Promise.all([
      knex('properties').where('branch_id', id).first(),
      knex('users').where('branch_id', id).first()
    ]);

    if (usedInProperty || usedInUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BRANCH_IN_USE',
          message: 'Cannot delete branch that is used in properties or assigned to users'
        }
      });
    }

    const deleted = await knex('branches').where('id', id).del();
    
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'BRANCH_NOT_FOUND', message: 'Branch not found' }
      });
    }

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_BRANCH_ERROR', message: 'Failed to delete branch' }
    });
  }
});

module.exports = router;