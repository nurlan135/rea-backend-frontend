'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PropertyFormData, propertyFormSchema, getPropertyFormDefaults, getVisibleFields } from '@/lib/schemas/property';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { Save, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { propertiesApi } from '@/lib/api/properties';

// Import form sections
import PropertyBasicInfo from './PropertyBasicInfo';
import PropertyLocation from './PropertyLocation';
import AgencyPricing from './AgencyPricing';
import BrokeragePricing from './BrokeragePricing';
import PropertyFeatures from './PropertyFeatures';
import PropertyMedia from './PropertyMedia';

interface PropertyFormProps {
  mode: 'create' | 'edit';
  propertyId?: string;
  initialData?: Partial<PropertyFormData>;
  onSuccess?: (property: any) => void;
  onError?: (error: string) => void;
}

export default function PropertyForm({ 
  mode, 
  propertyId, 
  initialData, 
  onSuccess, 
  onError 
}: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      ...getPropertyFormDefaults(),
      ...initialData,
    },
  });

  const watchListingType = form.watch('listing_type');
  const visibleFields = getVisibleFields(watchListingType || '');
  
  // Auto-save functionality
  useEffect(() => {
    if (mode === 'edit' && propertyId) {
      const subscription = form.watch((value, { name, type }) => {
        if (type === 'change') {
          // Debounced auto-save
          const timeoutId = setTimeout(() => {
            handleAutoSave(value as PropertyFormData);
          }, 2000);
          
          return () => clearTimeout(timeoutId);
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, mode, propertyId]);

  const handleAutoSave = async (data: PropertyFormData) => {
    if (!propertyId || isSubmitting) return;
    
    try {
      setIsDraft(true);
      await propertiesApi.update(propertyId, { ...data, save_as_draft: true });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsDraft(false);
    }
  };

  const handleSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (mode === 'create') {
        result = await propertiesApi.create(data);
      } else if (propertyId) {
        result = await propertiesApi.update(propertyId, data);
      }
      
      if (result?.success) {
        onSuccess?.(result.data.property);
        
        if (mode === 'create') {
          // Redirect to the property detail page
          router.push(`/properties/${result.data.property.id}`);
        } else {
          // Show success message or redirect
          router.refresh();
        }
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Əmlak yadda saxlanarkən xəta baş verdi';
      onError?.(errorMessage);
      console.error('Property submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    const data = form.getValues();
    data.save_as_draft = true;
    
    setIsDraft(true);
    try {
      let result;
      
      if (mode === 'create') {
        result = await propertiesApi.create(data);
        if (result?.success) {
          // Switch to edit mode and update the propertyId
          router.push(`/properties/${result.data.property.id}/edit`);
        }
      } else if (propertyId) {
        result = await propertiesApi.update(propertyId, data);
      }
      
      setLastSaved(new Date());
    } catch (error: any) {
      onError?.(error.message || 'Draft yadda saxlanarkən xəta baş verdi');
    } finally {
      setIsDraft(false);
    }
  };

  const getFormProgress = () => {
    const requiredFields = [
      'property_category',
      'property_subcategory', 
      'area_m2',
      'category',
      'listing_type'
    ];
    
    const conditionalFields = [];
    if (visibleFields.agencyFields) {
      conditionalFields.push('buy_price_azn');
    }
    if (visibleFields.brokerageFields) {
      conditionalFields.push('owner_first_name', 'owner_last_name', 'owner_contact', 'brokerage_commission_percent');
    }
    
    const allRequiredFields = [...requiredFields, ...conditionalFields];
    const values = form.getValues();
    const completedFields = allRequiredFields.filter(field => {
      const value = values[field as keyof PropertyFormData];
      return value !== undefined && value !== null && value !== '';
    });
    
    return Math.round((completedFields.length / allRequiredFields.length) * 100);
  };

  const progress = getFormProgress();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {mode === 'create' ? 'Yeni Əmlak Yaradın' : 'Əmlakı Redaktə Edin'}
              </CardTitle>
              <CardDescription>
                {mode === 'create' 
                  ? 'Əmlak məlumatlarını daxil edərək sistemə əlavə edin'
                  : 'Əmlak məlumatlarını yeniləyin'
                }
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant={progress < 50 ? 'destructive' : progress < 100 ? 'secondary' : 'default'}>
                {progress}% tamamlandı
              </Badge>
              {lastSaved && (
                <p className="text-xs text-gray-500 mt-1">
                  Son yaddaşda saxlanma: {lastSaved.toLocaleTimeString('az-AZ')}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <PropertyBasicInfo form={form} />
          
          {/* Location */}
          <PropertyLocation form={form} />
          
          {/* Conditional Pricing Sections */}
          {visibleFields.agencyFields && <AgencyPricing form={form} />}
          {visibleFields.brokerageFields && <BrokeragePricing form={form} />}
          
          {/* Features */}
          <PropertyFeatures form={form} />
          
          {/* Media */}
          <PropertyMedia form={form} />

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {Object.keys(form.formState.errors).length > 0 && (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {Object.keys(form.formState.errors).length} xəta var
                      </span>
                    </div>
                  )}
                  
                  {progress < 100 && (
                    <div className="flex items-center text-amber-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        Bəzi məcburi sahələr boşdur
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Save as Draft */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isDraft || isSubmitting}
                  >
                    {isDraft ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saxlanır...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Draft Saxla
                      </>
                    )}
                  </Button>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || isDraft}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {mode === 'create' ? 'Yaradılır...' : 'Yenilənir...'}
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4 mr-2" />
                        {mode === 'create' ? 'Əmlak Yarat' : 'Dəyişiklikləri Saxla'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}