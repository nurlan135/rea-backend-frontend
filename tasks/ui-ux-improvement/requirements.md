# UI/UX Requirements for REA INVEST System

## Based on PRD Document Analysis

### 1. Core Business Requirements

#### 1.1 User Personas (PRD §4)
- **Agent**: Property and customer portfolio management, booking creation/conversion, call/SMS logging
- **Manager**: Branch/team performance monitoring, approvals and exception handling  
- **Accountant**: XLSX exports, expense accuracy verification, audit trail access
- **Director**: Company-wide KPIs, strategic decision making
- **VP**: Budget allocation approvals
- **Call Center Operator**: Incoming call logging, customer/property linking

#### 1.2 Key Functional Areas (PRD §6)

##### Property Management
- CRUD operations with complex field requirements
- Status workflow: Pending → Active → Sold (archived)
- Categories: Sale and Rent
- Listing types: agency_owned | branch_owned | brokerage
- Image/video galleries (max 30 images, 5MB each)
- Expense tracking integration

##### Booking System (PRD §17)
- One active booking per property constraint
- Status flow: ACTIVE → EXPIRED/CONVERTED/CANCELLED
- Deposit amount tracking
- End date management
- Convert to transaction (idempotent operation)

##### Communication Center (PRD §18)
- Manual call logging (V1)
- SMS/WhatsApp integration (M2 - future)
- Call duration, notes, entity linking
- Communication journal per customer/property

##### Approval Workflow (PRD §6 FR-4)
- Multi-step approval: Agent → Manager → VP (budget) → Director → Manager (publish)
- Conditional VP step based on listing_type
- Audit trail for all approval actions

### 2. Performance Requirements (PRD §7, §11)

#### Response Time Targets
- Dashboard KPI loading: P95 ≤ 3s
- Property lists: Server-side pagination, P95 < 1s
- XLSX export: ≤ 60s (async with progress)
- API latency: P95 < 300ms, P99 < 600ms
- ISR revalidation: ≤ 5 minutes

#### Data Volume Expectations
- Properties: 1000+ active listings
- Bookings: 100+ active per month
- Communications: 500+ logs per day
- Users: 50+ concurrent agents

### 3. Rendering Strategy (PRD §15)

| Route | Strategy | Revalidate | SEO Required |
|-------|----------|------------|--------------|
| /login | CSR | - | No |
| /dashboard | CSR | - | No |
| /properties | ISR | 60s | Yes |
| /properties/[id] | SSR | - | Yes |
| /admin/** | CSR | - | No |
| /reports/kpi | ISR | 300s | Minimal |

### 4. Security & Compliance (PRD §13)

#### Access Control
- Role-based permissions (RBAC)
- IP whitelisting for admin operations
- Session management with JWT (60min + refresh)
- Optional 2FA (TOTP)

#### Audit Requirements
- 100% mutation coverage
- 5+ year retention
- Before/after state tracking
- Actor, IP, timestamp logging

### 5. Localization (PRD §7)
- Language: Azerbaijani (AZ)
- Currency: Primary AZN, secondary USD
- Date format: DD.MM.YYYY
- Phone format: +994 XX XXX XX XX

### 6. Device Support
- Desktop-first design
- Mobile responsive (tablets and phones)
- Browser support: Chrome/Edge/Firefox (last 2 versions), Safari (latest)
- Minimum viewport: 320px width

### 7. Accessibility Requirements
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratio ≥ 4.5:1
- Focus indicators on all interactive elements

### 8. Data Validation Rules (PRD §9.4)

#### Property Validation
- agency_owned: purchase_price required, expenses recommended
- branch_owned: purchase_price + min 1 expense required  
- brokerage: owner info + commission required, no purchase/expenses

#### Booking Constraints
- One active booking per property
- End date must be future date
- Deposit amount optional but trackable

#### Communication Validation
- Caller ID required
- Link to customer OR property required
- Duration ≥ 0 seconds
- Note max 1000 characters

### 9. Export Requirements (PRD §16.3)
- XLSX format (primary)
- CSV format (optional)
- Columns: Date, Branch, Agent, PropertyCode, DealType, BuyPriceAZN, SellPriceAZN, ProfitAZN, ExpenseAZN, NetProfitAZN
- Async processing with progress indicator

### 10. KPI Metrics (PRD §11)
- Booked → Sold Conversion Rate
- Average booking duration (days)
- Pre-expiry conversion percentage
- Listing aging (average days active)
- Expense-to-Profit ratio
- Lead → Booking conversion
- Missed calls count
- First Response Time (FRT)