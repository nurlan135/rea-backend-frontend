const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const crypto = require('crypto');

// Get notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status = 'all',
      priority,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db('notifications')
      .select(
        'notifications.*',
        'users.first_name as sender_first_name',
        'users.last_name as sender_last_name',
        'properties.title as property_title'
      )
      .leftJoin('users', 'notifications.sender_id', 'users.id')
      .leftJoin('properties', 'notifications.related_property_id', 'properties.id')
      .where('notifications.recipient_id', req.user.id);

    // Apply filters
    if (type) {
      query = query.where('notifications.type', type);
    }

    if (status !== 'all') {
      if (status === 'unread') {
        query = query.where('notifications.read_at', null);
      } else if (status === 'read') {
        query = query.whereNotNull('notifications.read_at');
      }
    }

    if (priority) {
      query = query.where('notifications.priority', priority);
    }

    // Apply sorting
    query = query.orderBy(`notifications.${sort_by}`, sort_order);

    // Get total count
    const totalQuery = query.clone();
    const total = await totalQuery.count('* as count').first();

    // Get notifications
    const notifications = await query.limit(limit).offset(offset);

    // Get unread count
    const unreadCount = await db('notifications')
      .where('recipient_id', req.user.id)
      .where('read_at', null)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total.count / limit),
          totalNotifications: parseInt(total.count),
          limit: parseInt(limit)
        },
        unreadCount: parseInt(unreadCount.count)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildirişlər alınarkən xəta baş verdi',
        code: 'GET_NOTIFICATIONS_ERROR'
      }
    });
  }
});

// Get notification by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const notification = await db('notifications')
      .select(
        'notifications.*',
        'users.first_name as sender_first_name',
        'users.last_name as sender_last_name',
        'properties.title as property_title'
      )
      .leftJoin('users', 'notifications.sender_id', 'users.id')
      .leftJoin('properties', 'notifications.related_property_id', 'properties.id')
      .where('notifications.id', req.params.id)
      .where('notifications.recipient_id', req.user.id)
      .first();

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bildiriş tapılmadı',
          code: 'NOTIFICATION_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildiriş məlumatları alınarkən xəta baş verdi',
        code: 'GET_NOTIFICATION_ERROR'
      }
    });
  }
});

// Create notification
router.post('/', authenticate, async (req, res) => {
  try {
    const schema = Joi.object({
      recipient_id: Joi.string().uuid().required(),
      type: Joi.string().valid(
        'property_approved',
        'property_rejected', 
        'booking_confirmed',
        'booking_cancelled',
        'deal_status_change',
        'new_property_assigned',
        'system_announcement',
        'reminder',
        'approval_request'
      ).required(),
      title: Joi.string().required(),
      message: Joi.string().required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      action_url: Joi.string().uri().allow('').optional(),
      related_property_id: Joi.string().uuid().allow(null).optional(),
      related_deal_id: Joi.string().uuid().allow(null).optional(),
      related_booking_id: Joi.string().uuid().allow(null).optional(),
      expires_at: Joi.date().optional(),
      metadata: Joi.object().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Check if recipient exists
    const recipient = await db('users')
      .where('id', value.recipient_id)
      .first();

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Alıcı istifadəçi tapılmadı',
          code: 'RECIPIENT_NOT_FOUND'
        }
      });
    }

    // Create notification
    const notification = await db('notifications').insert({
      id: crypto.randomUUID(),
      sender_id: req.user.id,
      ...value,
      created_at: new Date()
    }).returning('*');

    // Send push notification if recipient has enabled notifications
    await sendPushNotification(recipient, {
      title: value.title,
      message: value.message,
      priority: value.priority,
      action_url: value.action_url
    });

    res.status(201).json({
      success: true,
      data: {
        notification: notification[0],
        message: 'Bildiriş göndərildi'
      }
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildiriş yaradılarkən xəta baş verdi',
        code: 'CREATE_NOTIFICATION_ERROR'
      }
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await db('notifications')
      .where('id', req.params.id)
      .where('recipient_id', req.user.id)
      .first();

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bildiriş tapılmadı',
          code: 'NOTIFICATION_NOT_FOUND'
        }
      });
    }

    if (notification.read_at) {
      return res.json({
        success: true,
        data: {
          message: 'Bildiriş artıq oxunub'
        }
      });
    }

    await db('notifications')
      .where('id', req.params.id)
      .update({
        read_at: new Date()
      });

    res.json({
      success: true,
      data: {
        message: 'Bildiriş oxundu olaraq qeyd edildi'
      }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildiriş yenilənərkən xəta baş verdi',
        code: 'UPDATE_NOTIFICATION_ERROR'
      }
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await db('notifications')
      .where('recipient_id', req.user.id)
      .where('read_at', null)
      .update({
        read_at: new Date()
      });

    res.json({
      success: true,
      data: {
        message: 'Bütün bildirişlər oxundu olaraq qeyd edildi'
      }
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildirişlər yenilənərkən xəta baş verdi',
        code: 'UPDATE_NOTIFICATIONS_ERROR'
      }
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await db('notifications')
      .where('id', req.params.id)
      .where('recipient_id', req.user.id)
      .first();

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bildiriş tapılmadı',
          code: 'NOTIFICATION_NOT_FOUND'
        }
      });
    }

    await db('notifications')
      .where('id', req.params.id)
      .del();

    res.json({
      success: true,
      data: {
        message: 'Bildiriş silindi'
      }
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildiriş silinərkən xəta baş verdi',
        code: 'DELETE_NOTIFICATION_ERROR'
      }
    });
  }
});

// Batch operations
router.post('/batch', authenticate, async (req, res) => {
  try {
    const { action, notification_ids } = req.body;

    if (!action || !notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Batch əməliyyat parametrləri natamam',
          code: 'INVALID_BATCH_PARAMS'
        }
      });
    }

    let result = {};

    switch (action) {
      case 'read':
        await db('notifications')
          .whereIn('id', notification_ids)
          .where('recipient_id', req.user.id)
          .update({
            read_at: new Date()
          });
        result = { message: `${notification_ids.length} bildiriş oxundu olaraq qeyd edildi` };
        break;

      case 'delete':
        await db('notifications')
          .whereIn('id', notification_ids)
          .where('recipient_id', req.user.id)
          .del();
        result = { message: `${notification_ids.length} bildiriş silindi` };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            message: 'Bilinməyən batch əməliyyatı',
            code: 'UNKNOWN_BATCH_ACTION'
          }
        });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Batch notification operation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Batch əməliyyat xətası',
        code: 'BATCH_OPERATION_ERROR'
      }
    });
  }
});

// Get notification settings for current user
router.get('/settings', authenticate, async (req, res) => {
  try {
    const settings = await db('notification_settings')
      .where('user_id', req.user.id)
      .first();

    if (!settings) {
      // Return default settings
      const defaultSettings = {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        property_updates: true,
        booking_updates: true,
        deal_updates: true,
        system_announcements: true,
        daily_digest: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      };

      res.json({
        success: true,
        data: { settings: defaultSettings }
      });
    } else {
      res.json({
        success: true,
        data: { settings }
      });
    }

  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildiriş tənzimləmələri alınarkən xəta baş verdi',
        code: 'GET_SETTINGS_ERROR'
      }
    });
  }
});

// Update notification settings
router.put('/settings', authenticate, async (req, res) => {
  try {
    const schema = Joi.object({
      email_notifications: Joi.boolean().optional(),
      push_notifications: Joi.boolean().optional(),
      sms_notifications: Joi.boolean().optional(),
      property_updates: Joi.boolean().optional(),
      booking_updates: Joi.boolean().optional(),
      deal_updates: Joi.boolean().optional(),
      system_announcements: Joi.boolean().optional(),
      daily_digest: Joi.boolean().optional(),
      quiet_hours_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      quiet_hours_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Upsert settings
    const settings = await db('notification_settings')
      .insert({
        id: crypto.randomUUID(),
        user_id: req.user.id,
        ...value,
        updated_at: new Date()
      })
      .onConflict('user_id')
      .merge({
        ...value,
        updated_at: new Date()
      })
      .returning('*');

    res.json({
      success: true,
      data: {
        settings: settings[0],
        message: 'Bildiriş tənzimləmələri yeniləndi'
      }
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Bildiriş tənzimləmələri yenilənərkən xəta baş verdi',
        code: 'UPDATE_SETTINGS_ERROR'
      }
    });
  }
});

// Send bulk notifications (admin only)
router.post('/broadcast', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const schema = Joi.object({
      recipient_roles: Joi.array().items(Joi.string()).optional(),
      recipient_ids: Joi.array().items(Joi.string().uuid()).optional(),
      type: Joi.string().required(),
      title: Joi.string().required(),
      message: Joi.string().required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      action_url: Joi.string().uri().allow('').optional(),
      expires_at: Joi.date().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    let recipients = [];

    // Get recipients based on roles or IDs
    if (value.recipient_roles && value.recipient_roles.length > 0) {
      recipients = await db('users')
        .select('id', 'email', 'first_name', 'last_name')
        .whereIn('role', value.recipient_roles)
        .where('is_active', true);
    } else if (value.recipient_ids && value.recipient_ids.length > 0) {
      recipients = await db('users')
        .select('id', 'email', 'first_name', 'last_name')
        .whereIn('id', value.recipient_ids)
        .where('is_active', true);
    } else {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Alıcı təyin edilməlib',
          code: 'NO_RECIPIENTS'
        }
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Uyğun alıcı tapılmadı',
          code: 'NO_MATCHING_RECIPIENTS'
        }
      });
    }

    // Create notifications for all recipients
    const notifications = recipients.map(recipient => ({
      id: crypto.randomUUID(),
      sender_id: req.user.id,
      recipient_id: recipient.id,
      type: value.type,
      title: value.title,
      message: value.message,
      priority: value.priority,
      action_url: value.action_url || null,
      expires_at: value.expires_at || null,
      created_at: new Date()
    }));

    await db('notifications').insert(notifications);

    // Send push notifications
    for (const recipient of recipients) {
      await sendPushNotification(recipient, {
        title: value.title,
        message: value.message,
        priority: value.priority,
        action_url: value.action_url
      });
    }

    res.json({
      success: true,
      data: {
        message: `Bildiriş ${recipients.length} istifadəçiyə göndərildi`,
        recipient_count: recipients.length
      }
    });

  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Toplu bildiriş göndərilməsində xəta baş verdi',
        code: 'BROADCAST_ERROR'
      }
    });
  }
});

// Helper function to send push notification
async function sendPushNotification(recipient, notification) {
  try {
    // Check user's notification settings
    const settings = await db('notification_settings')
      .where('user_id', recipient.id)
      .first();

    if (settings && !settings.push_notifications) {
      return; // User has disabled push notifications
    }

    // Check quiet hours
    if (settings && isInQuietHours(settings.quiet_hours_start, settings.quiet_hours_end)) {
      return; // Don't send during quiet hours
    }

    // Here you would integrate with a push notification service like:
    // - Firebase Cloud Messaging (FCM)
    // - Apple Push Notification service (APNs)
    // - Web Push Protocol
    // - SMS service (Twilio, AWS SNS)
    // - Email service (SendGrid, AWS SES)

    console.log(`Push notification sent to ${recipient.email}:`, notification);

  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// Helper function to check if current time is in quiet hours
function isInQuietHours(startTime, endTime) {
  if (!startTime || !endTime) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return currentTime >= startTime || currentTime <= endTime;
}

module.exports = router;