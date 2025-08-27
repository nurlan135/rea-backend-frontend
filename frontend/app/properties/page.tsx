'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyFilters, { PropertyFiltersState } from '@/components/properties/filters/PropertyFilters';
import PropertyListView from '@/components/properties/PropertyListView';
import { propertiesApi } from '@/lib/api/properties';

interface Property {
  id: string;
  property_code: string;
  property_category: string;
  property_subcategory: string;
  area_m2: number;
  floor?: number;
  floors_total?: number;
  room_count?: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  category: 'sale' | 'rent';
  listing_type: 'agency_owned' | 'branch_owned' | 'brokerage';
  sell_price_azn?: number;
  rent_price_monthly_azn?: number;
  address?: string;
  district_name?: string;
  street_name?: string;
  is_renovated: boolean;
  created_at: string;
  updated_at: string;
  agent_first_name?: string;
  agent_last_name?: string;
  active_bookings_count?: number;
}

interface PropertiesResponse {
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

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Initialize filters from URL params
  const initializeFilters = (): PropertyFiltersState => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      search: params.search || '',
      status: params.status || '',
      category: params.category || '',
      listing_type: params.listing_type || '',
      district_id: params.district_id || '',
      street_id: params.street_id || '',
      min_price: params.min_price ? parseInt(params.min_price) : undefined,
      max_price: params.max_price ? parseInt(params.max_price) : undefined,
      min_area: params.min_area ? parseInt(params.min_area) : undefined,
      max_area: params.max_area ? parseInt(params.max_area) : undefined,
      property_category: params.property_category || '',
      property_subcategory: params.property_subcategory || '',
      construction_type: params.construction_type || '',
      room_count: params.room_count || '',
      is_renovated: params.is_renovated === 'true' ? true : undefined,
      sort_by: params.sort_by || 'created_at',
      sort_order: (params.sort_order as 'asc' | 'desc') || 'desc'
    };
  };

  const [filters, setFilters] = useState<PropertyFiltersState>(initializeFilters);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: PropertyFiltersState) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/properties${newURL}`, { scroll: false });
  }, [router]);

  // Fetch properties with current filters
  const fetchProperties = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const filterParams = {
        ...filters,
        page,
        limit: pagination.limit
      };

      const response = await propertiesApi.list(filterParams);
      
      if (response.success) {
        setProperties(response.data.properties);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'Əmlaklar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PropertyFiltersState) => {
    setFilters(newFilters);
    updateURL(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [updateURL]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchProperties(newPage);
  };

  // Load properties when filters change or on mount
  useEffect(() => {
    if (!authLoading && user) {
      fetchProperties();
    }
  }, [user, authLoading, filters, fetchProperties]);

  // Update filters from URL changes
  useEffect(() => {
    const newFilters = initializeFilters();
    setFilters(newFilters);
  }, [searchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Giriş tələb olunur</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Əmlaklar">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Əmlak portfelini idarə edin</p>
          {['agent', 'manager', 'admin'].includes(user.role) && (
            <Button 
              onClick={() => router.push('/properties/create')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Əmlak
            </Button>
          )}
        </div>

        {/* Filters */}
        <PropertyFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loading={loading}
          totalCount={pagination.total}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Properties List */}
        <PropertyListView
          properties={properties}
          loading={loading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Pagination */}
        {!loading && properties.length > 0 && pagination.totalPages > 1 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Səhifə {pagination.page} / {pagination.totalPages} 
                  <span className="ml-2 text-gray-400">
                    ({pagination.total} əmlak)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    Əvvəlki
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) {
                        page = i + 1;
                      } else if (pagination.page <= 3) {
                        page = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        page = pagination.totalPages - 4 + i;
                      } else {
                        page = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={page === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Növbəti
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}