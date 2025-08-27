'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Building, 
  Eye, 
  Heart,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Grid,
  List,
  Map,
  Download,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PropertyListView from '../PropertyListView';

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  criteria: any;
  stats: {
    totalResults: number;
    searchTime: number;
    avgPrice: number;
    avgArea: number;
  };
  searchPerformed: boolean;
}

interface SearchStats {
  totalResults: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgArea: number;
  minArea: number;
  maxArea: number;
  byCategory: { [key: string]: number };
  byListingType: { [key: string]: number };
  byDistrict: { [key: string]: number };
}

export default function SearchResults({
  results,
  loading,
  criteria,
  stats,
  searchPerformed
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showStats, setShowStats] = useState(true);
  const router = useRouter();

  const calculateDetailedStats = (): SearchStats => {
    if (results.length === 0) {
      return {
        totalResults: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgArea: 0,
        minArea: 0,
        maxArea: 0,
        byCategory: {},
        byListingType: {},
        byDistrict: {}
      };
    }

    const prices = results
      .map(r => r.sell_price_azn || r.rent_price_monthly_azn || 0)
      .filter(p => p > 0);
    
    const areas = results
      .map(r => r.area_m2)
      .filter(a => a > 0);

    const byCategory = results.reduce((acc, r) => {
      const cat = r.category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const byListingType = results.reduce((acc, r) => {
      const type = r.listing_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const byDistrict = results.reduce((acc, r) => {
      const district = r.district_name || 'Naməlum';
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalResults: results.length,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgArea: areas.length > 0 ? Math.round(areas.reduce((a, b) => a + b, 0) / areas.length) : 0,
      minArea: areas.length > 0 ? Math.min(...areas) : 0,
      maxArea: areas.length > 0 ? Math.max(...areas) : 0,
      byCategory,
      byListingType,
      byDistrict
    };
  };

  const detailedStats = calculateDetailedStats();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getActiveFiltersCount = () => {
    const filters = Object.values(criteria).filter(value => 
      value !== undefined && value !== null && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
    return filters.length;
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting search results...');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!searchPerformed) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Axtarış Edin
          </h3>
          <p className="text-gray-500">
            Sol tərəfdəki formu dolduraraq əmlakları axtarın
          </p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400">
            <Building className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nəticə tapılmadı
            </h3>
            <p className="text-gray-500 mb-4">
              Seçilmiş kriteyalara uyğun əmlak mövcud deyil
            </p>
            <div className="space-y-2 text-sm">
              <p>Axtarışı genişləndirmək üçün:</p>
              <ul className="text-left inline-block">
                <li>• Qiymət aralığını artırın</li>
                <li>• Yerləşmə filtrlərini azaldın</li>
                <li>• Əlavə xüsusiyyətləri silin</li>
                <li>• Ümumi axtarış istifadə edin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Summary & Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {detailedStats.totalResults} əmlak tapıldı
                </h3>
                <p className="text-sm text-gray-600">
                  {stats.searchTime}ms-də • {getActiveFiltersCount()} filtr aktiv
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-x"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-l-none"
                  disabled
                  title="Xəritə görünüşü tezliklə"
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                İxrac et
              </Button>
            </div>
          </div>
        </CardHeader>

        {showStats && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(detailedStats.avgPrice)}
                </div>
                <div className="text-sm text-gray-600">Orta qiymət</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {detailedStats.avgArea} m²
                </div>
                <div className="text-sm text-gray-600">Orta sahə</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {detailedStats.minPrice > 0 ? formatPrice(detailedStats.minPrice) : '-'}
                </div>
                <div className="text-sm text-gray-600">Min qiymət</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {detailedStats.maxPrice > 0 ? formatPrice(detailedStats.maxPrice) : '-'}
                </div>
                <div className="text-sm text-gray-600">Max qiymət</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mt-4 space-y-3">
              <h4 className="font-medium">Nəticə bölgüsü</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* By Category */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Satış/İcarə</h5>
                  <div className="space-y-1">
                    {Object.entries(detailedStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span>{category === 'sale' ? 'Satış' : 'İcarə'}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Listing Type */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Mülkiyyət növü</h5>
                  <div className="space-y-1">
                    {Object.entries(detailedStats.byListingType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span>
                          {type === 'agency_owned' ? 'Agentlik' :
                           type === 'branch_owned' ? 'Filial' : 
                           type === 'brokerage' ? 'Vasitəçi' : type}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By District */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Rayon</h5>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {Object.entries(detailedStats.byDistrict)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([district, count]) => (
                      <div key={district} className="flex justify-between text-sm">
                        <span className="truncate">{district}</span>
                        <span className="font-medium ml-2">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="mt-4"
            >
              Statistikani gizlət
            </Button>
          </CardContent>
        )}

        {!showStats && (
          <CardContent className="pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              Statistikani göstər
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Results Display */}
      {viewMode === 'map' ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xəritə Görünüşü
            </h3>
            <p className="text-gray-500">
              Xəritə funksionallığı tezliklə əlavə ediləcək
            </p>
          </CardContent>
        </Card>
      ) : (
        <PropertyListView
          properties={results}
          loading={false}
          viewMode={viewMode as 'grid' | 'list'}
          onViewModeChange={(mode) => setViewMode(mode)}
        />
      )}

      {/* Performance Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Performance:</strong> {detailedStats.totalResults} nəticə {stats.searchTime}ms-də yükləndi.
          {stats.searchTime < 200 && ' Çox sürətli!'} 
          {stats.searchTime >= 200 && stats.searchTime < 500 && ' Sürətli!'} 
          {stats.searchTime >= 500 && ' Optimizasiya lazım ola bilər.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}