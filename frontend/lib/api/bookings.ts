// Bookings API Client

export interface Booking {
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
  
  // Related data (from joins)
  property_code?: string;
  property_address?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface CreateBookingRequest {
  customer_id: string;
  expiry_date: string;
  deposit_amount_azn?: number;
  notes?: string;
}

export interface UpdateBookingRequest {
  expiry_date?: string;
  deposit_amount_azn?: number;
  notes?: string;
}

export interface BookingsListResponse {
  success: boolean;
  data: {
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface BookingDetailResponse {
  success: boolean;
  data: {
    booking: Booking;
  };
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  property_id?: string;
  customer_id?: string;
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

// Bookings API functions
export const bookingsApi = {
  // List all bookings with filtering
  async list(filters: BookingFilters = {}): Promise<BookingsListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/bookings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<BookingsListResponse>(response);
  },

  // Get booking by ID
  async getById(id: string): Promise<BookingDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<BookingDetailResponse>(response);
  },

  // Create booking for property
  async createForProperty(propertyId: string, bookingData: CreateBookingRequest): Promise<{ success: boolean; data: { booking: Booking }; message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookings/properties/${propertyId}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });

    return handleResponse(response);
  },

  // Update booking
  async update(id: string, updateData: UpdateBookingRequest): Promise<{ success: boolean; data: { booking: Booking }; message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    return handleResponse(response);
  },

  // Convert booking to transaction (idempotent)
  async convert(id: string, saleData: { sale_price_azn: number; notes?: string }): Promise<{ success: boolean; data: { booking: Booking }; message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData),
    });

    return handleResponse(response);
  },

  // Cancel booking
  async cancel(id: string, reason?: string): Promise<{ success: boolean; data: { booking: Booking }; message: string }> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    return handleResponse(response);
  }
};

// Booking validation helpers
export const bookingValidation = {
  validateCreateBooking(data: CreateBookingRequest): string[] {
    const errors: string[] = [];

    if (!data.customer_id) errors.push('Müştəri seçilməlidir');
    if (!data.expiry_date) errors.push('Bitmə tarixi məcburidir');
    
    // Check if expiry date is in future
    const expiryDate = new Date(data.expiry_date);
    const now = new Date();
    if (expiryDate <= now) {
      errors.push('Bitmə tarixi gələcəkdə olmalıdır');
    }

    // Check deposit amount
    if (data.deposit_amount_azn !== undefined && data.deposit_amount_azn < 0) {
      errors.push('Depozit miqdarı 0-dan kiçik ola bilməz');
    }

    return errors;
  },

  validateConvertBooking(salePrice: number): string[] {
    const errors: string[] = [];

    if (!salePrice || salePrice <= 0) {
      errors.push('Satış qiyməti məcburidir və 0-dan böyük olmalıdır');
    }

    return errors;
  }
};

// Booking formatting helpers
export const bookingFormatters = {
  formatStatus(status: string): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
    const statusMap = {
      ACTIVE: { text: 'Aktiv', variant: 'default' as const },
      EXPIRED: { text: 'Vaxtı keçib', variant: 'destructive' as const },
      CONVERTED: { text: 'Sövdələşməyə çevrilib', variant: 'outline' as const },
      CANCELLED: { text: 'Ləğv edilib', variant: 'secondary' as const },
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const };
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

  formatDateOnly(dateString: string): string {
    return new Intl.DateTimeFormat('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  },

  formatPrice(price: number, currency = 'AZN'): string {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  },

  formatCustomerName(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return 'Naməlum müştəri';
    return `${firstName || ''} ${lastName || ''}`.trim();
  },

  isExpiringSoon(expiryDate: string, daysThreshold = 2): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  },

  isExpired(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry < now;
  },

  getDaysUntilExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};