# Əmlak İdarəetmə Modulu - Texniki Dizayn (Technical Design)

## İcmal

Bu sənəd REA INVEST əmlak idarəetmə modulunun texniki arxitekturasını, komponent dizaynını və implementasiya təfərrüatlarını təsvir edir.

## 1. Modul Arxitekturası

### 1.1 Layered Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
├─────────────────────────────────────────┤
│ • Next.js App Router Pages             │
│ • React Components (shadcn/ui)         │
│ • Client-side State Management         │
│ • Form Validation (Zod schemas)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│             API Layer                   │
├─────────────────────────────────────────┤
│ • Express.js REST Endpoints            │
│ • JWT Authentication Middleware        │
│ • RBAC Authorization                    │
│ • Input Validation (Joi schemas)       │
│ • Error Handling & Logging             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Business Logic Layer          │
├─────────────────────────────────────────┤
│ • Property Service                      │
│ • Booking Service                       │
│ • File Upload Service                   │
│ • Search Service                        │
│ • Audit Service                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Data Access Layer             │
├─────────────────────────────────────────┤
│ • Knex.js Query Builder                 │
│ • PostgreSQL Database                   │
│ • Redis Cache (future)                  │
│ • File System Storage                   │
└─────────────────────────────────────────┘
```

### 1.2 Component Hierarchy

```
/app/properties
├── layout.tsx (Properties layout with navigation)
├── page.tsx (Property list with filters - ISR)
├── create/
│   └── page.tsx (Property creation form - CSR)
├── [id]/
│   ├── page.tsx (Property detail view - SSR)
│   ├── edit/
│   │   └── page.tsx (Property edit form - CSR)
│   └── booking/
│       └── page.tsx (Booking management - CSR)
└── search/
    └── page.tsx (Advanced search - CSR)

/components/properties
├── PropertyCard.tsx
├── PropertyForm.tsx
├── PropertyFilters.tsx
├── PropertyDetails.tsx
├── BookingForm.tsx
├── ExpenseTracker.tsx
├── FileUpload.tsx
└── PropertySearch.tsx
```

## 2. Database Schema Design

### 2.1 Properties Table Structure

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Basic Information
  property_category property_category_enum NOT NULL, -- residential/commercial
  property_subcategory VARCHAR(50) NOT NULL, -- apartment/house/office/shop
  construction_type construction_type_enum, -- new/old/under_construction
  
  -- Physical Specifications  
  area_m2 NUMERIC(10,2) NOT NULL,
  floor INTEGER,
  floors_total INTEGER,
  room_count VARCHAR(10), -- 1+1, 2+1, 3+1, studio
  height NUMERIC(4,2), -- ceiling height in meters
  
  -- Location
  district_id UUID REFERENCES districts(id),
  street_id UUID REFERENCES streets(id),
  complex_id UUID REFERENCES complexes(id),
  complex_manual VARCHAR(100), -- if not in complexes table
  building VARCHAR(20),
  apt_no VARCHAR(10),
  block VARCHAR(10),
  entrance_door INTEGER,
  address TEXT, -- full address description
  
  -- Pricing and Business Type
  category category_enum NOT NULL, -- sale/rent
  listing_type listing_type_enum NOT NULL, -- agency_owned/branch_owned/brokerage
  buy_price_azn NUMERIC(12,2), -- purchase price (agency_owned/branch_owned)
  sell_price_azn NUMERIC(12,2), -- listing price
  rent_price_monthly_azn NUMERIC(10,2), -- monthly rent for rentals
  
  -- Brokerage Information (for listing_type='brokerage')
  owner_first_name VARCHAR(50),
  owner_last_name VARCHAR(50),
  owner_contact VARCHAR(100), -- phone/email
  brokerage_commission_percent NUMERIC(5,2),
  
  -- Property Features
  is_renovated BOOLEAN DEFAULT FALSE,
  features JSONB, -- array of feature IDs or descriptions
  description TEXT,
  
  -- Media
  images JSONB, -- array of image URLs with metadata
  videos JSONB, -- array of video URLs with metadata
  documents JSONB, -- array of document URLs with metadata
  
  -- Status and Workflow
  status property_status_enum DEFAULT 'pending', -- pending/active/sold/archived
  approval_status approval_status_enum DEFAULT 'pending',
  
  -- Ownership and Assignment
  agent_id UUID REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Audit and Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  sold_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_prices CHECK (
    (listing_type = 'brokerage' AND buy_price_azn IS NULL) OR
    (listing_type IN ('agency_owned', 'branch_owned') AND buy_price_azn IS NOT NULL)
  ),
  CONSTRAINT valid_brokerage_info CHECK (
    (listing_type = 'brokerage' AND owner_first_name IS NOT NULL AND owner_last_name IS NOT NULL) OR
    (listing_type IN ('agency_owned', 'branch_owned'))
  )
);

-- Indexes for Performance
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_category ON properties(category, listing_type);
CREATE INDEX idx_properties_location ON properties(district_id, street_id);
CREATE INDEX idx_properties_agent ON properties(agent_id);
CREATE INDEX idx_properties_price ON properties(sell_price_azn);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', description || ' ' || COALESCE(address, '')));

-- Partial Index for Active Properties
CREATE INDEX idx_properties_active ON properties(created_at DESC) WHERE status = 'active';
```

### 2.2 Related Tables

```sql
-- Property Expenses
CREATE TABLE property_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  expense_category expense_category_enum NOT NULL, -- repair/docs/tax/agent_comm/admin/other
  amount_azn NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AZN',
  exchange_rate NUMERIC(10,4) DEFAULT 1.0,
  description TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP
);

-- Property Bookings (with unique constraint)
CREATE TABLE property_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  status booking_status_enum DEFAULT 'ACTIVE', -- ACTIVE/EXPIRED/CONVERTED/CANCELLED
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  deposit_amount_azn NUMERIC(10,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: only one active booking per property
  CONSTRAINT unique_active_booking UNIQUE (property_id) WHERE status = 'ACTIVE'
);

-- Property Communications Log
CREATE TABLE property_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  communication_type communication_type_enum NOT NULL, -- call/sms/whatsapp/email/visit
  direction VARCHAR(10) NOT NULL, -- inbound/outbound
  content TEXT,
  duration_seconds INTEGER, -- for calls
  status VARCHAR(20), -- delivered/read/failed
  external_id VARCHAR(100), -- provider message ID
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property Search History (for analytics)
CREATE TABLE property_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  search_query TEXT,
  filters JSONB, -- search criteria
  results_count INTEGER,
  search_duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. API Design Specification

### 3.1 RESTful Endpoints

```typescript
// Property CRUD Operations
GET    /api/properties                 // List with filtering
POST   /api/properties                 // Create new property
GET    /api/properties/:id             // Get property details
PATCH  /api/properties/:id             // Update property
DELETE /api/properties/:id             // Soft delete property

// Property Status Management
POST   /api/properties/:id/activate    // Activate property
POST   /api/properties/:id/archive     // Archive property
POST   /api/properties/:id/sold        // Mark as sold

// Property Booking Management
GET    /api/properties/:id/bookings    // Get property bookings
POST   /api/properties/:id/bookings    // Create booking
PATCH  /api/bookings/:id               // Update booking
POST   /api/bookings/:id/convert       // Convert to transaction
POST   /api/bookings/:id/cancel        // Cancel booking

// Property File Management
POST   /api/properties/:id/upload      // Upload files
DELETE /api/properties/:id/files/:fileId // Delete file

// Property Search and Analytics
GET    /api/properties/search          // Advanced search
GET    /api/properties/analytics       // Property metrics
GET    /api/properties/export          // Export data

// Property Expenses
GET    /api/properties/:id/expenses    // Get expenses
POST   /api/properties/:id/expenses    // Add expense
PATCH  /api/expenses/:id               // Update expense
```

### 3.2 Request/Response Schemas

```typescript
// Property Creation Request
interface CreatePropertyRequest {
  // Basic Information
  property_category: 'residential' | 'commercial';
  property_subcategory: string;
  construction_type?: 'new' | 'old' | 'under_construction';
  
  // Physical Specifications
  area_m2: number;
  floor?: number;
  floors_total?: number;
  room_count?: string;
  height?: number;
  
  // Location
  district_id: string;
  street_id?: string;
  complex_id?: string;
  complex_manual?: string;
  building?: string;
  apt_no?: string;
  block?: string;
  entrance_door?: number;
  address?: string;
  
  // Pricing and Business Type
  category: 'sale' | 'rent';
  listing_type: 'agency_owned' | 'branch_owned' | 'brokerage';
  buy_price_azn?: number;
  sell_price_azn?: number;
  rent_price_monthly_azn?: number;
  
  // Brokerage Information
  owner_first_name?: string;
  owner_last_name?: string;
  owner_contact?: string;
  brokerage_commission_percent?: number;
  
  // Features
  is_renovated?: boolean;
  features?: string[];
  description?: string;
  
  // Expenses (for agency_owned/branch_owned)
  expenses?: PropertyExpense[];
}

// Property List Response
interface PropertyListResponse {
  success: boolean;
  data: {
    properties: PropertySummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: AppliedFilters;
  };
}

// Property Detail Response
interface PropertyDetailResponse {
  success: boolean;
  data: {
    property: Property;
    expenses?: PropertyExpense[];
    booking?: PropertyBooking;
    communications?: PropertyCommunication[];
    analytics?: PropertyAnalytics;
  };
}
```

### 3.3 Validation Rules

```typescript
// Joi Validation Schemas
const createPropertySchema = Joi.object({
  property_category: Joi.string().valid('residential', 'commercial').required(),
  property_subcategory: Joi.string().min(1).max(50).required(),
  area_m2: Joi.number().positive().max(10000).required(),
  floor: Joi.number().integer().min(0).max(100),
  room_count: Joi.string().max(10),
  
  category: Joi.string().valid('sale', 'rent').required(),
  listing_type: Joi.string().valid('agency_owned', 'branch_owned', 'brokerage').required(),
  
  // Conditional validation based on listing_type
  buy_price_azn: Joi.when('listing_type', {
    is: Joi.string().valid('agency_owned', 'branch_owned'),
    then: Joi.number().positive().required(),
    otherwise: Joi.forbidden()
  }),
  
  owner_first_name: Joi.when('listing_type', {
    is: 'brokerage',
    then: Joi.string().min(2).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  
  expenses: Joi.when('listing_type', {
    is: Joi.string().valid('agency_owned', 'branch_owned'),
    then: Joi.array().items(expenseSchema).min(0),
    otherwise: Joi.forbidden()
  })
});

// File Upload Validation
const fileValidation = {
  images: {
    maxFiles: 20,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  videos: {
    maxFiles: 3,
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov']
  },
  documents: {
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'image/jpeg']
  }
};
```

## 4. Component Design

### 4.1 React Component Architecture

```typescript
// Property Form Component
interface PropertyFormProps {
  initialData?: Partial<Property>;
  mode: 'create' | 'edit';
  onSubmit: (data: PropertyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  initialData,
  mode,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData
  });

  const listingType = form.watch('listing_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information Section */}
        <PropertyBasicInfo form={form} />
        
        {/* Location Section */}
        <PropertyLocation form={form} />
        
        {/* Pricing Section - Conditional based on listing_type */}
        {listingType === 'brokerage' ? (
          <BrokeragePricing form={form} />
        ) : (
          <AgencyPricing form={form} />
        )}
        
        {/* Features and Media Section */}
        <PropertyFeatures form={form} />
        <PropertyMedia form={form} />
        
        {/* Form Actions */}
        <PropertyFormActions
          mode={mode}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      </form>
    </Form>
  );
};

// Property List Component with Filters
const PropertyList: React.FC = () => {
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  
  const { data, error, mutate } = useSWR(
    ['/api/properties', filters, pagination],
    ([url, filters, pagination]) => 
      fetchProperties({ ...filters, ...pagination }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000 // 30 seconds
    }
  );

  return (
    <div className="space-y-6">
      <PropertyFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({})}
      />
      
      <PropertyGrid
        properties={data?.properties || []}
        loading={!data && !error}
        error={error}
      />
      
      <PropertyPagination
        pagination={data?.pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />
    </div>
  );
};
```

### 4.2 State Management Strategy

```typescript
// Property Context for Global State
interface PropertyContextValue {
  // Current property data
  currentProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createProperty: (data: CreatePropertyRequest) => Promise<Property>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  
  // Filters and Search
  filters: PropertyFilters;
  setFilters: (filters: PropertyFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // File Management
  uploadFiles: (propertyId: string, files: File[]) => Promise<string[]>;
  deleteFile: (propertyId: string, fileId: string) => Promise<void>;
}

// Local State Management Patterns
const usePropertyForm = (initialData?: Partial<Property>) => {
  const [formData, setFormData] = useState<PropertyFormData>(
    initialData || getDefaultFormData()
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const result = propertySchema.safeParse(formData);
    if (!result.success) {
      setValidationErrors(formatZodErrors(result.error));
      return false;
    }
    setValidationErrors({});
    return true;
  }, [formData]);

  const submitForm = useCallback(async (onSuccess?: (property: Property) => void) => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const property = await createProperty(formData);
      onSuccess?.(property);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  return {
    formData,
    setFormData,
    validationErrors,
    isSubmitting,
    validateForm,
    submitForm
  };
};
```

## 5. Performance Optimization

### 5.1 Caching Strategy

```typescript
// Next.js ISR for Property List
export async function generateStaticParams() {
  // Pre-generate popular property list combinations
  return [
    { category: 'sale', district: 'sabail' },
    { category: 'rent', district: 'nasimi' },
    // ... more combinations
  ];
}

export const revalidate = 60; // Revalidate every 60 seconds

// SWR Caching Configuration
const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  fallbackData: null
};

// Database Query Optimization
const getPropertiesList = async (filters: PropertyFilters, pagination: Pagination) => {
  const query = knex('properties')
    .select([
      'id', 'property_code', 'property_category', 'property_subcategory',
      'area_m2', 'sell_price_azn', 'status', 'created_at',
      // JSON aggregation for performance
      knex.raw('json_build_object(\'name\', districts.name) as district'),
      knex.raw('json_build_object(\'first_name\', users.first_name, \'last_name\', users.last_name) as agent')
    ])
    .leftJoin('districts', 'properties.district_id', 'districts.id')
    .leftJoin('users', 'properties.agent_id', 'users.id')
    .where('properties.status', '!=', 'archived')
    .orderBy('properties.created_at', 'desc');

  // Apply filters dynamically
  applyFilters(query, filters);
  
  // Apply pagination
  const offset = (pagination.page - 1) * pagination.limit;
  query.offset(offset).limit(pagination.limit);

  return query;
};
```

### 5.2 File Upload Optimization

```typescript
// Progressive File Upload with Chunking
const useFileUpload = (propertyId: string) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploadStatus('uploading');
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', propertyId);

      return fetch('/api/properties/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        }
      });
    });

    try {
      await Promise.all(uploadPromises);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      throw error;
    }
  }, [propertyId]);

  return { uploadFiles, uploadProgress, uploadStatus };
};

// Image Optimization Pipeline
const optimizeImage = async (file: File): Promise<File> => {
  // Client-side image compression
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      // Calculate optimal dimensions
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        const optimizedFile = new File([blob!], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(optimizedFile);
      }, 'image/jpeg', 0.85);
    };

    img.src = URL.createObjectURL(file);
  });
};
```

## 6. Security Implementation

### 6.1 Authorization Middleware

```typescript
// Role-Based Access Control
const propertyPermissions = {
  create: ['agent', 'manager', 'vp', 'director', 'admin'],
  read: ['agent', 'manager', 'vp', 'director', 'admin'],
  update: ['agent', 'manager', 'vp', 'director', 'admin'],
  delete: ['manager', 'vp', 'director', 'admin'],
  approve: ['manager', 'vp', 'director', 'admin'],
  archive: ['director', 'admin']
};

const checkPropertyAccess = async (req: Request, res: Response, next: NextFunction) => {
  const { user } = req;
  const { id: propertyId } = req.params;
  const action = getActionFromMethod(req.method, req.path);

  // Check role permissions
  if (!propertyPermissions[action]?.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions for this action' }
    });
  }

  // Check ownership for agents
  if (user.role === 'agent' && ['update', 'delete'].includes(action)) {
    const property = await knex('properties').where('id', propertyId).first();
    if (property?.agent_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_OWNER', message: 'You can only modify your own properties' }
      });
    }
  }

  next();
};

// Input Sanitization and Validation
const sanitizePropertyInput = (data: any): CreatePropertyRequest => {
  return {
    // Remove HTML tags and dangerous characters
    property_category: validator.escape(data.property_category),
    property_subcategory: validator.escape(data.property_subcategory),
    description: data.description ? DOMPurify.sanitize(data.description) : undefined,
    
    // Validate and convert numbers
    area_m2: parseFloat(data.area_m2),
    floor: data.floor ? parseInt(data.floor, 10) : undefined,
    buy_price_azn: data.buy_price_azn ? parseFloat(data.buy_price_azn) : undefined,
    
    // Validate UUIDs
    district_id: validator.isUUID(data.district_id) ? data.district_id : null,
    street_id: data.street_id && validator.isUUID(data.street_id) ? data.street_id : null,
    
    // Sanitize arrays
    features: Array.isArray(data.features) ? data.features.map(validator.escape) : []
  };
};
```

### 6.2 Audit Trail Implementation

```typescript
// Comprehensive Audit Logging
const auditPropertyChange = async (
  userId: string,
  action: string,
  propertyId: string,
  before: any,
  after: any,
  ipAddress: string
) => {
  const auditEntry = {
    id: crypto.randomUUID(),
    user_id: userId,
    action,
    table_name: 'properties',
    record_id: propertyId,
    changes: {
      before: before ? sanitizeAuditData(before) : null,
      after: after ? sanitizeAuditData(after) : null,
      diff: generateDiff(before, after)
    },
    ip_address: ipAddress,
    user_agent: req.headers['user-agent'],
    created_at: new Date()
  };

  await knex('audit_logs').insert(auditEntry);
  
  // Real-time notification for critical changes
  if (['delete', 'archive', 'price_change'].includes(action)) {
    await notificationService.send({
      type: 'audit_alert',
      recipients: await getAuditAlertRecipients(propertyId),
      data: auditEntry
    });
  }
};

// Audit data sanitization (remove sensitive information)
const sanitizeAuditData = (data: any) => {
  const sanitized = { ...data };
  
  // Remove sensitive fields from audit trail
  delete sanitized.password;
  delete sanitized.api_key;
  delete sanitized.internal_notes;
  
  // Mask PII data
  if (sanitized.owner_contact) {
    sanitized.owner_contact = maskPhoneNumber(sanitized.owner_contact);
  }
  
  return sanitized;
};
```

## 7. Error Handling and Monitoring

### 7.1 Error Classification and Handling

```typescript
// Standardized Error Response Format
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Property-specific Error Codes
const PropertyErrorCodes = {
  PROPERTY_NOT_FOUND: 'Property not found',
  INVALID_LISTING_TYPE: 'Invalid listing type provided',
  MISSING_REQUIRED_FIELDS: 'Required fields are missing',
  DUPLICATE_PROPERTY_CODE: 'Property code already exists',
  ACTIVE_BOOKING_EXISTS: 'Property already has an active booking',
  INVALID_PRICE_RANGE: 'Price is outside acceptable range',
  UNSUPPORTED_FILE_TYPE: 'File type not supported',
  FILE_SIZE_EXCEEDED: 'File size exceeds maximum allowed',
  CONCURRENT_MODIFICATION: 'Property was modified by another user'
} as const;

// Global Error Handler
const handlePropertyError = (error: any, req: Request, res: Response) => {
  const requestId = crypto.randomUUID();
  
  // Log error with context
  logger.error('Property operation failed', {
    error: error.message,
    stack: error.stack,
    requestId,
    userId: req.user?.id,
    propertyId: req.params.id,
    action: req.method + ' ' + req.path
  });

  // Determine error type and response
  if (error.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_PROPERTY_CODE',
        message: PropertyErrorCodes.DUPLICATE_PROPERTY_CODE,
        requestId
      }
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: error.details,
        requestId
      }
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      requestId
    }
  });
};
```

### 7.2 Performance Monitoring

```typescript
// Performance Metrics Collection
const collectPropertyMetrics = async (operation: string, duration: number, success: boolean) => {
  const metrics = {
    operation,
    duration_ms: duration,
    success,
    timestamp: Date.now(),
    memory_usage: process.memoryUsage(),
    cpu_usage: process.cpuUsage()
  };

  // Send to monitoring system
  await metricsCollector.record('property_operation', metrics);
  
  // Alert on performance degradation
  if (duration > PERFORMANCE_THRESHOLDS[operation]) {
    await alertService.send({
      level: 'warning',
      message: `Property ${operation} operation exceeded threshold`,
      data: metrics
    });
  }
};

// Database Query Performance Monitoring
const monitorQuery = (query: any) => {
  const startTime = Date.now();
  
  return query.on('query', (queryData: any) => {
    const duration = Date.now() - startTime;
    
    if (duration > 1000) { // Log slow queries
      logger.warn('Slow query detected', {
        sql: queryData.sql,
        duration,
        bindings: queryData.bindings
      });
    }
  });
};
```

## 8. Testing Strategy

### 8.1 Component Testing

```typescript
// Property Form Testing
describe('PropertyForm Component', () => {
  it('should validate required fields correctly', async () => {
    render(<PropertyForm mode="create" onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    fireEvent.click(screen.getByText('Yadda saxla'));
    
    expect(await screen.findByText('Əmlak kateqoriyası məcburidir')).toBeInTheDocument();
    expect(await screen.findByText('Sahə məlumatı məcburidir')).toBeInTheDocument();
  });

  it('should show brokerage fields when listing_type is brokerage', async () => {
    render(<PropertyForm mode="create" onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    fireEvent.change(screen.getByLabelText('Listing Type'), { target: { value: 'brokerage' } });
    
    expect(screen.getByLabelText('Owner First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Commission Percentage')).toBeInTheDocument();
    expect(screen.queryByLabelText('Purchase Price')).not.toBeInTheDocument();
  });
});

// API Integration Testing
describe('Property API', () => {
  it('should create property with valid data', async () => {
    const propertyData = {
      property_category: 'residential',
      property_subcategory: 'apartment',
      area_m2: 100,
      category: 'sale',
      listing_type: 'agency_owned',
      buy_price_azn: 150000,
      expenses: []
    };

    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${agentToken}`)
      .send(propertyData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.property.property_code).toMatch(/^sale-apartment-\d{4}-\d+$/);
  });
});
```

### 8.2 End-to-End Testing

```typescript
// E2E Property Management Flow
test('Complete property creation and approval flow', async ({ page }) => {
  // Login as agent
  await page.goto('/login');
  await page.fill('[name="email"]', 'agent@rea-invest.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create new property
  await page.goto('/properties/create');
  await page.selectOption('[name="property_category"]', 'residential');
  await page.selectOption('[name="property_subcategory"]', 'apartment');
  await page.fill('[name="area_m2"]', '85');
  await page.selectOption('[name="listing_type"]', 'agency_owned');
  await page.fill('[name="buy_price_azn"]', '120000');
  
  // Submit form
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/properties\/[a-f0-9-]+$/);
  await expect(page.locator('.property-status')).toContainText('Gözləmədə');

  // Switch to manager account for approval
  await page.goto('/logout');
  await page.goto('/login');
  await page.fill('[name="email"]', 'manager@rea-invest.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Approve property
  await page.goto('/dashboard/manager/approvals');
  await page.click('button:has-text("Təsdiq Et"):first');
  await page.click('button:has-text("Təsdiq et")'); // Confirmation dialog
  
  await expect(page.locator('.success-message')).toContainText('Əmlak uğurla təsdiq edildi');
});
```

## 9. Deployment and DevOps

### 9.1 Build Pipeline

```yaml
# Docker Configuration
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]
```

### 9.2 Monitoring and Alerting

```typescript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || 'unknown',
    checks: {
      database: await checkDatabaseConnection(),
      storage: await checkFileStorage(),
      memory: checkMemoryUsage(),
      diskSpace: await checkDiskSpace()
    }
  };

  const isHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});

// Performance Metrics Dashboard
const createMetricsDashboard = () => ({
  property_operations: {
    create: { p50: 250, p95: 800, p99: 1500 },
    read: { p50: 120, p95: 300, p99: 600 },
    update: { p50: 200, p95: 600, p99: 1200 },
    delete: { p50: 150, p95: 400, p99: 800 }
  },
  database_performance: {
    connection_pool_usage: 65,
    slow_queries_count: 12,
    cache_hit_ratio: 0.89
  },
  business_metrics: {
    properties_created_today: 15,
    properties_approved_today: 12,
    active_bookings: 45,
    conversion_rate: 0.23
  }
});
```

This technical design provides a comprehensive foundation for implementing the Properties module with proper architecture, security, performance, and maintainability considerations.