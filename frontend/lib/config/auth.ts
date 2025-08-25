// Authentication configuration
export const AUTH_CONFIG = {
  // API endpoints
  API_BASE_URL: 'http://localhost:8000/api',
  LOGIN_ENDPOINT: '/auth/login',
  LOGOUT_ENDPOINT: '/auth/logout',
  ME_ENDPOINT: '/auth/me',
  
  // Storage keys
  TOKEN_KEY: 'rea_invest_token',
  USER_KEY: 'rea_invest_user',
  
  // JWT token expiry (in days)
  TOKEN_EXPIRY_DAYS: 7,
  
  // Role-based dashboard URLs
  DASHBOARD_URLS: {
    manager: '/dashboard/manager',
    agent: '/dashboard/agent',
    vp: '/dashboard/vp',
    director: '/dashboard/director',
    admin: '/dashboard/admin',
    default: '/dashboard'
  },
  
  // Default redirect URLs
  LOGIN_URL: '/login',
  UNAUTHORIZED_URL: '/unauthorized',
  HOME_URL: '/',
  
  // Performance requirements
  PERFORMANCE_TARGETS: {
    // P95 loading time requirement (in milliseconds)
    P95_LOADING_TIME: 3000,
    
    // Maximum allowed API response time
    MAX_API_RESPONSE_TIME: 5000,
    
    // Auth check timeout
    AUTH_CHECK_TIMEOUT: 10000
  },
  
  // Validation rules
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
  }
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  admin: [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'properties.view',
    'properties.create',
    'properties.update',
    'properties.delete',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'bookings.delete',
    'deals.view',
    'deals.create',
    'deals.update',
    'deals.delete',
    'expenses.view',
    'expenses.create',
    'expenses.update',
    'expenses.delete',
    'reports.view',
    'reports.create',
    'audit.view',
    'system.admin'
  ],
  director: [
    'properties.view',
    'properties.create',
    'properties.update',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'deals.view',
    'deals.create',
    'deals.update',
    'deals.approve',
    'expenses.view',
    'expenses.create',
    'expenses.update',
    'reports.view',
    'reports.create',
    'audit.view'
  ],
  vp: [
    'properties.view',
    'properties.create',
    'properties.update',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'deals.view',
    'deals.create',
    'deals.update',
    'expenses.view',
    'expenses.create',
    'expenses.update',
    'expenses.approve',
    'reports.view'
  ],
  manager: [
    'properties.view',
    'properties.create',
    'properties.update',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'deals.view',
    'deals.create',
    'deals.update',
    'expenses.view',
    'expenses.create',
    'reports.view'
  ],
  agent: [
    'properties.view',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'deals.view',
    'deals.create'
  ]
};

// Business rules
export const BUSINESS_RULES = {
  // Property booking rules
  MAX_ACTIVE_BOOKINGS_PER_PROPERTY: 1,
  BOOKING_DURATION_DAYS: 30,
  
  // Deal approval workflow
  DEAL_APPROVAL_WORKFLOW: [
    { role: 'agent', action: 'create' },
    { role: 'manager', action: 'review' },
    { role: 'vp', action: 'budget_approval' },
    { role: 'director', action: 'final_approval' },
    { role: 'manager', action: 'publish' }
  ],
  
  // Expense limits by role
  EXPENSE_LIMITS: {
    agent: 1000,      // AZN
    manager: 5000,    // AZN
    vp: 20000,        // AZN
    director: 100000, // AZN
    admin: Infinity
  },
  
  // Audit requirements
  AUDIT_RETENTION_YEARS: 5,
  REQUIRED_AUDIT_FIELDS: [
    'user_id',
    'action',
    'resource',
    'before_state',
    'after_state',
    'timestamp',
    'ip_address'
  ]
};

export default AUTH_CONFIG;