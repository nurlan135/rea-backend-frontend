/**
 * Permission Management Utility
 * Advanced permission checking and management system
 */

const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);

// Base role permissions (fallback system)
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

/**
 * Get all permissions for a user (role-based + custom)
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Array>} Array of permissions
 */
async function getUserPermissions(userId, userRole = null) {
  try {
    // Get base role permissions
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    
    // Get custom permissions from database
    const customPermissions = await knex('user_permissions')
      .select('permission', 'restrictions', 'expires_at')
      .where('user_id', userId)
      .where('is_active', true)
      .where(function() {
        this.whereNull('expires_at')
            .orWhere('expires_at', '>', new Date());
      });

    // Combine permissions
    const allPermissions = [...rolePermissions];
    
    customPermissions.forEach(cp => {
      if (!allPermissions.includes(cp.permission)) {
        allPermissions.push(cp.permission);
      }
    });

    return {
      rolePermissions,
      customPermissions: customPermissions.map(cp => cp.permission),
      allPermissions: [...new Set(allPermissions)], // Remove duplicates
      customDetails: customPermissions
    };
    
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      rolePermissions: ROLE_PERMISSIONS[userRole] || [],
      customPermissions: [],
      allPermissions: ROLE_PERMISSIONS[userRole] || [],
      customDetails: []
    };
  }
}

/**
 * Check if user has specific permission
 * @param {string} userId - User ID  
 * @param {string} userRole - User role
 * @param {string} permission - Permission to check
 * @param {Object} context - Additional context (branch, property, etc.)
 * @returns {Promise<boolean>} Has permission
 */
async function hasPermission(userId, userRole, permission, context = {}) {
  try {
    const permissions = await getUserPermissions(userId, userRole);
    
    // Check for admin wildcard
    if (permissions.allPermissions.includes('*')) {
      return true;
    }
    
    // Check exact permission match
    if (permissions.allPermissions.includes(permission)) {
      return true;
    }
    
    // Check wildcard permissions (e.g., 'properties:*' covers 'properties:read')
    const wildcardPermissions = permissions.allPermissions.filter(p => p.endsWith(':*'));
    for (const wildcardPerm of wildcardPermissions) {
      const prefix = wildcardPerm.replace(':*', '');
      if (permission.startsWith(prefix + ':')) {
        return true;
      }
    }
    
    // Check contextual permissions (e.g., 'properties:read:own')
    if (permission.includes(':own') && context.userId) {
      const basePermission = permission.replace(':own', '');
      if (permissions.allPermissions.includes(basePermission + ':own') && context.userId === userId) {
        return true;
      }
    }
    
    // Check branch-specific permissions
    if (context.branchCode && userRole === 'manager') {
      // Managers have full access within their branch
      if (permission.startsWith('properties:') || permission.startsWith('customers:')) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Grant custom permission to user
 * @param {string} userId - Target user ID
 * @param {string} permission - Permission to grant
 * @param {string} grantedBy - ID of user granting permission
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result
 */
async function grantPermission(userId, permission, grantedBy, options = {}) {
  try {
    const { restrictions = null, expiresAt = null } = options;
    
    // Check if permission already exists
    const existingPermission = await knex('user_permissions')
      .where('user_id', userId)
      .where('permission', permission)
      .first();
      
    if (existingPermission) {
      // Update existing permission
      await knex('user_permissions')
        .where('id', existingPermission.id)
        .update({
          restrictions: restrictions ? JSON.stringify(restrictions) : null,
          expires_at: expiresAt,
          granted_by: grantedBy,
          granted_at: new Date(),
          is_active: true,
          updated_at: new Date()
        });
        
      return { success: true, action: 'updated', permissionId: existingPermission.id };
    } else {
      // Create new permission
      const [newPermission] = await knex('user_permissions')
        .insert({
          user_id: userId,
          permission,
          restrictions: restrictions ? JSON.stringify(restrictions) : null,
          granted_by: grantedBy,
          granted_at: new Date(),
          expires_at: expiresAt,
          is_active: true
        })
        .returning('id');
        
      return { success: true, action: 'created', permissionId: newPermission.id };
    }
    
  } catch (error) {
    console.error('Error granting permission:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke custom permission from user
 * @param {string} userId - Target user ID
 * @param {string} permission - Permission to revoke
 * @param {string} revokedBy - ID of user revoking permission
 * @returns {Promise<Object>} Result
 */
async function revokePermission(userId, permission, revokedBy) {
  try {
    const result = await knex('user_permissions')
      .where('user_id', userId)
      .where('permission', permission)
      .update({
        is_active: false,
        updated_at: new Date()
      });
    
    if (result > 0) {
      // Log the revocation
      console.log(`Permission ${permission} revoked from user ${userId} by ${revokedBy}`);
      return { success: true, action: 'revoked' };
    } else {
      return { success: false, error: 'Permission not found or already revoked' };
    }
    
  } catch (error) {
    console.error('Error revoking permission:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all available permission templates
 * @returns {Promise<Array>} Permission templates
 */
async function getPermissionTemplates() {
  try {
    const templates = await knex('permission_templates')
      .select('*')
      .where('is_active', true)
      .orderBy('name');
      
    return templates.map(template => ({
      ...template,
      permissions: typeof template.permissions === 'string' 
        ? JSON.parse(template.permissions) 
        : template.permissions
    }));
    
  } catch (error) {
    console.error('Error getting permission templates:', error);
    return [];
  }
}

/**
 * Apply permission template to user
 * @param {string} userId - Target user ID
 * @param {string} templateId - Template ID
 * @param {string} grantedBy - ID of user applying template
 * @returns {Promise<Object>} Result
 */
async function applyPermissionTemplate(userId, templateId, grantedBy) {
  try {
    const template = await knex('permission_templates')
      .where('id', templateId)
      .where('is_active', true)
      .first();
      
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    const permissions = typeof template.permissions === 'string' 
      ? JSON.parse(template.permissions) 
      : template.permissions;
    
    let granted = 0;
    let updated = 0;
    
    for (const permission of permissions) {
      const result = await grantPermission(userId, permission, grantedBy);
      if (result.success) {
        if (result.action === 'created') granted++;
        if (result.action === 'updated') updated++;
      }
    }
    
    return {
      success: true,
      templateName: template.name,
      permissionsGranted: granted,
      permissionsUpdated: updated,
      totalPermissions: permissions.length
    };
    
  } catch (error) {
    console.error('Error applying permission template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Express middleware for permission checking
 * @param {string|Array} requiredPermission - Required permission(s)
 * @param {Object} options - Additional options
 * @returns {Function} Middleware function
 */
function requirePermission(requiredPermission, options = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' }
        });
      }
      
      const userId = req.user.id;
      const userRole = req.user.role;
      const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      
      // Check each required permission
      let hasAccess = false;
      for (const permission of permissions) {
        const context = {
          userId: req.user.id,
          branchCode: req.user.branch_code,
          ...options.context
        };
        
        const hasPermissionResult = await hasPermission(userId, userRole, permission, context);
        if (hasPermissionResult) {
          hasAccess = true;
          break; // Any one permission is sufficient (OR logic)
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Bu əməliyyat üçün lazımi icazəniz yoxdur',
            requiredPermissions: permissions
          }
        });
      }
      
      // Add user permissions to request for further use
      req.userPermissions = await getUserPermissions(userId, userRole);
      next();
      
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'PERMISSION_CHECK_ERROR', message: 'İcazə yoxlama xətası' }
      });
    }
  };
}

module.exports = {
  ROLE_PERMISSIONS,
  getUserPermissions,
  hasPermission,
  grantPermission,
  revokePermission,
  getPermissionTemplates,
  applyPermissionTemplate,
  requirePermission
};