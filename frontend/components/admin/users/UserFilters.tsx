/**
 * User Filters Component
 * Filter controls for users list page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, RotateCcw } from 'lucide-react';

interface UserFiltersProps {
  initialValues: {
    search: string;
    role: string;
    status: string;
    branch_code: string;
    sort: string;
    order: string;
  };
}

const roleOptions = [
  { value: '', label: 'Bütün rollar' },
  { value: 'admin', label: 'Admin' },
  { value: 'director', label: 'Direktor' },
  { value: 'vp', label: 'VP' },
  { value: 'manager', label: 'Manager' },
  { value: 'agent', label: 'Agent' }
];

const statusOptions = [
  { value: '', label: 'Bütün statuslar' },
  { value: 'active', label: 'Aktiv' },
  { value: 'inactive', label: 'Qeyri-aktiv' },
  { value: 'suspended', label: 'Dayandırılmış' }
];

const branchOptions = [
  { value: '', label: 'Bütün filiallar' },
  { value: 'HQ', label: 'Baş Ofis' },
  { value: 'YAS', label: 'Yasamal Filialı' },
  { value: 'NAS', label: 'Nəsimi Filialı' },
  { value: 'SUR', label: 'Səbail Filialı' }
];

const sortOptions = [
  { value: 'created_at', label: 'Yaradılma tarixi' },
  { value: 'first_name', label: 'Ad' },
  { value: 'last_name', label: 'Soyad' },
  { value: 'email', label: 'Email' },
  { value: 'last_login_at', label: 'Son daxil olma' }
];

export default function UserFilters({ initialValues }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState(initialValues);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change (except when just changing page)
    params.delete('page');
    
    const queryString = params.toString();
    const newUrl = `/admin/users${queryString ? `?${queryString}` : ''}`;
    
    router.push(newUrl);
  }, [filters, router]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      branch_code: '',
      sort: 'created_at',
      order: 'desc'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sort' && value === 'created_at') return false;
    if (key === 'order' && value === 'desc') return false;
    return Boolean(value);
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ad, soyad və ya email ilə axtarın..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Ətraflı Filter
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Təmizlə
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filial
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.branch_code}
              onChange={(e) => handleFilterChange('branch_code', e.target.value)}
            >
              {branchOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sıralama
            </label>
            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
              >
                <option value="desc">Azalan</option>
                <option value="asc">Artan</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Axtarış: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.role && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Rol: {roleOptions.find(r => r.value === filters.role)?.label}
              <button
                onClick={() => handleFilterChange('role', '')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.branch_code && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Filial: {branchOptions.find(b => b.value === filters.branch_code)?.label}
              <button
                onClick={() => handleFilterChange('branch_code', '')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}