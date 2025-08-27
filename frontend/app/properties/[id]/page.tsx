'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { propertiesApi } from '@/lib/api/properties';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyDetailView from '@/components/properties/PropertyDetailView';
import BookingModal from '@/components/properties/BookingModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && propertyId) {
      loadPropertyData();
    }
  }, [user, authLoading, propertyId]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await propertiesApi.getById(propertyId);
      
      if (response.success) {
        setProperty(response.data.property);
        setActiveBooking(response.data.activeBooking || null);
        setExpenses(response.data.expenses || []);
      }
    } catch (err: any) {
      console.error('Error loading property:', err);
      setError(err.message || 'Əmlak məlumatları yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = (booking: any) => {
    setActiveBooking(booking);
    setBookingModalOpen(false);
    loadPropertyData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Əmlak məlumatları yüklənir...</p>
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

  if (error && !property) {
    return (
      <DashboardLayout title="Xəta">
        <div className="max-w-md mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout title="Əmlak Tapılmadı">
        <div className="max-w-md mx-auto mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Tələb olunan əmlak tapılmadı</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={property.property_code}>
      <PropertyDetailView
        property={property}
        activeBooking={activeBooking}
        expenses={expenses}
        onBookProperty={() => setBookingModalOpen(true)}
        onEditProperty={() => router.push(`/properties/${propertyId}/edit`)}
        currentUser={user}
      />

      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        propertyId={propertyId}
        property={property}
        onSuccess={handleBookingSuccess}
        onError={(error) => console.error('Booking error:', error)}
      />
    </DashboardLayout>
  );
}