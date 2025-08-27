'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Building, MapPin, Calendar, Edit, Trash2, Archive, ArrowLeft, 
  DollarSign, FileText, User, Users, Phone, MessageCircle, CheckCircle, Clock
} from 'lucide-react';

interface PropertyDetails {
  id: string;
  code: string;
  project?: string;
  building?: string;
  apt_no?: string;
  floor: number;
  floors_total?: number;
  area_m2: number;
  rooms_count?: number;
  status: 'pending' | 'active' | 'sold' | 'archived';
  category: 'sale' | 'rent';
  listing_type: 'agency_owned' | 'branch_owned' | 'brokerage';
  docs_type?: string;
  address?: string;
  district?: string;
  street?: string;
  features: string[];
  images: string[];
  videos: string[];
  buy_price_azn?: number;
  target_price_azn?: number;
  sell_price_azn?: number;
  is_renovated: boolean;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_father_name?: string;
  owner_contact?: string;
  brokerage_commission_percent?: number;
  created_at: string;
  updated_at: string;
  branch_name?: string;
  branch_code?: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  assigned_to_first_name?: string;
  assigned_to_last_name?: string;
  active_bookings: any[];
  recent_communications: any[];
  expenses: any[];
  total_expenses: number;
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
  agency_owned: 'Agentlik Əmlakı',
  branch_owned: 'Filial Əmlakı',
  brokerage: 'Vasitəçilik'
};

const expenseCategoryLabels = {
  repair: 'Təmir',
  docs: 'Sənədləşmə',
  tax: 'Vergi',
  agent_comm: 'Agent komissiyası',
  admin: 'İdari xərclər',
  other: 'Digər'
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const propertyId = params?.id as string;

  const fetchProperty = async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`http://localhost:8000/api/properties/${propertyId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Əmlak tapılmadı');
        }
        throw new Error('Əmlak məlumatları yüklənərkən xəta baş verdi');
      }

      const data = await response.json();
      setProperty(data.data.property);

    } catch (err: any) {
      console.error('Error fetching property:', err);
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && propertyId) {
      fetchProperty();
    }
  }, [user, authLoading, propertyId]);

  const handleArchive = async () => {
    if (!confirm('Əmlakı arxivləmək istədiyinizdən əminsinizmi?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Əmlak arxivlənərkən xəta baş verdi');
      }

      router.push('/properties');
    } catch (err: any) {
      console.error('Archive error:', err);
      setError(err.message);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '—';
    return price.toLocaleString('az-AZ') + ' AZN';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Xəta baş verdi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <Button onClick={fetchProperty}>
              Yenidən cəhd et
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <DashboardLayout title={property ? `Əmlak: ${property.code}` : 'Əmlak Detalları'}>
      <div className="max-w-6xl mx-auto">
        {/* Action Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[property.status]}>
                  {statusLabels[property.status]}
                </Badge>
              </div>
                {property.project && (
                  <p className="text-lg text-gray-600 mt-1">
                    {property.project}
                    {property.building && ` - ${property.building}`}
                    {property.apt_no && ` - Mənzil ${property.apt_no}`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => router.push(`/properties/${propertyId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Redaktə et
              </Button>
              {property.status !== 'archived' && (
                <Button 
                  variant="outline"
                  onClick={handleArchive}
                  className="text-red-600 hover:text-red-700"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arxivə göndər
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Təfərrüatlar</TabsTrigger>
                <TabsTrigger value="expenses">
                  Xərclər ({property.expenses.length})
                </TabsTrigger>
                <TabsTrigger value="bookings">
                  Bronlar ({property.active_bookings.length})
                </TabsTrigger>
                <TabsTrigger value="communications">
                  Əlaqə ({property.recent_communications.length})
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Əsas Məlumatlar</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Kateqoriya</p>
                          <p className="font-medium">{categoryLabels[property.category]}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Əmlak Tipi</p>
                          <p className="font-medium">{listingTypeLabels[property.listing_type]}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sahə</p>
                          <p className="font-medium">{property.area_m2} m²</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Otaq sayı</p>
                          <p className="font-medium">{property.rooms_count || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Mərtəbə</p>
                          <p className="font-medium">{property.floor} / {property.floors_total || '?'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Təmir vəziyyəti</p>
                          <p className="font-medium">{property.is_renovated ? 'Təmirli' : 'Təmirsiz'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sənəd növü</p>
                          <p className="font-medium">{property.docs_type || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Filial</p>
                          <p className="font-medium">{property.branch_name || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    {(property.address || property.district || property.street) && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Ünvan</h3>
                          <div className="space-y-2">
                            {property.district && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Rayon</p>
                                  <p className="font-medium">{property.district}</p>
                                </div>
                              </div>
                            )}
                            {property.street && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Küçə</p>
                                  <p className="font-medium">{property.street}</p>
                                </div>
                              </div>
                            )}
                            {property.address && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Tam ünvan</p>
                                  <p className="font-medium">{property.address}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Features */}
                    {property.features && property.features.length > 0 && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Xüsusiyyətlər</h3>
                          <div className="flex flex-wrap gap-2">
                            {property.features.map((feature: string) => (
                              <Badge key={feature} variant="secondary">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Owner Information (for Brokerage) */}
                    {property.listing_type === 'brokerage' && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Mülkiyyətçi Məlumatları</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Ad Soyad</p>
                              <p className="font-medium">
                                {property.owner_first_name} {property.owner_last_name}
                                {property.owner_father_name && ` ${property.owner_father_name}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Əlaqə</p>
                              <p className="font-medium">{property.owner_contact}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Komissiya Faizi</p>
                              <p className="font-medium">{property.brokerage_commission_percent}%</p>
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Created/Updated Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Sistem Məlumatları</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Yaradılıb</p>
                          <p className="font-medium">
                            {property.created_by_first_name} {property.created_by_last_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(property.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Təyin edilib</p>
                          <p className="font-medium">
                            {property.assigned_to_first_name} {property.assigned_to_last_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(property.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <CardTitle>Xərclər</CardTitle>
                    <CardDescription>
                      Cəmi xərclər: {formatPrice(property.total_expenses)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {property.expenses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Xərc qeydi mövcud deyil</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {property.expenses.map((expense: any) => (
                          <div key={expense.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge variant="outline" className="mb-2">
                                  {expenseCategoryLabels[expense.category as keyof typeof expenseCategoryLabels] || expense.category}
                                </Badge>
                                <p className="font-semibold text-lg">
                                  {formatPrice(expense.amount_azn)}
                                </p>
                                {expense.note && (
                                  <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>{formatDate(expense.spent_at || expense.created_at)}</p>
                                {expense.currency !== 'AZN' && (
                                  <p className="mt-1">
                                    {expense.original_amount} {expense.currency}
                                    <br />
                                    (1 {expense.currency} = {expense.fx_rate} AZN)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bookings Tab */}
              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Aktiv Bronlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {property.active_bookings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Aktiv bron mövcud deyil</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {property.active_bookings.map((booking: any) => (
                          <div key={booking.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">
                                  {booking.first_name} {booking.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{booking.phone}</p>
                                {booking.deposit_amount && (
                                  <p className="text-sm mt-1">
                                    Depozit: {formatPrice(booking.deposit_amount)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge className="bg-orange-100 text-orange-800">Aktiv</Badge>
                                <p className="text-sm text-gray-500 mt-1">
                                  Bitir: {formatDate(booking.end_date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communications Tab */}
              <TabsContent value="communications">
                <Card>
                  <CardHeader>
                    <CardTitle>Son Əlaqə Qeydləri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {property.recent_communications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Əlaqə qeydi mövcud deyil</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {property.recent_communications.map((comm: any) => (
                          <div key={comm.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                {comm.type === 'call' && <Phone className="h-4 w-4 mt-0.5 text-gray-500" />}
                                {comm.type === 'sms' && <MessageCircle className="h-4 w-4 mt-0.5 text-gray-500" />}
                                <div>
                                  <p className="font-medium">
                                    {comm.customer_first_name} {comm.customer_last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">{comm.message || comm.note}</p>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>{comm.direction === 'in' ? 'Gələn' : 'Gedən'}</p>
                                <p>{formatDate(comm.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Information */}
            <Card>
              <CardHeader>
                <CardTitle>Qiymət Məlumatları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.listing_type !== 'brokerage' && (
                  <div>
                    <p className="text-sm text-gray-500">Alış Qiyməti</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice(property.buy_price_azn)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Hədəf Qiymət</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatPrice(property.target_price_azn)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Satış Qiyməti</p>
                  <p className="text-xl font-bold">
                    {formatPrice(property.sell_price_azn)}
                  </p>
                </div>
                {property.total_expenses > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500">Cəmi Xərclər</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatPrice(property.total_expenses)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Tez Əməliyyatlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Bron Yarat
                </Button>
                <Button className="w-full" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Zəng Qeydi Əlavə Et
                </Button>
                <Button className="w-full" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Xərc Əlavə Et
                </Button>
                {property.status === 'pending' && (
                  <Button className="w-full" variant="default">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Təsdiq üçün Göndər
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}