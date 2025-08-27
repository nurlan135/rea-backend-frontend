'use client';

import { UseFormReturn } from 'react-hook-form';
import { PropertyFormData } from '@/lib/schemas/property';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BrokeragePricingProps {
  form: UseFormReturn<PropertyFormData>;
}

export default function BrokeragePricing({ form }: BrokeragePricingProps) {
  const watchListingType = form.watch('listing_type');
  const watchCategory = form.watch('category');
  const watchCommission = form.watch('brokerage_commission_percent');
  const watchSellPrice = form.watch('sell_price_azn');
  const watchRentPrice = form.watch('rent_price_monthly_azn');
  
  // Only show for brokerage
  if (watchListingType !== 'brokerage') {
    return null;
  }

  // Calculate commission amounts
  const calculateCommission = () => {
    if (!watchCommission) return null;
    
    let commissionAmount = 0;
    let period = '';
    
    if (watchCategory === 'sale' && watchSellPrice) {
      commissionAmount = (watchSellPrice * watchCommission) / 100;
      period = 'satışdan';
    } else if (watchCategory === 'rent' && watchRentPrice) {
      commissionAmount = (watchRentPrice * watchCommission) / 100;
      period = 'aylıq icarədən';
    }
    
    return commissionAmount > 0 ? { amount: commissionAmount, period } : null;
  };

  const commissionInfo = calculateCommission();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vasitəçilik Məlumatları</CardTitle>
        <CardDescription>
          Malik və komissiya məlumatları
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner Information */}
        <div>
          <h4 className="text-lg font-medium mb-4">Malik Məlumatları</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="owner_first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malik Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Əli" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malik Soyadı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Əliyev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={form.control}
              name="owner_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Malik Əlaqə Məlumatı *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Telefon, email və ya digər əlaqə məlumatları" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Telefon nömrəsi, email ünvanı və ya digər əlaqə vasitələri
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Commission Information */}
        <div>
          <h4 className="text-lg font-medium mb-4">Komissiya Məlumatları</h4>
          
          <FormField
            control={form.control}
            name="brokerage_commission_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Komissiya Faizi (%) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="50"
                    placeholder="5.0" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Satış və ya icarə qiymətindən alınacaq komissiya faizi (0.1% - 50%)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Pricing Information */}
        <div>
          <h4 className="text-lg font-medium mb-4">Qiymət Məlumatları</h4>
          
          {watchCategory === 'sale' && (
            <FormField
              control={form.control}
              name="sell_price_azn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satış Qiyməti (AZN)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="200000" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Malikin təyin etdiyi satış qiyməti (optional - sonra dəyişə bilər)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchCategory === 'rent' && (
            <FormField
              control={form.control}
              name="rent_price_monthly_azn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aylıq İcarə Haqqı (AZN)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1000" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Malikin təyin etdiyi aylıq icarə haqqı (optional - sonra dəyişə bilər)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Alternative pricing if both sale and rent possible */}
          {watchCategory === 'sale' && (
            <FormField
              control={form.control}
              name="rent_price_monthly_azn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternativ İcarə Haqqı (AZN)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1000" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Əgər malik həm satış həm də icarə seçənəyi təklif edirsə
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Commission Calculator */}
        {commissionInfo && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Gözlənilən Komissiya</h4>
            <div className="text-sm">
              <p className="text-blue-700">
                {commissionInfo.period} alınacaq komissiya:
              </p>
              <p className="font-semibold text-blue-900 text-lg">
                {commissionInfo.amount.toLocaleString()} AZN
              </p>
              {watchCategory === 'rent' && (
                <p className="text-blue-600 mt-1">
                  İcarə müqavilələrində komissiya adətən ilk aydan alınır
                </p>
              )}
            </div>
          </div>
        )}

        {/* Brokerage Guidelines */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Vasitəçilik Qaydaları</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Malik ilə yazılı müqavilə imzalanmalıdır</li>
            <li>• Komissiya faizi öncədən razılaşdırılmalıdır</li>
            <li>• Malik əlaqə məlumatları dəqiq olmalıdır</li>
            <li>• Satış komissiyası adətən 2-10% arasındadır</li>
            <li>• İcarə komissiyası adətən 50-100% (ilk ay) arasındadır</li>
            <li>• Bütün qiymət dəyişiklikləri malikin razılığı ilə olur</li>
          </ul>
        </div>

        {/* Commission Calculation Examples */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Komissiya Hesablama Nümunələri</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            {watchCategory === 'sale' && (
              <div>
                <strong>Satış üçün:</strong> 200,000 AZN qiymətli ev üçün 5% komissiya = 10,000 AZN
              </div>
            )}
            {watchCategory === 'rent' && (
              <div>
                <strong>İcarə üçün:</strong> 1,000 AZN aylıq icarə üçün 100% komissiya = 1,000 AZN (ilk ay)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}