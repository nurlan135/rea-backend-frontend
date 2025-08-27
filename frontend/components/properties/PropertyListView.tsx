'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid, List, MapPin, Calendar, Users, Building, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  images?: any[];
}

interface PropertyListViewProps {
  properties: Property[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  sold: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  pending: 'Gözləmədə',
  active: 'Aktiv',
  sold: 'Satılıb',
  archived: 'Arxiv'
};

const categoryLabels = {
  sale: 'Satış',
  rent: 'İcarə'
};

const listingTypeLabels = {
  agency_owned: 'Agentlik',
  branch_owned: 'Filial',
  brokerage: 'Vasitəçilik'
};

function PropertyLoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  const skeletonCount = 9;
  
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-20" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-24" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const canEdit = user?.role === 'admin' || 
                 user?.role === 'manager' || 
                 (user?.role === 'agent' && property.agent_first_name === user.first_name);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMainPrice = () => {
    if (property.category === 'sale' && property.sell_price_azn) {
      return formatPrice(property.sell_price_azn);
    } else if (property.category === 'rent' && property.rent_price_monthly_azn) {
      return `${formatPrice(property.rent_price_monthly_azn)}/ay`;
    }
    return null;
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle 
              className="text-lg font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              onClick={() => router.push(`/properties/${property.id}`)}
            >
              {property.property_code}
            </CardTitle>
            <CardDescription className="font-medium">
              {property.property_subcategory}
              {property.address && ` • ${property.district_name}`}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={statusColors[property.status]}>
              {statusLabels[property.status]}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Bax
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Redaktə et
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent onClick={() => router.push(`/properties/${property.id}`)}>
        <div className="space-y-3">
          {/* Address */}
          {property.address && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{property.address}</span>
            </div>
          )}

          {/* Property Details */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {property.area_m2} m² • {property.room_count || 'N/A'}
            </span>
            {(property.floor || property.floors_total) && (
              <span className="text-gray-600">
                {property.floor || '?'}/{property.floors_total || '?'} mərtəbə
              </span>
            )}
          </div>

          {/* Price */}
          {getMainPrice() && (
            <div className="text-lg font-bold text-green-600">
              {getMainPrice()}
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[property.category]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {listingTypeLabels[property.listing_type]}
            </Badge>
            {property.is_renovated && (
              <Badge variant="outline" className="text-xs text-green-600">
                Təmirli
              </Badge>
            )}
            {(property.active_bookings_count || 0) > 0 && (
              <Badge className="text-xs bg-orange-100 text-orange-800">
                <Users className="h-3 w-3 mr-1" />
                {property.active_bookings_count} bron
              </Badge>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <span>
              {property.agent_first_name} {property.agent_last_name}
            </span>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(property.created_at).toLocaleDateString('az-AZ')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyListItem({ property }: { property: Property }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const canEdit = user?.role === 'admin' || 
                 user?.role === 'manager' || 
                 (user?.role === 'agent' && property.agent_first_name === user.first_name);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMainPrice = () => {
    if (property.category === 'sale' && property.sell_price_azn) {
      return formatPrice(property.sell_price_azn);
    } else if (property.category === 'rent' && property.rent_price_monthly_azn) {
      return `${formatPrice(property.rent_price_monthly_azn)}/ay`;
    }
    return 'Qiymət təyin edilməyib';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            {/* Property Image Placeholder */}
            <div className="h-16 w-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
              <Building className="h-6 w-6 text-gray-400" />
            </div>
            
            {/* Property Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  onClick={() => router.push(`/properties/${property.id}`)}
                >
                  {property.property_code}
                </h3>
                <Badge className={statusColors[property.status]}>
                  {statusLabels[property.status]}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{property.property_subcategory}</span>
                {property.district_name && ` • ${property.district_name}`}
              </div>
              
              <div className="text-sm text-gray-600">
                {property.area_m2} m² • {property.room_count || 'N/A'} 
                {(property.floor || property.floors_total) && 
                  ` • ${property.floor || '?'}/${property.floors_total || '?'} mərtəbə`
                }
                {property.is_renovated && ' • Təmirli'}
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="text-right space-y-2 flex-shrink-0">
            <div className="text-lg font-bold text-green-600">
              {getMainPrice()}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[property.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {listingTypeLabels[property.listing_type]}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Bax
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Redaktə et
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertyListView({ properties, loading, viewMode, onViewModeChange }: PropertyListViewProps) {
  if (loading) {
    return <PropertyLoadingSkeleton viewMode={viewMode} />;
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Əmlak tapılmadı</h3>
        <p className="mt-1 text-sm text-gray-500">
          Seçilmiş filtrlərə uyğun əmlak mövcud deyil.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {properties.length} əmlak tapıldı
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Properties Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <PropertyListItem key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}