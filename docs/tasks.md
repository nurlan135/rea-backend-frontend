# İmplementasiya Tapşırıqları (Tasks)

## V1 Mərhələsi - İcra Planı

### Epic 1: Məlumat Modeli və Migrasiyalar (EP-01)
**Müddət**: 2 həftə  
**Prioritet**: Yüksək

#### 1.1 Database Schema Setup
- [ ] PostgreSQL database yaratmaq və konfiqurasiya
- [ ] ORM seçimi və konfigurasiyası (Prisma/Knex)
- [ ] Migration sisteminin qurulması
- [ ] Base tables yaratmaq:
  - [ ] users, roles (RBAC foundation)
  - [ ] properties (əsas sahələr)
  - [ ] customers (müştəri məlumatları)
  - [ ] deals (satış/icarə)
  - [ ] bookings (bron sistemi)
  - [ ] expenses (xərclər)
  - [ ] communications (ünsiyyət)
  - [ ] audit_logs (audit trail)

#### 1.2 Database Constraints və İndekslər
- [ ] Booking unique constraint: 1 ACTIVE per property
- [ ] Property code unique constraint
- [ ] Foreign key relationships
- [ ] Performance indices:
  - [ ] properties(status) where status='active'
  - [ ] bookings(property_id, status)
  - [ ] audit_logs(created_at, entity, entity_id)
  - [ ] communications(property_id, customer_id, deal_id)

#### 1.3 Data Validation Qaydaları
- [ ] Property validation rules:
  - [ ] listing_type bazında sahə tələbləri
  - [ ] brokerage üçün owner_* sahələri məcburi
  - [ ] branch_owned üçün expenses[] tələb
- [ ] Booking validation:
  - [ ] end_date future date check
  - [ ] deposit_amount >= 0
- [ ] Customer validation:
  - [ ] phone və ya email məcburi
  - [ ] E.164 phone format validation

### Epic 2: Backend API Development (EP-02)
**Müddət**: 3 həftə  
**Prioritet**: Yüksək

#### 2.1 Core API Infrastructure
- [ ] Express.js server setup
- [ ] Middleware stack:
  - [ ] Helmet (security headers)
  - [ ] CORS konfiqurasiyası
  - [ ] Rate limiting
  - [ ] Request logging
  - [ ] Error handling middleware
- [ ] Environment konfigurasiyası (.env)
- [ ] Health check endpoints

#### 2.2 Authentication və Authorization
- [ ] JWT authentication sistemi
- [ ] RBAC middleware implementation
- [ ] Role-based route protection
- [ ] Session management
- [ ] Password hashing və validation
- [ ] 2FA setup (opsional)

#### 2.3 Properties API
- [ ] `GET /api/properties` (list with pagination, filtering)
- [ ] `POST /api/properties` (create with validation)
- [ ] `GET /api/properties/:id` (single property)
- [ ] `PATCH /api/properties/:id` (update)
- [ ] `DELETE /api/properties/:id` (soft delete)
- [ ] Image upload handling
- [ ] listing_type specific validation

#### 2.4 Bookings API
- [ ] `GET /api/bookings` (list with filters)
- [ ] `POST /api/bookings` (create with conflict check)
- [ ] `GET /api/properties/:id/bookings` (property bookings)
- [ ] `GET /api/customers/:id/bookings` (customer bookings)
- [ ] `POST /api/bookings/:id/convert-to-transaction` (idempotent)
- [ ] `POST /api/bookings/:id/cancel`
- [ ] Automatic expiry job (cron)

#### 2.5 Customers API
- [ ] `GET /api/customers` (search with query)
- [ ] `POST /api/customers` (create with duplicate check)
- [ ] `PATCH /api/customers/:id` (update)
- [ ] `GET /api/customers/:id` (profile)
- [ ] Phone/email validation
- [ ] KYC data handling

#### 2.6 Communications API
- [ ] `POST /api/communications` (manual call log)
- [ ] `GET /api/communications` (journal with filters)
- [ ] Entity linking (property/customer/deal)
- [ ] Duration və status tracking

#### 2.7 Expenses API
- [ ] `POST /api/expenses` (create with property/deal link)
- [ ] `GET /api/expenses` (list with filters)
- [ ] `PATCH /api/expenses/:id` (update)
- [ ] Category və currency validation
- [ ] FX rate handling

#### 2.8 Approval Workflow API
- [ ] `POST /api/approvals/:dealId/submit`
- [ ] `POST /api/approvals/:dealId/approve`
- [ ] `POST /api/approvals/:dealId/reject`
- [ ] `GET /api/approvals` (pending approvals)
- [ ] Step-based workflow logic
- [ ] listing_type based skip rules

#### 2.9 Export API
- [ ] `GET /api/export/accounting.xlsx` (async job)
- [ ] XLSX generation with proper formatting
- [ ] Date range və filter support
- [ ] Job status tracking
- [ ] File cleanup after download

#### 2.10 Audit Logging
- [ ] Audit middleware for all mutations
- [ ] Before/after state capture
- [ ] Actor və IP tracking
- [ ] Audit search və filter API
- [ ] Retention policy implementation

### Epic 3: Frontend UI Development (EP-03)
**Müddət**: 4 həftə  
**Prioritet**: Yüksək

#### 3.1 Project Setup və Base Structure
- [ ] Next.js 15 project konfiqurasiyası
- [ ] TypeScript strict mode
- [ ] Tailwind CSS v4 setup
- [ ] ESLint və Prettier konfiqurasiyası
- [ ] shadcn/ui komponenti library
- [ ] Folder structure: components, pages, hooks, utils

#### 3.2 Authentication Pages
- [ ] Login page (CSR)
- [ ] Logout functionality
- [ ] Password reset (basic)
- [ ] Role-based navigation
- [ ] Session timeout handling

#### 3.3 Layout və Navigation
- [ ] Responsive sidebar navigation
- [ ] Header with user menu
- [ ] Breadcrumb navigation
- [ ] Role-based menu items
- [ ] Mobile responsiveness

#### 3.4 Properties Management
- [ ] Properties list page (ISR, 60s revalidate)
- [ ] Property detail page (SSR)
- [ ] Property create/edit forms
- [ ] Image upload component
- [ ] listing_type conditional fields
- [ ] Status workflow UI
- [ ] Search və filtering

#### 3.5 Bookings Management
- [ ] Bookings list page
- [ ] Create booking modal/form
- [ ] Booking detail view
- [ ] Convert to transaction UI
- [ ] Active bookings dashboard
- [ ] Expiry notification system

#### 3.6 Customer Management
- [ ] Customer search və list
- [ ] Customer profile pages
- [ ] Customer create/edit forms
- [ ] Duplicate warning UI
- [ ] Communication history tab

#### 3.7 Communications Journal
- [ ] Communications list with filtering
- [ ] Call log creation form
- [ ] Timeline view for entities
- [ ] Search by phone/customer/property
- [ ] Status indicators

#### 3.8 Expenses Management
- [ ] Expense list və filtering
- [ ] Expense create/edit forms
- [ ] Category və currency selection
- [ ] Property/deal linkage UI
- [ ] Cost calculation display

#### 3.9 Approval Workflow UI
- [ ] Pending approvals dashboard
- [ ] Approval request forms
- [ ] Step-by-step workflow view
- [ ] Approval history
- [ ] Manager dashboard

#### 3.10 Reporting və Dashboard
- [ ] KPI dashboard (ISR, 300s revalidate)
- [ ] Charts və metrics widgets
- [ ] Export functionality UI
- [ ] Date range selectors
- [ ] Role-specific dashboards

### Epic 4: Security və Audit (EP-04)
**Müddət**: 1 həftə  
**Prioritet**: Yüksək

#### 4.1 API Security Hardening
- [ ] Rate limiting implementation
- [ ] CORS proper configuration
- [ ] Input sanitization
- [ ] SQL injection protection
- [ ] XSS protection headers
- [ ] CSRF token handling

#### 4.2 RBAC System
- [ ] Permission matrix implementation
- [ ] Role hierarchy definition
- [ ] Field-level access control
- [ ] Route protection middleware
- [ ] Frontend permission guards

#### 4.3 Audit Trail Completion
- [ ] Comprehensive audit logging
- [ ] Audit log search interface
- [ ] Export audit logs
- [ ] Retention policy
- [ ] Compliance reporting

#### 4.4 Webhook Security (M2 hazırlığı)
- [ ] HMAC signature validation
- [ ] Replay attack protection
- [ ] IP whitelisting
- [ ] Webhook retry logic
- [ ] Error handling

### Epic 5: Performance və Monitoring (EP-05)
**Müddət**: 1 həftə  
**Prioritet**: Orta

#### 5.1 Database Optimization
- [ ] Query optimization
- [ ] Index usage analysis
- [ ] Materialized views for reporting
- [ ] Connection pooling
- [ ] Slow query monitoring

#### 5.2 Caching Implementation
- [ ] Next.js ISR configuration
- [ ] API response caching
- [ ] SWR setup for client-side
- [ ] Cache invalidation strategies
- [ ] Redis setup (opsional)

#### 5.3 Monitoring Setup
- [ ] Application metrics collection
- [ ] Health check endpoints
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Log aggregation

### Epic 6: Testing və QA
**Müddət**: 2 həftə  
**Prioritet**: Orta

#### 6.1 Backend Testing
- [ ] Unit tests for core business logic
- [ ] Integration tests for API endpoints
- [ ] Database transaction tests
- [ ] Booking conflict resolution tests
- [ ] Approval workflow tests

#### 6.2 Frontend Testing
- [ ] Component unit tests
- [ ] Form validation tests
- [ ] User interaction tests
- [ ] Responsive design tests
- [ ] Cross-browser compatibility

#### 6.3 End-to-End Testing
- [ ] User journey tests:
  - [ ] Property create → expense add → booking → convert
  - [ ] Customer create → booking → communication log
  - [ ] Manager approval workflow
  - [ ] Export functionality

#### 6.4 Performance Testing
- [ ] Load testing for key endpoints
- [ ] Database performance under load
- [ ] Export generation performance
- [ ] Concurrent booking conflict handling

### Epic 7: Deployment və DevOps
**Müddət**: 1 həftə  
**Prioritet**: Orta

#### 7.1 Production Environment Setup
- [ ] Server infrastructure planning
- [ ] PostgreSQL production setup
- [ ] Nginx reverse proxy configuration
- [ ] SSL certificate setup
- [ ] Environment variables management

#### 7.2 CI/CD Pipeline
- [ ] Build pipeline setup
- [ ] Automated testing integration
- [ ] Deployment scripts
- [ ] Database migration scripts
- [ ] Rollback procedures

#### 7.3 Backup və Recovery
- [ ] Database backup scripts
- [ ] Media files backup
- [ ] Recovery testing
- [ ] Disaster recovery plan
- [ ] Monitoring scripts

## Milestone və Deliverables

### Milestone 1: MVP Core (6 həftə)
- [ ] Basic CRUD for Properties, Customers, Bookings
- [ ] Authentication və basic RBAC
- [ ] Booking conflict prevention
- [ ] Basic audit logging

### Milestone 2: Business Logic (8 həftə)
- [ ] Approval workflow complete
- [ ] Expenses management
- [ ] Communications journal
- [ ] listing_type validations
- [ ] Export functionality

### Milestone 3: Production Ready (10 həftə)
- [ ] Security hardening complete
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Production deployment
- [ ] User training materials

## Risk Mitigation Tasks

### Yüksək Prioritet
- [ ] Booking double-convert protection testing
- [ ] Database performance under concurrent load
- [ ] Audit log retention və compliance testing
- [ ] Security penetration testing

### Orta Prioritet
- [ ] Browser compatibility testing
- [ ] Mobile responsive design validation
- [ ] Export performance optimization
- [ ] Backup və recovery testing

## Dependencies və Blockers

### External Dependencies
- [ ] ORM library selection (Prisma vs Knex)
- [ ] Server infrastructure provision
- [ ] SSL certificate procurement
- [ ] Production database setup

### Team Dependencies
- [ ] UI/UX design approval
- [ ] Business rules clarification
- [ ] User acceptance testing
- [ ] Training material creation

## Success Criteria

### Technical Success
- [ ] All API endpoints response time P95 < 300ms
- [ ] Booking conflict rate = 0%
- [ ] Export generation ≤ 60s for typical datasets
- [ ] 100% audit coverage for mutations
- [ ] Zero data loss during booking conversion

### Business Success
- [ ] User training completed successfully
- [ ] Management reporting reduction by 80%
- [ ] Excel dependency eliminated
- [ ] Real-time visibility into operations
- [ ] Compliance requirements met

## Next Steps (Post V1)

### M2 Preparation Tasks
- [ ] SMS provider integration research
- [ ] WhatsApp Business API setup
- [ ] Webhook infrastructure enhancement
- [ ] Advanced reporting features
- [ ] Mobile application planning