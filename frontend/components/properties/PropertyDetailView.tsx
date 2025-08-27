'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Edit, 
  Calendar, 
  User, 
  MapPin, 
  Home, 
  Layers, 
  Square, 
  Bed, 
  Phone,
  Mail,
  Share2,
  Bookmark,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import ImageGallery from './ImageGallery';
import PropertySpecs from './PropertySpecs';
import BookingInfo from './BookingInfo';
import ExpensesList from './ExpensesList';

interface PropertyDetailViewProps {
  property: any;
  activeBooking?: any;
  expenses?: any[];
  onBookProperty?: () => void;
  onEditProperty?: () => void;
  currentUser?: any;
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
  agency_owned: 'Agentlik malı',
  branch_owned: 'Filial malı',
  brokerage: 'Vasitəçilik'
};

export default function PropertyDetailView({
  property,
  activeBooking,
  expenses = [],
  onBookProperty,
  onEditProperty,
  currentUser
}: PropertyDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'booking' | 'expenses'>('overview');
  
  const formatPrice = (price: number, currency = 'AZN') => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const canEdit = currentUser?.role === 'admin' || 
                 currentUser?.role === 'manager' || 
                 (currentUser?.role === 'agent' && property.agent_id === currentUser.id);

  const canBook = currentUser?.role === 'agent' && 
                  property.status === 'active' && 
                  !activeBooking;

  const getMainPrice = () => {
    if (property.category === 'sale' && property.sell_price_azn) {
      return { amount: property.sell_price_azn, label: 'Satış qiyməti' };
    } else if (property.category === 'rent' && property.rent_price_monthly_azn) {
      return { amount: property.rent_price_monthly_azn, label: 'Aylıq icarə' };
    } else if (property.listing_type !== 'brokerage' && property.buy_price_azn) {
      return { amount: property.buy_price_azn, label: 'Alış qiyməti' };
    }
    return null;
  };

  const mainPrice = getMainPrice();

  const tabs = [
    { id: 'overview', label: 'Ümumi', icon: Home },
    { id: 'specs', label: 'Xüsusiyyətlər', icon: Layers },
    { id: 'booking', label: 'Booking', icon: Users, count: activeBooking ? 1 : 0 },
    { id: 'expenses', label: 'Xərclər', icon: DollarSign, count: expenses.length }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{property.property_code}</h1>
          <div className="flex items-center space-x-3">
            <Badge className={statusColors[property.status]}>
              {statusLabels[property.status]}
            </Badge>
            <Badge variant="outline">
              {categoryLabels[property.category]}
            </Badge>
            <Badge variant="outline">
              {listingTypeLabels[property.listing_type]}
            </Badge>
            {property.is_renovated && (
              <Badge variant="outline" className="text-green-600">
                Təmirli
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {property.property_subcategory}
            {property.district_name && ` • ${property.district_name}`}
            {property.street_name && ` • ${property.street_name}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Paylaş
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Qeyd et
          </Button>
          {canBook && (
            <Button onClick={onBookProperty} className="bg-orange-600 hover:bg-orange-700">
              <Users className="h-4 w-4 mr-2" />
              Book et
            </Button>
          )}
          {canEdit && (
            <Button onClick={onEditProperty}>
              <Edit className="h-4 w-4 mr-2" />
              Redaktə et
            </Button>
          )}
        </div>
      </div>

      {/* Active Booking Alert */}
      {activeBooking && (
        <Alert className="border-orange-200 bg-orange-50">
          <Users className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Aktiv booking:</strong> Bu əmlak hazırda booking edilib.
            Booking tarixi: {formatDate(activeBooking.booking_date)}
            {activeBooking.expiry_date && (
              <span> • Bitmə tarixi: {formatDate(activeBooking.expiry_date)}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <ImageGallery 
            images={property.images || []} 
            videos={property.videos || []}
            propertyCode={property.property_code}
          />

          {/* Navigation Tabs */}
          <div className="border-b">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {tab.count}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                {property.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Təsvir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {property.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Xüsusiyyətlər</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Location Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Yerləşmə
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.address && (
                      <div>
                        <h4 className="font-medium text-gray-900">Tam ünvan</h4>
                        <p className="text-gray-700">{property.address}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {property.district_name && (
                        <div>
                          <h4 className="font-medium text-gray-900">Rayon</h4>
                          <p className="text-gray-700">{property.district_name}</p>
                        </div>
                      )}
                      {property.street_name && (
                        <div>
                          <h4 className="font-medium text-gray-900">Küçə</h4>
                          <p className="text-gray-700">{property.street_name}</p>
                        </div>
                      )}
                      {property.complex_name && (
                        <div>
                          <h4 className="font-medium text-gray-900">Kompleks</h4>
                          <p className="text-gray-700">{property.complex_name}</p>
                        </div>
                      )}
                      {property.building && (
                        <div>
                          <h4 className="font-medium text-gray-900">Bina</h4>
                          <p className="text-gray-700">{property.building}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'specs' && (
              <PropertySpecs property={property} />
            )}

            {activeTab === 'booking' && (
              <BookingInfo 
                activeBooking={activeBooking}
                property={property}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesList 
                expenses={expenses}
                property={property}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Qiymət Məlumatları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mainPrice && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">{mainPrice.label}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(mainPrice.amount)}
                  </p>
                </div>
              )}

              {property.listing_type !== 'brokerage' && property.buy_price_azn && mainPrice?.label !== 'Alış qiyməti' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Alış qiyməti</h3>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatPrice(property.buy_price_azn)}
                  </p>
                </div>
              )}

              {property.listing_type === 'brokerage' && property.brokerage_commission_percent && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Komissiya</h3>
                  <p className="text-lg font-semibold">
                    {property.brokerage_commission_percent}%
                  </p>
                  {mainPrice && (
                    <p className="text-sm text-gray-500">
                      ≈ {formatPrice((mainPrice.amount * property.brokerage_commission_percent) / 100)}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium">Sahə</h4>
                  <p>{property.area_m2} m²</p>
                </div>
                {property.room_count && (
                  <div>
                    <h4 className="font-medium">Otaq</h4>
                    <p>{property.room_count}</p>
                  </div>
                )}
                {property.floor && (
                  <div>
                    <h4 className="font-medium">Mərtəbə</h4>
                    <p>{property.floor}/{property.floors_total || '?'}</p>
                  </div>
                )}
                {property.construction_type && (
                  <div>
                    <h4 className="font-medium">Tikinti</h4>
                    <p>{property.construction_type}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          {(property.listing_type === 'brokerage' ? 
            (property.owner_first_name || property.owner_contact) : 
            (property.agent_first_name || property.agent_phone)
          ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {property.listing_type === 'brokerage' ? 'Malik Məlumatları' : 'Agent Məlumatları'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.listing_type === 'brokerage' ? (
                  <>
                    {(property.owner_first_name || property.owner_last_name) && (
                      <div>
                        <h4 className="font-medium text-gray-900">Ad Soyad</h4>
                        <p className="text-gray-700">
                          {property.owner_first_name} {property.owner_last_name}
                        </p>
                      </div>
                    )}
                    {property.owner_contact && (
                      <div>
                        <h4 className="font-medium text-gray-900">Əlaqə</h4>
                        <p className="text-gray-700">{property.owner_contact}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Phone className="h-4 w-4 mr-2" />
                          Zəng et
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {(property.agent_first_name || property.agent_last_name) && (
                      <div>
                        <h4 className="font-medium text-gray-900">Agent</h4>
                        <p className="text-gray-700">
                          {property.agent_first_name} {property.agent_last_name}
                        </p>
                      </div>
                    )}
                    {property.agent_phone && (
                      <div>
                        <h4 className="font-medium text-gray-900">Telefon</h4>
                        <p className="text-gray-700">{property.agent_phone}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Phone className="h-4 w-4 mr-2" />
                          Zəng et
                        </Button>
                      </div>
                    )}
                    {property.agent_email && (
                      <div>
                        <h4 className="font-medium text-gray-900">Email</h4>
                        <Button variant="outline" size="sm" className="mt-1">
                          <Mail className="h-4 w-4 mr-2" />
                          Email göndər
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Əmlak Məlumatları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-900">Yaradılma tarixi</h4>
                <p className="text-gray-700">
                  {formatDate(property.created_at)}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Son yenilənmə</h4>
                <p className="text-gray-700">
                  {formatDate(property.updated_at)}
                </p>
              </div>

              {property.created_by_first_name && (
                <div>
                  <h4 className="font-medium text-gray-900">Yaradan şəxs</h4>
                  <p className="text-gray-700">
                    {property.created_by_first_name} {property.created_by_last_name}
                  </p>
                </div>
              )}

              {property.branch_name && (
                <div>
                  <h4 className="font-medium text-gray-900">Filial</h4>
                  <p className="text-gray-700">{property.branch_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}