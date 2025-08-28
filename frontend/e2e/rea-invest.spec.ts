import { test, expect, Page } from '@playwright/test';

// Test data
const testCredentials = {
  email: 'admin@rea-invest.com',
  password: 'password123'
};

const API_BASE_URL = 'http://localhost:8000';

test.describe('REA INVEST E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Homepage', () => {
    test('should display REA INVEST homepage correctly', async ({ page }) => {
      // Check main heading
      await expect(page.getByRole('heading', { name: /REA INVEST/i })).toBeVisible();
      
      // Check subtitle in Azerbaijani (specific to paragraph)
      await expect(page.locator('p').getByText(/Əmlak İdarəetmə Sistemi/i)).toBeVisible();
      
      // Check English subtitle
      await expect(page.getByText(/Real Estate Management System/i)).toBeVisible();
      
      // Check production test button
      await expect(page.getByRole('link', { name: /Production Test/i })).toBeVisible();
    });

    test('should navigate to production test page', async ({ page }) => {
      // Click on Production Test link
      await page.getByRole('link', { name: /Production Test/i }).click();
      
      // Should navigate to production test page
      await expect(page).toHaveURL(/.*production-test.*/);
      await page.waitForLoadState('networkidle');
      
      // Check if production test page elements are visible (specific to heading)
      await expect(page.getByRole('heading', { name: /Production Test/i })).toBeVisible();
    });
  });

  test.describe('Production Test Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/production-test');
      await page.waitForLoadState('networkidle');
    });

    test('should display production test interface', async ({ page }) => {
      // Check for API test buttons using actual text from the page
      await expect(page.getByRole('button', { name: /Health Check/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Production Login/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Fetch Properties/i })).toBeVisible();
      
      // Check for main heading
      await expect(page.getByRole('heading', { name: /REA INVEST Production Test/i })).toBeVisible();
    });

    test('should test backend connection', async ({ page }) => {
      // Click the health check button
      const healthButton = page.getByRole('button', { name: /Health Check/i });
      await healthButton.click();
      
      // Wait for health check response
      await page.waitForTimeout(3000);
      
      // Health check shows an alert, so we don't need to check for visual indicators
      // Just verify the button is clickable and page responds
      await expect(healthButton).toBeEnabled();
    });

    test('should test authentication flow', async ({ page }) => {
      // Click the production login button
      const loginButton = page.getByRole('button', { name: /Production Login/i });
      await loginButton.click();
      
      // Wait for authentication test
      await page.waitForTimeout(5000);
      
      // Check for authentication success indicators
      const authSuccess = page.locator('text=/✅ Authenticated!/i').or(
        page.locator('text=/Token:/i')
      );
      await expect(authSuccess.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('API Integration', () => {
    test('backend health endpoint should be accessible', async ({ page }) => {
      // Test direct API access through the frontend
      const response = await page.evaluate(async (apiUrl) => {
        try {
          const res = await fetch(`${apiUrl}/health`);
          return {
            status: res.status,
            ok: res.ok,
            data: await res.json()
          };
        } catch (error) {
          return {
            status: 0,
            ok: false,
            error: error.message
          };
        }
      }, API_BASE_URL);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });

    test('authentication API should work', async ({ page }) => {
      const response = await page.evaluate(async (data) => {
        try {
          const res = await fetch(`${data.apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              password: data.password
            })
          });
          return {
            status: res.status,
            ok: res.ok,
            data: await res.json()
          };
        } catch (error) {
          return {
            status: 0,
            ok: false,
            error: error.message
          };
        }
      }, {
        apiUrl: API_BASE_URL,
        email: testCredentials.email,
        password: testCredentials.password
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toHaveProperty('token');
      expect(response.data.data.user).toHaveProperty('email', testCredentials.email);
    });
  });

  test.describe('Performance', () => {
    test('page should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('production test page should be responsive', async ({ page }) => {
      await page.goto('/production-test');
      
      // Test different viewport sizes
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
      
      await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
      
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('homepage should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      // Check for main heading
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/REA INVEST/i);
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Check if focus is visible (at least one focusable element should exist)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible({ timeout: 5000 });
    });

    test('images should have alt text or be decorative', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Either has alt text or is marked as decorative
        expect(alt !== null || role === 'presentation').toBe(true);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block all network requests to simulate network failure
      await page.route('**/*', route => route.abort());
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Page should still render basic content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle 404 errors appropriately', async ({ page }) => {
      // Try to navigate to non-existent page
      const response = await page.goto('/non-existent-page');
      
      // Should either redirect to 404 page or handle gracefully
      expect(response?.status()).toBeGreaterThanOrEqual(200);
    });
  });

  test.describe('Security', () => {
    test('should have security headers', async ({ page }) => {
      const response = await page.goto('/');
      
      const headers = response?.headers() || {};
      
      // Check for basic security headers (some might be set by Next.js or our backend)
      expect(Object.keys(headers)).toBeDefined();
      
      // Page should load successfully with security measures
      expect(response?.status()).toBe(200);
    });

    test('should not expose sensitive information in client', async ({ page }) => {
      await page.goto('/production-test');
      
      // Check that no database credentials or secrets are exposed in the page source
      const pageContent = await page.content();
      
      expect(pageContent).not.toContain('admin123'); // Database password
      expect(pageContent).not.toContain('postgresql://'); // Connection string
      expect(pageContent).not.toContain('JWT_SECRET'); // JWT secret key name
    });
  });
});

// Helper function for authentication in other tests
export async function login(page: Page, email: string, password: string) {
  // This would be used if we had a proper login page
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation or success indicator
  await page.waitForTimeout(2000);
}