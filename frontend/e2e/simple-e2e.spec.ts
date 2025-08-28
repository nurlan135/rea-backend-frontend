import { test, expect } from '@playwright/test';

// Simple E2E tests that don't require full app running
test.describe('REA INVEST Simple E2E Tests', () => {
  
  test.describe('Backend API Tests', () => {
    const API_BASE_URL = 'http://localhost:8000';

    test('backend health endpoint should be accessible', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`);
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
    });

    test('authentication API should work correctly', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com',
          password: 'password123'
        }
      });

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('token');
      expect(data.data.user).toHaveProperty('email', 'admin@rea-invest.com');
      expect(data.data.user).toHaveProperty('role', 'admin');
    });

    test('authentication should fail with wrong credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toHaveProperty('message');
    });

    test('properties API should require authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/properties`);
      
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error.message).toContain('token');
    });

    test('properties API should work with valid token', async ({ request }) => {
      // First login to get token
      const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com',
          password: 'password123'
        }
      });

      expect(loginResponse.ok()).toBeTruthy();
      const loginData = await loginResponse.json();
      const token = loginData.data.token;

      // Use token to access properties
      const propertiesResponse = await request.get(`${API_BASE_URL}/api/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(propertiesResponse.ok()).toBeTruthy();
      expect(propertiesResponse.status()).toBe(200);
      
      const propertiesData = await propertiesResponse.json();
      expect(propertiesData).toHaveProperty('success', true);
      expect(propertiesData).toHaveProperty('data');
      expect(Array.isArray(propertiesData.data)).toBeTruthy();
    });
  });

  test.describe('API Performance Tests', () => {
    const API_BASE_URL = 'http://localhost:8000';

    test('health endpoint should respond quickly', async ({ request }) => {
      const start = Date.now();
      
      const response = await request.get(`${API_BASE_URL}/health`);
      
      const responseTime = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('authentication should be reasonably fast', async ({ request }) => {
      const start = Date.now();
      
      await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com',
          password: 'password123'
        }
      });
      
      const responseTime = Date.now() - start;
      
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('multiple concurrent requests should work', async ({ request }) => {
      const promises = Array.from({ length: 5 }, () => 
        request.get(`${API_BASE_URL}/health`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
      });
    });
  });

  test.describe('API Security Tests', () => {
    const API_BASE_URL = 'http://localhost:8000';

    test('should reject requests without proper headers', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        headers: {
          'Content-Type': 'text/plain'
        },
        data: 'invalid-json-data'
      });

      // Should handle malformed requests gracefully  
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle SQL injection attempts', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: "admin@rea-invest.com'; DROP TABLE users; --",
          password: 'password123'
        }
      });

      // Should not return 500 error (which might indicate SQL error)
      expect(response.status()).not.toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
    });

    test('should handle XSS attempts in login', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: '<script>alert("xss")</script>',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(401); // Should be invalid credentials
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
    });

    test('should have proper CORS headers', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      expect(response.ok()).toBeTruthy();
      
      const headers = response.headers();
      expect(headers).toHaveProperty('access-control-allow-origin');
    });
  });

  test.describe('API Error Handling', () => {
    const API_BASE_URL = 'http://localhost:8000';

    test('should return proper error format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: '',
          password: ''
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('message');
      expect(typeof data.error.message).toBe('string');
    });

    test('should handle 404 endpoints gracefully', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/non-existent-endpoint`);
      
      expect(response.status()).toBe(404);
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com'
          // missing password
        }
      });

      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error.message).toContain('required');
    });
  });

  test.describe('API Data Validation', () => {
    const API_BASE_URL = 'http://localhost:8000';

    test('should validate email format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'invalid-email-format',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(401); // Should be unauthorized due to invalid email
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
    });

    test('should return consistent data structure', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`);
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      
      // Health endpoint should have consistent structure
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  test.describe('Load Testing', () => {
    const API_BASE_URL = 'http://localhost:8000';

    test('should handle rapid successive requests', async ({ request }) => {
      const requests = [];
      
      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(request.get(`${API_BASE_URL}/health`));
      }

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
      });
    });

    test('should handle different request sizes', async ({ request }) => {
      // Small request
      const smallResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com',
          password: 'password123'
        }
      });

      expect(smallResponse.ok()).toBeTruthy();

      // Request with more data
      const largeResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@rea-invest.com',
          password: 'password123',
          extraField: 'A'.repeat(1000) // Large string
        }
      });

      // Should still handle the request (may reject due to extra field, but shouldn't crash)
      expect(largeResponse.status()).toBeGreaterThanOrEqual(200);
      expect(largeResponse.status()).toBeLessThan(500);
    });
  });
});