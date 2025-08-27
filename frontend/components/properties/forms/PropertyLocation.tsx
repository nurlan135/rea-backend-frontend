'use client';

import { UseFormReturn } from 'react-hook-form';
import { PropertyFormData } from '@/lib/schemas/property';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';

interface PropertyLocationProps {
  form: UseFormReturn<PropertyFormData>;
}

interface LookupOption {
  id: string;
  name: string;
}

export default function PropertyLocation({ form }: PropertyLocationProps) {
  const [districts, setDistricts] = useState<LookupOption[]>([]);
  const [streets, setStreets] = useState<LookupOption[]>([]);
  const [complexes, setComplexes] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState({
    districts: true,
    streets: false,
    complexes: true
  });

  const watchDistrictId = form.watch('district_id');
  const watchComplexId = form.watch('complex_id');

  // Load districts and complexes on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load districts
        const districtsResponse = await fetch('/api/lookup/districts');
        if (districtsResponse.ok) {
          const districtsData = await districtsResponse.json();
          setDistricts(districtsData.data || []);
        }

        // Load complexes  
        const complexesResponse = await fetch('/api/lookup/complexes');
        if (complexesResponse.ok) {
          const complexesData = await complexesResponse.json();
          setComplexes(complexesData.data || []);
        }
      } catch (error) {
        console.error('Failed to load lookup data:', error);
      } finally {
        setLoading({ districts: false, streets: false, complexes: false });
      }
    };

    loadInitialData();
  }, []);

  // Load streets when district changes
  useEffect(() => {
    if (!watchDistrictId) {
      setStreets([]);
      return;
    }

    const loadStreets = async () => {
      setLoading(prev => ({ ...prev, streets: true }));
      try {
        const response = await fetch(`/api/lookup/streets?district_id=${watchDistrictId}`);
        if (response.ok) {
          const data = await response.json();
          setStreets(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load streets:', error);
        setStreets([]);
      } finally {
        setLoading(prev => ({ ...prev, streets: false }));
      }
    };

    loadStreets();
  }, [watchDistrictId]);

  // Reset street when district changes
  useEffect(() => {
    if (watchDistrictId) {
      form.setValue('street_id', '');
    }
  }, [watchDistrictId, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yerləşmə</CardTitle>
        <CardDescription>
          Əmlakın yerləşmə məlumatlarını daxil edin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* District & Street */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="district_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rayon</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loading.districts ? "Yüklənir..." : "Rayon seçin"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Küçə</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!watchDistrictId || loading.streets}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !watchDistrictId ? "Əvvəl rayon seçin" :
                        loading.streets ? "Yüklənir..." :
                        "Küçə seçin"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {streets.map((street) => (
                      <SelectItem key={street.id} value={street.id}>
                        {street.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Complex Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="complex_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yaşayış Kompleksi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loading.complexes ? "Yüklənir..." : "Kompleks seçin"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {complexes.map((complex) => (
                      <SelectItem key={complex.id} value={complex.id}>
                        {complex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Siyahıda yoxdursa, aşağıda manual daxil edin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="complex_manual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kompleks (Manual)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Kompleks adını daxil edin" 
                    {...field}
                    disabled={!!watchComplexId}
                  />
                </FormControl>
                <FormDescription>
                  Yalnız siyahıda kompleks yoxdursa istifadə edin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Building Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="building"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bina</FormLabel>
                <FormControl>
                  <Input placeholder="25A, 104/2" {...field} />
                </FormControl>
                <FormDescription>
                  Bina nömrəsi və ya kodu
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apt_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mənzil №</FormLabel>
                <FormControl>
                  <Input placeholder="25, A-25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="block"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blok</FormLabel>
                <FormControl>
                  <Input placeholder="A, B, 1A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Entrance Door */}
        <FormField
          control={form.control}
          name="entrance_door"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giriş qapısı</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="1, 2, 3" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                />
              </FormControl>
              <FormDescription>
                Binanın hansı girişində yerləşir
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Full Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tam ünvan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tam ünvan məlumatını daxil edin..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Əmlakın tam və dəqiq ünvanı (GPS koordinatları da daxil edə bilərsiniz)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}