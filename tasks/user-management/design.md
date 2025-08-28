# İstifadəçi İdarəetmə Sistemi - Texniki Dizayn

## İcmal

Bu sənəd REA INVEST sistemində Admin Panel üçün İstifadəçi İdarəetmə modulunun detallı texniki dizaynını təsvir edir. Sistem mövcud RBAC arxitekturasına inteqrasiya olunacaq və tam təhlükəsiz istifadəçi idarəetməsi təqdim edəcək.

## 1. System Architecture Overview

### 1.1 Module Integration
```
REA INVEST System
├── Authentication Layer (Existing)
│   ├── JWT Token Management
│   ├── RBAC Middleware
│   └── Audit Logging
├── Admin Panel (New)
│   ├── Dashboard
│   ├── User Management ← NEW MODULE
│   ├── Property Management
│   └── Reports
└── Database Layer
    ├── users table (Enhanced)
    ├── audit_logs table
    └── RBAC system
```

### 1.2 Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI Components**: shadcn/ui + Radix primitives
- **State Management**: React Context + SWR
- **Forms**: React Hook Form + Zod validation
- **Backend**: Node.js + Express.js + Knex.js
- **Database**: PostgreSQL with JSONB permissions
- **Security**: JWT + bcrypt + RBAC middleware

## 2. Database Design

### 2.1 Users Table Enhancement
```sql
-- Existing users table structure
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role role_enum NOT NULL, -- admin, director, vp, manager, agent
    branch_code VARCHAR(10),
    permissions JSONB DEFAULT '[]',
    status user_status_enum DEFAULT 'active', -- active, inactive, suspended
    last_login_at TIMESTAMP,
    last_password_change TIMESTAMP, -- NEW
    login_attempts INTEGER DEFAULT 0, -- NEW
    locked_until TIMESTAMP, -- NEW
    force_password_change BOOLEAN DEFAULT FALSE, -- NEW
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_branch ON users(branch_code);
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;
```

### 2.2 Permission Matrix
```typescript
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  director: [
    'properties:*',
    'users:*',
    'deals:*',
    'reports:*',
    'settings:read',
    'settings:update',
    'audit:read',
    'system:configure'
  ],
  vp: [
    'properties:*',
    'budget:approve',
    'properties:archive',
    'reports:*',
    'users:read',
    'cross-branch:access'
  ],
  manager: [
    'properties:*',
    'users:read',
    'users:create:agent',
    'approvals:process',
    'reports:branch',
    'customers:*'
  ],
  agent: [
    'properties:read:own',
    'properties:create',
    'bookings:create',
    'customers:*',
    'communications:own'
  ]
};
```

### 2.3 Audit Log Enhancement
```sql
-- Enhanced audit_logs for user management
INSERT INTO audit_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    before_state,
    after_state,
    metadata,
    ip_address,
    user_agent,
    created_at
) VALUES (
    $1, -- admin user id
    'user',
    $2, -- target user id
    $3, -- CREATE | UPDATE | DELETE | RESET_PASSWORD | UNLOCK
    $4, -- JSON before state
    $5, -- JSON after state
    $6, -- JSON metadata (reason, bulk_operation_id, etc.)
    $7, -- IP address
    $8, -- User agent
    CURRENT_TIMESTAMP
);
```

## 3. Backend API Design

### 3.1 Route Structure
```
/api/admin/users/
├── GET / (list with pagination & filters)
├── GET /:id (user details)
├── POST / (create user)
├── PATCH /:id (update user)
├── DELETE /:id (soft delete)
├── POST /:id/reset-password
├── POST /:id/unlock
├── POST /bulk (bulk operations)
└── GET /permissions (available permissions)
```

### 3.2 Core API Implementation

#### 3.2.1 Users List Endpoint
```javascript
// backend/routes/admin/users.js
const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/audit');
const router = express.Router();

router.get('/', 
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        status = '',
        branch_code = '',
        sort = 'created_at',
        order = 'desc'
      } = req.query;

      let query = knex('users')
        .select([
          'id', 'email', 'first_name', 'last_name', 'phone', 
          'role', 'branch_code', 'status', 'last_login_at', 
          'created_at', 'login_attempts', 'locked_until'
        ])
        .where('id', '!=', req.user.id); // Don't show self

      // Search
      if (search) {
        query = query.where(function() {
          this.whereRaw('LOWER(first_name || \' \' || last_name) LIKE ?', [`%${search.toLowerCase()}%`])
              .orWhereRaw('LOWER(email) LIKE ?', [`%${search.toLowerCase()}%`]);
        });
      }

      // Filters
      if (role) query = query.where('role', role);
      if (status) query = query.where('status', status);
      if (branch_code) query = query.where('branch_code', branch_code);

      // Pagination
      const offset = (page - 1) * limit;
      const totalQuery = query.clone();
      const total = await totalQuery.count('* as count').first();

      // Sorting
      const validSortFields = ['first_name', 'last_name', 'email', 'role', 'status', 'created_at', 'last_login_at'];
      const sortField = validSortFields.includes(sort) ? sort : 'created_at';
      const sortOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

      const users = await query
        .orderBy(sortField, sortOrder)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total: parseInt(total.count),
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total.count / limit)
          },
          filters: { search, role, status, branch_code, sort, order }
        }
      });

    } catch (error) {
      console.error('Users list error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Server xətası baş verdi' }
      });
    }
  }
);
```

#### 3.2.2 Create User Endpoint
```javascript
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  auditLog('user', 'CREATE'),
  async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        role,
        branch_code,
        custom_permissions = []
      } = req.body;

      // Validation
      const createUserSchema = z.object({
        first_name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
        last_name: z.string().min(2, 'Soyad ən az 2 simvol olmalıdır'),
        email: z.string().email('Düzgün email daxil edin'),
        phone: z.string().optional(),
        role: z.enum(['admin', 'director', 'vp', 'manager', 'agent']),
        branch_code: z.string().optional(),
        custom_permissions: z.array(z.string()).optional()
      });

      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Form məlumatları düzgün deyil',
            details: validation.error.issues
          }
        });
      }

      // Check email uniqueness
      const existingUser = await knex('users').where('email', email).first();
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Bu email artıq istifadə olunur' }
        });
      }

      // Generate temporary password
      const tempPassword = generateSecurePassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Calculate permissions based on role
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      const finalPermissions = [...rolePermissions, ...custom_permissions];

      // Branch validation for manager/agent
      if (['manager', 'agent'].includes(role) && !branch_code) {
        return res.status(400).json({
          success: false,
          error: { code: 'BRANCH_REQUIRED', message: 'Bu rol üçün filial seçimi məcburidir' }
        });
      }

      const newUser = await knex('users')
        .insert({
          email,
          first_name,
          last_name,
          phone: phone || null,
          role,
          branch_code: branch_code || null,
          permissions: JSON.stringify(finalPermissions),
          password_hash: passwordHash,
          force_password_change: true,
          status: 'active'
        })
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'branch_code', 'created_at']);

      // Send temporary password (in real app, would send email)
      res.status(201).json({
        success: true,
        data: {
          user: newUser[0],
          temporary_password: tempPassword // In production, this would be emailed
        },
        message: 'İstifadəçi uğurla yaradıldı'
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'İstifadəçi yaradılarkən xəta baş verdi' }
      });
    }
  }
);
```

#### 3.2.3 Update User Endpoint
```javascript
router.patch('/:id',
  authenticateToken,
  requireRole(['admin']),
  auditLog('user', 'UPDATE'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent self-modification restrictions
      if (id === req.user.id) {
        const restrictedFields = ['role', 'status', 'permissions'];
        const hasRestrictedUpdate = restrictedFields.some(field => field in updates);
        
        if (hasRestrictedUpdate) {
          return res.status(403).json({
            success: false,
            error: { code: 'SELF_MODIFICATION_DENIED', message: 'Öz rol və statusunuzu dəyişə bilməzsiniz' }
          });
        }
      }

      // Get current user for audit
      const currentUser = await knex('users').where('id', id).first();
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'İstifadəçi tapılmadı' }
        });
      }

      // Email uniqueness check
      if (updates.email && updates.email !== currentUser.email) {
        const emailExists = await knex('users')
          .where('email', updates.email)
          .where('id', '!=', id)
          .first();
          
        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: { code: 'EMAIL_EXISTS', message: 'Bu email artıq istifadə olunur' }
          });
        }
      }

      // Recalculate permissions if role changed
      if (updates.role && updates.role !== currentUser.role) {
        const rolePermissions = ROLE_PERMISSIONS[updates.role] || [];
        const customPermissions = updates.custom_permissions || [];
        updates.permissions = JSON.stringify([...rolePermissions, ...customPermissions]);
      }

      // Update user
      const updatedUser = await knex('users')
        .where('id', id)
        .update({
          ...updates,
          updated_at: knex.fn.now()
        })
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'branch_code', 'status']);

      res.json({
        success: true,
        data: { user: updatedUser[0] },
        message: 'İstifadəçi məlumatları yeniləndi'
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'İstifadəçi yenilənərkən xəta baş verdi' }
      });
    }
  }
);
```

### 3.3 Helper Functions
```javascript
// backend/lib/user-management.js

function generateSecurePassword(length = 12) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const all = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

function calculatePermissions(role, customPermissions = []) {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  
  // Admin gets everything
  if (role === 'admin') {
    return ['*'];
  }
  
  // Merge and deduplicate
  return [...new Set([...rolePermissions, ...customPermissions])];
}

function validateBranchAssignment(role, branchCode) {
  const branchRequiredRoles = ['manager', 'agent'];
  
  if (branchRequiredRoles.includes(role) && !branchCode) {
    throw new Error('BRANCH_REQUIRED');
  }
  
  return true;
}
```

## 4. Frontend Component Architecture

### 4.1 Page Structure
```
app/admin/users/
├── page.tsx                    # Main users list page
├── new/
│   └── page.tsx               # Create user page
├── [id]/
│   └── page.tsx               # User detail/edit page
└── layout.tsx                 # Admin users layout

components/admin/users/
├── UsersList.tsx              # Data table component
├── UserForm.tsx               # Create/edit form
├── UserPermissions.tsx        # Permissions editor
├── UserFilters.tsx            # Filter controls
├── UserActions.tsx            # Action buttons
├── UserStatus.tsx             # Status management
└── BulkActions.tsx            # Bulk operations
```

### 4.2 Core Components Implementation

#### 4.2.1 Users List Component
```typescript
// components/admin/users/UsersList.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  branch_code?: string;
  last_login_at?: string;
  login_attempts: number;
  locked_until?: string;
  created_at: string;
}

interface UsersListProps {
  users: User[];
  pagination: PaginationInfo;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function UsersList({ users, pagination, filters, onFiltersChange }: UsersListProps) {
  const router = useRouter();
  
  const columns = [
    {
      accessorKey: 'name',
      header: 'Ad Soyad',
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }: any) => {
        const role = row.getValue('role');
        return <RoleBadge role={role} />;
      }
    },
    {
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }: any) => {
        const user = row.original;
        return <UserStatusBadge user={user} />;
      }
    },
    {
      accessorKey: 'branch_code',
      header: 'Filial',
      cell: ({ row }: any) => {
        const branchCode = row.getValue('branch_code');
        return branchCode ? (
          <Badge variant="outline">{branchCode}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      }
    },
    {
      accessorKey: 'last_login_at',
      header: 'Son Giriş',
      cell: ({ row }: any) => {
        const lastLogin = row.getValue('last_login_at');
        return lastLogin ? (
          <span className="text-sm">
            {formatDistanceToNow(new Date(lastLogin), { 
              addSuffix: true,
              locale: az 
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">Heç vaxt</span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Əməliyyatlar',
      cell: ({ row }: any) => {
        const user = row.original;
        return <UserActions user={user} />;
      }
    }
  ];

  return (
    <div className="space-y-4">
      <UserFilters 
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
      
      <DataTable
        columns={columns}
        data={users}
        pagination={pagination}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    director: 'bg-purple-100 text-purple-800',
    vp: 'bg-blue-100 text-blue-800',
    manager: 'bg-green-100 text-green-800',
    agent: 'bg-gray-100 text-gray-800'
  };

  const roleLabels = {
    admin: 'Administrator',
    director: 'Direktor',
    vp: 'Sədr Müavini',
    manager: 'Menecer',
    agent: 'Agent'
  };

  return (
    <Badge className={roleColors[role]}>
      {roleLabels[role]}
    </Badge>
  );
}

function UserStatusBadge({ user }: { user: User }) {
  const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
  
  if (isLocked) {
    return (
      <Badge variant="destructive">
        🔒 Kilitlənib
      </Badge>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    active: 'Aktiv',
    inactive: 'Qeyri-aktiv',
    suspended: 'Dayandırılıb'
  };

  return (
    <Badge className={statusColors[user.status]}>
      {statusLabels[user.status]}
    </Badge>
  );
}
```

#### 4.2.2 User Form Component
```typescript
// components/admin/users/UserForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPermissions } from './UserPermissions';

const userFormSchema = z.object({
  first_name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
  last_name: z.string().min(2, 'Soyad ən az 2 simvol olmalıdır'),
  email: z.string().email('Düzgün email daxil edin'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'director', 'vp', 'manager', 'agent']),
  branch_code: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  custom_permissions: z.array(z.string()).optional()
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  mode: 'create' | 'edit';
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, mode, onSubmit, onCancel, isLoading }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'agent',
      branch_code: user?.branch_code || '',
      status: user?.status || 'active',
      custom_permissions: user?.custom_permissions || []
    }
  });

  const selectedRole = form.watch('role');
  const requiresBranch = ['manager', 'agent'].includes(selectedRole);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad *</FormLabel>
                <FormControl>
                  <Input placeholder="İstifadəçinin adı" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soyad *</FormLabel>
                <FormControl>
                  <Input placeholder="İstifadəçinin soyadı" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="user@rea-invest.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="+994501234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Role and Organization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="manager">Menecer</SelectItem>
                    <SelectItem value="vp">Sədr Müavini</SelectItem>
                    <SelectItem value="director">Direktor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {requiresBranch && (
            <FormField
              control={form.control}
              name="branch_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filial *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Filial seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HQ">Mərkəzi Ofis</SelectItem>
                      <SelectItem value="YAS">Yasamal</SelectItem>
                      <SelectItem value="NSM">Nəsimi</SelectItem>
                      <SelectItem value="SBY">Sabayil</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === 'edit' && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Qeyri-aktiv</SelectItem>
                      <SelectItem value="suspended">Dayandırılıb</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Permissions */}
        <FormField
          control={form.control}
          name="custom_permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İcazələr</FormLabel>
              <FormControl>
                <UserPermissions
                  role={selectedRole}
                  customPermissions={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Ləğv et
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saxlanılır...' : mode === 'create' ? 'Yarat' : 'Yenilə'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 4.3 State Management Architecture

#### 4.3.1 Users Context
```typescript
// lib/context/UsersContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import { useSWR, mutate } from 'swr';
import { useToast } from '@/hooks/use-toast';

interface UsersContextValue {
  users: User[];
  pagination: PaginationInfo;
  filters: FilterState;
  isLoading: boolean;
  error: any;
  
  // Actions
  createUser: (userData: CreateUserData) => Promise<void>;
  updateUser: (id: string, userData: UpdateUserData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string) => Promise<string>;
  unlockUser: (id: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  refreshUsers: () => void;
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    status: '',
    branch_code: '',
    sort: 'created_at',
    order: 'desc'
  });

  const { toast } = useToast();

  // Build query string from filters
  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([_, value]) => value)
  ).toString();

  const { data, error, isLoading } = useSWR(
    `/api/admin/users?${queryString}`,
    fetcher
  );

  const createUser = async (userData: CreateUserData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Refresh the users list
      mutate(`/api/admin/users?${queryString}`);

      toast({
        title: 'Uğur!',
        description: 'İstifadəçi uğurla yaradıldı',
        variant: 'success'
      });

      return result.data;
    } catch (error) {
      toast({
        title: 'Xəta!',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateUser = async (id: string, userData: UpdateUserData) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error.message);
      }

      mutate(`/api/admin/users?${queryString}`);

      toast({
        title: 'Uğur!',
        description: 'İstifadəçi məlumatları yeniləndi',
        variant: 'success'
      });

      return result.data;
    } catch (error) {
      toast({
        title: 'Xəta!',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const resetPassword = async (id: string): Promise<string> => {
    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error.message);
      }

      toast({
        title: 'Uğur!',
        description: 'Password sıfırlandı',
        variant: 'success'
      });

      return result.data.temporary_password;
    } catch (error) {
      toast({
        title: 'Xəta!',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const value: UsersContextValue = {
    users: data?.data?.users || [],
    pagination: data?.data?.pagination || {},
    filters,
    isLoading,
    error,
    
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    unlockUser,
    setFilters,
    refreshUsers: () => mutate(`/api/admin/users?${queryString}`)
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
}

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within UsersProvider');
  }
  return context;
};
```

## 5. Security Implementation

### 5.1 Backend Security Measures
```javascript
// middleware/admin-security.js
const rateLimit = require('express-rate-limit');
const ipWhitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

// Admin-specific rate limiting
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Çox sayda sorğu göndərildi' }
  },
  skip: (req) => {
    // Skip rate limiting for whitelisted IPs
    return ipWhitelist.includes(req.ip);
  }
});

// IP Whitelist middleware for admin operations
const requireWhitelistIP = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!ipWhitelist.includes(req.ip)) {
    return res.status(403).json({
      success: false,
      error: { code: 'IP_NOT_ALLOWED', message: 'Bu IP ünvanından giriş icazə verilmir' }
    });
  }

  next();
};

// Enhanced audit logging for user management
const auditUserAction = (action) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request data
    const auditData = {
      actor_id: req.user?.id,
      action,
      entity_type: 'user',
      entity_id: req.params.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_data: req.body,
      before_state: null
    };

    // Get before state for updates
    if (['UPDATE', 'DELETE', 'RESET_PASSWORD'].includes(action) && req.params.id) {
      try {
        const beforeState = await knex('users')
          .select(['id', 'email', 'first_name', 'last_name', 'role', 'status', 'permissions'])
          .where('id', req.params.id)
          .first();
        auditData.before_state = beforeState;
      } catch (error) {
        console.error('Error getting before state:', error);
      }
    }

    // Override response methods to capture response
    res.send = function(data) {
      auditData.response_data = data;
      auditData.status_code = res.statusCode;
      
      // Write audit log
      writeAuditLog(auditData);
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      auditData.response_data = data;
      auditData.status_code = res.statusCode;
      
      // Write audit log
      writeAuditLog(auditData);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

async function writeAuditLog(auditData) {
  try {
    await knex('audit_logs').insert({
      actor_id: auditData.actor_id,
      entity_type: auditData.entity_type,
      entity_id: auditData.entity_id,
      action: auditData.action,
      before_state: auditData.before_state ? JSON.stringify(auditData.before_state) : null,
      after_state: auditData.response_data ? JSON.stringify(auditData.response_data) : null,
      metadata: JSON.stringify({
        status_code: auditData.status_code,
        request_data: auditData.request_data
      }),
      ip_address: auditData.ip_address,
      user_agent: auditData.user_agent,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}

module.exports = {
  adminRateLimit,
  requireWhitelistIP,
  auditUserAction
};
```

### 5.2 Frontend Security Implementation
```typescript
// lib/auth/AdminGuard.tsx
'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AdminGuard({ children, requiredPermission = 'users:manage' }: AdminGuardProps) {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin' || !hasPermission(requiredPermission)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, hasPermission, requiredPermission, router]);

  if (!isAuthenticated || user?.role !== 'admin' || !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Yoxlanılır...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## 6. Testing Strategy

### 6.1 Backend API Tests
```javascript
// tests/admin/users.test.js
const request = require('supertest');
const app = require('../../app');
const knex = require('../../db');

describe('Admin Users API', () => {
  let adminToken;
  let testUserId;

  beforeAll(async () => {
    // Login as admin to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@rea-invest.com',
        password: 'password123'
      });
    
    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await knex('users').where('id', testUserId).del();
    }
    await knex.destroy();
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users list', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=agent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('agent');
      });
    });

    it('should require admin role', async () => {
      // Create a non-admin token
      const agentLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent@rea-invest.com',
          password: 'password123'
        });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${agentLogin.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create new user successfully', async () => {
      const userData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@rea-invest.com',
        role: 'agent',
        branch_code: 'YAS'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('temporary_password');
      
      testUserId = response.body.data.user.id;
    });

    it('should reject duplicate email', async () => {
      const userData = {
        first_name: 'Duplicate',
        last_name: 'User',
        email: 'admin@rea-invest.com', // Existing email
        role: 'agent'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should validate required fields', async () => {
      const userData = {
        // Missing required fields
        email: 'invalid-user@test.com'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it('should update user successfully', async () => {
      // First create a test user
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          first_name: 'Update',
          last_name: 'Test',
          email: 'update-test@rea-invest.com',
          role: 'agent',
          branch_code: 'YAS'
        });

      const userId = createResponse.body.data.user.id;

      // Update the user
      const updateData = {
        first_name: 'Updated',
        role: 'manager'
      };

      const response = await request(app)
        .patch(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.first_name).toBe('Updated');
      expect(response.body.data.user.role).toBe('manager');

      // Cleanup
      await knex('users').where('id', userId).del();
    });

    it('should prevent self-role modification', async () => {
      // Get admin user ID
      const adminUser = await knex('users').where('email', 'admin@rea-invest.com').first();

      const response = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'agent' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SELF_MODIFICATION_DENIED');
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('should reset password and return temporary password', async () => {
      // Use existing test user
      if (!testUserId) return;

      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('temporary_password');
      expect(response.body.data.temporary_password).toHaveLength(12);
    });
  });
});
```

### 6.2 Frontend Component Tests
```typescript
// __tests__/components/admin/UserForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserForm } from '@/components/admin/users/UserForm';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('UserForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders create form correctly', () => {
    render(
      <UserForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Ad \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Soyad \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rol \*/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yarat/ })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <UserForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Yarat/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Ad ən az 2 simvol olmalıdır/)).toBeInTheDocument();
      expect(screen.getByText(/Soyad ən az 2 simvol olmalıdır/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows branch field for manager/agent roles', async () => {
    render(
      <UserForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const roleSelect = screen.getByRole('combobox');
    fireEvent.click(roleSelect);

    const managerOption = screen.getByRole('option', { name: /Menecer/ });
    fireEvent.click(managerOption);

    await waitFor(() => {
      expect(screen.getByLabelText(/Filial \*/)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(
      <UserForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Ad \*/), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/Soyad \*/), {
      target: { value: 'User' }
    });
    fireEvent.change(screen.getByLabelText(/Email \*/), {
      target: { value: 'test@rea-invest.com' }
    });

    const submitButton = screen.getByRole('button', { name: /Yarat/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Test',
          last_name: 'User',
          email: 'test@rea-invest.com'
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <UserForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Ləğv et/ });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
```

## 7. Performance Optimizations

### 7.1 Database Optimizations
```sql
-- Performance indexes for user management
CREATE INDEX CONCURRENTLY idx_users_search 
ON users USING GIN ((first_name || ' ' || last_name || ' ' || email) gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_users_compound 
ON users (status, role, branch_code) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_users_last_login 
ON users (last_login_at DESC NULLS LAST) 
WHERE status = 'active';

-- Partial index for locked accounts
CREATE INDEX CONCURRENTLY idx_users_locked 
ON users (locked_until) 
WHERE locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP;

-- Materialized view for user statistics (optional)
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    role,
    status,
    branch_code,
    COUNT(*) as count,
    COUNT(CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days
FROM users 
WHERE status != 'deleted'
GROUP BY role, status, branch_code;

CREATE UNIQUE INDEX idx_user_stats_unique ON user_stats (role, status, COALESCE(branch_code, ''));

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Frontend Performance
```typescript
// lib/hooks/useVirtualizedUsers.ts - Virtualization for large lists
import { useMemo } from 'react';
import { FixedSizeList } from 'react-window';

export function useVirtualizedUsers(users: User[], containerHeight: number) {
  const itemHeight = 72; // Height of each user row
  const itemCount = users.length;

  const VirtualUserList = useMemo(() => {
    const UserRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const user = users[index];
      
      return (
        <div style={style} className="flex items-center p-4 border-b">
          {/* User row content */}
        </div>
      );
    };

    return ({ height }: { height: number }) => (
      <FixedSizeList
        height={height}
        itemCount={itemCount}
        itemSize={itemHeight}
        overscanCount={5}
      >
        {UserRow}
      </FixedSizeList>
    );
  }, [users, itemCount, itemHeight]);

  return {
    VirtualUserList,
    totalHeight: itemCount * itemHeight,
    isVirtualizationNeeded: itemCount > 50
  };
}

// components/admin/users/OptimizedUsersList.tsx
import { memo, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

const OptimizedUsersList = memo(({ users, onFiltersChange }: UsersListProps) => {
  // Debounced search to reduce API calls
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      onFiltersChange(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 300),
    [onFiltersChange]
  );

  // Memoized filter options
  const filterOptions = useMemo(() => {
    const roles = [...new Set(users.map(u => u.role))];
    const branches = [...new Set(users.map(u => u.branch_code).filter(Boolean))];
    
    return { roles, branches };
  }, [users]);

  // Virtualization for large lists
  const { VirtualUserList, isVirtualizationNeeded } = useVirtualizedUsers(
    users, 
    600 // Container height
  );

  return (
    <div className="space-y-4">
      <UserFilters 
        onSearch={debouncedSearch}
        filterOptions={filterOptions}
      />
      
      {isVirtualizationNeeded ? (
        <VirtualUserList height={600} />
      ) : (
        <RegularUsersList users={users} />
      )}
    </div>
  );
});

OptimizedUsersList.displayName = 'OptimizedUsersList';
```

## 8. Integration Points

### 8.1 AuthContext Integration
```typescript
// Update AuthContext to handle user management changes
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing auth logic

  const refreshUserPermissions = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data.user);
        
        // Check if current user was modified by admin
        const currentUrl = window.location.pathname;
        if (currentUrl.startsWith('/admin/users') && result.data.user.role !== 'admin') {
          // Redirect non-admin users away from user management
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Failed to refresh user permissions:', error);
    }
  }, [user, token]);

  // Listen for user management changes
  useEffect(() => {
    if (!user) return;

    // Subscribe to user updates via WebSocket or polling
    const interval = setInterval(refreshUserPermissions, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, refreshUserPermissions]);

  // ... rest of AuthProvider
}
```

### 8.2 Audit Log Integration
```typescript
// components/admin/users/UserAuditLog.tsx
export function UserAuditLog({ userId }: { userId: string }) {
  const { data: auditLogs, isLoading } = useSWR(
    `/api/audit-logs?entity_type=user&entity_id=${userId}`,
    fetcher
  );

  if (isLoading) {
    return <div>Audit log yüklənir...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">İstifadəçi Tarixçəsi</h3>
      
      <div className="space-y-2">
        {auditLogs?.data?.map((log: AuditLog) => (
          <div key={log.id} className="p-3 border rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium">{getActionLabel(log.action)}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {log.actor_name} tərəfindən
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { 
                  addSuffix: true, 
                  locale: az 
                })}
              </span>
            </div>
            
            {log.before_state && log.after_state && (
              <AuditDiff 
                before={log.before_state} 
                after={log.after_state} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Bu dizayn REA INVEST sistemi üçün tam funksional, təhlükəsiz və performanslı İstifadəçi İdarəetmə modulunu təmin edəcək.