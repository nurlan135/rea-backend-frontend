import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend server...');
    let backendReady = false;
    let retries = 0;
    const maxRetries = 30;

    while (!backendReady && retries < maxRetries) {
      try {
        const response = await page.request.get('http://localhost:8000/health');
        if (response.ok()) {
          console.log('✅ Backend server is ready');
          backendReady = true;
        }
      } catch (error) {
        console.log(`⏳ Backend not ready, retrying... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries++;
      }
    }

    if (!backendReady) {
      throw new Error('Backend server failed to start within timeout');
    }

    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend server...');
    let frontendReady = false;
    retries = 0;

    while (!frontendReady && retries < maxRetries) {
      try {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 5000 });
        console.log('✅ Frontend server is ready');
        frontendReady = true;
      } catch (error) {
        console.log(`⏳ Frontend not ready, retrying... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries++;
      }
    }

    if (!frontendReady) {
      throw new Error('Frontend server failed to start within timeout');
    }

    // Check database connection and run basic setup
    console.log('🔧 Setting up test database...');
    
    try {
      // Test database connection through API
      const dbHealthResponse = await page.request.get('http://localhost:8000/api/auth/health');
      if (!dbHealthResponse.ok()) {
        console.warn('⚠️ Database health check failed, but continuing...');
      }
    } catch (error) {
      console.warn('⚠️ Could not verify database connection:', error);
    }

    // Prepare test environment
    console.log('🧪 Preparing test environment...');
    
    // Create test users if they don't exist (this would typically be done via seeding)
    const testUsers = [
      {
        email: 'agent@rea-invest.com',
        password: 'password123',
        first_name: 'Agent',
        last_name: 'User',
        role: 'agent'
      },
      {
        email: 'manager@rea-invest.com',
        password: 'password123',
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager'
      },
      {
        email: 'admin@rea-invest.com',
        password: 'password123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      }
    ];

    for (const user of testUsers) {
      try {
        // Try to login to see if user exists
        const loginResponse = await page.request.post('http://localhost:8000/api/auth/login', {
          data: {
            email: user.email,
            password: user.password
          }
        });

        if (!loginResponse.ok()) {
          // User doesn't exist or password is wrong, try to create
          console.log(`Creating test user: ${user.email}`);
          
          const registerResponse = await page.request.post('http://localhost:8000/api/auth/register', {
            data: user
          });

          if (registerResponse.ok()) {
            console.log(`✅ Created test user: ${user.email}`);
          } else {
            console.log(`ℹ️ Test user ${user.email} might already exist`);
          }
        } else {
          console.log(`✅ Test user ${user.email} is ready`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not verify/create test user ${user.email}:`, error);
      }
    }

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;