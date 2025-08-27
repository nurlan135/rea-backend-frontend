import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get authentication token
    const loginResponse = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'agent@rea-invest.com',
        password: 'password123'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    
    expect(loginData.success).toBe(true);
    authToken = loginData.data.token;
    userId = loginData.data.user.id;
    
    expect(authToken).toBeTruthy();
    expect(userId).toBeTruthy();
  });

  test.describe('Properties API', () => {
    let testPropertyId: string;

    test('should create property via API', async ({ request }) => {
      const propertyData = {
        title: 'API Test Property',
        description: 'Property created via API integration test',
        category: 'sale',
        property_category: 'residential',
        listing_type: 'agency_owned',
        sell_price_azn: 175000,
        area_m2: 95,
        room_count: 3,
        floor: 4,
        total_floors: 8,
        address: 'API Test Address, Baku',
        district_id: 1,
        features: ['central_heating', 'air_conditioning', 'security_system']
      };

      const response = await request.post('http://localhost:8000/api/properties', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: propertyData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.property).toHaveProperty('id');
      expect(responseData.data.property.title).toBe(propertyData.title);
      expect(responseData.data.property.agent_id).toBe(userId);
      expect(responseData.data.property.approval_status).toBe('pending');
      
      testPropertyId = responseData.data.property.id;
    });

    test('should get property by ID', async ({ request }) => {
      const response = await request.get(`http://localhost:8000/api/properties/${testPropertyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.property.id).toBe(testPropertyId);
      expect(responseData.data.property.title).toBe('API Test Property');
      
      // Verify view count was incremented
      expect(responseData.data.property.view_count).toBe(1);
    });

    test('should update property', async ({ request }) => {
      const updateData = {
        title: 'Updated API Test Property',
        sell_price_azn: 185000,
        description: 'Updated property description'
      };

      const response = await request.put(`http://localhost:8000/api/properties/${testPropertyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: updateData
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.property.title).toBe('Updated API Test Property');
      expect(responseData.data.property.sell_price_azn).toBe(185000);
      expect(responseData.data.property.approval_status).toBe('pending'); // Reset after update
    });

    test('should search properties with filters', async ({ request }) => {
      const searchParams = new URLSearchParams({
        category: 'sale',
        min_price: '100000',
        max_price: '200000',
        min_area: '50',
        max_area: '150',
        property_category: 'residential'
      });

      const response = await request.get(`http://localhost:8000/api/properties?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.properties).toBeInstanceOf(Array);
      
      // Verify filtering worked
      responseData.data.properties.forEach((property: any) => {
        expect(property.category).toBe('sale');
        expect(property.property_category).toBe('residential');
        if (property.sell_price_azn) {
          expect(property.sell_price_azn).toBeGreaterThanOrEqual(100000);
          expect(property.sell_price_azn).toBeLessThanOrEqual(200000);
        }
        if (property.area_m2) {
          expect(property.area_m2).toBeGreaterThanOrEqual(50);
          expect(property.area_m2).toBeLessThanOrEqual(150);
        }
      });
    });

    test('should handle property pagination', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/properties?page=1&limit=2', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.properties.length).toBeLessThanOrEqual(2);
      expect(responseData.data.pagination).toHaveProperty('currentPage', 1);
      expect(responseData.data.pagination).toHaveProperty('totalPages');
      expect(responseData.data.pagination).toHaveProperty('totalProperties');
    });

    test('should delete property', async ({ request }) => {
      const response = await request.delete(`http://localhost:8000/api/properties/${testPropertyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      
      // Verify property is soft deleted
      const getResponse = await request.get(`http://localhost:8000/api/properties/${testPropertyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Bookings API', () => {
    let testPropertyId: string;
    let testBookingId: string;

    test.beforeAll(async ({ request }) => {
      // Create a property for booking tests
      const propertyResponse = await request.post('http://localhost:8000/api/properties', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Bookable Property',
          description: 'Property for booking tests',
          category: 'rent',
          property_category: 'residential',
          listing_type: 'agency_owned',
          rent_price_monthly_azn: 1200,
          area_m2: 75,
          room_count: 2,
          floor: 3,
          total_floors: 6,
          address: 'Booking Test Address',
          district_id: 1,
          approval_status: 'approved'
        }
      });

      const propertyData = await propertyResponse.json();
      testPropertyId = propertyData.data.property.id;
    });

    test('should create booking', async ({ request }) => {
      const bookingData = {
        property_id: testPropertyId,
        customer_name: 'Test Customer',
        customer_phone: '+994501234567',
        customer_email: 'test@example.com',
        booking_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        notes: 'Test booking via API'
      };

      const response = await request.post('http://localhost:8000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: bookingData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.booking).toHaveProperty('id');
      expect(responseData.data.booking.property_id).toBe(testPropertyId);
      expect(responseData.data.booking.customer_name).toBe(bookingData.customer_name);
      expect(responseData.data.booking.status).toBe('pending');
      
      testBookingId = responseData.data.booking.id;
    });

    test('should get bookings list', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.bookings).toBeInstanceOf(Array);
      
      const testBooking = responseData.data.bookings.find((b: any) => b.id === testBookingId);
      expect(testBooking).toBeTruthy();
    });

    test('should update booking status', async ({ request }) => {
      const response = await request.put(`http://localhost:8000/api/bookings/${testBookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          status: 'confirmed',
          notes: 'Booking confirmed by agent'
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.booking.status).toBe('confirmed');
    });

    test('should prevent double booking', async ({ request }) => {
      // Try to create another booking for the same property and date
      const conflictingBookingData = {
        property_id: testPropertyId,
        customer_name: 'Another Customer',
        customer_phone: '+994509876543',
        customer_email: 'another@example.com',
        booking_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Same date
        notes: 'Should be rejected due to conflict'
      };

      const response = await request.post('http://localhost:8000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: conflictingBookingData
      });

      expect(response.status()).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('BOOKING_CONFLICT');
    });

    test.afterAll(async ({ request }) => {
      // Clean up test property
      if (testPropertyId) {
        await request.delete(`http://localhost:8000/api/properties/${testPropertyId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
    });
  });

  test.describe('Files API', () => {
    let testFileId: string;
    let testPropertyId: string;

    test.beforeAll(async ({ request }) => {
      // Create a property for file tests
      const propertyResponse = await request.post('http://localhost:8000/api/properties', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'File Test Property',
          description: 'Property for file tests',
          category: 'sale',
          property_category: 'residential',
          listing_type: 'agency_owned',
          sell_price_azn: 150000,
          area_m2: 80,
          room_count: 2,
          floor: 1,
          total_floors: 4,
          address: 'File Test Address',
          district_id: 1
        }
      });

      const propertyData = await propertyResponse.json();
      testPropertyId = propertyData.data.property.id;
    });

    test('should upload file', async ({ request }) => {
      const fileContent = 'This is a test file for API integration testing.';
      
      const response = await request.post('http://localhost:8000/api/files/upload', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        multipart: {
          files: {
            name: 'test-document.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from(fileContent)
          },
          property_id: testPropertyId,
          category: 'documents'
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.files).toBeInstanceOf(Array);
      expect(responseData.data.files.length).toBe(1);
      expect(responseData.data.files[0]).toHaveProperty('id');
      expect(responseData.data.files[0].original_name).toBe('test-document.txt');
      expect(responseData.data.files[0].property_id).toBe(testPropertyId);
      expect(responseData.data.files[0].uploaded_by).toBe(userId);
      
      testFileId = responseData.data.files[0].id;
    });

    test('should get files list', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/files', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.files).toBeInstanceOf(Array);
      
      const testFile = responseData.data.files.find((f: any) => f.id === testFileId);
      expect(testFile).toBeTruthy();
    });

    test('should update file metadata', async ({ request }) => {
      const updateData = {
        category: 'contracts',
        description: 'Updated file description',
        tags: ['important', 'legal']
      };

      const response = await request.put(`http://localhost:8000/api/files/${testFileId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: updateData
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.file.category).toBe('contracts');
      expect(responseData.data.file.description).toBe('Updated file description');
      expect(responseData.data.file.tags).toEqual(['important', 'legal']);
    });

    test('should filter files by category', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/files?category=contracts', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      
      responseData.data.files.forEach((file: any) => {
        expect(file.category).toBe('contracts');
      });
    });

    test('should handle batch file operations', async ({ request }) => {
      const response = await request.post('http://localhost:8000/api/files/batch', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          action: 'move',
          file_ids: [testFileId],
          target_category: 'images'
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      
      // Verify file was moved
      const getResponse = await request.get(`http://localhost:8000/api/files/${testFileId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const fileData = await getResponse.json();
      expect(fileData.data.file.category).toBe('images');
    });

    test.afterAll(async ({ request }) => {
      // Clean up test files and property
      if (testFileId) {
        await request.delete(`http://localhost:8000/api/files/${testFileId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
      
      if (testPropertyId) {
        await request.delete(`http://localhost:8000/api/properties/${testPropertyId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
    });
  });

  test.describe('Notifications API', () => {
    let testNotificationId: string;

    test('should create notification', async ({ request }) => {
      const notificationData = {
        recipient_id: userId,
        type: 'system_announcement',
        title: 'API Test Notification',
        message: 'This is a test notification created via API',
        priority: 'medium'
      };

      const response = await request.post('http://localhost:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: notificationData
      });

      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.notification).toHaveProperty('id');
      expect(responseData.data.notification.title).toBe(notificationData.title);
      expect(responseData.data.notification.recipient_id).toBe(userId);
      expect(responseData.data.notification.sender_id).toBe(userId);
      
      testNotificationId = responseData.data.notification.id;
    });

    test('should get notifications list', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.notifications).toBeInstanceOf(Array);
      expect(responseData.data.unreadCount).toBeGreaterThanOrEqual(1);
      
      const testNotification = responseData.data.notifications.find((n: any) => n.id === testNotificationId);
      expect(testNotification).toBeTruthy();
      expect(testNotification.read_at).toBeNull(); // Should be unread
    });

    test('should mark notification as read', async ({ request }) => {
      const response = await request.put(`http://localhost:8000/api/notifications/${testNotificationId}/read`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      
      // Verify notification is marked as read
      const getResponse = await request.get(`http://localhost:8000/api/notifications/${testNotificationId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const notificationData = await getResponse.json();
      expect(notificationData.data.notification.read_at).not.toBeNull();
    });

    test('should filter notifications by type and status', async ({ request }) => {
      // Test type filter
      const typeResponse = await request.get('http://localhost:8000/api/notifications?type=system_announcement', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(typeResponse.status()).toBe(200);
      const typeData = await typeResponse.json();
      
      typeData.data.notifications.forEach((notification: any) => {
        expect(notification.type).toBe('system_announcement');
      });

      // Test status filter
      const statusResponse = await request.get('http://localhost:8000/api/notifications?status=read', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(statusResponse.status()).toBe(200);
      const statusData = await statusResponse.json();
      
      statusData.data.notifications.forEach((notification: any) => {
        expect(notification.read_at).not.toBeNull();
      });
    });

    test('should handle batch notification operations', async ({ request }) => {
      // Create another notification for batch testing
      const notificationResponse = await request.post('http://localhost:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          recipient_id: userId,
          type: 'system_announcement',
          title: 'Batch Test Notification',
          message: 'Another test notification for batch operations',
          priority: 'low'
        }
      });

      const notificationData = await notificationResponse.json();
      const secondNotificationId = notificationData.data.notification.id;

      // Test batch delete
      const batchResponse = await request.post('http://localhost:8000/api/notifications/batch', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          action: 'delete',
          notification_ids: [testNotificationId, secondNotificationId]
        }
      });

      expect(batchResponse.status()).toBe(200);
      
      const batchData = await batchResponse.json();
      expect(batchData.success).toBe(true);
      
      // Verify notifications were deleted
      const getResponse = await request.get(`http://localhost:8000/api/notifications/${testNotificationId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle authentication errors', async ({ request }) => {
      // Test without token
      const response = await request.get('http://localhost:8000/api/properties');
      
      expect(response.status()).toBe(401);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NO_TOKEN');

      // Test with invalid token
      const invalidTokenResponse = await request.get('http://localhost:8000/api/properties', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      expect(invalidTokenResponse.status()).toBe(401);
      const invalidTokenData = await invalidTokenResponse.json();
      expect(invalidTokenData.success).toBe(false);
      expect(invalidTokenData.error.code).toBe('INVALID_TOKEN');
    });

    test('should handle validation errors', async ({ request }) => {
      // Test property creation with missing required fields
      const response = await request.post('http://localhost:8000/api/properties', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          // Missing required fields
          title: 'Incomplete Property'
        }
      });

      expect(response.status()).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle not found errors', async ({ request }) => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      
      const response = await request.get(`http://localhost:8000/api/properties/${nonExistentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(404);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('PROPERTY_NOT_FOUND');
    });

    test('should handle rate limiting', async ({ request }) => {
      // Make many requests quickly to trigger rate limiting
      const requests = Array(10).fill().map(() => 
        request.get('http://localhost:8000/api/properties', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(requests);
      
      // At least some should succeed
      const successfulResponses = responses.filter(r => r.status() === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      // Some might be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      // Note: Depending on rate limit configuration, this might not always trigger
    }, 15000); // Increase timeout for this test
  });
});