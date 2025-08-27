'use client';

import { UseFormReturn } from 'react-hook-form';
import { PropertyFormData } from '@/lib/schemas/property';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface PropertyBasicInfoProps {
  form: UseFormReturn<PropertyFormData>;
}

const propertyCategories = [
  { value: 'residential', label: 'Yaşayış' },
  { value: 'commercial', label: 'Kommersiya' }
];

const residentialSubcategories = [
  { value: 'apartment', label: 'Mənzil' },
  { value: 'house', label: 'Ev' },
  { value: 'villa', label: 'Villa' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' }
];

const commercialSubcategories = [
  { value: 'office', label: 'Ofis' },
  { value: 'shop', label: 'Mağaza' },
  { value: 'warehouse', label: 'Anbar' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'hotel', label: 'Otel' },
  { value: 'industrial', label: 'Sənaye' }
];

const constructionTypes = [
  { value: 'new', label: 'Yeni tikili' },
  { value: 'old', label: 'Köhnə tikili' },
  { value: 'under_construction', label: 'Tikinti davam edir' }
];

const saleCategories = [
  { value: 'sale', label: 'Satış' },
  { value: 'rent', label: 'İcarə' }
];

const listingTypes = [
  { value: 'agency_owned', label: 'Agentlik malı' },
  { value: 'branch_owned', label: 'Filial malı' },
  { value: 'brokerage', label: 'Vasitəçilik' }
];

const roomCounts = [
  { value: '1st', label: '1 otaq' },
  { value: '2st', label: '2 otaq' },
  { value: '3st', label: '3 otaq' },
  { value: '4st', label: '4 otaq' },
  { value: '5st', label: '5 otaq' },
  { value: '6+st', label: '6+ otaq' }
];

export default function PropertyBasicInfo({ form }: PropertyBasicInfoProps) {
  const watchCategory = form.watch('property_category');
  const watchListingType = form.watch('listing_type');

  const subcategories = watchCategory === 'residential' ? residentialSubcategories : commercialSubcategories;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Əsas Məlumatlar</CardTitle>
        <CardDescription>
          Əmlakın əsas məlumatlarını daxil edin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Category & Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="property_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Əmlak Kateqoriyası *</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset subcategory when category changes
                    form.setValue('property_subcategory', '');
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kateqoriya seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {propertyCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
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
            name="property_subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alt Kateqoriya *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Alt kateqoriya seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.value} value={sub.value}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Construction Type */}
        <FormField
          control={form.control}
          name="construction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tikinti Növü</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tikinti növü seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {constructionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Business Category & Listing Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Satış/İcarə *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Növ seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {saleCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
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
            name="listing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mülkiyyət Növü *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Mülkiyyət növü seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {listingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {watchListingType === 'brokerage' 
                    ? 'Vasitəçilik: Başqa mülk sahibinin əmlakı'
                    : watchListingType === 'agency_owned'
                    ? 'Agentlik malı: Agentliyin öz əmlakı'
                    : 'Filial malı: Filialın öz əmlakı'
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Physical Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="area_m2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sahə (m²) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="90" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="room_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Otaq sayı</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Otaq sayı" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roomCounts.map((room) => (
                      <SelectItem key={room.value} value={room.value}>
                        {room.label}
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
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hündürlük (m)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="3.0" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Floor Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mərtəbə</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floors_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ümumi mərtəbə sayı</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="12" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Renovation Status */}
        <FormField
          control={form.control}
          name="is_renovated"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Təmirli
                </FormLabel>
                <FormDescription>
                  Əmlak təmirli vəziyyətdədir
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}