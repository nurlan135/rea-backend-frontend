# Login Sistemi - Texniki Dizayn (Technical Design)

## İcmal

Bu sənəd REA INVEST əmlak idarəetmə sistemi üçün login səhifəsinin və autentifikasiya modulunun texniki arxitekturasını, komponent dizaynını və implementasiya təfərrüatlarını təsvir edir.

## 1. Modul Arxitekturası

### 1.1 Authentication Architecture Overview

```
┌─────────────────────────────────────────┐
│           Client Layer (Next.js)        │
├─────────────────────────────────────────┤
│ • LoginForm Component                   │
│ • Client-side State Management         │
│ • Form Validation (Zod schemas)        │
│ • JWT Token Storage (localStorage)     │
│ • Protected Route Components           │
└─────────────────────────────────────────┘
                    ↓ HTTPS
┌─────────────────────────────────────────┐
│             API Gateway Layer           │
├─────────────────────────────────────────┤
│ • Express.js Authentication Routes     │
│ • JWT Token Generation & Validation    │
│ • Rate Limiting & Security Headers     │
│ • IP Whitelisting (Admin Operations)   │
│ • Audit Logging Middleware             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Business Logic Layer          │
├─────────────────────────────────────────┤
│ • AuthService (User Validation)        │
│ • RoleService (RBAC Permissions)       │
│ • AuditService (Login Tracking)        │
│ • SessionService (Token Management)    │
│ • PasswordService (bcrypt handling)    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Data Access Layer             │
├─────────────────────────────────────────┤
│ • PostgreSQL Users Table               │
│ • Roles & Permissions Tables           │
│ • Audit Logs Table                     │
│ • Session Management                    │
│ • Redis Cache (future enhancement)     │
└─────────────────────────────────────────┘
```

### 1.2 Component Structure

```
/app
├── page.tsx (Landing with login link)
├── login/
│   ├── page.tsx (Login page - CSR)
│   └── layout.tsx (Auth layout)
├── dashboard/
│   ├── page.tsx (Dashboard - CSR with auth check)
│   └── layout.tsx (Protected layout)
└── unauthorized/
    └── page.tsx (Access denied page)

/components/auth
├── LoginForm.tsx (Main login component)
├── ProtectedRoute.tsx (HOC for protection)
├── AuthProvider.tsx (Context provider)
└── LogoutButton.tsx (Logout functionality)

/lib/auth
├── authContext.tsx (React context)
├── authService.ts (API calls)
├── tokenService.ts (JWT handling)
└── validations.ts (Zod schemas)
```

## 2. Database Schema Design

### 2.1 Authentication Tables

```sql
-- Users table (existing, enhanced for auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    phone VARCHAR(20),
    
    -- Work Information
    role_id UUID REFERENCES roles(id) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    employee_id VARCHAR(50),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Security
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table with hierarchical permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- agent, manager, vp, director, admin
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- Array of permission strings
    hierarchy_level INTEGER NOT NULL, -- 1=agent, 2=manager, 3=vp, 4=director, 5=admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login sessions (for tracking active sessions)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Hashed JWT token
    ip_address INET NOT NULL,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invalidated_at TIMESTAMP -- For logout/revocation
);

-- Audit log for authentication events
CREATE TABLE auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_EXPIRED, etc.
    email VARCHAR(255), -- Store email even if user not found
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100), -- INVALID_CREDENTIALS, ACCOUNT_LOCKED, etc.
    additional_data JSONB, -- Extra context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_branch ON users(role_id, branch_id);
CREATE INDEX idx_users_active ON users(is_active, last_login_at);
CREATE INDEX idx_sessions_user_token ON user_sessions(user_id, token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE invalidated_at IS NULL;
CREATE INDEX idx_auth_audit_user ON auth_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_auth_audit_ip ON auth_audit_logs(ip_address, created_at DESC);
```

### 2.2 Role-Based Access Control (RBAC)

```sql
-- Initial roles setup
INSERT INTO roles (name, display_name, hierarchy_level, permissions) VALUES
('agent', 'Agent', 1, '["properties.create", "properties.read_own", "properties.update_own", "bookings.create", "bookings.read_own", "communications.create"]'),
('manager', 'Manager', 2, '["properties.*", "bookings.*", "users.read", "reports.branch", "approvals.process"]'),
('vp', 'VP (Sədr müavini)', 3, '["*", "budget.approve", "users.manage"]'),
('director', 'Director', 4, '["*", "properties.archive", "system.configure"]'),
('admin', 'System Admin', 5, '["*"]');

-- Test users (password: password123)
INSERT INTO users (email, password_hash, first_name, last_name, role_id) VALUES
('admin@rea-invest.com', '$2b$10$hash_of_password123', 'Admin', 'User', (SELECT id FROM roles WHERE name = 'admin')),
('director@rea-invest.com', '$2b$10$hash_of_password123', 'Təhər', 'Məmmədov', (SELECT id FROM roles WHERE name = 'director')),
('manager@rea-invest.com', '$2b$10$hash_of_password123', 'Rəşad', 'İbrahimov', (SELECT id FROM roles WHERE name = 'manager')),
('agent@rea-invest.com', '$2b$10$hash_of_password123', 'Aygün', 'Həsənova', (SELECT id FROM roles WHERE name = 'agent'));
```

## 3. API Design Specification

### 3.1 Authentication Endpoints

```typescript
// Authentication API endpoints
POST   /api/auth/login          // User login
POST   /api/auth/logout         // User logout (invalidate token)
GET    /api/auth/me             // Get current user info
POST   /api/auth/refresh        // Refresh JWT token (future)
POST   /api/auth/forgot-password // Password reset (future)
POST   /api/auth/change-password // Change password (future)
GET    /api/auth/sessions       // List active sessions (future)
DELETE /api/auth/sessions/:id   // Revoke specific session (future)
```

### 3.2 Request/Response Schemas

```typescript
// Login request
interface LoginRequest {
  email: string;        // Email address
  password: string;     // Plain text password
  remember_me?: boolean; // Extended session (future)
}

// Login response (successful)
interface LoginResponse {
  success: true;
  data: {
    token: string;      // JWT token
    expires_in: number; // Token expiry in seconds
    user: UserProfile;  // User information
  };
}

// User profile structure
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  phone?: string;
  role: {
    name: string;        // agent, manager, vp, director, admin
    displayName: string; // Localized role name
    permissions: string[]; // Array of permission strings
    hierarchyLevel: number;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  lastLoginAt?: string;
  isActive: boolean;
}

// Error responses
interface AuthErrorResponse {
  success: false;
  error: {
    code: string;        // Error code for client handling
    message: string;     // User-friendly message in Azerbaijani
    details?: any;       // Additional error context
    timestamp: string;   // ISO timestamp
  };
}

// Common error codes
const AuthErrorCodes = {
  MISSING_CREDENTIALS: 'Email və parol tələb olunur',
  INVALID_CREDENTIALS: 'Yanlış email və ya parol',
  ACCOUNT_LOCKED: 'Hesab müvəqqəti bloklanıb',
  ACCOUNT_DISABLED: 'Hesab deaktiv edilib',
  TOO_MANY_ATTEMPTS: 'Həddindən artıq cəhd. Daha sonra cəhd edin',
  TOKEN_EXPIRED: 'Sessiya bitib. Yenidən daxil olun',
  INVALID_TOKEN: 'Yanlış token',
  ACCESS_DENIED: 'Giriş icazəsi yoxdur',
  SESSION_EXPIRED: 'Sessiya müddəti bitib'
} as const;
```

### 3.3 JWT Token Structure

```typescript
// JWT payload structure
interface JWTPayload {
  // Standard claims
  sub: string;          // User ID (subject)
  email: string;        // User email
  iat: number;          // Issued at
  exp: number;          // Expiry time
  
  // Custom claims
  role: string;         // User role name
  permissions: string[]; // User permissions array
  branch_id?: string;   // Branch ID if applicable
  session_id: string;   // Session identifier
}

// Token configuration
const TOKEN_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '8h', // 8 hours for work day
  algorithm: 'HS256' as const,
  issuer: 'rea-invest',
  audience: 'rea-invest-web'
};
```

## 4. Frontend Components Design

### 4.1 Login Form Component

```typescript
// LoginForm.tsx - Main authentication component
interface LoginFormProps {
  redirectTo?: string;        // Redirect URL after login
  onSuccess?: (user: UserProfile) => void;
  onError?: (error: AuthError) => void;
  isModal?: boolean;         // Modal vs page mode
}

const LoginForm: React.FC<LoginFormProps> = ({
  redirectTo = '/dashboard',
  onSuccess,
  onError,
  isModal = false
}) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    remember_me: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form validation with Zod
  const loginSchema = z.object({
    email: z.string()
      .email('Düzgün email daxil edin')
      .min(1, 'Email tələb olunur'),
    password: z.string()
      .min(1, 'Parol tələb olunur')
      .min(6, 'Parol ən azı 6 simvol olmalıdır'),
    remember_me: z.boolean().optional()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(formatZodErrors(validation.error));
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await authService.login(formData);
      
      // Store token and user data
      tokenService.setToken(response.data.token);
      authContext.setUser(response.data.user);
      
      // Audit log successful login
      await auditService.logEvent('LOGIN_SUCCESS', {
        user_id: response.data.user.id,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });
      
      // Call success callback
      onSuccess?.(response.data.user);
      
      // Redirect or close modal
      if (!isModal) {
        window.location.href = redirectTo;
      }
      
    } catch (error: any) {
      const authError = error.response?.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: 'Gözlənilməz xəta baş verdi'
      };
      
      setErrors({ form: authError.message });
      onError?.(authError);
      
      // Audit log failed login attempt
      await auditService.logEvent('LOGIN_FAILED', {
        email: formData.email,
        failure_reason: authError.code,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields implementation */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={clsx(
            "relative block w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            errors.email ? "border-red-500" : "border-gray-300"
          )}
          placeholder="admin@rea-invest.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Parol
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className={clsx(
              "block w-full px-3 py-2 pr-10 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
              errors.password ? "border-red-500" : "border-gray-300"
            )}
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          checked={formData.remember_me}
          onChange={(e) => setFormData(prev => ({ ...prev, remember_me: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
          Məni xatırla
        </label>
      </div>

      {/* Global form error */}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            "group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200",
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
          )}
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Yoxlanılır...
            </>
          ) : (
            <>
              <UserIcon className="w-4 h-4 mr-2" />
              Daxil ol
            </>
          )}
        </button>
      </div>
    </form>
  );
};
```

### 4.2 Authentication Context Provider

```typescript
// AuthContext.tsx - Global authentication state
interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Permissions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    try {
      const token = tokenService.getToken();
      if (!token || tokenService.isExpired(token)) {
        setIsLoading(false);
        return;
      }
      
      // Verify token with server and get fresh user data
      const response = await authService.me();
      setUser(response.data.user);
      
    } catch (error) {
      // Token invalid, clear it
      tokenService.removeToken();
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    tokenService.setToken(response.data.token);
    setUser(response.data.user);
  };
  
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenService.removeToken();
      setUser(null);
      window.location.href = '/login';
    }
  };
  
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role.permissions) return false;
    return user.role.permissions.includes('*') || user.role.permissions.includes(permission);
  };
  
  const hasRole = (role: string): boolean => {
    return user?.role.name === role;
  };
  
  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission) || hasPermission(`${resource}.*`);
  };
  
  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser: initializeAuth,
    hasPermission,
    hasRole,
    canAccess
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 4.3 Protected Route Component

```typescript
// ProtectedRoute.tsx - Route protection HOC
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackComponent: FallbackComponent = UnauthorizedPage,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push(`${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`);
    return null;
  }
  
  // Check specific permission if required
  if (requiredPermission && !user?.role.permissions.includes('*') && !user?.role.permissions.includes(requiredPermission)) {
    return <FallbackComponent />;
  }
  
  // Check specific role if required
  if (requiredRole && user?.role.name !== requiredRole) {
    return <FallbackComponent />;
  }
  
  return <>{children}</>;
};

// HOC version for wrapping page components
export function withAuth<T extends {}>(
  Component: React.ComponentType<T>,
  options?: {
    requiredPermission?: string;
    requiredRole?: string;
    redirectTo?: string;
  }
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
```

## 5. Security Implementation

### 5.1 Authentication Security Measures

```typescript
// Security configurations and middleware
const SECURITY_CONFIG = {
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // Keep simple for initial version
  },
  
  // Account lockout settings
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    resetAfterSuccess: true
  },
  
  // Token settings
  token: {
    expiresIn: '8h',
    refreshThreshold: 30 * 60 * 1000, // Refresh 30 mins before expiry
    maxSessions: 3 // Max concurrent sessions per user
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 10, // Max 10 login attempts per IP per window
    message: 'Həddindən artıq cəhd. 15 dəqiqə sonra yenidən cəhd edin.'
  }
};

// Account lockout middleware
export const checkAccountLockout = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (!email) return next();
  
  try {
    const user = await db('users').where({ email }).first();
    
    if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Hesab ${remainingTime} dəqiqə müddətinə bloklanıb`,
          lockedUntil: user.locked_until
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Account lockout check failed:', error);
    next(); // Continue on error to avoid blocking legitimate users
  }
};

// IP-based rate limiting
export const loginRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimit.windowMs,
  max: SECURITY_CONFIG.rateLimit.maxAttempts,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: SECURITY_CONFIG.rateLimit.message
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + email for more granular limiting
    return `${req.ip}_${req.body?.email || 'unknown'}`;
  }
});

// Secure token generation
export const generateSecureToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: SECURITY_CONFIG.token.expiresIn,
    issuer: 'rea-invest',
    audience: 'rea-invest-web',
    subject: payload.sub
  });
};
```

### 5.2 Audit Trail Implementation

```typescript
// Comprehensive authentication audit logging
export const auditAuthEvent = async (eventData: {
  action: string;
  user_id?: string;
  email?: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason?: string;
  additional_data?: any;
}) => {
  try {
    await db('auth_audit_logs').insert({
      id: crypto.randomUUID(),
      ...eventData,
      created_at: new Date()
    });
    
    // Real-time alerting for security events
    if (!eventData.success && shouldAlertOnFailure(eventData)) {
      await securityAlerts.send({
        type: 'AUTH_FAILURE',
        severity: getSeverityLevel(eventData),
        data: eventData
      });
    }
    
  } catch (error) {
    console.error('Failed to log auth audit event:', error);
    // Don't throw - audit logging failure shouldn't break login
  }
};

// Enhanced login endpoint with full security
router.post('/login', loginRateLimit, checkAccountLockout, async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  
  let auditData = {
    action: 'LOGIN_ATTEMPT',
    email: req.body?.email,
    ip_address: clientIP,
    user_agent: userAgent,
    success: false,
    additional_data: {
      duration_ms: 0,
      timestamp: new Date().toISOString()
    }
  };
  
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      auditData.failure_reason = 'MISSING_CREDENTIALS';
      await auditAuthEvent(auditData);
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email və parol tələb olunur'
        }
      });
    }
    
    // Find user
    const user = await db('users')
      .select([
        'users.*',
        'roles.name as role_name',
        'roles.display_name as role_display_name',
        'roles.permissions',
        'roles.hierarchy_level',
        'branches.name as branch_name',
        'branches.code as branch_code'
      ])
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('branches', 'users.branch_id', 'branches.id')
      .where('users.email', email.toLowerCase().trim())
      .where('users.is_active', true)
      .first();
    
    if (!user) {
      auditData.failure_reason = 'USER_NOT_FOUND';
      await auditAuthEvent(auditData);
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Yanlış email və ya parol'
        }
      });
    }
    
    auditData.user_id = user.id;
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await db('users')
        .where({ id: user.id })
        .increment('login_attempts', 1);
      
      // Check if account should be locked
      const updatedAttempts = user.login_attempts + 1;
      if (updatedAttempts >= SECURITY_CONFIG.lockout.maxAttempts) {
        const lockUntil = new Date(Date.now() + SECURITY_CONFIG.lockout.lockoutDuration);
        await db('users')
          .where({ id: user.id })
          .update({ locked_until: lockUntil });
        
        auditData.failure_reason = 'ACCOUNT_LOCKED_DUE_TO_ATTEMPTS';
        auditData.additional_data.locked_until = lockUntil;
      } else {
        auditData.failure_reason = 'INVALID_PASSWORD';
        auditData.additional_data.remaining_attempts = SECURITY_CONFIG.lockout.maxAttempts - updatedAttempts;
      }
      
      await auditAuthEvent(auditData);
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Yanlış email və ya parol'
        }
      });
    }
    
    // Successful authentication - reset login attempts
    await db('users')
      .where({ id: user.id })
      .update({
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date()
      });
    
    // Generate JWT token
    const sessionId = crypto.randomUUID();
    const tokenPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions || [],
      branch_id: user.branch_id,
      session_id: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + ms(SECURITY_CONFIG.token.expiresIn)) / 1000)
    };
    
    const token = generateSecureToken(tokenPayload);
    
    // Store session
    await db('user_sessions').insert({
      id: sessionId,
      user_id: user.id,
      token_hash: crypto.createHash('sha256').update(token).digest('hex'),
      ip_address: clientIP,
      user_agent: userAgent,
      expires_at: new Date(tokenPayload.exp * 1000)
    });
    
    // Success audit
    auditData.success = true;
    auditData.additional_data.duration_ms = Date.now() - startTime;
    auditData.additional_data.session_id = sessionId;
    await auditAuthEvent(auditData);
    
    // Return success response
    res.json({
      success: true,
      data: {
        token,
        expires_in: SECURITY_CONFIG.token.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fatherName: user.father_name,
          phone: user.phone,
          role: {
            name: user.role_name,
            displayName: user.role_display_name,
            permissions: user.permissions || [],
            hierarchyLevel: user.hierarchy_level
          },
          branch: user.branch_id ? {
            id: user.branch_id,
            name: user.branch_name,
            code: user.branch_code
          } : undefined,
          lastLoginAt: user.last_login_at,
          isActive: user.is_active
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    auditData.failure_reason = 'SYSTEM_ERROR';
    auditData.additional_data.error = error.message;
    auditData.additional_data.duration_ms = Date.now() - startTime;
    await auditAuthEvent(auditData);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Sistemdə xəta baş verdi. Administratorla əlaqə saxlayın'
      }
    });
  }
});
```

## 6. Performance and Optimization

### 6.1 Login Page Optimization

```typescript
// Login page performance optimizations
export default function LoginPage() {
  // Preload critical resources
  useEffect(() => {
    // Preload dashboard page for faster navigation after login
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/dashboard';
      document.head.appendChild(link);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo and branding */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-lg">
            <Image
              src="/logo-rea-invest.png"
              alt="REA INVEST"
              width={40}
              height={40}
              priority // Optimize logo loading
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,..."
            />
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            REA INVEST
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Əmlak İdarəetmə Sistemi
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enable static generation for login page
export const generateStaticParams = async () => {
  return {}; // Static page, no dynamic params
};
```

### 6.2 Token Management Optimization

```typescript
// Efficient token storage and management
export class TokenService {
  private static TOKEN_KEY = 'rea_invest_token';
  private static REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Also set in memory for faster access
      (window as any).__REA_TOKEN = token;
    }
  }
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Check memory first
    const memoryToken = (window as any).__REA_TOKEN;
    if (memoryToken) return memoryToken;
    
    // Fall back to localStorage
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      (window as any).__REA_TOKEN = token;
    }
    return token;
  }
  
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      delete (window as any).__REA_TOKEN;
    }
  }
  
  static isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
  
  static shouldRefresh(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now();
      const expiryTime = payload.exp * 1000;
      return (expiryTime - currentTime) < this.REFRESH_THRESHOLD;
    } catch {
      return false;
    }
  }
  
  static getPayload(token: string): JWTPayload | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
```

Bu comprehensive design təmin edir ki, login sistemi təhlükəsizlik, performance və user experience baxımından ən yüksək standartlarda olsun. Həmçinin, sistemin gələcək genişlənmələri üçün də əsas yaradır.