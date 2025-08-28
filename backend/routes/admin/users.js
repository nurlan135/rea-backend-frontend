/**
 * Admin User Management API Routes
 * Provides comprehensive user management functionality for admin users
 */

const express = require('express');
const bcrypt = require('bcrypt');
const knex = require('knex')(require('../../knexfile')[process.env.NODE_ENV || 'development']);
const { z } = require('zod');
const router = express.Router();

// Validation schemas
const createUserSchema = z.object({
  first_name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
  last_name: z.string().min(2, 'Soyad ən az 2 simvol olmalıdır'),
  email: z.string().email('Düzgün email daxil edin'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'director', 'vp', 'manager', 'agent']),
  branch_code: z.string().optional(),
  custom_permissions: z.array(z.string()).optional()
});

const updateUserSchema = z.object({
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'director', 'vp', 'manager', 'agent']).optional(),
  branch_code: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  custom_permissions: z.array(z.string()).optional()
});

// Helper functions
function generateSecurePassword(length = 12) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const all = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

const ROLE_PERMISSIONS = {
  admin: ['*'],
  director: [
    'properties:*', 'users:*', 'deals:*', 'reports:*', 
    'settings:read', 'settings:update', 'audit:read', 'system:configure'
  ],
  vp: [
    'properties:*', 'budget:approve', 'properties:archive', 
    'reports:*', 'users:read', 'cross-branch:access'
  ],
  manager: [
    'properties:*', 'users:read', 'users:create:agent', 
    'approvals:process', 'reports:branch', 'customers:*'
  ],
  agent: [
    'properties:read:own', 'properties:create', 
    'bookings:create', 'customers:*', 'communications:own'
  ]
};

function calculatePermissions(role, customPermissions = []) {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  
  // Admin gets everything
  if (role === 'admin') {
    return ['*'];
  }
  
  // Merge and deduplicate
  return [...new Set([...rolePermissions, ...customPermissions])];
}

// GET /api/admin/users - List users with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      branch_code = '',
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    let query = knex('users')
      .select([
        'id', 'email', 'first_name', 'last_name', 'phone', 
        'role', 'branch_code', 'status', 'last_login_at', 
        'created_at', 'login_attempts', 'locked_until',
        'force_password_change', 'last_password_change'
      ])
      .where('id', '!=', req.user.id); // Don't show self

    // Search functionality
    if (search) {
      query = query.where(function() {
        this.whereRaw('LOWER(first_name || \' \' || last_name) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(email) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }

    // Apply filters
    if (role) query = query.where('role', role);
    if (status) query = query.where('status', status);
    if (branch_code) query = query.where('branch_code', branch_code);

    // Get total count for pagination with separate query
    let countQuery = knex('users').where('id', '!=', req.user.id);
    
    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.where(function() {
        this.whereRaw('LOWER(first_name || \' \' || last_name) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(email) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }
    if (role) countQuery = countQuery.where('role', role);
    if (status) countQuery = countQuery.where('status', status);
    if (branch_code) countQuery = countQuery.where('branch_code', branch_code);
    
    const total = await countQuery.count('* as count').first();
    
    // Apply pagination
    const offset = (page - 1) * limit;
    
    // Apply sorting
    const validSortFields = ['first_name', 'last_name', 'email', 'role', 'status', 'created_at', 'last_login_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

    const users = await query
      .orderBy(sortField, sortOrder)
      .limit(limit)
      .offset(offset);

    // Add computed fields
    const enhancedUsers = users.map(user => ({
      ...user,
      is_locked: user.locked_until && new Date(user.locked_until) > new Date(),
      permissions: calculatePermissions(user.role, []) // Will be enhanced with custom permissions later
    }));

    res.json({
      success: true,
      data: {
        users: enhancedUsers,
        pagination: {
          total: parseInt(total.count),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total.count / limit)
        },
        filters: { search, role, status, branch_code, sort, order }
      }
    });

  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server xətası baş verdi' }
    });
  }
});

// GET /api/admin/users/permission-templates - Get permission templates  
router.get('/permission-templates', async (req, res) => {
  try {
    const { getPermissionTemplates } = require('../../lib/permissions');
    const templates = await getPermissionTemplates();

    res.json({
      success: true,
      data: {
        templates
      }
    });

  } catch (error) {
    console.error('Get permission templates error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İcazə şablonları alınarkən xəta baş verdi' }
    });
  }
});

// GET /api/admin/users/list-permissions - Get available permissions
router.get('/list-permissions', async (req, res) => {
  try {
    const permissionCategories = {
      properties: {
        label: 'Əmlak İdarəetməsi',
        permissions: [
          { key: 'properties:read', label: 'Əmlak məlumatlarını görmək' },
          { key: 'properties:read:own', label: 'Yalnız öz əmlakını görmək' },
          { key: 'properties:create', label: 'Yeni əmlak əlavə etmək' },
          { key: 'properties:update', label: 'Əmlak məlumatlarını yeniləmək' },
          { key: 'properties:delete', label: 'Əmlak silmək' },
          { key: 'properties:archive', label: 'Əmlak arxivləmək' },
          { key: 'properties:*', label: 'Bütün əmlak əməliyyatları' }
        ]
      },
      users: {
        label: 'İstifadəçi İdarəetməsi',
        permissions: [
          { key: 'users:read', label: 'İstifadəçi məlumatlarını görmək' },
          { key: 'users:create', label: 'Yeni istifadəçi yaratmaq' },
          { key: 'users:create:agent', label: 'Yalnız agent yaratmaq' },
          { key: 'users:update', label: 'İstifadəçi məlumatlarını yeniləmək' },
          { key: 'users:delete', label: 'İstifadəçi silmək' },
          { key: 'users:*', label: 'Bütün istifadəçi əməliyyatları' }
        ]
      },
      reports: {
        label: 'Hesabatlar',
        permissions: [
          { key: 'reports:read', label: 'Hesabatları görmək' },
          { key: 'reports:branch', label: 'Filial hesabatları' },
          { key: 'reports:export', label: 'Hesabat ixrac etmək' },
          { key: 'reports:*', label: 'Bütün hesabat əməliyyatları' }
        ]
      },
      budget: {
        label: 'Büdcə',
        permissions: [
          { key: 'budget:approve', label: 'Büdcə təsdiq etmək' },
          { key: 'budget:*', label: 'Bütün büdcə əməliyyatları' }
        ]
      },
      system: {
        label: 'Sistem',
        permissions: [
          { key: 'settings:read', label: 'Sistem ayarlarını görmək' },
          { key: 'settings:update', label: 'Sistem ayarlarını yeniləmək' },
          { key: 'audit:read', label: 'Audit logları görmək' },
          { key: 'system:configure', label: 'Sistem konfiqurasiyası' },
          { key: '*', label: 'TAM GİRİŞ (Yalnız Admin)' }
        ]
      }
    };

    res.json({
      success: true,
      data: {
        role_permissions: ROLE_PERMISSIONS,
        permission_categories: permissionCategories
      }
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İcazələr yüklərkən xəta baş verdi' }
    });
  }
});

// GET /api/admin/users/:id - Get user details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await knex('users')
      .select([
        'id', 'email', 'first_name', 'last_name', 'phone', 'role', 
        'branch_code', 'status', 'permissions', 'last_login_at', 
        'created_at', 'updated_at', 'login_attempts', 'locked_until',
        'force_password_change', 'last_password_change'
      ])
      .where('id', id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    // Parse permissions if stored as JSON
    if (user.permissions && typeof user.permissions === 'string') {
      user.permissions = JSON.parse(user.permissions);
    }

    // Add computed fields
    user.is_locked = user.locked_until && new Date(user.locked_until) > new Date();
    user.role_permissions = ROLE_PERMISSIONS[user.role] || [];

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İstifadəçi məlumatları alınarkən xəta baş verdi' }
    });
  }
});

// POST /api/admin/users - Create new user
router.post('/', async (req, res) => {
  try {
    // Validation
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Form məlumatları düzgün deyil',
          details: validation.error.issues
        }
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      branch_code,
      custom_permissions = []
    } = validation.data;

    // Check email uniqueness
    const existingUser = await knex('users').where('email', email).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'Bu email artıq istifadə olunur' }
      });
    }

    // Branch validation for manager/agent
    if (['manager', 'agent'].includes(role) && !branch_code) {
      return res.status(400).json({
        success: false,
        error: { code: 'BRANCH_REQUIRED', message: 'Bu rol üçün filial seçimi məcburidir' }
      });
    }

    // Generate temporary password
    const tempPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Calculate permissions based on role
    const finalPermissions = calculatePermissions(role, custom_permissions);

    const newUser = await knex('users')
      .insert({
        email,
        first_name,
        last_name,
        phone: phone || null,
        role,
        branch_code: branch_code || null,
        permissions: JSON.stringify(finalPermissions),
        password_hash: passwordHash,
        force_password_change: true,
        status: 'active',
        last_password_change: knex.fn.now()
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'branch_code', 'created_at']);

    res.status(201).json({
      success: true,
      data: {
        user: newUser[0],
        temporary_password: tempPassword // In production, this would be emailed
      },
      message: 'İstifadəçi uğurla yaradıldı'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İstifadəçi yaradılarkən xəta baş verdi' }
    });
  }
});

// PATCH /api/admin/users/:id - Update user
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation
    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Yeniləmə məlumatları düzgün deyil',
          details: validation.error.issues
        }
      });
    }

    const updates = validation.data;

    // Prevent self-modification restrictions
    if (id === req.user.id) {
      const restrictedFields = ['role', 'status', 'permissions'];
      const hasRestrictedUpdate = restrictedFields.some(field => field in updates);
      
      if (hasRestrictedUpdate) {
        return res.status(403).json({
          success: false,
          error: { code: 'SELF_MODIFICATION_DENIED', message: 'Öz rol və statusunuzu dəyişə bilməzsiniz' }
        });
      }
    }

    // Get current user for audit
    const currentUser = await knex('users').where('id', id).first();
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    // Email uniqueness check
    if (updates.email && updates.email !== currentUser.email) {
      const emailExists = await knex('users')
        .where('email', updates.email)
        .where('id', '!=', id)
        .first();
        
      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Bu email artıq istifadə olunur' }
        });
      }
    }

    // Recalculate permissions if role changed
    if (updates.role && updates.role !== currentUser.role) {
      const finalPermissions = calculatePermissions(updates.role, updates.custom_permissions || []);
      updates.permissions = JSON.stringify(finalPermissions);
    } else if (updates.custom_permissions) {
      const finalPermissions = calculatePermissions(currentUser.role, updates.custom_permissions);
      updates.permissions = JSON.stringify(finalPermissions);
    }

    // Remove custom_permissions from updates as it's not a database field
    delete updates.custom_permissions;

    // Update user
    const updatedUser = await knex('users')
      .where('id', id)
      .update({
        ...updates,
        updated_at: knex.fn.now()
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'branch_code', 'status']);

    res.json({
      success: true,
      data: { user: updatedUser[0] },
      message: 'İstifadəçi məlumatları yeniləndi'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İstifadəçi yenilənərkən xəta baş verdi' }
    });
  }
});

// DELETE /api/admin/users/:id - Soft delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'SELF_DELETION_DENIED', message: 'Öz hesabınızı silə bilməzsiniz' }
      });
    }

    // Check if user exists
    const user = await knex('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    // Check for active dependencies (properties, deals, etc.)
    const activeProperties = await knex('properties')
      .where('agent_id', id)
      .whereNotIn('status', ['sold', 'rented'])
      .count('* as count')
      .first();

    if (parseInt(activeProperties.count) > 0) {
      return res.status(409).json({
        success: false,
        error: { 
          code: 'HAS_ACTIVE_DEPENDENCIES', 
          message: 'Bu istifadəçinin aktiv əmlakları var. Əvvəlcə onları başqa agentə köçürün.'
        }
      });
    }

    // Soft delete (set status to inactive)
    await knex('users')
      .where('id', id)
      .update({
        status: 'inactive',
        updated_at: knex.fn.now()
      });

    res.json({
      success: true,
      message: 'İstifadəçi uğurla silindi'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İstifadəçi silinərkən xəta baş verdi' }
    });
  }
});

// POST /api/admin/users/:id/reset-password - Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await knex('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    // Generate new temporary password
    const tempPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Update user password
    await knex('users')
      .where('id', id)
      .update({
        password_hash: passwordHash,
        force_password_change: true,
        last_password_change: knex.fn.now(),
        login_attempts: 0,
        locked_until: null,
        updated_at: knex.fn.now()
      });

    res.json({
      success: true,
      data: {
        temporary_password: tempPassword
      },
      message: 'Password uğurla sıfırlandı'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Password sıfırlanarkən xəta baş verdi' }
    });
  }
});

// POST /api/admin/users/:id/unlock - Unlock user account
router.post('/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await knex('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    // Unlock account
    await knex('users')
      .where('id', id)
      .update({
        login_attempts: 0,
        locked_until: null,
        updated_at: knex.fn.now()
      });

    res.json({
      success: true,
      message: 'Hesab kilidi uğurla açıldı'
    });

  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Hesab kilidi açılarkən xəta baş verdi' }
    });
  }
});

// Permission Management Endpoints

// GET /api/admin/users/:id/permissions - Get user permissions
router.get('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { getUserPermissions } = require('../../lib/permissions');

    // Check if user exists
    const user = await knex('users').select('id', 'role').where('id', id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    const permissions = await getUserPermissions(user.id, user.role);

    res.json({
      success: true,
      data: {
        userId: user.id,
        userRole: user.role,
        permissions
      }
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İcazələr alınarkən xəta baş verdi' }
    });
  }
});

// POST /api/admin/users/:id/permissions - Grant custom permission
router.post('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permission, restrictions, expiresAt } = req.body;
    const { grantPermission } = require('../../lib/permissions');

    if (!permission) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PERMISSION', message: 'İcazə adı tələb olunur' }
      });
    }

    // Check if target user exists
    const targetUser = await knex('users').select('id', 'email').where('id', id).first();
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    const result = await grantPermission(id, permission, req.user.id, {
      restrictions,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `İcazə "${permission}" uğurla verildi`
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'GRANT_FAILED', message: result.error }
      });
    }

  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İcazə verilərkən xəta baş verdi' }
    });
  }
});

// DELETE /api/admin/users/:id/permissions/:permission - Revoke custom permission
router.delete('/:id/permissions/:permission', async (req, res) => {
  try {
    const { id, permission } = req.params;
    const { revokePermission } = require('../../lib/permissions');

    // Check if target user exists
    const targetUser = await knex('users').select('id', 'email').where('id', id).first();
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    const result = await revokePermission(id, decodeURIComponent(permission), req.user.id);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `İcazə "${permission}" uğurla geri alındı`
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'REVOKE_FAILED', message: result.error }
      });
    }

  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'İcazə geri alınarkən xəta baş verdi' }
    });
  }
});

// POST /api/admin/users/:id/apply-template - Apply permission template
router.post('/:id/apply-template', async (req, res) => {
  try {
    const { id } = req.params;
    const { templateId } = req.body;
    const { applyPermissionTemplate } = require('../../lib/permissions');

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TEMPLATE_ID', message: 'Şablon ID-si tələb olunur' }
      });
    }

    // Check if target user exists
    const targetUser = await knex('users').select('id', 'email').where('id', id).first();
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
      });
    }

    const result = await applyPermissionTemplate(id, templateId, req.user.id);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `"${result.templateName}" şablonu uğurla tətbiq edildi`
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'TEMPLATE_APPLY_FAILED', message: result.error }
      });
    }

  } catch (error) {
    console.error('Apply template error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Şablon tətbiq edilərkən xəta baş verdi' }
    });
  }
});

module.exports = router;