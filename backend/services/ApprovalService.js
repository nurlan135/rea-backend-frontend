const db = require('../database');

/**
 * ApprovalService - Core business logic for property approval system
 * Handles approval workflow, validation, and listing type specific rules
 */
class ApprovalService {
  
  /**
   * Get pending approvals for a specific role
   * @param {Object} user - User object with role information
   * @param {Object} filters - Optional filters (page, limit, etc.)
   * @returns {Promise<Object>} Pending approvals list with pagination
   */
  async getPendingApprovals(user, filters = {}) {
    const { page = 1, limit = 20, status = 'pending' } = filters;
    const offset = (page - 1) * limit;

    try {
      // Build base query
      let query = db('properties as p')
        .leftJoin('users as u', 'p.created_by_id', 'u.id')
        .leftJoin('branches as b', 'p.branch_id', 'b.id')
        .select(
          'p.id',
          'p.code',
          'p.status',
          'p.property_category',
          'p.property_subcategory', 
          'p.listing_type',
          'p.area_m2',
          'p.buy_price_azn',
          'p.sell_price_azn',
          'p.created_at',
          'u.first_name as created_by_first_name',
          'u.last_name as created_by_last_name',
          'b.name as branch_name'
        )
        .where('p.status', status)
        .orderBy('p.created_at', 'desc');

      // Role-based filtering (if needed in future)
      if (user.role === 'manager' && user.branch_id) {
        query = query.where('p.branch_id', user.branch_id);
      }

      // Get total count
      const totalQuery = db('properties').where('status', status);
      if (user.role === 'manager' && user.branch_id) {
        totalQuery.where('branch_id', user.branch_id);
      }
      const [{ count }] = await totalQuery.count('* as count');
      
      // Get paginated results
      const properties = await query.limit(limit).offset(offset);

      // Add days pending calculation
      const now = new Date();
      const propertiesWithDays = properties.map(property => ({
        ...property,
        days_pending: Math.floor((now - new Date(property.created_at)) / (1000 * 60 * 60 * 24))
      }));

      return {
        success: true,
        data: {
          properties: propertiesWithDays,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(count),
            totalPages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      console.error('ApprovalService.getPendingApprovals error:', error);
      throw new Error('Failed to fetch pending approvals');
    }
  }

  /**
   * Approve a property
   * @param {string} propertyId - Property UUID
   * @param {Object} approver - User object performing the approval
   * @param {Object} options - Approval options (comments, etc.)
   * @returns {Promise<Object>} Approval result
   */
  async approveProperty(propertyId, approver, options = {}) {
    const trx = await db.transaction();
    
    try {
      console.log(`ApprovalService.approveProperty: ${propertyId} by ${approver.email}`);

      // 1. Get property and validate exists
      const property = await trx('properties').where('id', propertyId).first();
      
      if (!property) {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'PROPERTY_NOT_FOUND', 
            message: 'Əmlak tapılmadı' 
          }
        };
      }

      console.log(`Property found: ${property.code}, status: ${property.status}, type: ${property.listing_type}`);

      // 2. Validate current status
      if (property.status !== 'pending') {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `Əmlak artıq ${property.status} statusundadır` 
          }
        };
      }

      // 3. Validate user permissions
      const hasPermission = this.validateApprovalPermissions(approver.role);
      if (!hasPermission) {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Bu əməliyyat üçün icazəniz yoxdur' 
          }
        };
      }

      // 4. Validate listing type requirements
      const validationResult = this.validateListingTypeRequirements(property);
      if (!validationResult.valid) {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'VALIDATION_FAILED', 
            message: validationResult.message 
          }
        };
      }

      // 5. Update property status to active
      const updateResult = await trx('properties')
        .where('id', propertyId)
        .update({ 
          status: 'active',
          updated_at: trx.fn.now()
        });

      if (updateResult === 0) {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'UPDATE_FAILED', 
            message: 'Əmlak statusu yenilənə bilmədi' 
          }
        };
      }

      // 6. Create audit log entry
      const auditLogId = await this.createAuditLog(trx, {
        actorId: approver.id,
        actorRole: approver.role,
        entityType: 'Property',
        entityId: propertyId,
        action: 'APPROVE',
        beforeState: { status: 'pending' },
        afterState: { status: 'active' },
        metadata: {
          listing_type: property.listing_type,
          property_code: property.code,
          comments: options.comments || null
        }
      });

      await trx.commit();

      console.log(`Property ${property.code} approved successfully by ${approver.email}`);

      return {
        success: true,
        data: {
          message: 'Əmlak uğurla təsdiq edildi',
          property_id: propertyId,
          new_status: 'active',
          audit_log_id: auditLogId
        }
      };

    } catch (error) {
      await trx.rollback();
      console.error('ApprovalService.approveProperty error:', error);
      throw error;
    }
  }

  /**
   * Reject a property
   * @param {string} propertyId - Property UUID
   * @param {Object} approver - User object performing the rejection
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejection result
   */
  async rejectProperty(propertyId, approver, reason) {
    const trx = await db.transaction();
    
    try {
      console.log(`ApprovalService.rejectProperty: ${propertyId} by ${approver.email}`);

      if (!reason || reason.trim().length < 10) {
        return {
          success: false,
          error: { 
            code: 'INVALID_REASON', 
            message: 'Rədd etmə səbəbi ən az 10 simvol olmalıdır' 
          }
        };
      }

      // Get property and validate
      const property = await trx('properties').where('id', propertyId).first();
      
      if (!property) {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'PROPERTY_NOT_FOUND', 
            message: 'Əmlak tapılmadı' 
          }
        };
      }

      if (property.status !== 'pending') {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `Əmlak artıq ${property.status} statusundadır` 
          }
        };
      }

      // Validate permissions
      const hasPermission = this.validateApprovalPermissions(approver.role);
      if (!hasPermission) {
        await trx.rollback();
        return {
          success: false,
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Bu əməliyyat üçün icazəniz yoxdur' 
          }
        };
      }

      // Update property status to rejected
      await trx('properties')
        .where('id', propertyId)
        .update({ 
          status: 'rejected',
          updated_at: trx.fn.now()
        });

      // Create audit log
      const auditLogId = await this.createAuditLog(trx, {
        actorId: approver.id,
        actorRole: approver.role,
        entityType: 'Property',
        entityId: propertyId,
        action: 'UPDATE',
        beforeState: { status: 'pending' },
        afterState: { status: 'rejected' },
        metadata: {
          listing_type: property.listing_type,
          property_code: property.code,
          rejection_reason: reason.trim(),
          action_type: 'REJECT'
        }
      });

      await trx.commit();

      return {
        success: true,
        data: {
          message: 'Əmlak rədd edildi',
          property_id: propertyId,
          new_status: 'rejected',
          rejection_reason: reason.trim(),
          audit_log_id: auditLogId
        }
      };

    } catch (error) {
      await trx.rollback();
      console.error('ApprovalService.rejectProperty error:', error);
      throw error;
    }
  }

  /**
   * Validate user permissions for approval operations
   * @param {string} userRole - User role
   * @returns {boolean} Has permission or not
   */
  validateApprovalPermissions(userRole) {
    const allowedRoles = ['manager', 'vp', 'director', 'admin'];
    return allowedRoles.includes(userRole);
  }

  /**
   * Validate listing type specific requirements
   * @param {Object} property - Property object
   * @returns {Object} Validation result
   */
  validateListingTypeRequirements(property) {
    switch (property.listing_type) {
      case 'agency_owned':
        if (!property.buy_price_azn) {
          return {
            valid: false,
            message: 'Agency məlkiyyətində olan əmlak üçün alış qiyməti məcburidir'
          };
        }
        break;

      case 'branch_owned':
        if (!property.buy_price_azn) {
          return {
            valid: false,
            message: 'Filial məlkiyyətində olan əmlak üçün alış qiyməti məcburidir'
          };
        }
        break;

      case 'brokerage':
        if (!property.owner_first_name || !property.owner_last_name || 
            !property.owner_contact || !property.brokerage_commission_percent) {
          return {
            valid: false,
            message: 'Vasitəçilik əmlakı üçün sahib məlumatları və komissiya faizi məcburidir'
          };
        }
        break;

      default:
        return {
          valid: false,
          message: 'Naməlum əmlak növü'
        };
    }

    return { valid: true };
  }

  /**
   * Create audit log entry
   * @param {Object} trx - Database transaction
   * @param {Object} logData - Audit log data
   * @returns {Promise<string>} Audit log ID
   */
  async createAuditLog(trx, logData) {
    const auditEntry = {
      actor_id: logData.actorId,
      entity: logData.entityType,
      entity_id: logData.entityId,
      action: logData.action,
      before: JSON.stringify(logData.beforeState),
      after: JSON.stringify(logData.afterState),
      meta: JSON.stringify({
        actor_role: logData.actorRole,
        ...logData.metadata
      }),
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    };

    const [auditLog] = await trx('audit_logs')
      .insert(auditEntry)
      .returning('id');

    return auditLog.id;
  }

  /**
   * Get approval history for a property
   * @param {string} propertyId - Property UUID
   * @returns {Promise<Object>} Approval history
   */
  async getApprovalHistory(propertyId) {
    try {
      const auditLogs = await db('audit_logs as al')
        .leftJoin('users as u', 'al.actor_id', 'u.id')
        .select(
          'al.id',
          'al.action',
          'al.before',
          'al.after', 
          'al.meta',
          'al.created_at',
          'u.first_name as actor_first_name',
          'u.last_name as actor_last_name'
        )
        .where('al.entity', 'Property')
        .where('al.entity_id', propertyId)
        .where('al.action', 'in', ['APPROVE', 'UPDATE'])
        .orderBy('al.created_at', 'desc');

      return {
        success: true,
        data: {
          property_id: propertyId,
          history: auditLogs.map(log => ({
            id: log.id,
            action: log.action,
            actor: `${log.actor_first_name} ${log.actor_last_name}`,
            before_state: JSON.parse(log.before),
            after_state: JSON.parse(log.after),
            metadata: JSON.parse(log.meta),
            timestamp: log.created_at
          }))
        }
      };
    } catch (error) {
      console.error('ApprovalService.getApprovalHistory error:', error);
      throw new Error('Failed to fetch approval history');
    }
  }
}

module.exports = new ApprovalService();