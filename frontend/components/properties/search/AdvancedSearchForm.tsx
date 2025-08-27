'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  X, 
  Save, 
  RotateCcw,
  MapPin,
  Home,
  DollarSign,
  Square,
  Bed,
  Car,
  Zap,
  Loader2
} from 'lucide-react';

interface SearchCriteria {
  query?: string;
  property_category?: string;
  property_subcategory?: string;
  category?: string;
  listing_type?: string;
  district_id?: string;
  street_id?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  room_count?: string;
  construction_type?: string;
  is_renovated?: boolean;
  has_parking?: boolean;
  has_elevator?: boolean;
  features?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface AdvancedSearchFormProps {
  initialCriteria: SearchCriteria;
  onSearch: (criteria: SearchCriteria) => void;
  onSaveSearch: (name: string) => void;
  loading: boolean;
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

const saleCategories = [
  { value: 'sale', label: 'Satış' },
  { value: 'rent', label: 'İcarə' }
];

const listingTypes = [
  { value: 'agency_owned', label: 'Agentlik' },
  { value: 'branch_owned', label: 'Filial' },
  { value: 'brokerage', label: 'Vasitəçilik' }
];

const constructionTypes = [
  { value: 'new', label: 'Yeni tikili' },
  { value: 'old', label: 'Köhnə tikili' },
  { value: 'under_construction', label: 'İnşaat davam edir' }
];

const roomCounts = [
  { value: '1st', label: '1 otaq' },
  { value: '2st', label: '2 otaq' },
  { value: '3st', label: '3 otaq' },
  { value: '4st', label: '4 otaq' },
  { value: '5st', label: '5 otaq' },
  { value: '6+st', label: '6+ otaq' }
];

const sortOptions = [
  { value: 'created_at:desc', label: 'Ən yeni' },
  { value: 'created_at:asc', label: 'Ən köhnə' },
  { value: 'sell_price_azn:desc', label: 'Qiymət: Yüksək → Aşağı' },
  { value: 'sell_price_azn:asc', label: 'Qiymət: Aşağı → Yüksək' },
  { value: 'area_m2:desc', label: 'Sahə: Böyük → Kiçik' },
  { value: 'area_m2:asc', label: 'Sahə: Kiçik → Böyük' }
];

const commonFeatures = [
  'Mərkəzi isitmə', 'Kondisioner', 'Döşəmə isitmə', 'Təhlükəsizlik sistemi',
  'Konsierj', 'Kamera izləmə', 'Domofon', 'Lift', 'Avtomobil yeri',
  'Balkon', 'Terasa', 'Bağça', 'Üzmək hovuzu', 'İdman zalı',
  'Uşaq meydanı', 'Built-in mətbəx', 'Geyim otağı'
];

export default function AdvancedSearchForm({
  initialCriteria,
  onSearch,
  onSaveSearch,
  loading
}: AdvancedSearchFormProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>(initialCriteria);
  const [districts, setDistricts] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const form = useForm({
    defaultValues: initialCriteria
  });

  // Load districts on mount
  useEffect(() => {
    loadDistricts();
  }, []);

  // Update form when initial criteria changes
  useEffect(() => {
    setCriteria(initialCriteria);
    updateActiveFilters(initialCriteria);
  }, [initialCriteria]);

  // Load streets when district changes
  useEffect(() => {
    if (criteria.district_id) {
      loadStreets(criteria.district_id);
    } else {
      setStreets([]);
    }
  }, [criteria.district_id]);

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/lookup/districts');
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadStreets = async (districtId: string) => {
    try {
      const response = await fetch(`/api/lookup/streets?district_id=${districtId}`);
      if (response.ok) {
        const data = await response.json();
        setStreets(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load streets:', error);
      setStreets([]);
    }
  };

  const updateActiveFilters = (newCriteria: SearchCriteria) => {
    const filters = [];
    
    if (newCriteria.query) filters.push(`Axtarış: "${newCriteria.query}"`);
    if (newCriteria.property_category) {
      const cat = propertyCategories.find(c => c.value === newCriteria.property_category);
      filters.push(`Kateqoriya: ${cat?.label}`);
    }
    if (newCriteria.category) {
      const cat = saleCategories.find(c => c.value === newCriteria.category);
      filters.push(`Növ: ${cat?.label}`);
    }
    if (newCriteria.listing_type) {
      const type = listingTypes.find(t => t.value === newCriteria.listing_type);
      filters.push(`Mülkiyyət: ${type?.label}`);
    }
    if (newCriteria.min_price || newCriteria.max_price) {
      const min = newCriteria.min_price ? `${newCriteria.min_price.toLocaleString()}` : '0';
      const max = newCriteria.max_price ? `${newCriteria.max_price.toLocaleString()}` : '∞';
      filters.push(`Qiymət: ${min} - ${max} AZN`);
    }
    if (newCriteria.min_area || newCriteria.max_area) {
      const min = newCriteria.min_area || '0';
      const max = newCriteria.max_area || '∞';
      filters.push(`Sahə: ${min} - ${max} m²`);
    }
    if (newCriteria.room_count) {
      const room = roomCounts.find(r => r.value === newCriteria.room_count);
      filters.push(`Otaq: ${room?.label}`);
    }
    if (newCriteria.construction_type) {
      const type = constructionTypes.find(t => t.value === newCriteria.construction_type);
      filters.push(`Tikinti: ${type?.label}`);
    }
    if (newCriteria.is_renovated) filters.push('Təmirli');
    if (newCriteria.has_parking) filters.push('Avtomobil yeri');
    if (newCriteria.has_elevator) filters.push('Lift');
    if (newCriteria.features && newCriteria.features.length > 0) {
      filters.push(`Xüsusiyyətlər: ${newCriteria.features.length}`);
    }

    setActiveFilters(filters);
  };

  const handleInputChange = (field: keyof SearchCriteria, value: any) => {
    const newCriteria = { ...criteria, [field]: value };
    setCriteria(newCriteria);
    updateActiveFilters(newCriteria);
  };

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    const currentFeatures = criteria.features || [];
    const newFeatures = checked
      ? [...currentFeatures, feature]
      : currentFeatures.filter(f => f !== feature);
    
    handleInputChange('features', newFeatures);
  };

  const handleSearch = () => {
    onSearch(criteria);
  };

  const handleReset = () => {
    const emptyCriteria: SearchCriteria = {
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    setCriteria(emptyCriteria);
    updateActiveFilters(emptyCriteria);
  };

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      onSaveSearch(searchName.trim());
      setSaveDialogOpen(false);
      setSearchName('');
    }
  };

  const subcategories = criteria.property_category === 'residential' 
    ? residentialSubcategories 
    : commercialSubcategories;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Axtarış Formu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Search */}
          <div>
            <label className="text-sm font-medium">Ümumi axtarış</label>
            <Input
              placeholder="Əmlak kodu, ünvan, şəhər..."
              value={criteria.query || ''}
              onChange={(e) => handleInputChange('query', e.target.value)}
            />
          </div>

          {/* Property Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kateqoriya</label>
              <Select 
                value={criteria.property_category || ''} 
                onValueChange={(value) => handleInputChange('property_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Növ seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Hamısı</SelectItem>
                  {propertyCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Alt kateqoriya</label>
              <Select 
                value={criteria.property_subcategory || ''} 
                onValueChange={(value) => handleInputChange('property_subcategory', value)}
                disabled={!criteria.property_category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alt növ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Hamısı</SelectItem>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Business Category & Listing Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Satış/İcarə</label>
              <Select 
                value={criteria.category || ''} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Növ seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Hamısı</SelectItem>
                  {saleCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Mülkiyyət</label>
              <Select 
                value={criteria.listing_type || ''} 
                onValueChange={(value) => handleInputChange('listing_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Hamısı</SelectItem>
                  {listingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Yerləşmə
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Rayon</label>
                <Select 
                  value={criteria.district_id || ''} 
                  onValueChange={(value) => handleInputChange('district_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rayon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Hamısı</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Küçə</label>
                <Select 
                  value={criteria.street_id || ''} 
                  onValueChange={(value) => handleInputChange('street_id', value)}
                  disabled={!criteria.district_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Küçə seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Hamısı</SelectItem>
                    {streets.map((street) => (
                      <SelectItem key={street.id} value={street.id}>
                        {street.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Qiymət Aralığı (AZN)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Min qiymət</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={criteria.min_price || ''}
                  onChange={(e) => handleInputChange('min_price', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max qiymət</label>
                <Input
                  type="number"
                  placeholder="200000"
                  value={criteria.max_price || ''}
                  onChange={(e) => handleInputChange('max_price', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Area Range */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <Square className="h-4 w-4 mr-2" />
              Sahə Aralığı (m²)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Min sahə</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={criteria.min_area || ''}
                  onChange={(e) => handleInputChange('min_area', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max sahə</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={criteria.max_area || ''}
                  onChange={(e) => handleInputChange('max_area', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Room Count & Construction */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center">
                <Bed className="h-4 w-4 mr-2" />
                Otaq sayı
              </label>
              <Select 
                value={criteria.room_count || ''} 
                onValueChange={(value) => handleInputChange('room_count', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Otaq sayı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Hamısı</SelectItem>
                  {roomCounts.map((room) => (
                    <SelectItem key={room.value} value={room.value}>
                      {room.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Tikinti növü
              </label>
              <Select 
                value={criteria.construction_type || ''} 
                onValueChange={(value) => handleInputChange('construction_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tikinti növü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Hamısı</SelectItem>
                  {constructionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="renovated"
                checked={criteria.is_renovated || false}
                onCheckedChange={(checked) => handleInputChange('is_renovated', checked)}
              />
              <label htmlFor="renovated" className="text-sm font-medium">
                Təmirli
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="parking"
                checked={criteria.has_parking || false}
                onCheckedChange={(checked) => handleInputChange('has_parking', checked)}
              />
              <label htmlFor="parking" className="text-sm font-medium flex items-center">
                <Car className="h-4 w-4 mr-1" />
                Avtomobil yeri
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="elevator"
                checked={criteria.has_elevator || false}
                onCheckedChange={(checked) => handleInputChange('has_elevator', checked)}
              />
              <label htmlFor="elevator" className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Lift
              </label>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div>
            <h4 className="font-medium mb-3">Əlavə xüsusiyyətlər</h4>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {commonFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={criteria.features?.includes(feature) || false}
                    onCheckedChange={(checked) => handleFeatureToggle(feature, checked as boolean)}
                  />
                  <label htmlFor={feature} className="text-xs">
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sort */}
          <div>
            <label className="text-sm font-medium">Sıralama</label>
            <Select 
              value={`${criteria.sort_by || 'created_at'}:${criteria.sort_order || 'desc'}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split(':');
                handleInputChange('sort_by', sortBy);
                handleInputChange('sort_order', sortOrder as 'asc' | 'desc');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Aktiv Filtrlər ({activeFilters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary">
                  {filter}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={handleSearch} 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Axtarılır...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Axtarış Et
            </>
          )}
        </Button>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Təmizlə
          </Button>

          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Saxla
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Axtarışı Saxla</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Axtarış adını daxil edin"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSaveSearch}
                    disabled={!searchName.trim()}
                  >
                    Saxla
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSaveDialogOpen(false)}
                  >
                    Ləğv et
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}