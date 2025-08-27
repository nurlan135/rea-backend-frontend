'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface LocationFilterProps {
  districtId?: string;
  streetId?: string;
  onChange: (districtId: string | undefined, streetId: string | undefined) => void;
  disabled?: boolean;
}

interface LookupOption {
  id: string;
  name: string;
}

export default function LocationFilter({ districtId, streetId, onChange, disabled }: LocationFilterProps) {
  const [districts, setDistricts] = useState<LookupOption[]>([]);
  const [streets, setStreets] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState({
    districts: true,
    streets: false
  });

  // Load districts on mount
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        setLoading(prev => ({ ...prev, districts: true }));
        const response = await fetch('/api/lookup/districts');
        if (response.ok) {
          const data = await response.json();
          setDistricts(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load districts:', error);
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    };

    loadDistricts();
  }, []);

  // Load streets when district changes
  useEffect(() => {
    if (!districtId) {
      setStreets([]);
      return;
    }

    const loadStreets = async () => {
      try {
        setLoading(prev => ({ ...prev, streets: true }));
        const response = await fetch(`/api/lookup/streets?district_id=${districtId}`);
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
  }, [districtId]);

  const handleDistrictChange = (value: string) => {
    const newDistrictId = value || undefined;
    // Reset street when district changes
    onChange(newDistrictId, undefined);
  };

  const handleStreetChange = (value: string) => {
    const newStreetId = value || undefined;
    onChange(districtId, newStreetId);
  };

  const handleClear = () => {
    onChange(undefined, undefined);
  };

  const hasSelection = districtId || streetId;
  const selectedDistrict = districts.find(d => d.id === districtId);
  const selectedStreet = streets.find(s => s.id === streetId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Yerləşmə</h4>
        {hasSelection && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* District Selection */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Rayon</label>
          <Select 
            value={districtId || ''} 
            onValueChange={handleDistrictChange}
            disabled={disabled || loading.districts}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                loading.districts ? "Yüklənir..." : "Rayon seçin"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Bütün rayonlar</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Street Selection */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Küçə</label>
          <Select 
            value={streetId || ''} 
            onValueChange={handleStreetChange}
            disabled={disabled || !districtId || loading.streets}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !districtId ? "Əvvəl rayon seçin" :
                loading.streets ? "Yüklənir..." :
                "Küçə seçin"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Bütün küçələr</SelectItem>
              {streets.map((street) => (
                <SelectItem key={street.id} value={street.id}>
                  {street.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Selection Display */}
      {hasSelection && (
        <div className="text-center">
          <div className="text-sm text-gray-600">
            Seçilmiş yerləşmə: 
            <span className="font-medium text-gray-900 ml-1">
              {selectedDistrict?.name || 'Bütün rayonlar'}
              {selectedStreet && ` → ${selectedStreet.name}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}