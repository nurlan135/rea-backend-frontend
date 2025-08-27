'use client';

import { UseFormReturn } from 'react-hook-form';
import { PropertyFormData } from '@/lib/schemas/property';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AgencyPricingProps {
  form: UseFormReturn<PropertyFormData>;
}

export default function AgencyPricing({ form }: AgencyPricingProps) {
  const watchListingType = form.watch('listing_type');
  const watchCategory = form.watch('category');
  const watchBuyPrice = form.watch('buy_price_azn');
  
  // Only show for agency_owned and branch_owned
  if (!['agency_owned', 'branch_owned'].includes(watchListingType || '')) {
    return null;
  }

  const isAgencyOwned = watchListingType === 'agency_owned';
  const cardTitle = isAgencyOwned ? 'Agentlik Qiymətləndirmə' : 'Filial Qiymətləndirmə';
  const cardDescription = isAgencyOwned 
    ? 'Agentliyin öz malı üçün qiymətləndirmə məlumatları'
    : 'Filialın öz malı üçün qiymətləndirmə məlumatları';

  // Calculate potential profit
  const calculateProfit = () => {
    const buyPrice = watchBuyPrice || 0;
    const sellPrice = form.watch('sell_price_azn') || 0;
    if (buyPrice > 0 && sellPrice > 0) {
      const profit = sellPrice - buyPrice;
      const profitPercent = ((profit / buyPrice) * 100).toFixed(1);
      return { profit, profitPercent };
    }
    return null;
  };

  const profitInfo = calculateProfit();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Buy Price */}
        <FormField
          control={form.control}
          name="buy_price_azn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alış Qiyməti (AZN) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="150000" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormDescription>
                {isAgencyOwned 
                  ? 'Agentliyin bu əmlakı aldığı qiymət'
                  : 'Filialın bu əmlakı aldığı qiymət'
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional Pricing Based on Category */}
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
                    placeholder="180000" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Əmlakın satış qiyməti (optional - sonra təyin edilə bilər)
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
                    placeholder="800" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Aylıq icarə haqqı (optional - sonra təyin edilə bilər)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Both Sale and Rent for Mixed Properties */}
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
                    placeholder="800" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Əgər həm satış həm də icarə mümkündürsə (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Profit Calculation Display */}
        {profitInfo && watchCategory === 'sale' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Gözlənilən Mənfəət</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Mənfəət məbləği:</span>
                <p className="font-semibold text-green-900">
                  {profitInfo.profit.toLocaleString()} AZN
                </p>
              </div>
              <div>
                <span className="text-green-700">Mənfəət faizi:</span>
                <p className="font-semibold text-green-900">
                  {profitInfo.profitPercent}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROI for Rental Properties */}
        {watchCategory === 'rent' && watchBuyPrice && form.watch('rent_price_monthly_azn') && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">İcarə Gəlirliyi</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Aylıq gəlirlilik:</span>
                <p className="font-semibold text-blue-900">
                  {((form.watch('rent_price_monthly_azn') || 0) / watchBuyPrice * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <span className="text-blue-700">İllik gəlirlilik:</span>
                <p className="font-semibold text-blue-900">
                  {((form.watch('rent_price_monthly_azn') || 0) * 12 / watchBuyPrice * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Strategy Tips */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Qiymətləndirmə Məsləhətləri</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ətrafdakı oxşar əmlakların qiymətlərini araşdırın</li>
            <li>• Əmlakın vəziyyəti və yerləşməsini nəzərə alın</li>
            <li>• Bazaar tələbini və təklifi qiymətləndirin</li>
            {watchCategory === 'rent' && (
              <li>• İcarə üçün aylıq gəlirlilik 2-4% arasında olmalıdır</li>
            )}
            {watchCategory === 'sale' && (
              <li>• Satış mənfəəti 15-30% arasında məqsədəuyğundur</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}