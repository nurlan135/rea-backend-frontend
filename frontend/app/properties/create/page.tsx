'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyForm from '@/components/properties/forms/PropertyForm';
import { useAuth } from '@/lib/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function CreatePropertyPage() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { user, isLoading: authLoading } = useAuth();

  const handleSuccess = (property: any) => {
    setSuccess(`Əmlak uğurla yaradıldı: ${property.property_code}`);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
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

  if (!['agent', 'manager', 'admin'].includes(user.role)) {
    return (
      <DashboardLayout title="Səlahiyyət Yoxdur">
        <div className="max-w-md mx-auto mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Əmlak yaratmaq üçün icazəniz yoxdur.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Yeni Əmlak">
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
          mode="create"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </DashboardLayout>
  );
}