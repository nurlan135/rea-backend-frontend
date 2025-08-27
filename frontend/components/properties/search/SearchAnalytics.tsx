'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Search,
  Target,
  Users,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Activity
} from 'lucide-react';

interface SearchHistory {
  id: string;
  query: any;
  timestamp: string;
  results_count: number;
  search_time_ms: number;
}

interface SearchAnalyticsProps {
  searchHistory: SearchHistory[];
  currentResults: any[];
  currentStats: {
    totalResults: number;
    searchTime: number;
    avgPrice: number;
    avgArea: number;
  };
}

export default function SearchAnalytics({
  searchHistory,
  currentResults,
  currentStats
}: SearchAnalyticsProps) {
  
  const analytics = useMemo(() => {
    if (searchHistory.length === 0) {
      return {
        totalSearches: 0,
        avgResultsPerSearch: 0,
        avgSearchTime: 0,
        mostCommonFilters: [],
        searchTrends: [],
        performanceMetrics: {
          fastSearches: 0,
          slowSearches: 0,
          emptyResults: 0
        },
        popularCriteria: {},
        timeDistribution: {},
        resultDistribution: {}
      };
    }

    const totalSearches = searchHistory.length;
    const avgResultsPerSearch = Math.round(
      searchHistory.reduce((sum, h) => sum + h.results_count, 0) / totalSearches
    );
    const avgSearchTime = Math.round(
      searchHistory.reduce((sum, h) => sum + h.search_time_ms, 0) / totalSearches
    );

    // Performance metrics
    const performanceMetrics = {
      fastSearches: searchHistory.filter(h => h.search_time_ms < 200).length,
      slowSearches: searchHistory.filter(h => h.search_time_ms > 500).length,
      emptyResults: searchHistory.filter(h => h.results_count === 0).length
    };

    // Popular criteria analysis
    const popularCriteria: { [key: string]: number } = {};
    searchHistory.forEach(h => {
      Object.entries(h.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (!popularCriteria[key]) popularCriteria[key] = 0;
          popularCriteria[key]++;
        }
      });
    });

    // Most common filters
    const mostCommonFilters = Object.entries(popularCriteria)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([filter, count]) => ({
        filter: getFilterDisplayName(filter),
        count,
        percentage: Math.round((count / totalSearches) * 100)
      }));

    // Time distribution (by hour)
    const timeDistribution: { [hour: string]: number } = {};
    searchHistory.forEach(h => {
      const hour = new Date(h.timestamp).getHours();
      const hourKey = `${hour}:00`;
      timeDistribution[hourKey] = (timeDistribution[hourKey] || 0) + 1;
    });

    // Result count distribution
    const resultDistribution: { [range: string]: number } = {
      '0': 0,
      '1-10': 0,
      '11-50': 0,
      '51-100': 0,
      '100+': 0
    };

    searchHistory.forEach(h => {
      if (h.results_count === 0) resultDistribution['0']++;
      else if (h.results_count <= 10) resultDistribution['1-10']++;
      else if (h.results_count <= 50) resultDistribution['11-50']++;
      else if (h.results_count <= 100) resultDistribution['51-100']++;
      else resultDistribution['100+']++;
    });

    // Search trends (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSearches = searchHistory.filter(h => new Date(h.timestamp) >= sevenDaysAgo);
    
    const searchTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const daySearches = recentSearches.filter(h => 
        h.timestamp.split('T')[0] === dateStr
      ).length;
      
      searchTrends.push({
        date: dateStr,
        count: daySearches,
        label: date.toLocaleDateString('az-AZ', { weekday: 'short', day: 'numeric' })
      });
    }

    return {
      totalSearches,
      avgResultsPerSearch,
      avgSearchTime,
      mostCommonFilters,
      searchTrends,
      performanceMetrics,
      popularCriteria,
      timeDistribution,
      resultDistribution
    };
  }, [searchHistory]);

  const getFilterDisplayName = (filter: string): string => {
    const filterNames: { [key: string]: string } = {
      'query': 'Mətn axtarışı',
      'property_category': 'Əmlak kateqoriyası',
      'category': 'Satış/İcarə',
      'listing_type': 'Mülkiyyət növü',
      'district_id': 'Rayon',
      'min_price': 'Min qiymət',
      'max_price': 'Max qiymət',
      'min_area': 'Min sahə',
      'max_area': 'Max sahə',
      'room_count': 'Otaq sayı',
      'construction_type': 'Tikinti növü',
      'is_renovated': 'Təmirli',
      'has_parking': 'Avtomobil yeri',
      'has_elevator': 'Lift'
    };
    return filterNames[filter] || filter;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (searchHistory.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analitika Məlumatı Yoxdur
          </h3>
          <p className="text-gray-500">
            Analitika məlumatları görmək üçün bir neçə axtarış həyata keçirin
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Search Stats */}
      {currentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Cari Axtarış Nəticələri
            </CardTitle>
            <CardDescription>Son axtarışın statistikası</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentStats.totalResults}
                </div>
                <div className="text-sm text-blue-700">Tapılan əmlak</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentStats.searchTime}ms
                </div>
                <div className="text-sm text-green-700">Axtarış müddəti</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(currentStats.avgPrice)}
                </div>
                <div className="text-sm text-purple-700">Orta qiymət</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {currentStats.avgArea}m²
                </div>
                <div className="text-sm text-orange-700">Orta sahə</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Search className="h-5 w-5 mr-2" />
              Ümumi Statistika
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ümumi axtarış:</span>
              <span className="font-semibold text-lg">{analytics.totalSearches}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orta nəticə sayı:</span>
              <span className="font-semibold">{analytics.avgResultsPerSearch}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orta axtarış müddəti:</span>
              <span className="font-semibold">{analytics.avgSearchTime}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sürətli axtarışlar:</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {analytics.performanceMetrics.fastSearches}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Yavaş axtarışlar:</span>
              <Badge variant="destructive">
                {analytics.performanceMetrics.slowSearches}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Boş nəticələr:</span>
              <Badge variant="secondary">
                {analytics.performanceMetrics.emptyResults}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2" />
              Son 7 Gün Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.searchTrends.map((day, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-12">
                    {day.label}
                  </span>
                  <div className="flex-1">
                    <Progress 
                      value={(day.count / Math.max(...analytics.searchTrends.map(d => d.count))) * 100} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Common Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Ən Çox İstifadə Edilən Filtrlər
          </CardTitle>
          <CardDescription>Hansı filtrlər ən çox istifadə edilir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.mostCommonFilters.map((filter, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-4 text-sm font-medium text-gray-500">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{filter.filter}</span>
                    <span className="text-sm text-gray-600">
                      {filter.count} dəfə ({filter.percentage}%)
                    </span>
                  </div>
                  <Progress value={filter.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Result Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Nəticə Sayı Bölgüsü
            </CardTitle>
            <CardDescription>Axtarışların nəticə sayına görə bölgüsü</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.resultDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center justify-between">
                  <span className="text-sm">
                    {range === '0' ? 'Boş nəticə' : 
                     range === '100+' ? '100+ nəticə' : 
                     `${range} nəticə`}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20">
                      <Progress 
                        value={(count / analytics.totalSearches) * 100} 
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Axtarış Saatları
            </CardTitle>
            <CardDescription>Hansı saatlarda daha çox axtarış edilir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(analytics.timeDistribution)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, count]) => (
                <div key={hour} className="flex items-center justify-between text-sm">
                  <span>{hour}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16">
                      <Progress 
                        value={(count / Math.max(...Object.values(analytics.timeDistribution))) * 100}
                        className="h-1"
                      />
                    </div>
                    <span className="font-medium w-6">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Təhlil və Məsləhətlər
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Axtarış Səmərəliliyi</h4>
              <div className="space-y-2 text-sm">
                {analytics.performanceMetrics.fastSearches / analytics.totalSearches > 0.8 && (
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Axtarış performansınız çox yaxşıdır!
                  </div>
                )}
                
                {analytics.performanceMetrics.emptyResults / analytics.totalSearches > 0.3 && (
                  <div className="flex items-center text-orange-600">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Boş nəticələr çoxdur. Filtrlər daha geniş tutun.
                  </div>
                )}
                
                {analytics.avgSearchTime > 300 && (
                  <div className="flex items-center text-red-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Orta axtarış müddəti yüksəkdir. Daha sadə filtrlər istifadə edin.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Axtarış Alışkanlıqları</h4>
              <div className="space-y-2 text-sm">
                {analytics.mostCommonFilters[0] && (
                  <div>
                    <strong>Ən çox istifadə etdiyiniz filtr:</strong> {analytics.mostCommonFilters[0].filter}
                  </div>
                )}
                
                <div>
                  <strong>Orta nəticə sayı:</strong> {analytics.avgResultsPerSearch} əmlak
                </div>
                
                <div>
                  <strong>Axtarış tezliyi:</strong> {analytics.searchTrends.reduce((sum, day) => sum + day.count, 0)} dəfə (son 7 gün)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}