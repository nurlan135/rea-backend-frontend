# Dizayn Spesifikasiyası (Design)

## Sistem Arxitekturası

### Ümumi Topologiya (On-Premise)
```
[Internet] → [VPN/Office Network] → [Nginx Reverse Proxy] → [Next.js Frontend] + [Express API Backend] → [PostgreSQL Database]
                                                          ↓
                                                    [NAS/Local Storage]
```

### Komponentlər
- **Reverse Proxy**: Nginx (TLS, routing, static files)
- **Frontend**: Next.js 15 (SSR/ISR) + TypeScript + Tailwind CSS
- **Backend**: Express.js REST API + RBAC middleware
- **Database**: PostgreSQL (ayrı VM/fiziki server)
- **Storage**: NAS və ya lokal şifrələnmiş storage
- **Monitoring**: Node-exporter + Prometheus/Grafana (opsional)

## Məlumat Modeli

### Əsas Entitylər

#### Property (Əmlak)
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    project VARCHAR,
    building VARCHAR,
    apt_no VARCHAR,
    floor INTEGER >= 0,
    floors_total INTEGER >= floor,
    area_m2 DECIMAL > 0,
    status ENUM('pending', 'active', 'sold', 'archived'),
    category ENUM('sale', 'rent'),
    docs_type VARCHAR,
    address JSONB,
    features JSONB,
    images JSONB,
    buy_price_azn DECIMAL >= 0,
    target_price_azn DECIMAL >= 0,
    sell_price_azn DECIMAL >= 0,
    is_renovated BOOLEAN,
    listing_type ENUM('agency_owned', 'branch_owned', 'brokerage'),
    -- Brokerage sahələri
    owner_first_name VARCHAR,
    owner_last_name VARCHAR,
    owner_father_name VARCHAR,
    owner_contact VARCHAR,
    brokerage_commission_percent DECIMAL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Booking (Bron)
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    property_id UUID REFERENCES properties(id),
    customer_id UUID REFERENCES customers(id),
    deposit_amount DECIMAL,
    end_date TIMESTAMP NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED'),
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP
);

-- Unikal constraint: yalnız 1 ACTIVE booking per property
CREATE UNIQUE INDEX booking_active_unique 
ON bookings (property_id) WHERE status = 'ACTIVE';
```

#### Deal (Satış/İcarə)
```sql
CREATE TABLE deals (
    id UUID PRIMARY KEY,
    property_id UUID REFERENCES properties(id),
    type ENUM('buy', 'sell', 'rent', 'brokerage'),
    branch_id UUID,
    buy_price_azn DECIMAL,
    sell_price_azn DECIMAL,
    closed_at TIMESTAMP,
    deal_type ENUM('direct', 'brokerage'),
    brokerage_percent DECIMAL,
    brokerage_amount DECIMAL,
    payout_status ENUM('pending', 'approved', 'paid'),
    payout_date TIMESTAMP,
    invoice_no VARCHAR,
    partner_agency VARCHAR,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Customer (Müştəri)
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    father_name VARCHAR,
    phone VARCHAR, -- E.164 format
    email VARCHAR,
    type ENUM('seller', 'buyer', 'tenant'),
    kyc JSONB,
    created_at TIMESTAMP,
    
    CONSTRAINT contact_required CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
```

#### Expense (Xərc)
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    property_id UUID REFERENCES properties(id),
    category ENUM('repair', 'docs', 'tax', 'agent_comm', 'admin', 'other'),
    amount_azn DECIMAL > 0,
    currency ENUM('AZN', 'USD', 'EUR'),
    fx_rate DECIMAL > 0,
    note TEXT,
    spent_at TIMESTAMP <= NOW(),
    created_at TIMESTAMP
);
```

#### Audit Log
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    entity VARCHAR NOT NULL, -- 'Property', 'Deal', etc.
    entity_id UUID NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'CONVERT', 'CANCEL'),
    before JSONB,
    after JSONB,
    ip INET,
    created_at TIMESTAMP
);

-- İndekslər
CREATE INDEX audit_logs_ts_idx ON audit_logs (created_at);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity, entity_id);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id);
```

#### Communication (Ünsiyyət)
```sql
CREATE TABLE communications (
    id UUID PRIMARY KEY,
    contact_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    deal_id UUID REFERENCES deals(id),
    type ENUM('call', 'sms', 'whatsapp'),
    direction ENUM('in', 'out'),
    status ENUM('logged', 'sent', 'delivered', 'failed'),
    caller_id VARCHAR,
    recipient VARCHAR,
    duration_sec INTEGER >= 0,
    message TEXT,
    provider VARCHAR,
    meta JSONB,
    created_at TIMESTAMP
);
```

#### Approval Workflow
```sql
CREATE TABLE approvals (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id),
    step ENUM('manager', 'vp', 'director'),
    status ENUM('pending', 'approved', 'rejected'),
    user_id UUID REFERENCES users(id),
    note TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP
);
```

#### User & Role Management
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name ENUM('agent', 'manager', 'accountant', 'director', 'vp'),
    permissions JSONB,
    created_at TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);
```

### Əlaqələr
- Property 1→N Deal
- Deal 1→N Expense
- Deal 1→N Approval
- Property 1→N Booking
- Customer 1→N Booking
- Property/Deal/Customer 1→N Communication
- User 1→N AuditLog

## API Dizaynı

### Endpoint Struktur
```
/api/
  ├── properties/
  │   ├── GET / (list with pagination)
  │   ├── POST / (create)
  │   ├── GET /:id
  │   ├── PATCH /:id
  │   └── GET /:id/bookings
  ├── bookings/
  │   ├── GET / (list)
  │   ├── POST / (create)
  │   ├── POST /:id/convert-to-transaction
  │   └── POST /:id/cancel
  ├── customers/
  │   ├── GET / (search)
  │   ├── POST / (create)
  │   ├── PATCH /:id
  │   └── GET /:id/bookings
  ├── deals/
  │   ├── GET / (list)
  │   ├── POST / (create)
  │   └── PATCH /:id
  ├── expenses/
  │   ├── GET / (list)
  │   └── POST / (create)
  ├── communications/
  │   ├── GET / (jurnal)
  │   └── POST / (manual log)
  ├── approvals/
  │   ├── POST /:dealId/submit
  │   ├── POST /:dealId/approve
  │   └── POST /:dealId/reject
  ├── export/
  │   └── GET /accounting.xlsx
  └── webhooks/
      ├── POST /sms/dlr
      └── POST /whatsapp
```

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "warnings": [
    {
      "code": "POLICY_WARN_EXPENSE_RECOMMENDED",
      "message": "İlkin xərclər tövsiyə olunur"
    }
  ]
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Bu əmlak üçün artıq aktiv bron mövcuddur",
    "details": {
      "property_id": "uuid",
      "existing_booking_id": "uuid"
    }
  }
}
```

## Frontend Arxitekturası

### Route Strategiyası
| Route | Rendering | Revalidate | SEO | Məqsəd |
|-------|-----------|------------|-----|--------|
| `/login` | CSR | - | Yox | Auth formu |
| `/dashboard` | CSR | - | Yox | İnteraktiv widgetlər |
| `/properties` | ISR | 60s | Var | Public siyahı |
| `/properties/[id]` | SSR | - | Var | Detal səhifəsi |
| `/admin/**` | CSR | - | Yox | Admin panelləri |
| `/reports/kpi` | ISR | 300s | Minimal | KPI dashboard |

### Komponent Struktur
```
components/
├── ui/ (shadcn/ui komponentiləri)
├── forms/
│   ├── PropertyForm.tsx
│   ├── BookingForm.tsx
│   ├── CustomerForm.tsx
│   └── ExpenseForm.tsx
├── tables/
│   ├── PropertiesTable.tsx
│   ├── BookingsTable.tsx
│   └── DealsTable.tsx
├── charts/
│   ├── KPIDashboard.tsx
│   └── ReportsCharts.tsx
└── layout/
    ├── Sidebar.tsx
    ├── Header.tsx
    └── AuthGuard.tsx
```

### State Management
- **Client State**: React Query (server state caching)
- **Form State**: React Hook Form + Zod validation
- **Auth State**: NextAuth.js və ya custom JWT
- **UI State**: Zustand (minimal global state)

## Təhlükəsizlik Dizaynı

### RBAC Struktur
```json
{
  "roles": {
    "agent": {
      "properties": ["read", "create", "update:own"],
      "bookings": ["read", "create", "update:own"],
      "communications": ["read", "create"]
    },
    "manager": {
      "properties": ["read", "create", "update", "approve"],
      "bookings": ["read", "create", "update"],
      "reports": ["read", "export"]
    },
    "director": {
      "properties": "*",
      "approvals": ["approve", "reject"],
      "admin": ["settings"]
    }
  }
}
```

### Middleware Stack
```typescript
// API middleware tərtib
app.use(helmet()); // Security headers
app.use(rateLimit()); // Rate limiting
app.use(auth()); // JWT verification
app.use(rbac()); // Role permission check
app.use(audit()); // Audit logging
```

### Webhook Təhlükəsizliyi
```typescript
// HMAC signature validation
function validateWebhook(payload: string, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Replay attack protection
function validateTimestamp(timestamp: number, windowMs: number = 300000) {
  return Math.abs(Date.now() - timestamp) <= windowMs;
}
```

## Performans Dizaynı

### Database Optimizasiya
```sql
-- İndekslər
CREATE INDEX properties_status_idx ON properties (status) WHERE status = 'active';
CREATE INDEX bookings_property_status_idx ON bookings (property_id, status);
CREATE INDEX deals_closed_at_idx ON deals (closed_at) WHERE closed_at IS NOT NULL;
CREATE INDEX communications_entity_idx ON communications (property_id, customer_id, deal_id);

-- Materialized Views (Reporting üçün)
CREATE MATERIALIZED VIEW fact_deals AS
SELECT 
  d.id as deal_id,
  d.property_id,
  p.branch_id,
  d.buy_price_azn,
  d.sell_price_azn,
  (d.sell_price_azn - d.buy_price_azn - COALESCE(expense_total, 0)) as profit,
  d.closed_at,
  d.status
FROM deals d
LEFT JOIN properties p ON d.property_id = p.id
LEFT JOIN (
  SELECT deal_id, SUM(amount_azn) as expense_total
  FROM expenses
  GROUP BY deal_id
) e ON d.id = e.deal_id;
```

### Caching Strategy
```typescript
// ISR konfiqurasiya
export async function generateStaticParams() {
  return await getActiveProperties().map(p => ({ id: p.id }));
}

export const revalidate = 3600; // 1 saat

// SWR konfiqurasiya
const swrConfig = {
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  errorRetryCount: 3
};
```

### Pagination
```typescript
// Server-side pagination
interface PaginationParams {
  page?: number;
  limit?: number; // 1-100 arası
  sort?: string;
  order?: 'asc' | 'desc';
}

// Cursor-based pagination (böyük datasetlər üçün)
interface CursorPagination {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}
```

## İnteqrasiya Dizaynı

### External API Integration
```typescript
// SMS Provider Integration
interface SMSProvider {
  send(to: string, message: string): Promise<{messageId: string}>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

// Webhook Handler
async function handleSMSWebhook(req: Request) {
  const { messageId, status, timestamp } = req.body;
  
  // Signature validation
  if (!validateWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Update communication status
  await updateCommunicationStatus(messageId, status);
  
  // Audit log
  await logAuditEvent({
    entity: 'Communication',
    action: 'STATUS_UPDATE',
    before: { status: 'sent' },
    after: { status },
    actor: 'system'
  });
}
```

### Export Engine
```typescript
// XLSX Export with streaming
async function exportAccountingData(params: ExportParams) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Hesabat');
  
  // Headers
  worksheet.columns = [
    { header: 'Tarix', key: 'date' },
    { header: 'Filial', key: 'branch' },
    { header: 'Agent', key: 'agent' },
    { header: 'Əmlak Kodu', key: 'propertyCode' },
    // ...
  ];
  
  // Stream data in chunks
  const deals = await getDealsStream(params);
  for await (const chunk of deals) {
    worksheet.addRows(chunk);
  }
  
  return workbook;
}
```

## Monitoring və Logging

### Metrics Collection
```typescript
// Prometheus metrics
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const bookingConversions = new Counter({
  name: 'booking_conversions_total',
  help: 'Total booking conversions',
  labelNames: ['property_type', 'agent']
});
```

### Health Checks
```typescript
// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    checks: {
      database: await checkDatabase(),
      storage: await checkStorage(),
      external_apis: await checkExternalAPIs()
    }
  });
});
```

### Error Handling
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  // Audit critical errors
  if (error instanceof ValidationError) {
    auditLogger.warn('Validation failed', { error, input: req.body });
  }
  
  // Safe error response
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Daxili xəta baş verdi' : error.message
    }
  });
});
```

## Deployment və DevOps

### Docker Configuration
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Configuration
```nginx
upstream nextjs_backend {
    server 127.0.0.1:3000;
}

upstream api_backend {
    server 127.0.0.1:8000;
}

server {
    listen 443 ssl http2;
    server_name rea-invest.local;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin;

    # API routes
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend routes
    location / {
        proxy_pass http://nextjs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup Strategy
```bash
#!/bin/bash
# Daily backup script

# Database backup
pg_dump -h localhost -U postgres -d rea_invest_db | gzip > /backup/db_$(date +%Y%m%d).sql.gz

# Media files backup
rsync -av /app/storage/ /backup/media/

# Cleanup old backups (keep 30 days)
find /backup -name "*.gz" -mtime +30 -delete
```