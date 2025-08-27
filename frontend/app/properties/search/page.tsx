'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AdvancedSearchForm from '@/components/properties/search/AdvancedSearchForm';
import SearchResults from '@/components/properties/search/SearchResults';
import SavedSearches from '@/components/properties/search/SavedSearches';
import SearchAnalytics from '@/components/properties/search/SearchAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BarChart3, Bookmark, History, AlertCircle, Loader2 } from 'lucide-react';
import { propertiesApi } from '@/lib/api/properties';

interface SearchCriteria {
  query?: string;
  property_category?: string;
  property_subcategory?: string;
  category?: string;
  listing_type?: string;
  district_id?: string;
  street_id?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  room_count?: string;
  construction_type?: string;
  is_renovated?: boolean;
  has_parking?: boolean;
  has_elevator?: boolean;
  features?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface SearchHistory {
  id: string;
  query: SearchCriteria;
  timestamp: string;
  results_count: number;
  search_time_ms: number;
}

export default function AdvancedSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('search');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
    avgPrice: 0,
    avgArea: 0
  });

  // Initialize search from URL params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    if (Object.keys(params).length > 0) {
      const criteria: SearchCriteria = {
        query: params.q || '',
        property_category: params.property_category || '',
        property_subcategory: params.property_subcategory || '',
        category: params.category || '',
        listing_type: params.listing_type || '',
        district_id: params.district_id || '',
        street_id: params.street_id || '',
        min_price: params.min_price ? parseInt(params.min_price) : undefined,
        max_price: params.max_price ? parseInt(params.max_price) : undefined,
        min_area: params.min_area ? parseInt(params.min_area) : undefined,
        max_area: params.max_area ? parseInt(params.max_area) : undefined,
        room_count: params.room_count || '',
        construction_type: params.construction_type || '',
        is_renovated: params.is_renovated === 'true' ? true : undefined,
        has_parking: params.has_parking === 'true' ? true : undefined,
        has_elevator: params.has_elevator === 'true' ? true : undefined,
        features: params.features ? params.features.split(',') : [],
        sort_by: params.sort_by || 'created_at',
        sort_order: (params.sort_order as 'asc' | 'desc') || 'desc'
      };
      setSearchCriteria(criteria);
      performSearch(criteria);
    }
  }, [searchParams]);

  // Load user's saved searches and history
  useEffect(() => {
    if (user) {
      loadSavedSearches();
      loadSearchHistory();
    }
  }, [user]);

  const loadSavedSearches = async () => {
    try {
      // TODO: Implement saved searches API
      setSavedSearches([]);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      // TODO: Implement search history API
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const performSearch = useCallback(async (criteria: SearchCriteria) => {
    try {
      setLoading(true);
      setError('');
      const searchStartTime = Date.now();

      // Clean criteria - remove empty values
      const cleanCriteria = Object.entries(criteria).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '' && 
            (Array.isArray(value) ? value.length > 0 : true)) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const response = await propertiesApi.list(cleanCriteria);
      const searchTime = Date.now() - searchStartTime;

      if (response.success) {
        setSearchResults(response.data.properties);
        setSearchPerformed(true);

        // Calculate stats
        const properties = response.data.properties;
        const totalResults = properties.length;
        const avgPrice = properties.reduce((sum: number, p: any) => 
          sum + (p.sell_price_azn || p.rent_price_monthly_azn || 0), 0) / Math.max(totalResults, 1);
        const avgArea = properties.reduce((sum: number, p: any) => 
          sum + (p.area_m2 || 0), 0) / Math.max(totalResults, 1);

        setSearchStats({
          totalResults,
          searchTime,
          avgPrice: Math.round(avgPrice),
          avgArea: Math.round(avgArea)
        });

        // Add to search history
        const historyEntry: SearchHistory = {
          id: Date.now().toString(),
          query: criteria,
          timestamp: new Date().toISOString(),
          results_count: totalResults,
          search_time_ms: searchTime
        };
        setSearchHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

        // Update URL
        updateURL(criteria);

      } else {
        throw new Error('Axtarış zamanı xəta baş verdi');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Axtarış zamanı xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateURL = (criteria: SearchCriteria) => {
    const params = new URLSearchParams();
    
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','));
        } else if (!Array.isArray(value)) {
          params.set(key, value.toString());
        }
      }
    });

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/properties/search${newURL}`, { scroll: false });
  };

  const handleSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    performSearch(criteria);
  };

  const handleSaveSearch = async (name: string) => {
    try {
      // TODO: Implement save search API
      console.log('Saving search:', name, searchCriteria);
      // Add to saved searches
      const savedSearch = {
        id: Date.now().toString(),
        name,
        criteria: searchCriteria,
        created_at: new Date().toISOString(),
        results_count: searchStats.totalResults
      };
      setSavedSearches(prev => [savedSearch, ...prev]);
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const handleLoadSavedSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    performSearch(criteria);
    setActiveTab('search');
  };

  const handleLoadHistorySearch = (historyEntry: SearchHistory) => {
    setSearchCriteria(historyEntry.query);
    performSearch(historyEntry.query);
    setActiveTab('search');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Yüklənir...</p>
        </div>
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
    <DashboardLayout title="Advanced Axtarış">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Advanced Əmlak Axtarışı</h1>
            <p className="text-gray-600">Detallı filtrlərlə əmlakları axtarın və analiz edin</p>
          </div>
          
          {searchPerformed && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {searchStats.totalResults}
              </div>
              <div className="text-sm text-gray-600">
                nəticə ({searchStats.searchTime}ms)
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Axtarış
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center">
              <Bookmark className="h-4 w-4 mr-2" />
              Yadda saxlanmış
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              Tarixçə
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analitika
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search Form */}
              <div className="lg:col-span-1">
                <AdvancedSearchForm
                  initialCriteria={searchCriteria}
                  onSearch={handleSearch}
                  onSaveSearch={handleSaveSearch}
                  loading={loading}
                />
              </div>

              {/* Search Results */}
              <div className="lg:col-span-3">
                <SearchResults
                  results={searchResults}
                  loading={loading}
                  criteria={searchCriteria}
                  stats={searchStats}
                  searchPerformed={searchPerformed}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <SavedSearches
              savedSearches={savedSearches}
              onLoadSearch={handleLoadSavedSearch}
              onDeleteSearch={(id) => setSavedSearches(prev => prev.filter(s => s.id !== id))}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Axtarış Tarixçəsi</h3>
                  
                  {searchHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Hələ axtarış tarixçəniz yoxdur</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {searchHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleLoadHistorySearch(entry)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {entry.query.query || 'Filtrlənmiş axtarış'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(entry.timestamp).toLocaleString('az-AZ')} • 
                                {entry.results_count} nəticə • 
                                {entry.search_time_ms}ms
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Yenidən axtarı
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <SearchAnalytics
              searchHistory={searchHistory}
              currentResults={searchResults}
              currentStats={searchStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}