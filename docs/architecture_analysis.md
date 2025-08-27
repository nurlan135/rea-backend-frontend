# REA INVEST Sistem Arxitektura Analizi

## İcmal

Bu sənəd REA INVEST Hesabat və Əmlak İdarəetmə Sisteminin PRD əsasında texniki arxitekturasının detallı analizini təqdim edir. Sistem on-premises mühitdə yerləşdiriləcək və orta ölçülü daşınmaz əmlak agentliklərinin ehtiyaclarını qarşılayacaq.

## 1. Sistem Arxitekturası

### 1.1 Texnologiya Stack-i

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 
- **Component Library**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **Form Management**: React Hook Form + Zod validation
- **Data Fetching**: SWR/React Query

#### Backend  
- **Runtime**: Node.js + Express.js
- **API Type**: REST API
- **Security**: Helmet, CORS, rate limiting
- **Authentication**: JWT tokens + bcrypt
- **ORM**: Knex.js
- **Process Manager**: PM2/systemd

#### Database
- **Primary DB**: PostgreSQL (on-premises)
- **Backup**: Daily full + hourly differential
- **Migration**: Knex migrations
- **Indexes**: B-tree və GIN indexes

#### Infrastructure
- **Reverse Proxy**: Nginx
- **Storage**: NAS/Local encrypted storage
- **Monitoring**: Prometheus + Grafana (optional)
- **Logging**: Loki/ELK (optional)

### 1.2 Deployment Topologiyası

```
[Internet] 
    ↓
[Firewall + VPN]
    ↓
[Nginx Reverse Proxy]
    ↓
    ├── [Next.js SSR/ISR] :3000
    └── [Express API] :8000
         ↓
    [PostgreSQL] :5432
         ↓
    [NAS Storage]
```

## 2. Data Modeli Analizi

### 2.1 Əsas Entitilər və Əlaqələr

#### Core Entities
1. **Property** (Əmlaklar)
   - Əsas entity - bütün əmlak məlumatları
   - Relations: 1-N Deal, 1-N Booking, 1-N Expense, 1-N Communication
   - Listing types: agency_owned | branch_owned | brokerage

2. **Customer** (Müştərilər) 
   - Types: seller | buyer | tenant
   - Relations: 1-N Booking, 1-N BuyerRequest
   - Validation: Ad, soyad məcburi; telefon və ya email məcburi

3. **Deal** (Sövdələşmələr)
   - Types: buy | sell | rent | brokerage
   - Relations: N-1 Property, 1-N Expense, 1-N Approval, 1-1 Contract
   - Deal types: direct | brokerage

4. **Booking** (Bronlar)
   - Status: ACTIVE | EXPIRED | CONVERTED | CANCELLED
   - Constraint: Bir əmlak üçün yalnız 1 aktiv bron
   - Relations: N-1 Property, N-1 Customer

5. **Expense** (Xərclər)
   - Categories: repair | docs | tax | agent_comm | admin | other
   - Relations: N-1 Property, N-1 Deal
   - Currency: AZN, USD, EUR (FX rate support)

### 2.2 Supporting Entities

- **User**: İstifadəçilər və rollar
- **Role**: Rol və icazə idarəsi (RBAC)
- **Branch**: Filial strukturu  
- **Approval**: Təsdiq axını
- **Communication**: Zəng/SMS/WhatsApp logları
- **AuditLog**: Bütün dəyişikliklərin audit izi
- **BuyerRequest**: Alıcı tələbatları və matching

### 2.3 Database Design Patterns

1. **UUID Primary Keys**: Bütün cədvəllərdə UUID istifadəsi
2. **JSONB Fields**: features, images, permissions, meta
3. **Partial Unique Indexes**: Booking constraint üçün
4. **Materialized Views**: Hesabat və KPI-lar üçün
5. **Audit Trail**: Bütün mutasiyalar üçün before/after

## 3. API Arxitekturası

### 3.1 RESTful Endpoint Strukturu

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /logout  
│   └── GET /me
├── /properties
│   ├── GET / (list, pagination, filters)
│   ├── POST / (create)
│   ├── GET /:id (detail)
│   ├── PATCH /:id (update)
│   └── DELETE /:id (soft delete)
├── /bookings
│   ├── POST / (create)
│   ├── POST /:id/convert-to-transaction
│   └── POST /:id/cancel
├── /communications
│   ├── POST / (manual log)
│   └── GET / (list by entity)
├── /export
│   └── GET /accounting.xlsx
└── /approvals
    ├── POST /:dealId/submit
    ├── POST /:dealId/approve
    └── POST /:dealId/reject
```

### 3.2 API Security Layers

1. **Authentication**: Bearer JWT tokens
2. **Authorization**: RBAC middleware
3. **Rate Limiting**: 100 req/15min per IP
4. **Input Validation**: Zod schemas
5. **HMAC Signatures**: Webhook security
6. **IP Whitelisting**: Admin operations
7. **Audit Logging**: All mutations

## 4. Business Logic Implementation

### 4.1 Approval Workflow

```
Agent → Manager → VP (budget) → Director → Manager (publish)
```

**Conditional Rules**:
- `agency_owned`: Bütün addımlar tətbiq olunur
- `branch_owned`: VP budget addımı SKIP
- `brokerage`: VP budget addımı SKIP

### 4.2 Booking Constraints

1. **Active Booking Rule**: 
   - DB Level: Partial unique index `(property_id) WHERE status='ACTIVE'`
   - API Level: 409 Conflict response
   - Idempotent conversion to transaction

2. **Status Transitions**:
   ```
   ACTIVE → CONVERTED (sale)
   ACTIVE → EXPIRED (timeout)
   ACTIVE → CANCELLED (manual)
   ```

### 4.3 Commission Calculations

**Branch Sales**:
- REA INVEST: 2.5% of profit
- Branch: 2.5% of profit

**Brokerage Sales**:
- Custom percentage per property
- Formula: `sale_price * brokerage_percent / 100`

## 5. Frontend Architecture

### 5.1 Rendering Strategies

| Page Type | Strategy | Revalidation | Use Case |
|-----------|----------|--------------|----------|
| /login | CSR | - | Auth only |
| /dashboard | CSR | - | Interactive widgets |
| /properties | ISR | 60s | Public listings |
| /properties/[id] | SSR | - | SEO + sharing |
| /admin/* | CSR | - | Form-heavy |
| /reports/kpi | ISR | 300s | Cached metrics |

### 5.2 Component Structure

```
/components
├── /ui (shadcn/ui primitives)
├── /auth (AuthProvider, ProtectedRoute)
├── /dashboard (DashboardLayout)
├── /properties (PropertyCard, PropertyForm)
└── /common (Header, Sidebar, Footer)
```

### 5.3 State Management

1. **AuthContext**: User session, roles, permissions
2. **Local State**: Form data, UI state
3. **Server State**: SWR/React Query caching
4. **URL State**: Filters, pagination

## 6. Security Architecture

### 6.1 STRIDE Analysis Summary

| Threat | Mitigation |
|--------|------------|
| **Spoofing** | JWT + refresh tokens, 2FA optional, IP whitelist |
| **Tampering** | Input validation, audit trails, parametric queries |
| **Repudiation** | Comprehensive audit logs, 5+ year retention |
| **Information Disclosure** | TLS 1.2+, disk encryption, PII masking |
| **Denial of Service** | Rate limiting, pagination, queue processing |
| **Elevation of Privilege** | Fine-grained RBAC, approval workflows |

### 6.2 Data Protection

1. **At Rest**: Disk encryption (BitLocker/LUKS)
2. **In Transit**: TLS 1.2+ everywhere
3. **In Processing**: Memory-safe operations
4. **Backup**: Encrypted backups, offsite copies

## 7. Performance Architecture

### 7.1 Performance Targets

- **API Latency**: P95 < 300ms, P99 < 600ms
- **Dashboard Load**: P95 < 3s
- **XLSX Export**: ≤ 60s (async)
- **ISR Revalidation**: ≤ 5 min

### 7.2 Optimization Strategies

1. **Database**:
   - Proper indexing (B-tree, GIN)
   - Materialized views for reports
   - Connection pooling
   - Query optimization

2. **API**:
   - Server-side pagination
   - Response compression
   - HTTP caching headers
   - Circuit breakers

3. **Frontend**:
   - ISR for semi-static content
   - Image optimization
   - Code splitting
   - Lazy loading

## 8. Integration Points

### 8.1 Current Integrations (V1)

1. **SMTP**: Email notifications
2. **PostgreSQL**: Primary database
3. **NAS/Storage**: File storage

### 8.2 Future Integrations (V2+)

1. **SMS Gateway**: SMPP integration
2. **WhatsApp**: Meta Cloud API
3. **VoIP**: Call center integration
4. **Marketplaces**: Tap.az, bina.az
5. **Corporate Website**: Listing sync

## 9. Scalability Considerations

### 9.1 Current Limitations

- Single PostgreSQL instance
- Monolithic backend
- On-premises constraints
- Manual horizontal scaling

### 9.2 Future Scalability Path

1. **Database**: Read replicas, partitioning
2. **API**: Microservices migration
3. **Caching**: Redis layer
4. **Queue**: Message queue for async ops
5. **CDN**: Static asset delivery

## 10. Monitoring və Observability

### 10.1 Metrics Collection

```yaml
Application Metrics:
  - Request rate
  - Error rate  
  - Response time (P50, P95, P99)
  - Active users
  - Conversion rates

Infrastructure Metrics:
  - CPU/Memory usage
  - Disk I/O
  - Network throughput
  - Database connections
  - Queue depth
```

### 10.2 Alerting Rules

1. **Critical**: SLO breach, DB down, Auth failures spike
2. **Warning**: High latency, Disk space low, Rate limit hits
3. **Info**: Deployment complete, Backup success, Report generated

## 11. Development və Deployment

### 11.1 Development Workflow

```bash
# Local Development
1. Start PostgreSQL (Docker)
2. Run migrations
3. Seed test data
4. Start backend (port 8000)
5. Start frontend (port 3000)
```

### 11.2 Deployment Process

```bash
# Production Deployment
1. Run tests
2. Build frontend
3. Database migration
4. Deploy API (PM2)
5. Deploy frontend (PM2)
6. Health checks
7. Smoke tests
```

## 12. Testing Strategy

### 12.1 Test Pyramid

```
         /\
        /E2E\     (10%) - Critical user flows
       /------\
      /Integration\ (30%) - API, DB interactions  
     /------------\
    /   Unit Tests  \ (60%) - Business logic, utils
   /-----------------\
```

### 12.2 Test Coverage Requirements

- Unit Tests: ≥80% coverage
- API Tests: All endpoints
- E2E Tests: Critical paths
- Security Tests: RBAC, validations
- Performance Tests: Load testing

## 13. Backup və Disaster Recovery

### 13.1 Backup Strategy

```yaml
Database:
  Full: Daily at 02:00
  Differential: Every 4 hours
  Transaction Log: Every 15 minutes
  Retention: 30 days

Files:
  Full: Weekly
  Incremental: Daily
  Retention: 90 days
```

### 13.2 Recovery Targets

- **RPO** (Recovery Point Objective): ≤ 24 hours
- **RTO** (Recovery Time Objective): ≤ 4 hours
- **MTTR** (Mean Time To Recovery): ≤ 2 hours

## 14. Compliance və Audit

### 14.1 Regulatory Requirements

1. **PDPL**: Personal data protection
2. **Financial**: Transaction records 5+ years
3. **Audit Trail**: All mutations logged
4. **Data Residency**: On-premises only

### 14.2 Audit Capabilities

```json
{
  "coverage": "100% mutations",
  "retention": "5+ years",
  "fields": ["actor", "action", "entity", "before", "after", "timestamp", "ip"],
  "export": ["JSON", "CSV", "PDF"],
  "search": ["date range", "actor", "entity", "action"]
}
```

## 15. Risk Analizi

### 15.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DB Corruption | High | Low | PITR, regular backups |
| Double Booking | High | Medium | Unique constraints, idempotency |
| Data Breach | High | Low | Encryption, RBAC, audit |
| Performance Degradation | Medium | Medium | Monitoring, indexing |
| Integration Failure | Low | Medium | Circuit breakers, fallbacks |

### 15.2 Business Risks

1. **Excel Migration**: Data quality issues → Validation scripts
2. **User Adoption**: Training resistance → Gradual rollout
3. **Compliance**: Audit failures → Comprehensive logging
4. **Scalability**: Growth limits → Architecture evolution plan

## 16. Recommendations

### 16.1 Immediate Priorities

1. ✅ Implement comprehensive input validation
2. ✅ Setup audit logging for all mutations
3. ✅ Configure proper database indexes
4. ✅ Implement booking constraints
5. ✅ Setup RBAC properly

### 16.2 Short-term Improvements

1. Add Redis caching layer
2. Implement async job queue
3. Setup monitoring stack
4. Create API documentation
5. Implement automated testing

### 16.3 Long-term Evolution

1. Microservices migration
2. Multi-tenant support
3. Cloud-ready architecture
4. GraphQL API option
5. Mobile applications

## Conclusion

REA INVEST sisteminin arxitekturası müasir web development praktikalarına uyğun dizayn edilib və on-premises mühitdə təhlükəsiz, performanslı və scalable həll təqdim edir. Sistem modular struktura malik olub, gələcək genişlənmələr üçün uyğundur.

Key strengths:
- Comprehensive audit trail
- Strong security model (RBAC + STRIDE)
- Flexible property management
- Scalable architecture patterns
- Business rule enforcement at DB level

Areas for future enhancement:
- Horizontal scaling capabilities
- Real-time features (WebSocket)
- Advanced analytics
- AI/ML integration potential
- Mobile-first approach