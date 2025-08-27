'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Timer
} from 'lucide-react';

interface BookingInfoProps {
  activeBooking?: any;
  property: any;
  currentUser?: any;
}

const bookingStatusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const bookingStatusLabels = {
  ACTIVE: 'Aktiv',
  EXPIRED: 'Müddəti bitmib',
  COMPLETED: 'Tamamlanıb',
  CANCELLED: 'Ləğv edilib'
};

const bookingStatusIcons = {
  ACTIVE: CheckCircle,
  EXPIRED: XCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle
};

export default function BookingInfo({ activeBooking, property, currentUser }: BookingInfoProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDateShort = (dateString: string) => {
    return new Intl.DateTimeFormat('az-AZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getRemainingTime = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} gün ${hours} saat`;
    } else if (hours > 0) {
      return `${hours} saat ${minutes} dəqiqə`;
    } else {
      return `${minutes} dəqiqə`;
    }
  };

  if (!activeBooking) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Booking Məlumatları</h2>
          <p className="text-gray-600">Bu əmlak üçün aktiv booking yoxdur</p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aktiv Booking Yoxdur</h3>
              <p className="text-sm mb-4">
                Bu əmlak hazırda heç kim tərəfindən booking edilməyib və sərbəst vəziyyətdədir.
              </p>
              
              {property.status === 'active' && currentUser?.role === 'agent' && (
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Users className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Məlumat:</strong> Bu əmlakı müştəri üçün booking edə bilərsiniz.
                      Booking müddəti adətən 24-72 saat arasında olur.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking History Placeholder */}
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="text-gray-400">
              <Clock className="h-8 w-8 mx-auto mb-3" />
              <h4 className="font-medium mb-2">Booking Tarixçəsi</h4>
              <p className="text-sm">
                Bu əmlak üçün əvvəlki booking məlumatları burada göstəriləcək
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = bookingStatusIcons[activeBooking.status as keyof typeof bookingStatusIcons] || CheckCircle;
  const remainingTime = activeBooking.expiry_date ? getRemainingTime(activeBooking.expiry_date) : null;
  const isExpiring = remainingTime && activeBooking.expiry_date && 
    new Date(activeBooking.expiry_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Aktiv Booking</h2>
        <p className="text-gray-600">Bu əmlak üçün mövcud booking məlumatları</p>
      </div>

      {/* Active Booking Status Alert */}
      <Alert className={`border-2 ${
        activeBooking.status === 'ACTIVE' 
          ? isExpiring ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
          : activeBooking.status === 'EXPIRED' 
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-gray-50'
      }`}>
        <StatusIcon className={`h-4 w-4 ${
          activeBooking.status === 'ACTIVE' 
            ? isExpiring ? 'text-orange-600' : 'text-green-600'
            : activeBooking.status === 'EXPIRED' 
            ? 'text-red-600'
            : 'text-gray-600'
        }`} />
        <AlertDescription className={
          activeBooking.status === 'ACTIVE' 
            ? isExpiring ? 'text-orange-800' : 'text-green-800'
            : activeBooking.status === 'EXPIRED' 
            ? 'text-red-800'
            : 'text-gray-800'
        }>
          <div className="flex items-center justify-between">
            <div>
              <strong>
                {activeBooking.status === 'ACTIVE' ? 'Bu əmlak aktiv booking edilib' : 
                 activeBooking.status === 'EXPIRED' ? 'Booking müddəti bitib' :
                 'Booking statusu dəyişib'}
              </strong>
              {remainingTime && activeBooking.status === 'ACTIVE' && (
                <div className="mt-1 text-sm">
                  {isExpiring ? 'Diqqət: ' : ''}Qalan müddət: <strong>{remainingTime}</strong>
                </div>
              )}
            </div>
            <Badge className={bookingStatusColors[activeBooking.status as keyof typeof bookingStatusColors]}>
              {bookingStatusLabels[activeBooking.status as keyof typeof bookingStatusLabels]}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Booking Detalları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Booking Date */}
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Booking Tarixi</h4>
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(activeBooking.booking_date)}
              </div>
            </div>

            {/* Expiry Date */}
            {activeBooking.expiry_date && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Bitmə Tarixi</h4>
                <div className="flex items-center text-gray-700">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatDate(activeBooking.expiry_date)}
                </div>
              </div>
            )}

            {/* Booking Amount */}
            {activeBooking.booking_amount && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Booking Məbləği</h4>
                <div className="text-lg font-semibold text-green-600">
                  {new Intl.NumberFormat('az-AZ', {
                    style: 'currency',
                    currency: 'AZN',
                    minimumFractionDigits: 0,
                  }).format(activeBooking.booking_amount)}
                </div>
              </div>
            )}

            {/* Duration */}
            {activeBooking.booking_date && activeBooking.expiry_date && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Müddət</h4>
                <div className="flex items-center text-gray-700">
                  <Timer className="h-4 w-4 mr-2" />
                  {Math.ceil((new Date(activeBooking.expiry_date).getTime() - new Date(activeBooking.booking_date).getTime()) / (1000 * 60 * 60 * 24))} gün
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Müştəri Məlumatları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            {(activeBooking.customer_first_name || activeBooking.customer_last_name) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Ad Soyad</h4>
                <p className="text-gray-700">
                  {activeBooking.customer_first_name} {activeBooking.customer_last_name}
                </p>
              </div>
            )}

            {/* Customer Phone */}
            {activeBooking.customer_phone && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Telefon</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">{activeBooking.customer_phone}</span>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Zəng
                  </Button>
                </div>
              </div>
            )}

            {/* Customer Email */}
            {activeBooking.customer_email && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">{activeBooking.customer_email}</span>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {activeBooking.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Qeydlər</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {activeBooking.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Actions */}
      {currentUser?.role === 'agent' && activeBooking.status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Əməliyyatları</CardTitle>
            <CardDescription>
              Bu booking üçün mövcud əməliyyatlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Satışa çevir
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Müddəti uzat
              </Button>
              <Button variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Booking-i ləğv et
              </Button>
            </div>
            
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Xatırlatma:</strong> Booking əməliyyatları sistem loglarında saxlanılır və audit edilir.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}