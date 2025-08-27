# Əmlak İdarəetmə Modulu - Tələblər (Requirements)

## İcmal

Bu sənəd REA INVEST əmlak idarəetmə modulunun hərtərəfli implementasiyası üçün istifadəçi hekayələri və qəbul meyarlarını EARS (Easy Approach to Requirements Syntax) formatında təsvir edir.

## Kontekst və Problemin Təsviri

**Problem**: Hazırkı sistem minimal əmlak idarəetmə funksionallığına malikdir, lakin tam funksional əmlak modulu (CRUD əməliyyatları, təsdiq axını, bron idarəsi, qiymət hesablamaları) tələb olunur.

**Biznes Konteksti**: Sistem 3 növ əmlak idarə edir:
- `agency_owned`: REA INVEST malıdır, tam təsdiq axını və büdcə tələb edir
- `branch_owned`: Filial malıdır, VP büdcə addımını keç, sadələşdirilmiş təsdiq
- `brokerage`: Üçüncü tərəf malıdır, yalnız komissiya məlumatları və owner məlumatları

## User Stories (EARS Format)

### US-01: Property CRUD Operations

#### US-01.1: Create New Property
**WHEN** an Agent logs into the system  
**AND** navigates to property creation form  
**AND** fills all required fields based on listing_type  
**THEN** the system SHALL validate inputs according to listing_type rules  
**AND** SHALL create property with status="pending"  
**AND** SHALL assign property to the creating agent

**Acceptance Criteria:**
- AC-01.1.1: agency_owned requires: buy_price_azn, expenses[], category
- AC-01.1.2: branch_owned requires: buy_price_azn, expenses[], category  
- AC-01.1.3: brokerage requires: owner_first_name, owner_last_name, owner_contact, brokerage_commission_percent
- AC-01.1.4: All types require: property_category, property_subcategory, area_m2, floor, room_count
- AC-01.1.5: Property code auto-generated with format: {category}-{subcategory}-{YYYY}-{seq}
- AC-01.1.6: Images and videos stored securely with file validation
- AC-01.1.7: Address validation with district_id, street_id, building, apt_no

#### US-01.2: List Properties with Filters
**WHEN** a user accesses properties list  
**THEN** the system SHALL display properties based on user role  
**AND** SHALL provide filtering options  
**AND** SHALL implement pagination for performance

**Acceptance Criteria:**
- AC-01.2.1: Agent sees only their own properties
- AC-01.2.2: Manager+ sees all properties in their branch/company
- AC-01.2.3: Filters: status, category, price range, area, district, listing_type
- AC-01.2.4: Pagination: 20 items per page, total count displayed
- AC-01.2.5: Search by property code, address, owner name
- AC-01.2.6: Sort by: created_date, price, area, updated_at
- AC-01.2.7: ISR caching for public listings (60s revalidation)

#### US-01.3: Property Detail View
**WHEN** a user clicks on property from list  
**THEN** the system SHALL display complete property details  
**AND** SHALL show related information based on user permissions

**Acceptance Criteria:**
- AC-01.3.1: SSR rendering for SEO and sharing
- AC-01.3.2: Property details: location, specifications, features, images
- AC-01.3.3: Price history and expense breakdown (authorized users)
- AC-01.3.4: Active booking information if exists
- AC-01.3.5: Deal history and status transitions
- AC-01.3.6: Contact information (masked for unauthorized users)
- AC-01.3.7: Action buttons based on user role and property status

#### US-01.4: Update Property Information
**WHEN** an authorized user updates property  
**AND** property status allows modifications  
**THEN** the system SHALL validate changes  
**AND** SHALL log all modifications in audit trail

**Acceptance Criteria:**
- AC-01.4.1: Only property owner or Manager+ can edit
- AC-01.4.2: pending/active properties can be edited
- AC-01.4.3: sold/archived properties read-only
- AC-01.4.4: Price changes require approval for active properties
- AC-01.4.5: Image/video updates validated and resized
- AC-01.4.6: Audit log captures before/after state
- AC-01.4.7: Version history maintained for major changes

### US-02: Property Status Management

#### US-02.1: Property Status Transitions
**WHEN** property status needs to change  
**THEN** the system SHALL validate allowed transitions  
**AND** SHALL enforce business rules  
**AND** SHALL trigger appropriate workflows

**Acceptance Criteria:**
- AC-02.1.1: Allowed transitions: pending → active → sold/archived
- AC-02.1.2: No backward transitions allowed
- AC-02.1.3: pending → active requires Manager+ approval
- AC-02.1.4: active → sold requires completed deal
- AC-02.1.5: Any status → archived allowed by Director+
- AC-02.1.6: Status change notifications to stakeholders
- AC-02.1.7: Audit trail for all status changes

#### US-02.2: Bulk Status Operations
**WHEN** Manager+ selects multiple properties  
**AND** initiates bulk status change  
**THEN** the system SHALL process each property individually  
**AND** SHALL provide detailed results

**Acceptance Criteria:**
- AC-02.2.1: Maximum 50 properties per bulk operation
- AC-02.2.2: Individual validation per property
- AC-02.2.3: Partial success handling (some fail, some succeed)
- AC-02.2.4: Progress indicator for long operations
- AC-02.2.5: Detailed success/failure report
- AC-02.2.6: Rollback capability for failed operations

### US-03: Property Search and Discovery

#### US-03.1: Advanced Search
**WHEN** user performs property search  
**THEN** the system SHALL provide comprehensive search capabilities  
**WITH** fast response times and relevant results

**Acceptance Criteria:**
- AC-03.1.1: Full-text search across property descriptions
- AC-03.1.2: Geospatial search by district, street, complex
- AC-03.1.3: Range filters: price, area, floor, year built
- AC-03.1.4: Multi-select filters: features, property_category, room_count
- AC-03.1.5: Search response time P95 < 500ms
- AC-03.1.6: Search results cached for 5 minutes
- AC-03.1.7: Search analytics and popular queries tracking

#### US-03.2: Saved Searches and Alerts
**WHEN** user creates saved search  
**THEN** the system SHALL store search criteria  
**AND** SHALL notify when matching properties added

**Acceptance Criteria:**
- AC-03.2.1: Users can save up to 10 search queries
- AC-03.2.2: Email notifications for new matches (daily digest)
- AC-03.2.3: SMS notifications for urgent matches (optional)
- AC-03.2.4: Saved search management (edit, delete, enable/disable)
- AC-03.2.5: Search alert frequency settings
- AC-03.2.6: Match quality scoring and ranking

### US-04: Property Booking System

#### US-04.1: Create Property Booking
**WHEN** customer wants to book property  
**AND** property status is "active"  
**AND** no active booking exists  
**THEN** the system SHALL create booking  
**AND** SHALL enforce uniqueness constraint

**Acceptance Criteria:**
- AC-04.1.1: Only one active booking per property
- AC-04.1.2: Booking requires customer contact information
- AC-04.1.3: Booking duration configurable (default 7 days)
- AC-04.1.4: Booking deposit amount based on property price
- AC-04.1.5: Automatic booking expiry handling
- AC-04.1.6: Idempotent booking creation (duplicate protection)
- AC-04.1.7: SMS/email confirmation to customer

#### US-04.2: Booking Management
**WHEN** booking exists for property  
**THEN** authorized users SHALL manage booking lifecycle  
**WITH** proper state transitions and notifications

**Acceptance Criteria:**
- AC-04.2.1: Booking states: ACTIVE, EXPIRED, CONVERTED, CANCELLED
- AC-04.2.2: Only Agent+ can extend booking duration
- AC-04.2.3: Convert booking to transaction (idempotent)
- AC-04.2.4: Cancel booking with reason tracking
- AC-04.2.5: Booking history and timeline view
- AC-04.2.6: Customer communication log integration
- AC-04.2.7: Booking conflict detection and resolution

### US-05: Property Financial Management

#### US-05.1: Expense Tracking
**WHEN** expenses incurred for property  
**THEN** the system SHALL record and categorize expenses  
**WITH** proper validation and approval workflow

**Acceptance Criteria:**
- AC-05.1.1: Expense categories: repair, docs, tax, agent_comm, admin, other
- AC-05.1.2: Multi-currency support (AZN, USD, EUR) with FX rates
- AC-05.1.3: Receipt upload and storage (PDF, images)
- AC-05.1.4: Expense approval workflow for amounts >1000 AZN
- AC-05.1.5: Monthly expense reports by property
- AC-05.1.6: Expense allocation to deals when property sold
- AC-05.1.7: Tax calculation and reporting integration

#### US-05.2: Price History and Analysis
**WHEN** property prices change  
**THEN** the system SHALL maintain price history  
**AND** SHALL provide market analysis insights

**Acceptance Criteria:**
- AC-05.2.1: Complete price change history with timestamps
- AC-05.2.2: Price change reasons and justifications
- AC-05.2.3: Market comparison with similar properties
- AC-05.2.4: Price trends and analytics dashboard
- AC-05.2.5: Automated price suggestions based on market data
- AC-05.2.6: ROI calculations for agency_owned properties
- AC-05.2.7: Commission calculations for brokerage properties

### US-06: Property Documentation

#### US-06.1: Document Management
**WHEN** property documents need management  
**THEN** the system SHALL provide secure document storage  
**WITH** version control and access permissions

**Acceptance Criteria:**
- AC-06.1.1: Document types: contracts, certificates, plans, photos, videos
- AC-06.1.2: File encryption and secure storage
- AC-06.1.3: Document versioning and change tracking
- AC-06.1.4: Role-based document access control
- AC-06.1.5: Document expiry tracking and alerts
- AC-06.1.6: Digital signature integration (future)
- AC-06.1.7: Document templates for common forms

#### US-06.2: Legal Compliance
**WHEN** property operations require compliance  
**THEN** the system SHALL enforce legal requirements  
**AND** SHALL maintain compliance audit trail

**Acceptance Criteria:**
- AC-06.2.1: Required documents checklist by property type
- AC-06.2.2: Compliance status dashboard
- AC-06.2.3: Legal document templates
- AC-06.2.4: Deadline tracking for legal submissions
- AC-06.2.5: Integration with government registries (future)
- AC-06.2.6: Compliance reporting for audits
- AC-06.2.7: Legal alerts and notifications

### US-07: Property Analytics and Reporting

#### US-07.1: Property Performance Metrics
**WHEN** Manager+ accesses property analytics  
**THEN** the system SHALL provide comprehensive metrics  
**WITH** real-time data and historical trends

**Acceptance Criteria:**
- AC-07.1.1: Key metrics: inventory count, avg. days on market, conversion rate
- AC-07.1.2: Property performance by type, district, price range
- AC-07.1.3: Agent performance metrics by property sales
- AC-07.1.4: Revenue and profitability analysis
- AC-07.1.5: Market trends and comparative analysis
- AC-07.1.6: Interactive charts and visualizations
- AC-07.1.7: Automated report generation and distribution

#### US-07.2: Export and Integration
**WHEN** users need to export property data  
**THEN** the system SHALL provide multiple export formats  
**WITH** data filtering and customization options

**Acceptance Criteria:**
- AC-07.2.1: Export formats: Excel, PDF, CSV, JSON
- AC-07.2.2: Custom field selection for exports
- AC-07.2.3: Filtered exports based on search criteria
- AC-07.2.4: Scheduled export automation
- AC-07.2.5: API endpoints for third-party integrations
- AC-07.2.6: Export audit trail and access logging
- AC-07.2.7: Large dataset handling (async processing)

## Edge Cases and Error Scenarios

### EC-01: Concurrent Property Modifications
**WHEN** multiple users edit same property simultaneously  
**THEN** the system SHALL handle conflicts gracefully  
**AND** SHALL maintain data integrity

### EC-02: Network Failures During Operations
**WHEN** network interruption occurs during property operations  
**THEN** the system SHALL detect failures  
**AND** SHALL provide recovery mechanisms

### EC-03: Large File Upload Handling
**WHEN** users upload large property images/videos  
**THEN** the system SHALL handle uploads efficiently  
**WITH** progress tracking and error recovery

### EC-04: Database Performance Under Load
**WHEN** system experiences high property query load  
**THEN** the system SHALL maintain response times  
**WITH** proper caching and optimization

## Business Rules and Constraints

1. **Single Active Booking Rule**: Each property can have only 1 active booking
2. **Status Transition Rules**: pending → active → sold/archived (no backwards)
3. **Role-Based Access**: Agent sees own properties, Manager+ sees all
4. **Listing Type Validation**: Different validation rules per listing_type
5. **Price Change Rules**: Price increases >10% require Manager approval
6. **Image Constraints**: Max 20 images per property, max 5MB per image
7. **Video Constraints**: Max 3 videos per property, max 100MB per video
8. **Address Validation**: Must reference valid district_id and street_id
9. **Expense Approval**: Expenses >1000 AZN require Manager+ approval
10. **Archive Rules**: Only Director+ can archive properties permanently

## Success Metrics

1. **Functional**: 100% CRUD operations work without data loss
2. **Performance**: 95% of property list loads < 1s, detail views < 2s
3. **User Experience**: Property creation completes in <2 minutes average
4. **Reliability**: 99.9% uptime for property operations
5. **Data Integrity**: 100% of property changes logged in audit trail
6. **Search Performance**: 95% of searches complete <500ms
7. **Booking Success**: 100% booking uniqueness constraint enforced
8. **File Management**: 100% uploaded files stored securely and accessible

## Dependencies

- Authentication system (JWT tokens + RBAC)
- PostgreSQL database with proper indexing
- File storage system (NAS/local encrypted storage)
- Audit logging infrastructure
- Address lookup system (districts, streets, complexes)
- Email/SMS notification system
- Image processing and optimization library
- PDF generation for reports and contracts
- Backup and disaster recovery system
- Monitoring and logging infrastructure

## API Integration Points

- `/api/properties` - Full CRUD operations
- `/api/bookings` - Booking management
- `/api/expenses` - Property expense tracking
- `/api/communications` - Customer interaction logs
- `/api/lookup` - Address and reference data
- `/api/export` - Data export functionality
- `/api/upload` - File upload handling
- `/api/search` - Advanced property search
- `/api/analytics` - Performance metrics
- `/api/audit` - Audit trail access