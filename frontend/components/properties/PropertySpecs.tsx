'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Layers, 
  Square, 
  Bed, 
  Bath, 
  Car, 
  Zap, 
  Thermometer,
  Shield,
  Wifi,
  Building
} from 'lucide-react';

interface PropertySpecsProps {
  property: any;
}

const getSpecIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    'area': Square,
    'rooms': Bed,
    'floor': Building,
    'construction': Home,
    'utilities': Zap,
    'heating': Thermometer,
    'security': Shield,
    'amenities': Car,
    'internet': Wifi,
    'default': Layers
  };
  
  return iconMap[category] || iconMap.default;
};

const formatSpecValue = (key: string, value: any) => {
  if (value === null || value === undefined) return 'Məlumat yoxdur';
  
  switch (key) {
    case 'area_m2':
      return `${value} m²`;
    case 'floor':
      return `${value}${value === 1 ? '-ci' : value === 2 ? '-ci' : value === 3 ? '-cü' : '-cü'} mərtəbə`;
    case 'floors_total':
      return `${value} mərtəbəli`;
    case 'height':
      return `${value} m`;
    case 'entrance_door':
      return `${value} nömrəli giriş`;
    case 'is_renovated':
      return value ? 'Bəli' : 'Xeyr';
    default:
      return value;
  }
};

const getSpecLabel = (key: string) => {
  const labelMap: { [key: string]: string } = {
    'area_m2': 'Sahə',
    'floor': 'Mərtəbə',
    'floors_total': 'Ümumi mərtəbə',
    'room_count': 'Otaq sayı',
    'height': 'Hündürlük',
    'construction_type': 'Tikinti növü',
    'property_category': 'Əmlak kateqoriyası',
    'property_subcategory': 'Alt kateqoriya',
    'building': 'Bina',
    'apt_no': 'Mənzil nömrəsi',
    'block': 'Blok',
    'entrance_door': 'Giriş qapısı',
    'is_renovated': 'Təmirli',
    'complex_name': 'Kompleks',
    'complex_manual': 'Kompleks (manual)'
  };
  
  return labelMap[key] || key;
};

const getSpecCategory = (key: string) => {
  const categoryMap: { [key: string]: string } = {
    'area_m2': 'area',
    'room_count': 'rooms',
    'floor': 'floor',
    'floors_total': 'floor',
    'height': 'construction',
    'construction_type': 'construction',
    'property_category': 'construction',
    'property_subcategory': 'construction',
    'building': 'construction',
    'apt_no': 'construction',
    'block': 'construction',
    'entrance_door': 'construction',
    'is_renovated': 'construction',
    'complex_name': 'construction',
    'complex_manual': 'construction'
  };
  
  return categoryMap[key] || 'default';
};

export default function PropertySpecs({ property }: PropertySpecsProps) {
  // Group specifications by category
  const specs = [
    { key: 'area_m2', value: property.area_m2 },
    { key: 'room_count', value: property.room_count },
    { key: 'floor', value: property.floor },
    { key: 'floors_total', value: property.floors_total },
    { key: 'height', value: property.height },
    { key: 'construction_type', value: property.construction_type },
    { key: 'property_category', value: property.property_category },
    { key: 'property_subcategory', value: property.property_subcategory },
    { key: 'building', value: property.building },
    { key: 'apt_no', value: property.apt_no },
    { key: 'block', value: property.block },
    { key: 'entrance_door', value: property.entrance_door },
    { key: 'is_renovated', value: property.is_renovated },
    { key: 'complex_name', value: property.complex_name },
    { key: 'complex_manual', value: property.complex_manual }
  ].filter(spec => spec.value !== null && spec.value !== undefined && spec.value !== '');

  const groupedSpecs = specs.reduce((acc, spec) => {
    const category = getSpecCategory(spec.key);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(spec);
    return acc;
  }, {} as { [key: string]: typeof specs });

  const specCategories = [
    {
      id: 'area',
      title: 'Sahə və Ölçülər',
      description: 'Əmlakın sahəsi və fiziki ölçüləri',
      icon: Square
    },
    {
      id: 'rooms',
      title: 'Otaq Tərkibi',
      description: 'Otaq sayı və tərkibi',
      icon: Bed
    },
    {
      id: 'floor',
      title: 'Mərtəbə Məlumatları',
      description: 'Mərtəbə və bina məlumatları',
      icon: Building
    },
    {
      id: 'construction',
      title: 'Tikinti və Struktur',
      description: 'Tikinti növü və struktur məlumatları',
      icon: Home
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Texniki Xüsusiyyətlər</h2>
        <p className="text-gray-600">Əmlakın ətraflı texniki məlumatları</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {specCategories.map((category) => {
          const categorySpecs = groupedSpecs[category.id] || [];
          
          if (categorySpecs.length === 0) return null;

          const Icon = category.icon;

          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Icon className="h-5 w-5 mr-2 text-blue-600" />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorySpecs.map((spec) => (
                    <div key={spec.key} className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        {getSpecLabel(spec.key)}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatSpecValue(spec.key, spec.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Əlavə Məlumatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Listing Type Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Mülkiyyət Növü</h4>
              <Badge variant="outline" className="mb-2">
                {property.listing_type === 'agency_owned' ? 'Agentlik malı' :
                 property.listing_type === 'branch_owned' ? 'Filial malı' :
                 'Vasitəçilik'}
              </Badge>
              <p className="text-sm text-gray-600">
                {property.listing_type === 'agency_owned' 
                  ? 'Bu əmlak agentliyin öz mülkiyyətindədir'
                  : property.listing_type === 'branch_owned'
                  ? 'Bu əmlak filialın öz mülkiyyətindədir'
                  : 'Bu əmlak vasitəçilik yolu ilə təklif edilir'
                }
              </p>
            </div>

            {/* Category Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Satış/İcarə</h4>
              <Badge variant="outline" className="mb-2">
                {property.category === 'sale' ? 'Satış' : 'İcarə'}
              </Badge>
              <p className="text-sm text-gray-600">
                {property.category === 'sale' 
                  ? 'Bu əmlak satış üçün təklif edilir'
                  : 'Bu əmlak icarəyə verilir'
                }
              </p>
            </div>

            {/* Status Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
              <Badge 
                className={
                  property.status === 'active' ? 'bg-green-100 text-green-800' :
                  property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }
              >
                {property.status === 'active' ? 'Aktiv' :
                 property.status === 'pending' ? 'Gözləmədə' :
                 property.status === 'sold' ? 'Satılıb' :
                 'Arxiv'}
              </Badge>
              <p className="text-sm text-gray-600">
                {property.status === 'active' 
                  ? 'Əmlak aktiv vəziyyətdədir və satışa hazırdır'
                  : property.status === 'pending'
                  ? 'Əmlak təsdiq gözləyir'
                  : property.status === 'sold'
                  ? 'Əmlak artıq satılıb'
                  : 'Əmlak arxivlənib'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Energy Efficiency & Certifications (Future) */}
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">
            <Zap className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Enerji Səmərəliliyi</h3>
            <p className="text-sm">
              Enerji sertifikatları və səmərəlilik məlumatları gələcəkdə əlavə ediləcək
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}