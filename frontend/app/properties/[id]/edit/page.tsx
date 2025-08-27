'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyForm from '@/components/properties/forms/PropertyForm';
import { useAuth } from '@/lib/context/AuthContext';
import { propertiesApi } from '@/lib/api/properties';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function EditPropertyPage() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<any>(null);
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && propertyId) {
      loadProperty();
    }
  }, [user, authLoading, propertyId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await propertiesApi.getById(propertyId);
      
      if (response.success) {
        setPropertyData(response.data.property);
        
        // Check if user has permission to edit this property
        const property = response.data.property;
        const canEdit = user.role === 'admin' || 
                       user.role === 'manager' || 
                       (user.role === 'agent' && property.agent_id === user.id);
        
        if (!canEdit) {
          setError('Bu əmlakı redaktə etmək üçün icazəniz yoxdur');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Əmlak məlumatları yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (property: any) => {
    setSuccess(`Əmlak uğurla yeniləndi: ${property.property_code}`);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (error && !propertyData) {
    return (
      <DashboardLayout title="Xəta">
        <div className="max-w-md mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (!propertyData) {
    return (
      <DashboardLayout title="Əmlak Tapılmadı">
        <div className="max-w-md mx-auto mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tələb olunan əmlak tapılmadı
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Check permissions
  const canEdit = user.role === 'admin' || 
                 user.role === 'manager' || 
                 (user.role === 'agent' && propertyData.agent_id === user.id);

  if (!canEdit) {
    return (
      <DashboardLayout title="Səlahiyyət Yoxdur">
        <div className="max-w-md mx-auto mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bu əmlakı redaktə etmək üçün icazəniz yoxdur
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Redaktə: ${propertyData.property_code}`}>
      <div className="space-y-6">
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <PropertyForm
          mode="edit"
          propertyId={propertyId}
          initialData={propertyData}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </DashboardLayout>
  );
}