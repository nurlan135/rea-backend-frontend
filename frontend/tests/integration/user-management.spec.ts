import { test, expect } from '@playwright/test';

test.describe('User Management and Authentication', () => {
  test.describe('Authentication Flow', () => {
    test('should handle complete login flow', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Verify login page elements
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
      
      // Test form validation
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('E-mail tələb olunur');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Şifrə tələb olunur');
      
      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Düzgün e-mail ünvanı daxil edin');
      
      // Test successful login
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // Verify redirect to dashboard
      await page.waitForURL('**/dashboard');
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toContainText('Xoş gəlmisiniz');
      
      // Verify token is stored
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
      
      // Verify user info in header
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('Agent User');
    });

    test('should handle invalid login credentials', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Test with non-existent user
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for error response
      await page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && 
        response.status() === 401
      );
      
      await expect(page.locator('[data-testid="login-error"]')).toContainText('E-mail və ya şifrə yanlışdır');
      
      // Test with wrong password
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && 
        response.status() === 401
      );
      
      await expect(page.locator('[data-testid="login-error"]')).toContainText('E-mail və ya şifrə yanlışdır');
    });

    test('should handle logout functionality', async ({ page }) => {
      // Login first
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
      
      // Test logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Wait for logout API call
      await page.waitForResponse(response => 
        response.url().includes('/api/auth/logout')
      );
      
      // Verify redirect to login
      await page.waitForURL('**/login');
      
      // Verify token is removed
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeFalsy();
      
      // Verify cannot access protected routes
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForURL('**/login');
    });

    test('should handle session expiration', async ({ page }) => {
      // Login with a short-lived token (simulate by API)
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
      
      // Simulate expired token by replacing it
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired.token.here');
      });
      
      // Try to access a protected resource
      await page.goto('http://localhost:3000/properties');
      
      // Should redirect to login due to expired token
      await page.waitForURL('**/login');
      await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Sessiyanız başa çatıb');
    });
  });

  test.describe('User Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
    });

    test('should display and update user profile', async ({ page }) => {
      // Navigate to profile page
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="profile-link"]');
      
      await page.waitForURL('**/profile');
      
      // Verify profile information is displayed
      await expect(page.locator('[data-testid="profile-first-name"]')).toHaveValue('Agent');
      await expect(page.locator('[data-testid="profile-last-name"]')).toHaveValue('User');
      await expect(page.locator('[data-testid="profile-email"]')).toHaveValue('agent@rea-invest.com');
      await expect(page.locator('[data-testid="profile-role"]')).toContainText('Agent');
      
      // Test profile update
      await page.fill('[data-testid="profile-first-name"]', 'Updated Agent');
      await page.fill('[data-testid="profile-phone"]', '+994501234567');
      await page.fill('[data-testid="profile-bio"]', 'Experienced real estate agent specializing in residential properties.');
      
      await page.click('[data-testid="save-profile-button"]');
      
      // Wait for update API call
      await page.waitForResponse(response => 
        response.url().includes('/api/users/profile') && 
        response.method() === 'PUT' &&
        response.status() === 200
      );
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Profil yeniləndi');
      
      // Verify changes are reflected in UI
      await page.reload();
      await expect(page.locator('[data-testid="profile-first-name"]')).toHaveValue('Updated Agent');
      await expect(page.locator('[data-testid="profile-phone"]')).toHaveValue('+994501234567');
    });

    test('should handle password change', async ({ page }) => {
      await page.goto('http://localhost:3000/profile/security');
      
      // Test password change form
      await page.fill('[data-testid="current-password"]', 'password123');
      await page.fill('[data-testid="new-password"]', 'newpassword123');
      await page.fill('[data-testid="confirm-password"]', 'newpassword123');
      
      await page.click('[data-testid="change-password-button"]');
      
      // Wait for password change API call
      await page.waitForResponse(response => 
        response.url().includes('/api/users/change-password') && 
        response.status() === 200
      );
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Şifrə dəyişdirildi');
      
      // Test login with new password
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('**/login');
      
      // Try old password (should fail)
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="login-error"]')).toContainText('E-mail və ya şifrə yanlışdır');
      
      // Try new password (should succeed)
      await page.fill('[data-testid="password-input"]', 'newpassword123');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard');
    });

    test('should validate password change requirements', async ({ page }) => {
      await page.goto('http://localhost:3000/profile/security');
      
      // Test password mismatch
      await page.fill('[data-testid="current-password"]', 'password123');
      await page.fill('[data-testid="new-password"]', 'newpassword123');
      await page.fill('[data-testid="confirm-password"]', 'differentpassword');
      
      await page.click('[data-testid="change-password-button"]');
      
      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Şifrələr uyğun deyil');
      
      // Test weak password
      await page.fill('[data-testid="new-password"]', '123');
      await page.fill('[data-testid="confirm-password"]', '123');
      
      await page.click('[data-testid="change-password-button"]');
      
      await expect(page.locator('[data-testid="new-password-error"]')).toContainText('Şifrə ən azı 8 simvol olmalıdır');
      
      // Test wrong current password
      await page.fill('[data-testid="current-password"]', 'wrongpassword');
      await page.fill('[data-testid="new-password"]', 'validnewpassword123');
      await page.fill('[data-testid="confirm-password"]', 'validnewpassword123');
      
      await page.click('[data-testid="change-password-button"]');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/users/change-password') && 
        response.status() === 400
      );
      
      await expect(page.locator('[data-testid="current-password-error"]')).toContainText('Mövcud şifrə yanlışdır');
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should restrict access based on user roles - Agent', async ({ page }) => {
      // Login as agent
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'agent@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
      
      // Verify agent can access their own properties
      await page.goto('http://localhost:3000/properties');
      await expect(page.locator('[data-testid="properties-list"]')).toBeVisible();
      
      // Verify agent cannot access admin pages
      await page.goto('http://localhost:3000/dashboard/admin');
      await expect(page.locator('[data-testid="access-denied"]')).toContainText('Bu səhifəyə giriş icazəniz yoxdur');
      
      // Verify agent cannot access user management
      await page.goto('http://localhost:3000/dashboard/users');
      await expect(page.locator('[data-testid="access-denied"]')).toContainText('Bu səhifəyə giriş icazəniz yoxdur');
      
      // Verify agent can only see their own properties in list
      const properties = page.locator('[data-testid="property-item"]');
      const firstProperty = properties.first();
      
      if (await firstProperty.isVisible()) {
        await expect(firstProperty.locator('[data-testid="property-agent"]')).toContainText('Agent User');
      }
    });

    test('should allow manager access to approval features', async ({ page }) => {
      // Login as manager
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'manager@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
      
      // Verify manager can access approvals
      await page.goto('http://localhost:3000/dashboard/approvals');
      await expect(page.locator('[data-testid="approvals-list"]')).toBeVisible();
      
      // Verify manager can access team management
      await page.goto('http://localhost:3000/dashboard/team');
      await expect(page.locator('[data-testid="team-management"]')).toBeVisible();
      
      // Verify manager cannot access system admin features
      await page.goto('http://localhost:3000/dashboard/admin/system');
      await expect(page.locator('[data-testid="access-denied"]')).toContainText('Bu səhifəyə giriş icazəniz yoxdur');
      
      // Verify manager can see all properties
      await page.goto('http://localhost:3000/properties');
      const properties = page.locator('[data-testid="property-item"]');
      
      // Should be able to see properties from different agents
      const propertyCount = await properties.count();
      expect(propertyCount).toBeGreaterThan(0);
    });

    test('should allow admin full access', async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'admin@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
      
      // Verify admin can access all areas
      const adminPages = [
        '/dashboard/admin',
        '/dashboard/users',
        '/dashboard/approvals',
        '/dashboard/reports',
        '/dashboard/settings'
      ];
      
      for (const pagePath of adminPages) {
        await page.goto(`http://localhost:3000${pagePath}`);
        await expect(page.locator('[data-testid="access-denied"]')).not.toBeVisible();
      }
      
      // Verify admin can manage users
      await page.goto('http://localhost:3000/dashboard/users');
      await expect(page.locator('[data-testid="create-user-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
      
      // Verify admin can see system statistics
      await page.goto('http://localhost:3000/dashboard/admin');
      await expect(page.locator('[data-testid="system-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="property-stats"]')).toBeVisible();
    });
  });

  test.describe('User Management (Admin)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'admin@rea-invest.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');
    });

    test('should create new user', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/users');
      
      // Click create user button
      await page.click('[data-testid="create-user-button"]');
      
      // Fill user creation form
      await page.fill('[data-testid="user-first-name"]', 'Yeni');
      await page.fill('[data-testid="user-last-name"]', 'Agent');
      await page.fill('[data-testid="user-email"]', 'yeni.agent@rea-invest.com');
      await page.fill('[data-testid="user-password"]', 'password123');
      await page.fill('[data-testid="user-confirm-password"]', 'password123');
      await page.selectOption('[data-testid="user-role"]', 'agent');
      await page.fill('[data-testid="user-phone"]', '+994501234568');
      
      await page.click('[data-testid="create-user-submit"]');
      
      // Wait for user creation API call
      await page.waitForResponse(response => 
        response.url().includes('/api/users') && 
        response.method() === 'POST' &&
        response.status() === 201
      );
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('İstifadəçi yaradıldı');
      
      // Verify user appears in list
      await page.waitForSelector('[data-testid="user-list-item"]');
      const userItems = page.locator('[data-testid="user-list-item"]');
      await expect(userItems.filter({ hasText: 'yeni.agent@rea-invest.com' })).toBeVisible();
    });

    test('should edit existing user', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/users');
      
      // Find and click edit button for a user
      const userItem = page.locator('[data-testid="user-list-item"]').first();
      await userItem.locator('[data-testid="edit-user-button"]').click();
      
      // Update user information
      await page.fill('[data-testid="user-first-name"]', 'Yenilənmiş');
      await page.fill('[data-testid="user-phone"]', '+994501111111');
      await page.check('[data-testid="user-is-active"]');
      
      await page.click('[data-testid="update-user-submit"]');
      
      // Wait for update API call
      await page.waitForResponse(response => 
        response.url().includes('/api/users/') && 
        response.method() === 'PUT' &&
        response.status() === 200
      );
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('İstifadəçi yeniləndi');
      
      // Verify changes are reflected
      await page.reload();
      await expect(page.locator('[data-testid="user-list-item"]').first()).toContainText('Yenilənmiş');
    });

    test('should deactivate/activate users', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/users');
      
      // Find an active user and deactivate
      const activeUser = page.locator('[data-testid="user-list-item"]').filter({ hasText: 'Aktiv' }).first();
      await activeUser.locator('[data-testid="user-actions-menu"]').click();
      await page.click('[data-testid="deactivate-user-action"]');
      
      // Confirm deactivation
      await page.click('[data-testid="confirm-deactivation"]');
      
      // Wait for API call
      await page.waitForResponse(response => 
        response.url().includes('/api/users/') && 
        response.url().includes('/deactivate') &&
        response.status() === 200
      );
      
      // Verify status change
      await expect(page.locator('[data-testid="success-message"]')).toContainText('İstifadəçi deaktiv edildi');
      
      // Test reactivation
      const inactiveUser = page.locator('[data-testid="user-list-item"]').filter({ hasText: 'Deaktiv' }).first();
      await inactiveUser.locator('[data-testid="user-actions-menu"]').click();
      await page.click('[data-testid="activate-user-action"]');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/users/') && 
        response.url().includes('/activate') &&
        response.status() === 200
      );
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('İstifadəçi aktiv edildi');
    });

    test('should filter and search users', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/users');
      
      // Test role filter
      await page.selectOption('[data-testid="role-filter"]', 'agent');
      await page.waitForResponse(response => 
        response.url().includes('/api/users') && 
        response.url().includes('role=agent')
      );
      
      // Verify filtered results
      const userItems = page.locator('[data-testid="user-list-item"]');
      const count = await userItems.count();
      
      for (let i = 0; i < count; i++) {
        await expect(userItems.nth(i).locator('[data-testid="user-role"]')).toContainText('Agent');
      }
      
      // Test search functionality
      await page.fill('[data-testid="user-search"]', 'agent@rea-invest.com');
      await page.waitForResponse(response => 
        response.url().includes('/api/users') && 
        response.url().includes('search=agent%40rea-invest.com')
      );
      
      // Verify search results
      await expect(userItems.filter({ hasText: 'agent@rea-invest.com' })).toBeVisible();
      
      // Test status filter
      await page.fill('[data-testid="user-search"]', ''); // Clear search
      await page.selectOption('[data-testid="status-filter"]', 'active');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/users') && 
        response.url().includes('status=active')
      );
      
      // Verify all shown users are active
      const activeUsers = page.locator('[data-testid="user-list-item"]');
      const activeCount = await activeUsers.count();
      
      for (let i = 0; i < activeCount; i++) {
        await expect(activeUsers.nth(i).locator('[data-testid="user-status"]')).toContainText('Aktiv');
      }
    });
  });
});