'use client';

import { UseFormReturn } from 'react-hook-form';
import { PropertyFormData } from '@/lib/schemas/property';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface PropertyFeaturesProps {
  form: UseFormReturn<PropertyFormData>;
}

// Common property features
const commonFeatures = [
  // Heating & Cooling
  { id: 'central_heating', label: 'Mərkəzi isitirmə', category: 'heating' },
  { id: 'air_conditioning', label: 'Kondisioner', category: 'heating' },
  { id: 'floor_heating', label: 'Döşəmə isitirmə', category: 'heating' },
  
  // Security
  { id: 'security_system', label: 'Təhlükəsizlik sistemi', category: 'security' },
  { id: 'concierge', label: 'Konsierj', category: 'security' },
  { id: 'cctv', label: 'Kameraların izlənmə sistemi', category: 'security' },
  { id: 'intercom', label: 'Domofonun sistemi', category: 'security' },
  
  // Amenities
  { id: 'elevator', label: 'Lift', category: 'amenities' },
  { id: 'parking', label: 'Avtomobil yeri', category: 'amenities' },
  { id: 'balcony', label: 'Balkon', category: 'amenities' },
  { id: 'terrace', label: 'Terasa', category: 'amenities' },
  { id: 'garden', label: 'Bağça', category: 'amenities' },
  { id: 'pool', label: 'Üzmək hovuzu', category: 'amenities' },
  { id: 'gym', label: 'İdman zalı', category: 'amenities' },
  { id: 'playground', label: 'Uşaq meydanı', category: 'amenities' },
  
  // Interior
  { id: 'built_in_kitchen', label: 'Built-in mətbəx', category: 'interior' },
  { id: 'walk_in_closet', label: 'Geyim otağı', category: 'interior' },
  { id: 'master_bathroom', label: 'Master vanna otağı', category: 'interior' },
  { id: 'guest_bathroom', label: 'Qonaq vanna otağı', category: 'interior' },
  { id: 'laundry_room', label: 'Çamaşırhana', category: 'interior' },
  { id: 'storage_room', label: 'Anbar otağı', category: 'interior' },
  
  // Utilities
  { id: 'high_speed_internet', label: 'Yüksək sürətli internet', category: 'utilities' },
  { id: 'cable_tv', label: 'Kabel TV', category: 'utilities' },
  { id: 'gas_supply', label: 'Qaz təchizatı', category: 'utilities' },
  { id: 'backup_generator', label: 'Ehtiyat generator', category: 'utilities' }
];

// Group features by category
const featureCategories = {
  heating: 'İsitmə və Soyutma',
  security: 'Təhlükəsizlik',
  amenities: 'Imkanlar',
  interior: 'Daxili',
  utilities: 'Kommunal Xidmətlər'
};

export default function PropertyFeatures({ form }: PropertyFeaturesProps) {
  const [customFeature, setCustomFeature] = useState('');
  const watchFeatures = form.watch('features') || [];

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    const currentFeatures = form.getValues('features') || [];
    const feature = commonFeatures.find(f => f.id === featureId);
    
    if (!feature) return;
    
    if (checked) {
      // Add feature if not already present
      if (!currentFeatures.includes(feature.label)) {
        form.setValue('features', [...currentFeatures, feature.label]);
      }
    } else {
      // Remove feature
      form.setValue('features', currentFeatures.filter(f => f !== feature.label));
    }
  };

  const addCustomFeature = () => {
    if (!customFeature.trim()) return;
    
    const currentFeatures = form.getValues('features') || [];
    if (!currentFeatures.includes(customFeature.trim())) {
      form.setValue('features', [...currentFeatures, customFeature.trim()]);
      setCustomFeature('');
    }
  };

  const removeCustomFeature = (featureToRemove: string) => {
    const currentFeatures = form.getValues('features') || [];
    form.setValue('features', currentFeatures.filter(f => f !== featureToRemove));
  };

  const isFeatureSelected = (featureLabel: string) => {
    return watchFeatures.includes(featureLabel);
  };

  const getCustomFeatures = () => {
    const commonFeatureLabels = commonFeatures.map(f => f.label);
    return watchFeatures.filter(f => !commonFeatureLabels.includes(f));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xüsusiyyətlər və Təsvir</CardTitle>
        <CardDescription>
          Əmlakın xüsusiyyətlərini və ətraflı təsvirini əlavə edin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Common Features by Category */}
        {Object.entries(featureCategories).map(([categoryId, categoryName]) => {
          const categoryFeatures = commonFeatures.filter(f => f.category === categoryId);
          
          return (
            <div key={categoryId} className="space-y-3">
              <h4 className="font-medium text-gray-900">{categoryName}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.id}
                      checked={isFeatureSelected(feature.label)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
                    />
                    <label 
                      htmlFor={feature.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Custom Feature Addition */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Fərdi Xüsusiyyət Əlavə Et</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Xüsusiyyət adını daxil edin..."
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addCustomFeature}
              disabled={!customFeature.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Custom Features */}
        {getCustomFeatures().length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Fərdi Xüsusiyyətlər</h4>
            <div className="flex flex-wrap gap-2">
              {getCustomFeatures().map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeCustomFeature(feature)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* All Selected Features Display */}
        {watchFeatures.length > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">
              Seçilmiş Xüsusiyyətlər ({watchFeatures.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {watchFeatures.map((feature, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Property Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ətraflı Təsvir</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Əmlakın ətraflı təsvirini daxil edin... (məsələn: lokasiya üstünlükləri, ətrafdakı məktəb və xəstəxana, nəqliyyat əlçatanlığı, əmlakın vəziyyəti və s.)"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Əmlakın üstünlüklərini, ətrafdakı infrastrukturu, nəqliyyat əlçatanlığını və digər vacib məlumatları qeyd edin (maksimum 2000 simvol)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Feature Guidelines */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Xüsusiyyət Seçimi Məsləhətləri</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Yalnız həqiqətən mövcud olan xüsusiyyətləri seçin</li>
            <li>• Əmlakın qiymətini artıran önəmli xüsusiyyətləri vurğulayın</li>
            <li>• Təsvirdə əmlakın unikal cəhətlərini qeyd edin</li>
            <li>• Ətrafdakı infrastrukturu (məktəb, xəstəxana, nəqliyyat) qeyd edin</li>
            <li>• İstifadəçilər üçün önəmli olan məlumatları əlavə edin</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}