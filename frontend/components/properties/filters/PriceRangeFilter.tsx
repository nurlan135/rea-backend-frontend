'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  disabled?: boolean;
}

// Predefined price ranges for quick selection
const priceRanges = [
  { label: '50K-100K', min: 50000, max: 100000 },
  { label: '100K-200K', min: 100000, max: 200000 },
  { label: '200K-300K', min: 200000, max: 300000 },
  { label: '300K-500K', min: 300000, max: 500000 },
  { label: '500K+', min: 500000, max: undefined }
];

export default function PriceRangeFilter({ minPrice, maxPrice, onChange, disabled }: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState<string>(minPrice?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(maxPrice?.toString() || '');

  useEffect(() => {
    setLocalMin(minPrice?.toString() || '');
    setLocalMax(maxPrice?.toString() || '');
  }, [minPrice, maxPrice]);

  const handleApply = useCallback(() => {
    const min = localMin ? parseInt(localMin) : undefined;
    const max = localMax ? parseInt(localMax) : undefined;
    
    // Validation
    if (min && max && min > max) {
      // Swap values if min > max
      onChange(max, min);
    } else {
      onChange(min, max);
    }
  }, [localMin, localMax, onChange]);

  const handleQuickSelect = (range: typeof priceRanges[0]) => {
    setLocalMin(range.min.toString());
    setLocalMax(range.max?.toString() || '');
    onChange(range.min, range.max);
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    onChange(undefined, undefined);
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  const isRangeActive = (range: typeof priceRanges[0]): boolean => {
    const currentMin = minPrice;
    const currentMax = maxPrice;
    
    return currentMin === range.min && currentMax === range.max;
  };

  const hasActiveRange = minPrice !== undefined || maxPrice !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Qiymət aralığı (AZN)</h4>
        {hasActiveRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs"
          >
            Təmizlə
          </Button>
        )}
      </div>

      {/* Quick Select Ranges */}
      <div className="flex flex-wrap gap-2">
        {priceRanges.map((range, index) => (
          <Badge
            key={index}
            variant={isRangeActive(range) ? "default" : "outline"}
            className="cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => !disabled && handleQuickSelect(range)}
          >
            {range.label}
          </Badge>
        ))}
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Min qiymət</label>
          <Input
            type="number"
            placeholder="50000"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onBlur={handleApply}
            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
            disabled={disabled}
            className="text-sm"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Max qiymət</label>
          <Input
            type="number"
            placeholder="200000"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onBlur={handleApply}
            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
            disabled={disabled}
            className="text-sm"
          />
        </div>
      </div>

      {/* Current Range Display */}
      {hasActiveRange && (
        <div className="text-center">
          <div className="text-sm text-gray-600">
            Seçilmiş aralıq: 
            <span className="font-medium text-gray-900 ml-1">
              {minPrice ? `${formatPrice(minPrice)} AZN` : 'Min yox'}
              {' - '}
              {maxPrice ? `${formatPrice(maxPrice)} AZN` : 'Max yox'}
            </span>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {localMin && localMax && parseInt(localMin) > parseInt(localMax) && (
        <div className="text-xs text-red-600 text-center">
          Minimum qiymət maksimumdan böyük ola bilməz
        </div>
      )}
    </div>
  );
}