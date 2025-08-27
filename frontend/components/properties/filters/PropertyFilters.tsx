'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import PriceRangeFilter from './PriceRangeFilter';
import LocationFilter from './LocationFilter';
import { useDebounce } from '@/lib/hooks/useDebounce';

export interface PropertyFiltersState {
  search?: string;
  status?: string;
  category?: string;
  listing_type?: string;
  district_id?: string;
  street_id?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  property_category?: string;
  property_subcategory?: string;
  construction_type?: string;
  room_count?: string;
  is_renovated?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PropertyFiltersProps {
  filters: PropertyFiltersState;
  onFiltersChange: (filters: PropertyFiltersState) => void;
  loading?: boolean;
  totalCount?: number;
}

const statusOptions = [
  { value: '', label: 'Bütün statuslar' },
  { value: 'pending', label: 'Gözləmədə' },
  { value: 'active', label: 'Aktiv' },
  { value: 'sold', label: 'Satılıb' },
  { value: 'archived', label: 'Arxiv' }
];

const categoryOptions = [
  { value: '', label: 'Bütün kateqoriyalar' },
  { value: 'sale', label: 'Satış' },
  { value: 'rent', label: 'İcarə' }
];

const listingTypeOptions = [
  { value: '', label: 'Bütün tiplər' },
  { value: 'agency_owned', label: 'Agentlik' },
  { value: 'branch_owned', label: 'Filial' },
  { value: 'brokerage', label: 'Vasitəçilik' }
];

const propertyCategoryOptions = [
  { value: '', label: 'Bütün növlər' },
  { value: 'residential', label: 'Yaşayış' },
  { value: 'commercial', label: 'Kommersiya' }
];

const constructionTypeOptions = [
  { value: '', label: 'Tikinti növü' },
  { value: 'new', label: 'Yeni tikili' },
  { value: 'old', label: 'Köhnə tikili' },
  { value: 'under_construction', label: 'İnşaat davam edir' }
];

const roomCountOptions = [
  { value: '', label: 'Otaq sayı' },
  { value: '1st', label: '1 otaq' },
  { value: '2st', label: '2 otaq' },
  { value: '3st', label: '3 otaq' },
  { value: '4st', label: '4 otaq' },
  { value: '5st', label: '5 otaq' },
  { value: '6+st', label: '6+ otaq' }
];

const sortOptions = [
  { value: 'created_at:desc', label: 'Ən yeni' },
  { value: 'created_at:asc', label: 'Ən köhnə' },
  { value: 'sell_price_azn:desc', label: 'Qiymət: Yüksək → Aşağı' },
  { value: 'sell_price_azn:asc', label: 'Qiymət: Aşağı → Yüksək' },
  { value: 'area_m2:desc', label: 'Sahə: Böyük → Kiçik' },
  { value: 'area_m2:asc', label: 'Sahə: Kiçik → Böyük' }
];

export default function PropertyFilters({ filters, onFiltersChange, loading, totalCount }: PropertyFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  const handleFilterChange = useCallback((key: keyof PropertyFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const handlePriceRangeChange = useCallback((min: number | undefined, max: number | undefined) => {
    onFiltersChange({ 
      ...filters, 
      min_price: min, 
      max_price: max 
    });
  }, [filters, onFiltersChange]);

  const handleAreaRangeChange = useCallback((min: number | undefined, max: number | undefined) => {
    onFiltersChange({ 
      ...filters, 
      min_area: min, 
      max_area: max 
    });
  }, [filters, onFiltersChange]);

  const handleLocationChange = useCallback((districtId: string | undefined, streetId: string | undefined) => {
    onFiltersChange({
      ...filters,
      district_id: districtId,
      street_id: streetId
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    const activeFilters = Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    );
    return activeFilters.length;
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':');
    onFiltersChange({
      ...filters,
      sort_by: sortBy,
      sort_order: sortOrder as 'asc' | 'desc'
    });
  };

  const getCurrentSortValue = () => {
    if (filters.sort_by && filters.sort_order) {
      return `${filters.sort_by}:${filters.sort_order}`;
    }
    return 'created_at:desc';
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="flex items-center">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filtrlər
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                {activeFilterCount} aktiv
              </Badge>
            )}
            {totalCount !== undefined && (
              <Badge variant="outline">
                {totalCount} nəticə
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Təmizlə
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Kod, ünvan axtarın..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Status Filter */}
          <Select 
            value={filters.status || ''} 
            onValueChange={(value) => handleFilterChange('status', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select 
            value={filters.category || ''} 
            onValueChange={(value) => handleFilterChange('category', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Satış/İcarə" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select 
            value={getCurrentSortValue()} 
            onValueChange={handleSortChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expanded Filters */}
        {expanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Property Type & Listing Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select 
                value={filters.listing_type || ''} 
                onValueChange={(value) => handleFilterChange('listing_type', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mülkiyyət növü" />
                </SelectTrigger>
                <SelectContent>
                  {listingTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.property_category || ''} 
                onValueChange={(value) => handleFilterChange('property_category', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Əmlak növü" />
                </SelectTrigger>
                <SelectContent>
                  {propertyCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.construction_type || ''} 
                onValueChange={(value) => handleFilterChange('construction_type', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tikinti növü" />
                </SelectTrigger>
                <SelectContent>
                  {constructionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Location Filter */}
            <LocationFilter
              districtId={filters.district_id}
              streetId={filters.street_id}
              onChange={handleLocationChange}
              disabled={loading}
            />

            <Separator />

            {/* Price Range */}
            <PriceRangeFilter
              minPrice={filters.min_price}
              maxPrice={filters.max_price}
              onChange={handlePriceRangeChange}
              disabled={loading}
            />

            <Separator />

            {/* Area & Room Count */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min sahə (m²)</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={filters.min_area || ''}
                  onChange={(e) => handleFilterChange('min_area', e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max sahə (m²)</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={filters.max_area || ''}
                  onChange={(e) => handleFilterChange('max_area', e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={loading}
                />
              </div>

              <Select 
                value={filters.room_count || ''} 
                onValueChange={(value) => handleFilterChange('room_count', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Otaq sayı" />
                </SelectTrigger>
                <SelectContent>
                  {roomCountOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}