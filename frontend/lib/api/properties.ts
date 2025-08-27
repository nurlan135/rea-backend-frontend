// Properties API Client

export interface Property {
  id: string;
  property_code: string;
  property_category: 'residential' | 'commercial';
  property_subcategory: string;
  construction_type?: 'new' | 'old' | 'under_construction';
  
  // Physical specs
  area_m2: number;
  floor?: number;
  floors_total?: number;
  room_count?: string;
  height?: number;
  
  // Location
  district_id?: string;
  street_id?: string;
  complex_id?: string;
  complex_manual?: string;
  building?: string;
  apt_no?: string;
  block?: string;
  entrance_door?: number;
  address?: string;
  
  // Business
  category: 'sale' | 'rent';
  listing_type: 'agency_owned' | 'branch_owned' | 'brokerage';
  buy_price_azn?: number;
  sell_price_azn?: number;
  rent_price_monthly_azn?: number;
  
  // Brokerage fields
  owner_first_name?: string;
  owner_last_name?: string;
  owner_contact?: string;
  brokerage_commission_percent?: number;
  
  // Features
  is_renovated: boolean;
  features?: string[];
  description?: string;
  
  // Media
  images?: any[];
  videos?: any[];
  documents?: any[];
  
  // Status
  status: 'pending' | 'active' | 'sold' | 'archived';
  approval_status: 'pending' | 'approved' | 'rejected';
  
  // Ownership
  agent_id?: string;
  branch_id?: string;
  created_by?: string;
  updated_by?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  archived_at?: string;
  sold_at?: string;
  
  // Related data (from joins)
  district_name?: string;
  street_name?: string;
  complex_name?: string;
  agent_first_name?: string;
  agent_last_name?: string;
  agent_email?: string;
  agent_phone?: string;
}

export interface PropertyExpense {
  id: string;
  property_id: string;
  expense_category: 'repair' | 'docs' | 'tax' | 'agent_comm' | 'admin' | 'other';
  amount_azn: number;
  currency: string;
  exchange_rate: number;
  description?: string;
  receipt_url?: string;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface PropertyBooking {
  id: string;
  property_id: string;
  customer_id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
  booking_date: string;
  expiry_date: string;
  deposit_amount_azn?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
}

export interface CreatePropertyRequest {
  property_category: 'residential' | 'commercial';
  property_subcategory: string;
  construction_type?: 'new' | 'old' | 'under_construction';
  area_m2: number;
  floor?: number;
  floors_total?: number;
  room_count?: string;
  height?: number;
  district_id?: string;
  street_id?: string;
  complex_id?: string;
  complex_manual?: string;
  building?: string;
  apt_no?: string;
  block?: string;
  entrance_door?: number;
  address?: string;
  category: 'sale' | 'rent';
  listing_type: 'agency_owned' | 'branch_owned' | 'brokerage';
  buy_price_azn?: number;
  sell_price_azn?: number;
  rent_price_monthly_azn?: number;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_contact?: string;
  brokerage_commission_percent?: number;
  is_renovated?: boolean;
  features?: string[];
  description?: string;
  images?: any[];
  videos?: any[];
  documents?: any[];
}

export interface PropertiesListResponse {
  success: boolean;
  data: {
    properties: Property[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PropertyDetailResponse {
  success: boolean;
  data: {
    property: Property;
    expenses?: PropertyExpense[];
    activeBooking?: PropertyBooking;
  };
}

export interface PropertyFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  listing_type?: string;
  district_id?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to get auth headers
function getAuthHeaders(): { [key: string]: string } {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Properties API functions
export const propertiesApi = {
  // List properties with filtering
  async list(filters: PropertyFilters = {}): Promise<PropertiesListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/properties${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<PropertiesListResponse>(response);
  },

  // Get property by ID
  async getById(id: string): Promise<PropertyDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<PropertyDetailResponse>(response);
  },

  // Create new property
  async create(propertyData: CreatePropertyRequest): Promise<{ success: boolean; data: { property: Property } }> {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData),
    });

    return handleResponse(response);
  },

  // Update property
  async update(id: string, updateData: Partial<CreatePropertyRequest>): Promise<{ success: boolean; data: { property: Property } }> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    return handleResponse(response);
  },

  // Delete property (soft delete)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Activate property
  async activate(id: string): Promise<{ success: boolean; data: { property: Property }; message: string }> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Upload files for property
  async uploadFiles(propertyId: string, files: File[]): Promise<{ success: boolean; data: { urls: string[] } }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    formData.append('property_id', propertyId);

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(response);
  }
};

// Property validation helpers
export const propertyValidation = {
  validateRequiredFields(data: CreatePropertyRequest): string[] {
    const errors: string[] = [];

    if (!data.property_category) errors.push('Əmlak kateqoriyası məcburidir');
    if (!data.property_subcategory) errors.push('Əmlak alt kateqoriyası məcburidir');
    if (!data.area_m2 || data.area_m2 <= 0) errors.push('Sahə düzgün deyil');
    if (!data.category) errors.push('Satış/kirayə növü məcburidir');
    if (!data.listing_type) errors.push('Listing növü məcburidir');

    // Listing type specific validations
    if (data.listing_type === 'agency_owned' || data.listing_type === 'branch_owned') {
      if (!data.buy_price_azn || data.buy_price_azn <= 0) {
        errors.push('Alış qiyməti məcburidir');
      }
    }

    if (data.listing_type === 'brokerage') {
      if (!data.owner_first_name) errors.push('Malik adı məcburidir');
      if (!data.owner_last_name) errors.push('Malik soyadı məcburidir');
      if (!data.owner_contact) errors.push('Malik əlaqə məlumatı məcburidir');
      if (!data.brokerage_commission_percent || data.brokerage_commission_percent <= 0) {
        errors.push('Brokerage komissiyası məcburidir');
      }
    }

    return errors;
  },

  validatePriceRange(minPrice?: number, maxPrice?: number): string[] {
    const errors: string[] = [];
    
    if (minPrice && minPrice < 0) errors.push('Minimum qiymət 0-dan böyük olmalıdır');
    if (maxPrice && maxPrice < 0) errors.push('Maksimum qiymət 0-dan böyük olmalıdır');
    if (minPrice && maxPrice && minPrice > maxPrice) {
      errors.push('Minimum qiymət maksimum qiymətdən kiçik olmalıdır');
    }

    return errors;
  }
};

// Property formatting helpers
export const propertyFormatters = {
  formatPrice(price: number, currency = 'AZN'): string {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  },

  formatArea(area: number): string {
    return `${area} m²`;
  },

  formatStatus(status: string): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
    const statusMap = {
      pending: { text: 'Gözləyir', variant: 'secondary' as const },
      active: { text: 'Aktiv', variant: 'default' as const },
      sold: { text: 'Satıldı', variant: 'outline' as const },
      archived: { text: 'Arxivləşdi', variant: 'destructive' as const },
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const };
  },

  formatListingType(listingType: string): string {
    const typeMap = {
      agency_owned: 'Agentlik malı',
      branch_owned: 'Filial malı',
      brokerage: 'Brokerage'
    };
    return typeMap[listingType as keyof typeof typeMap] || listingType;
  },

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  },

  formatPropertyCode(code: string): string {
    return code.toUpperCase();
  }
};