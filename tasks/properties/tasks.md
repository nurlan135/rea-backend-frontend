# Əmlak İdarəetmə Modulu - İcra Tapşırıqları (Implementation Tasks)

## İcmal

Bu sənəd REA INVEST əmlak idarəetmə modulunun addım-addım implementasiyası üçün detallı tapşırıqlar siyahısını təqdim edir. Hər tapşırıq prioritet, müddət və asılılıq məlumatları ilə birlikdə təsvir edilir.

## Tapşırıq Prioritet Səviyyələri

- **P0 (Kritik)**: Sistem əsas funksionallığı - dərhal icra edilməli
- **P1 (Yüksək)**: Əsas biznes tələbləri - 1-2 həftə ərzində  
- **P2 (Orta)**: Əlavə funksionallıq - 2-4 həftə ərzində
- **P3 (Aşağı)**: Optimizasiya və təkmilləşdirmə - gələcəkdə

## Faza 1: Database və API Foundation (P0) - 3-5 gün

### T-001: Database Schema Implementation
**Prioritet**: P0 | **Müddət**: 1 gün | **Asılılıq**: None

**Təsvir**: PostgreSQL verilənlər bazası sxemini yarat və konfiqurasiya et

**Addımlar**:
1. **properties table yaradılması**
   ```bash
   cd backend
   npm run make-migration create_properties_table
   ```
   - Bütün sahələri (id, property_code, category, listing_type, etc.) əlavə et
   - CHECK constraints əlavə et (listing_type validation)
   - Indexes yarat (status, category, location, agent_id)

2. **Əlaqəli cədvəllərin yaradılması**
   ```bash
   npm run make-migration create_property_related_tables
   ```
   - `property_expenses` table
   - `property_bookings` table (unique constraint ilə)
   - `property_communications` table
   - `property_search_history` table

3. **Test data seeding**
   ```bash
   npm run make-migration seed_property_test_data
   ```
   - Hər listing_type üçün nümunə properties
   - Test expenses və bookings
   - Lookup data (districts, streets, complexes)

4. **Migration icra etmək**
   ```bash
   npm run migrate
   npm run seed
   ```

**Qəbul Meyarları**:
- ✅ Bütün cədvəllər uğurla yaradılır
- ✅ Constraints düzgün işləyir (unique booking, listing_type validation)
- ✅ Indexes performans testlərindən keçir
- ✅ Test data uğurla yüklənir

### T-002: Property CRUD API Endpoints
**Prioritet**: P0 | **Müddət**: 2 gün | **Asılılıq**: T-001

**Təsvir**: Əsas CRUD əməliyyatlar üçün REST API endpoints yaradılması

**Addımlar**:
1. **Backend route faylı yaratmaq**
   ```bash
   touch backend/routes/properties.js
   ```

2. **CRUD endpoints implementasiyası**:
   - `GET /api/properties` - List with filters and pagination
   - `POST /api/properties` - Create new property
   - `GET /api/properties/:id` - Get property details
   - `PATCH /api/properties/:id` - Update property
   - `DELETE /api/properties/:id` - Soft delete

3. **Input validation əlavə etmək**:
   - Joi schemas hər endpoint üçün
   - Listing_type-a əsaslanan conditional validation
   - File upload validation

4. **Authorization middleware**:
   - Role-based access control
   - Property ownership validation (agents yalnız öz properties)
   - Permission checks hər action üçün

5. **Error handling və logging**:
   - Standardized error responses
   - Audit trail implementation
   - Performance metrics collection

**Qəbul Meyarları**:
- ✅ Bütün CRUD əməliyyatlar işləyir
- ✅ Input validation bütün edge case-ləri handle edir
- ✅ Authorization düzgün tətbiq edilir
- ✅ Error messages Azerbaijani dilində
- ✅ API documentation hazırlanır (Postman collection)

### T-003: Property Booking API
**Prioritet**: P0 | **Müddət**: 1 gün | **Asılılıq**: T-002

**Təsvir**: Property booking idarəsi üçün API endpoints

**Addımlar**:
1. **Booking routes faylı yaratmaq**:
   ```bash
   touch backend/routes/bookings.js
   ```

2. **Booking endpoints**:
   - `POST /api/properties/:id/bookings` - Create booking
   - `GET /api/bookings` - List user bookings
   - `PATCH /api/bookings/:id` - Update booking
   - `POST /api/bookings/:id/convert` - Convert to transaction
   - `POST /api/bookings/:id/cancel` - Cancel booking

3. **Business logic implementation**:
   - Unique active booking constraint enforcement
   - Automatic expiry handling
   - Idempotent conversion logic
   - Status transitions validation

4. **Notification system**:
   - Email/SMS confirmations
   - Expiry reminders
   - Status change notifications

**Qəbul Meyarları**:
- ✅ Unique booking constraint 100% işləyir
- ✅ All booking operations are idempotent
- ✅ Status transitions follow business rules
- ✅ Notifications göndərilir (simulated)

### T-004: Basic Frontend Structure
**Prioritet**: P0 | **Müddət**: 1 gün | **Asılılıq**: T-002

**Təsvir**: Next.js frontend əsas struktur və routing qurulması

**Addımlar**:
1. **Folder structure yaratmaq**:
   ```bash
   mkdir -p frontend/app/properties/{create,search,[id]/{edit,booking}}
   mkdir -p frontend/components/properties
   mkdir -p frontend/lib/api
   ```

2. **Page components yaratmaq**:
   - `app/properties/page.tsx` - Property list (ISR)
   - `app/properties/create/page.tsx` - Create form (CSR)
   - `app/properties/[id]/page.tsx` - Detail view (SSR)
   - `app/properties/[id]/edit/page.tsx` - Edit form (CSR)

3. **API client setup**:
   - `lib/api/properties.ts` - API functions
   - `lib/api/bookings.ts` - Booking API functions
   - Authentication headers integration
   - Error handling wrapper

4. **Basic UI components**:
   - PropertyCard component
   - PropertyForm skeleton
   - Loading states
   - Error boundaries

**Qəbul Meyarları**:
- ✅ Routing düzgün konfiqurasiya edilir
- ✅ API client authentication işləyir
- ✅ Basic navigation properties arasında mümkündür
- ✅ Loading və error states göstərilir

## Faza 2: Core Property Management (P1) - 5-7 gün

### T-005: Property Form Implementation
**Prioritet**: P1 | **Müddət**: 3 gün | **Asılılıq**: T-004

**Təsvir**: Tam funksional property yaratma və redaktə formu

**Addımlar**:
1. **Form schema və validation**:
   ```typescript
   // frontend/lib/schemas/property.ts
   export const propertySchema = z.object({
     property_category: z.enum(['residential', 'commercial']),
     property_subcategory: z.string().min(1),
     listing_type: z.enum(['agency_owned', 'branch_owned', 'brokerage']),
     // Conditional validation əlavə et
   });
   ```

2. **Form components yaratmaq**:
   - `PropertyBasicInfo.tsx` - Basic information section
   - `PropertyLocation.tsx` - Location picker with dropdowns
   - `AgencyPricing.tsx` - Agency/branch pricing fields
   - `BrokeragePricing.tsx` - Brokerage owner and commission
   - `PropertyFeatures.tsx` - Features and description
   - `PropertyMedia.tsx` - Image/video upload

3. **Conditional form logic**:
   - Dynamic field showing based on listing_type
   - Real-time validation feedback
   - Form state management with React Hook Form
   - Auto-save functionality (draft mode)

4. **File upload integration**:
   - Image upload with preview
   - File type and size validation
   - Progress indicators
   - Multiple file handling

**Qəbul Meyarları**:
- ✅ Form düzgün validation işləyir
- ✅ Conditional fields listing_type-a görə göstərilir
- ✅ File upload uğurla işləyir
- ✅ Form state properly managed
- ✅ User experience smooth və intuitive

### T-006: Property List and Filtering
**Prioritet**: P1 | **Müddət**: 2 gün | **Asılılıq**: T-004

**Təsvir**: Property siyahısı və filtrleme funksionallığı

**Addımlar**:
1. **Property list component**:
   - Grid və list görünüşləri
   - Pagination implementation
   - Loading skeletons
   - Empty states

2. **Filter system**:
   - Price range slider
   - Location filters (district, street)
   - Property type filters
   - Status filters (agent görə)
   - Search by property code

3. **Performance optimization**:
   - Virtual scrolling böyük siyahılar üçün
   - Debounced search input
   - Filter state URL-də saxlanılması
   - Cache strategy with SWR

4. **ISR configuration**:
   - Static generation popular filter combinations üçün
   - 60 second revalidation interval
   - Fallback handling

**Qəbul Meyarları**:
- ✅ List yükləmə müddəti P95 < 1s
- ✅ Filters real-time işləyir
- ✅ Pagination smooth işləyir
- ✅ ISR düzgün konfiqurasiya edilir
- ✅ Mobile responsive design

### T-007: Property Detail View
**Prioritet**: P1 | **Müddət**: 2 gün | **Asılılıq**: T-003, T-005

**Təsvir**: Əmlak detail səhifəsi və booking functionality

**Addımlar**:
1. **Detail page layout**:
   - Image gallery with lightbox
   - Property specifications table
   - Location map integration (future)
   - Contact information (role-based)

2. **Action buttons**:
   - Edit button (owner/manager)
   - Book property button
   - Contact agent button
   - Print/share functionality

3. **Booking integration**:
   - Booking form modal
   - Active booking display
   - Booking history (authorized users)
   - Status change tracking

4. **SSR optimization**:
   - Meta tags for SEO
   - Open Graph data
   - Structured data markup
   - Cache headers

**Qəbul Meyarları**:
- ✅ Detail page yükləmə müddəti P95 < 2s
- ✅ Booking functionality 100% işləyir
- ✅ Authorization düzgün tətbiq edilir
- ✅ SEO optimization complete
- ✅ Mobile responsive

## Faza 3: Advanced Features (P2) - 3-5 gün

### T-008: Property Search and Analytics
**Prioritet**: P2 | **Müddət**: 2 gün | **Asılılıq**: T-006

**Təsvir**: Advanced search və basic analytics

**Addımlar**:
1. **Advanced search page**:
   - Multi-criteria search form
   - Map-based search interface
   - Saved searches functionality
   - Search history

2. **Search API enhancement**:
   - Full-text search implementation
   - Geospatial queries
   - Search performance optimization
   - Search analytics tracking

3. **Basic analytics dashboard**:
   - Property count by status
   - Average days on market
   - Price trends
   - Agent performance metrics

**Qəbul Meyarları**:
- ✅ Search response müddəti P95 < 500ms
- ✅ Advanced filters işləyir
- ✅ Analytics data accurate
- ✅ Search əməliyyatları log edilir

### T-009: File Management System
**Prioritet**: P2 | **Müddət**: 2 gün | **Asılılıq**: T-005

**Təsvir**: Comprehensive file upload və management

**Addımlar**:
1. **File upload API enhancement**:
   - Chunked upload for large files
   - Image optimization pipeline
   - File type validation
   - Virus scanning integration (future)

2. **File management UI**:
   - Drag & drop interface
   - File organization (images, videos, documents)
   - Batch operations
   - File versioning

3. **Storage optimization**:
   - Image compression
   - CDN integration preparation
   - Backup strategy
   - Access logging

**Qəbul Meyarları**:
- ✅ File upload 100% reliable
- ✅ Large files (100MB+) handle edilir
- ✅ Image optimization işləyir
- ✅ File access properly secured

### T-010: Expense Tracking Integration
**Prioritet**: P2 | **Müddət**: 1 gün | **Asılılıq**: T-002

**Təsvir**: Property expenses tracking və reporting

**Addımlar**:
1. **Expense API endpoints**:
   - `POST /api/properties/:id/expenses` - Add expense
   - `GET /api/properties/:id/expenses` - List expenses
   - `PATCH /api/expenses/:id` - Update expense

2. **Expense UI components**:
   - Expense form modal
   - Expense list with categories
   - Receipt upload functionality
   - Expense summaries

3. **Business logic**:
   - Expense approval workflow
   - Multi-currency support
   - Automatic calculations
   - Report generation

**Qəbul Meyarları**:
- ✅ Expense operations fully functional
- ✅ Multi-currency calculations correct
- ✅ Reports generated accurately
- ✅ Approval workflow implemented

## Faza 4: Testing və Quality Assurance (P1) - 2-3 gün

### T-011: Unit Testing Implementation
**Prioritet**: P1 | **Müddət**: 2 gün | **Asılılıq**: T-010

**Təsvir**: Comprehensive unit testing coverage

**Addımlar**:
1. **Backend API tests**:
   ```bash
   npm install --save-dev jest supertest
   ```
   - Property CRUD operation tests
   - Booking logic tests
   - Validation schema tests
   - Authorization middleware tests

2. **Frontend component tests**:
   ```bash
   cd frontend && npm install --save-dev @testing-library/react vitest
   ```
   - Form validation tests
   - Component render tests
   - User interaction tests
   - API integration tests

3. **Database tests**:
   - Migration tests
   - Constraint enforcement tests
   - Performance tests
   - Data integrity tests

**Qəbul Meyarları**:
- ✅ Test coverage ≥80%
- ✅ Bütün critical paths covered
- ✅ CI/CD integration hazır
- ✅ Test runs automated

### T-012: End-to-End Testing
**Prioritet**: P1 | **Müddət**: 1 gün | **Asılılıq**: T-011

**Təsvir**: User journey automation tests

**Addımlar**:
1. **Playwright setup**:
   ```bash
   cd frontend && npm install --save-dev @playwright/test
   ```

2. **Critical user flows**:
   - Property creation flow (agent)
   - Property approval flow (manager)
   - Booking creation flow
   - Search and filter flow

3. **Test data management**:
   - Test database setup
   - Data cleanup strategies
   - Mock external services

**Qəbul Meyarları**:
- ✅ Bütün critical flows pass
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness verified
- ✅ Performance assertions included

## Faza 5: Production Optimization (P2-P3) - 2-3 gün

### T-013: Performance Optimization
**Prioritet**: P2 | **Müddət**: 2 gün | **Asılılıq**: T-012

**Təsvir**: Performance benchmarks və optimization

**Addımlar**:
1. **Database optimization**:
   - Query performance analysis
   - Index optimization
   - Connection pooling configuration
   - Slow query identification

2. **Frontend performance**:
   - Bundle size analysis
   - Code splitting implementation
   - Image optimization
   - Lazy loading strategies

3. **API performance**:
   - Response compression
   - Caching strategy
   - Rate limiting implementation
   - Load testing

**Qəbul Meyarları**:
- ✅ API latency P95 < 300ms
- ✅ Page load time P95 < 3s
- ✅ Bundle size optimized
- ✅ Database queries optimized

### T-014: Security Hardening
**Prioritet**: P2 | **Müddət**: 1 gün | **Asılılıq**: T-013

**Təsvir**: Security assessment və hardening

**Addımlar**:
1. **Security audit**:
   - Input validation review
   - SQL injection prevention
   - XSS protection verification
   - Authentication flow review

2. **Security enhancements**:
   - Rate limiting refinement
   - CORS policy implementation
   - Security headers configuration
   - Audit trail verification

3. **Penetration testing preparation**:
   - Security checklist completion
   - Vulnerability scanning
   - Security documentation

**Qəbul Meyarları**:
- ✅ Security scan passes
- ✅ No critical vulnerabilities
- ✅ Security headers configured
- ✅ Audit trail 100% functional

## Faza 6: Documentation və Deployment (P2) - 1-2 gün

### T-015: Documentation Completion
**Prioritet**: P2 | **Müddət**: 1 gün | **Asılılıq**: T-014

**Təsvir**: Technical və user documentation

**Addımlar**:
1. **API documentation**:
   - OpenAPI/Swagger specification
   - Example requests/responses
   - Error code documentation
   - Postman collection update

2. **User guides**:
   - Property management guide
   - Booking workflow guide
   - Search functionality guide
   - Troubleshooting guide

3. **Developer documentation**:
   - Setup instructions
   - Database schema documentation
   - Deployment procedures
   - Monitoring setup

**Qəbul Meyarları**:
- ✅ API documentation complete
- ✅ User guides Azerbaijani dilində
- ✅ Developer onboarding ready
- ✅ Troubleshooting guide comprehensive

### T-016: Production Deployment
**Prioritet**: P2 | **Müddət**: 1 gün | **Asılılıq**: T-015

**Təsvir**: Production environment hazırlığı

**Addımlar**:
1. **Environment configuration**:
   - Production environment variables
   - Database configuration
   - SSL certificate setup
   - Backup procedures

2. **Monitoring setup**:
   - Health check endpoints
   - Performance monitoring
   - Error tracking
   - Audit log monitoring

3. **Deployment verification**:
   - Smoke tests
   - Performance validation
   - Security verification
   - User acceptance testing

**Qəbul Meyarları**:
- ✅ Production environment stable
- ✅ All systems monitored
- ✅ Backup procedures verified
- ✅ User acceptance complete

## Risk Mitigation Strategies

### Yüksək Risk Sahələr

1. **Database Performance Risk**
   - **Risk**: Large property dataset performance degradation
   - **Mitigation**: Proper indexing, query optimization, pagination
   - **Monitoring**: Slow query alerts, performance metrics

2. **File Upload Risk**
   - **Risk**: Large file uploads causing server issues
   - **Mitigation**: File size limits, chunked upload, async processing
   - **Monitoring**: Upload success rate, server resource usage

3. **Concurrent Booking Risk**
   - **Risk**: Race conditions in booking creation
   - **Mitigation**: Database constraints, idempotent operations
   - **Monitoring**: Booking conflict logs, constraint violations

4. **Data Migration Risk**
   - **Risk**: Data loss during production deployment
   - **Mitigation**: Comprehensive backups, migration rollback procedures
   - **Monitoring**: Migration success verification, data integrity checks

## Success Metrics

### Technical Metrics
- API response time P95 < 300ms
- Page load time P95 < 3s
- Test coverage ≥80%
- Zero critical security vulnerabilities
- 99.9% booking uniqueness constraint enforcement

### Business Metrics
- Property creation time < 5 minutes average
- Search response time < 500ms
- File upload success rate > 99%
- User error rate < 1%
- Property approval workflow completion rate > 95%

### Quality Metrics
- Code review coverage 100%
- Documentation completeness 100%
- User acceptance test pass rate > 95%
- Performance benchmark achievement 100%
- Security audit pass rate 100%

## Final Checklist

Implementasiya tamamlanmadan əvvəl aşağıdakı checklist-i yoxlayın:

### Functionality Checklist
- [ ] Property CRUD operations fully functional
- [ ] Listing type validation working correctly
- [ ] Booking system enforcing uniqueness
- [ ] File upload and management working
- [ ] Search and filtering functional
- [ ] User role authorization implemented
- [ ] Audit trail capturing all changes
- [ ] Performance targets achieved

### Quality Checklist
- [ ] Unit tests passing with ≥80% coverage
- [ ] E2E tests covering critical flows
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User acceptance testing passed
- [ ] Production deployment verified
- [ ] Monitoring and alerts configured

### Business Checklist
- [ ] All user stories implemented
- [ ] Business rules properly enforced
- [ ] Edge cases handled gracefully
- [ ] Error messages in Azerbaijani
- [ ] User experience optimized
- [ ] Stakeholder requirements met
- [ ] Training materials prepared
- [ ] Support procedures documented

Bu implementation plan REA INVEST əmlak idarəetmə modulunun tam funksional və production-ready həllini təmin edəcəkdir.