import { test, expect } from '@playwright/test';

test.describe('Property Management Flow', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    
    await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard');
    
    // Extract token from localStorage
    authToken = await page.evaluate(() => localStorage.getItem('token') || '');
    expect(authToken).toBeTruthy();
  });

  test('should create a new property successfully', async ({ page }) => {
    // Navigate to property creation
    await page.goto('http://localhost:3000/properties/create');
    
    // Fill property form
    await page.fill('[data-testid="title-input"]', 'Test Integration Property');
    await page.fill('[data-testid="description-textarea"]', 'A comprehensive test property created during integration testing.');
    
    // Select category
    await page.selectOption('[data-testid="category-select"]', 'sale');
    
    // Select property category
    await page.selectOption('[data-testid="property-category-select"]', 'residential');
    
    // Select listing type
    await page.selectOption('[data-testid="listing-type-select"]', 'agency_owned');
    
    // Fill numeric fields
    await page.fill('[data-testid="sell-price-input"]', '250000');
    await page.fill('[data-testid="area-input"]', '120');
    await page.fill('[data-testid="room-count-input"]', '3');
    await page.fill('[data-testid="floor-input"]', '8');
    await page.fill('[data-testid="total-floors-input"]', '12');
    
    // Fill address
    await page.fill('[data-testid="address-textarea"]', 'Yasamal rayonu, Həzi Aslanov küç. 123');
    
    // Select district
    await page.selectOption('[data-testid="district-select"]', '1'); // Yasamal
    
    // Add features
    await page.check('[data-testid="feature-central-heating"]');
    await page.check('[data-testid="feature-air-conditioning"]');
    await page.check('[data-testid="feature-security-system"]');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Əmlak uğurla yaradıldı');
    
    // Verify redirect to property list
    await page.waitForURL('**/properties');
    
    // Verify property appears in list
    await expect(page.locator('[data-testid="property-item"]').first()).toContainText('Test Integration Property');
  });

  test('should search and filter properties', async ({ page }) => {
    // First create a test property via API for consistent testing
    const response = await page.request.post('http://localhost:8000/api/properties', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Searchable Property',
        description: 'Property for search testing',
        category: 'rent',
        property_category: 'commercial',
        listing_type: 'brokerage',
        rent_price_monthly_azn: 3000,
        area_m2: 200,
        room_count: 5,
        floor: 2,
        total_floors: 5,
        address: 'Nasimi rayonu, Test küç. 456',
        district_id: 2
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const propertyData = await response.json();
    const propertyId = propertyData.data.property.id;
    
    // Navigate to search page
    await page.goto('http://localhost:3000/properties/search');
    
    // Test basic search
    await page.fill('[data-testid="search-input"]', 'Searchable Property');
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');
    await expect(page.locator('[data-testid="property-item"]').first()).toContainText('Searchable Property');
    
    // Test filter by category
    await page.selectOption('[data-testid="category-filter"]', 'rent');
    await page.click('[data-testid="apply-filters-button"]');
    
    await page.waitForResponse(response => response.url().includes('/api/properties') && response.status() === 200);
    
    // Verify results are filtered
    const rentProperties = page.locator('[data-testid="property-item"]');
    await expect(rentProperties.first()).toContainText('İcarə');
    
    // Test price range filter
    await page.fill('[data-testid="min-price-input"]', '2000');
    await page.fill('[data-testid="max-price-input"]', '4000');
    await page.click('[data-testid="apply-filters-button"]');
    
    await page.waitForResponse(response => response.url().includes('/api/properties') && response.status() === 200);
    
    // Verify property is still in results (3000 AZN rent)
    await expect(page.locator('[data-testid="property-item"]').first()).toContainText('Searchable Property');
    
    // Test area filter
    await page.fill('[data-testid="min-area-input"]', '150');
    await page.fill('[data-testid="max-area-input"]', '250');
    await page.click('[data-testid="apply-filters-button"]');
    
    await page.waitForResponse(response => response.url().includes('/api/properties') && response.status() === 200);
    
    // Verify results
    await expect(page.locator('[data-testid="property-item"]').first()).toContainText('200 m²');
    
    // Clean up - delete test property
    await page.request.delete(`http://localhost:8000/api/properties/${propertyId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  });

  test('should handle property approval workflow', async ({ page, context }) => {
    // Create property as agent
    const agentPage = page;
    await agentPage.goto('http://localhost:3000/properties/create');
    
    await agentPage.fill('[data-testid="title-input"]', 'Approval Test Property');
    await agentPage.fill('[data-testid="description-textarea"]', 'Property for testing approval workflow');
    await agentPage.selectOption('[data-testid="category-select"]', 'sale');
    await agentPage.selectOption('[data-testid="property-category-select"]', 'residential');
    await agentPage.selectOption('[data-testid="listing-type-select"]', 'agency_owned');
    await agentPage.fill('[data-testid="sell-price-input"]', '180000');
    await agentPage.fill('[data-testid="area-input"]', '90');
    await agentPage.fill('[data-testid="room-count-input"]', '2');
    await agentPage.fill('[data-testid="address-textarea"]', 'Approval Test Address');
    await agentPage.selectOption('[data-testid="district-select"]', '1');
    
    await agentPage.click('[data-testid="submit-button"]');
    await agentPage.waitForURL('**/properties');
    
    // Get property ID from the created property
    const propertyElement = agentPage.locator('[data-testid="property-item"]').first();
    const propertyId = await propertyElement.getAttribute('data-property-id');
    
    // Verify property is in pending status
    await expect(propertyElement.locator('[data-testid="status-badge"]')).toContainText('Gözləmədə');
    
    // Login as manager in new tab
    const managerPage = await context.newPage();
    await managerPage.goto('http://localhost:3000/login');
    
    await managerPage.fill('[data-testid="email-input"]', 'manager@rea-invest.com');
    await managerPage.fill('[data-testid="password-input"]', 'password123');
    await managerPage.click('[data-testid="login-button"]');
    await managerPage.waitForURL('**/dashboard');
    
    // Navigate to approvals page
    await managerPage.goto('http://localhost:3000/dashboard/approvals');
    
    // Find and approve the property
    const approvalItem = managerPage.locator(`[data-property-id="${propertyId}"]`);
    await expect(approvalItem).toContainText('Approval Test Property');
    
    await approvalItem.locator('[data-testid="approve-button"]').click();
    
    // Add approval comment
    await managerPage.fill('[data-testid="approval-comment"]', 'Property meets all requirements. Approved for listing.');
    await managerPage.click('[data-testid="confirm-approval-button"]');
    
    // Wait for approval to complete
    await managerPage.waitForResponse(response => 
      response.url().includes('/api/properties/') && 
      response.url().includes('/approve') && 
      response.status() === 200
    );
    
    // Verify approval success message
    await expect(managerPage.locator('[data-testid="success-message"]')).toContainText('Əmlak təsdiqləndi');
    
    // Go back to agent page and verify property is approved
    await agentPage.reload();
    await agentPage.waitForSelector('[data-testid="property-item"]');
    
    const updatedPropertyElement = agentPage.locator(`[data-property-id="${propertyId}"]`);
    await expect(updatedPropertyElement.locator('[data-testid="status-badge"]')).toContainText('Təsdiqləndi');
    
    // Verify property is now visible in public search
    const publicPage = await context.newPage();
    await publicPage.goto('http://localhost:3000/properties');
    
    await expect(publicPage.locator('[data-testid="property-item"]')).toContainText('Approval Test Property');
    
    await managerPage.close();
    await publicPage.close();
  });

  test('should handle property booking flow', async ({ page, context }) => {
    // Create an approved property first
    const createResponse = await page.request.post('http://localhost:8000/api/properties', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Bookable Property',
        description: 'Property available for booking',
        category: 'rent',
        property_category: 'residential',
        listing_type: 'agency_owned',
        rent_price_monthly_azn: 1500,
        area_m2: 85,
        room_count: 2,
        floor: 5,
        total_floors: 10,
        address: 'Booking Test Address',
        district_id: 1,
        approval_status: 'approved' // Manager creating pre-approved property
      }
    });
    
    const propertyData = await createResponse.json();
    const propertyId = propertyData.data.property.id;
    
    // Navigate to property details
    await page.goto(`http://localhost:3000/properties/${propertyId}`);
    
    // Verify property details are displayed
    await expect(page.locator('[data-testid="property-title"]')).toContainText('Bookable Property');
    await expect(page.locator('[data-testid="property-price"]')).toContainText('1,500 AZN');
    
    // Click book property button
    await page.click('[data-testid="book-property-button"]');
    
    // Fill booking form
    await page.fill('[data-testid="customer-name-input"]', 'Əli Məmmədov');
    await page.fill('[data-testid="customer-phone-input"]', '+994501234567');
    await page.fill('[data-testid="customer-email-input"]', 'ali@example.com');
    
    // Select booking dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await page.fill('[data-testid="booking-start-date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('[data-testid="booking-end-date"]', nextWeek.toISOString().split('T')[0]);
    
    // Add booking notes
    await page.fill('[data-testid="booking-notes"]', 'İlk görüş üçün rezervasiya. Sübh saatları əlverişlidir.');
    
    // Submit booking
    await page.click('[data-testid="submit-booking-button"]');
    
    // Wait for booking confirmation
    await page.waitForResponse(response => 
      response.url().includes('/api/bookings') && 
      response.status() === 201
    );
    
    // Verify booking success
    await expect(page.locator('[data-testid="booking-success-message"]')).toContainText('Rezervasiya uğurla yaradıldı');
    
    // Verify booking appears in agent's bookings
    await page.goto('http://localhost:3000/dashboard/bookings');
    
    await page.waitForSelector('[data-testid="booking-item"]');
    const bookingItem = page.locator('[data-testid="booking-item"]').first();
    
    await expect(bookingItem).toContainText('Əli Məmmədov');
    await expect(bookingItem).toContainText('Bookable Property');
    await expect(bookingItem).toContainText('+994501234567');
    
    // Test booking status update
    await bookingItem.locator('[data-testid="booking-actions-menu"]').click();
    await page.click('[data-testid="confirm-booking-action"]');
    
    // Add confirmation comment
    await page.fill('[data-testid="booking-comment"]', 'Müştəri ilə əlaqə quruldu. Görüş təsdiqləndi.');
    await page.click('[data-testid="confirm-status-change"]');
    
    // Verify status update
    await page.waitForResponse(response => 
      response.url().includes('/api/bookings/') && 
      response.url().includes('/status') && 
      response.status() === 200
    );
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Rezervasiya statusu yeniləndi');
    
    // Clean up
    await page.request.delete(`http://localhost:8000/api/properties/${propertyId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  });

  test('should handle file upload and management', async ({ page }) => {
    // Create a property to attach files to
    const createResponse = await page.request.post('http://localhost:8000/api/properties', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'File Test Property',
        description: 'Property for testing file uploads',
        category: 'sale',
        property_category: 'residential',
        listing_type: 'agency_owned',
        sell_price_azn: 200000,
        area_m2: 100,
        room_count: 3,
        floor: 1,
        total_floors: 5,
        address: 'File Test Address',
        district_id: 1
      }
    });
    
    const propertyData = await createResponse.json();
    const propertyId = propertyData.data.property.id;
    
    // Navigate to file management
    await page.goto(`http://localhost:3000/properties/${propertyId}/files`);
    
    // Test file upload via drag and drop zone
    const fileContent = 'This is a test document for file upload testing.';
    const file = {
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    };
    
    // Simulate file drop
    await page.setInputFiles('[data-testid="file-upload-input"]', {
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer
    });
    
    // Wait for upload to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/files/upload') && 
      response.status() === 200
    );
    
    // Verify file appears in list
    await page.waitForSelector('[data-testid="file-item"]');
    const fileItem = page.locator('[data-testid="file-item"]').first();
    
    await expect(fileItem).toContainText('test-document.txt');
    await expect(fileItem).toContainText('text/plain');
    
    // Test file categorization
    await fileItem.locator('[data-testid="file-actions-menu"]').click();
    await page.click('[data-testid="edit-file-action"]');
    
    // Change category
    await page.selectOption('[data-testid="file-category-select"]', 'documents');
    await page.fill('[data-testid="file-description-input"]', 'Important property document');
    await page.fill('[data-testid="file-tags-input"]', 'contract, legal, important');
    
    await page.click('[data-testid="save-file-metadata"]');
    
    // Verify metadata update
    await page.waitForResponse(response => 
      response.url().includes('/api/files/') && 
      response.method() === 'PUT' &&
      response.status() === 200
    );
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Fayl məlumatları yeniləndi');
    
    // Test file download
    const downloadPromise = page.waitForEvent('download');
    await fileItem.locator('[data-testid="download-file-button"]').click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('test-document.txt');
    
    // Test batch file operations
    await page.check('[data-testid="select-file-checkbox"]');
    await expect(page.locator('[data-testid="batch-actions"]')).toBeVisible();
    
    // Test batch delete
    await page.click('[data-testid="batch-delete-button"]');
    await page.click('[data-testid="confirm-batch-delete"]');
    
    // Verify batch operation
    await page.waitForResponse(response => 
      response.url().includes('/api/files/batch') && 
      response.status() === 200
    );
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Fayllar silindi');
    
    // Clean up
    await page.request.delete(`http://localhost:8000/api/properties/${propertyId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  });

  test('should handle notification system', async ({ page, context }) => {
    // Navigate to notifications center
    await page.goto('http://localhost:3000/dashboard/notifications');
    
    // Create a test notification via API
    const notificationResponse = await page.request.post('http://localhost:8000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        recipient_id: await page.evaluate(() => localStorage.getItem('userId')),
        type: 'system_announcement',
        title: 'Integration Test Notification',
        message: 'This is a test notification created during integration testing.',
        priority: 'high'
      }
    });
    
    expect(notificationResponse.ok()).toBeTruthy();
    
    // Refresh to load new notification
    await page.reload();
    await page.waitForSelector('[data-testid="notification-item"]');
    
    // Verify notification appears
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toContainText('Integration Test Notification');
    await expect(notificationItem).toContainText('Yüksək'); // High priority badge
    
    // Test notification filtering
    await page.selectOption('[data-testid="notification-type-filter"]', 'system_announcement');
    await page.waitForResponse(response => 
      response.url().includes('/api/notifications') && 
      response.url().includes('type=system_announcement')
    );
    
    await expect(notificationItem).toContainText('Integration Test Notification');
    
    // Test mark as read
    await notificationItem.locator('[data-testid="notification-actions"]').click();
    await page.click('[data-testid="mark-read-action"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/notifications/') && 
      response.url().includes('/read') && 
      response.status() === 200
    );
    
    // Verify notification marked as read (visual change)
    await expect(notificationItem).not.toHaveClass(/unread/);
    
    // Test notification settings
    await page.goto('http://localhost:3000/dashboard/notifications/settings');
    
    // Update notification preferences
    await page.uncheck('[data-testid="email-notifications-toggle"]');
    await page.check('[data-testid="push-notifications-toggle"]');
    await page.selectOption('[data-testid="quiet-hours-start"]', '22:00');
    await page.selectOption('[data-testid="quiet-hours-end"]', '08:00');
    
    await page.click('[data-testid="save-notification-settings"]');
    
    // Verify settings saved
    await page.waitForResponse(response => 
      response.url().includes('/api/notifications/settings') && 
      response.method() === 'PUT' &&
      response.status() === 200
    );
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Tənzimləmələr saxlandı');
    
    // Test bulk notification operations
    await page.goto('http://localhost:3000/dashboard/notifications');
    await page.check('[data-testid="select-all-notifications"]');
    
    await page.click('[data-testid="batch-mark-read"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/notifications/batch') && 
      response.status() === 200
    );
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Bildirişlər oxundu olaraq qeyd edildi');
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/properties', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Server error', code: 'INTERNAL_ERROR' }
        })
      });
    });
    
    await page.goto('http://localhost:3000/properties');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Xəta baş verdi');
    
    // Test form validation errors
    await page.unroute('**/api/properties');
    await page.goto('http://localhost:3000/properties/create');
    
    // Submit form without required fields
    await page.click('[data-testid="submit-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Başlıq tələb olunur');
    await expect(page.locator('[data-testid="description-error"]')).toContainText('Təsvir tələb olunur');
    await expect(page.locator('[data-testid="address-error"]')).toContainText('Ünvan tələb olunur');
    
    // Test authentication error
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('http://localhost:3000/dashboard');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Test invalid login credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toContainText('E-mail və ya şifrə yanlışdır');
  });
});