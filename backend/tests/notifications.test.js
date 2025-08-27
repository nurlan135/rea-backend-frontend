const request = require('supertest');
const app = require('../index');
const { setupTestDatabase, teardownTestDatabase, clearTestData, getTestDb } = require('./setup');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Notifications Routes', () => {
  let db;
  let userToken, managerToken;
  let userId, managerId, recipientId;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    userId = '550e8400-e29b-41d4-a716-446655440001';
    managerId = '550e8400-e29b-41d4-a716-446655440002';
    recipientId = '550e8400-e29b-41d4-a716-446655440003';

    await db('users').insert([
      {
        id: userId,
        email: 'user@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'agent',
        is_active: true
      },
      {
        id: managerId,
        email: 'manager@example.com',
        password: hashedPassword,
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
        is_active: true
      },
      {
        id: recipientId,
        email: 'recipient@example.com',
        password: hashedPassword,
        first_name: 'Recipient',
        last_name: 'User',
        role: 'agent',
        is_active: true
      }
    ]);

    // Generate auth tokens
    userToken = jwt.sign(
      { id: userId, email: 'user@example.com', role: 'agent' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    managerToken = jwt.sign(
      { id: managerId, email: 'manager@example.com', role: 'manager' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/notifications', () => {
    const validNotificationData = {
      recipient_id: recipientId,
      type: 'property_approved',
      title: 'Property Approved',
      message: 'Your property has been approved for listing.',
      priority: 'medium'
    };

    it('should create notification successfully', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validNotificationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toHaveProperty('id');
      expect(response.body.data.notification.title).toBe(validNotificationData.title);
      expect(response.body.data.notification.sender_id).toBe(userId);
      expect(response.body.data.notification.recipient_id).toBe(recipientId);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send(validNotificationData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient_id: recipientId,
          title: 'Test Notification'
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate notification type enum', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validNotificationData,
          type: 'invalid_type'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate priority enum', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validNotificationData,
          priority: 'invalid_priority'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with non-existent recipient', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validNotificationData,
          recipient_id: '550e8400-e29b-41d4-a716-446655440999'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RECIPIENT_NOT_FOUND');
    });

    it('should create notification with optional fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validNotificationData,
          action_url: 'https://example.com/property/123',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          metadata: { property_id: '123', agent_name: 'Test Agent' }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.action_url).toBe('https://example.com/property/123');
      expect(response.body.data.notification.metadata).toEqual({ property_id: '123', agent_name: 'Test Agent' });
    });
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await db('notifications').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          sender_id: managerId,
          recipient_id: userId,
          type: 'property_approved',
          title: 'Property Approved',
          message: 'Your property has been approved.',
          priority: 'high',
          read_at: null,
          created_at: new Date(Date.now() - 60000) // 1 minute ago
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          sender_id: managerId,
          recipient_id: userId,
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: 'A booking has been confirmed for your property.',
          priority: 'medium',
          read_at: new Date(),
          created_at: new Date(Date.now() - 120000) // 2 minutes ago
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          sender_id: userId,
          recipient_id: recipientId,
          type: 'system_announcement',
          title: 'System Update',
          message: 'System will be updated tonight.',
          priority: 'low',
          read_at: null,
          created_at: new Date(Date.now() - 180000) // 3 minutes ago
        }
      ]);
    });

    it('should get notifications for current user', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(2); // Only user's notifications
      expect(response.body.data.unreadCount).toBe(1); // One unread notification
      
      // Check that notifications are sorted by created_at desc
      const notifications = response.body.data.notifications;
      expect(new Date(notifications[0].created_at)).toBeAfter(new Date(notifications[1].created_at));
    });

    it('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=property_approved')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].type).toBe('property_approved');
    });

    it('should filter notifications by status', async () => {
      const response = await request(app)
        .get('/api/notifications?status=unread')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].read_at).toBeNull();
    });

    it('should filter notifications by priority', async () => {
      const response = await request(app)
        .get('/api/notifications?priority=high')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].priority).toBe('high');
    });

    it('should paginate notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('GET /api/notifications/:id', () => {
    let notificationId;

    beforeEach(async () => {
      notificationId = '550e8400-e29b-41d4-a716-446655440020';
      await db('notifications').insert({
        id: notificationId,
        sender_id: managerId,
        recipient_id: userId,
        type: 'property_approved',
        title: 'Test Notification',
        message: 'This is a test notification.',
        priority: 'medium',
        read_at: null,
        created_at: new Date()
      });
    });

    it('should get notification by ID', async () => {
      const response = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.id).toBe(notificationId);
      expect(response.body.data.notification.title).toBe('Test Notification');
    });

    it('should fail to get notification of another user', async () => {
      const recipientToken = jwt.sign(
        { id: recipientId, email: 'recipient@example.com', role: 'agent' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('should return 404 for non-existent notification', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .get(`/api/notifications/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let notificationId;

    beforeEach(async () => {
      notificationId = '550e8400-e29b-41d4-a716-446655440030';
      await db('notifications').insert({
        id: notificationId,
        sender_id: managerId,
        recipient_id: userId,
        type: 'property_approved',
        title: 'Unread Notification',
        message: 'This notification is unread.',
        priority: 'medium',
        read_at: null,
        created_at: new Date()
      });
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify notification was marked as read
      const notification = await db('notifications').where('id', notificationId).first();
      expect(notification.read_at).not.toBeNull();
    });

    it('should handle already read notification', async () => {
      // First mark as read
      await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      // Try to mark as read again
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('artıq oxunub');
    });

    it('should fail for non-existent notification', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .put(`/api/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await db('notifications').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440040',
          sender_id: managerId,
          recipient_id: userId,
          type: 'property_approved',
          title: 'Unread 1',
          message: 'Unread notification 1',
          priority: 'medium',
          read_at: null,
          created_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440041',
          sender_id: managerId,
          recipient_id: userId,
          type: 'booking_confirmed',
          title: 'Unread 2',
          message: 'Unread notification 2',
          priority: 'low',
          read_at: null,
          created_at: new Date()
        }
      ]);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify all notifications were marked as read
      const unreadCount = await db('notifications')
        .where('recipient_id', userId)
        .where('read_at', null)
        .count('* as count')
        .first();
      
      expect(parseInt(unreadCount.count)).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let notificationId;

    beforeEach(async () => {
      notificationId = '550e8400-e29b-41d4-a716-446655440050';
      await db('notifications').insert({
        id: notificationId,
        sender_id: managerId,
        recipient_id: userId,
        type: 'property_approved',
        title: 'To Be Deleted',
        message: 'This notification will be deleted.',
        priority: 'medium',
        read_at: null,
        created_at: new Date()
      });
    });

    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify notification was deleted
      const notification = await db('notifications').where('id', notificationId).first();
      expect(notification).toBeUndefined();
    });

    it('should fail for non-existent notification', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .delete(`/api/notifications/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });
  });

  describe('POST /api/notifications/batch', () => {
    let notificationIds;

    beforeEach(async () => {
      notificationIds = [
        '550e8400-e29b-41d4-a716-446655440060',
        '550e8400-e29b-41d4-a716-446655440061'
      ];

      await db('notifications').insert([
        {
          id: notificationIds[0],
          sender_id: managerId,
          recipient_id: userId,
          type: 'property_approved',
          title: 'Batch Test 1',
          message: 'Batch test notification 1',
          priority: 'medium',
          read_at: null,
          created_at: new Date()
        },
        {
          id: notificationIds[1],
          sender_id: managerId,
          recipient_id: userId,
          type: 'booking_confirmed',
          title: 'Batch Test 2',
          message: 'Batch test notification 2',
          priority: 'low',
          read_at: null,
          created_at: new Date()
        }
      ]);
    });

    it('should mark multiple notifications as read', async () => {
      const response = await request(app)
        .post('/api/notifications/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'read',
          notification_ids: notificationIds
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify notifications were marked as read
      const notifications = await db('notifications').whereIn('id', notificationIds);
      notifications.forEach(notification => {
        expect(notification.read_at).not.toBeNull();
      });
    });

    it('should delete multiple notifications', async () => {
      const response = await request(app)
        .post('/api/notifications/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'delete',
          notification_ids: notificationIds
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify notifications were deleted
      const notifications = await db('notifications').whereIn('id', notificationIds);
      expect(notifications).toHaveLength(0);
    });

    it('should validate batch parameters', async () => {
      const response = await request(app)
        .post('/api/notifications/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'invalid_action',
          notification_ids: notificationIds
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNKNOWN_BATCH_ACTION');
    });
  });

  describe('POST /api/notifications/broadcast', () => {
    it('should broadcast notification to multiple users as manager', async () => {
      const broadcastData = {
        recipient_roles: ['agent'],
        type: 'system_announcement',
        title: 'System Maintenance',
        message: 'System will be down for maintenance tonight.',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(broadcastData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recipient_count).toBeGreaterThan(0);

      // Verify notifications were created
      const notifications = await db('notifications')
        .where('type', 'system_announcement')
        .where('title', 'System Maintenance');
      
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should fail broadcast as regular user', async () => {
      const response = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipient_roles: ['agent'],
          type: 'system_announcement',
          title: 'Unauthorized Broadcast',
          message: 'This should fail.'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate broadcast parameters', async () => {
      const response = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          // Missing recipient specification
          type: 'system_announcement',
          title: 'Test',
          message: 'Test message'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_RECIPIENTS');
    });
  });
});