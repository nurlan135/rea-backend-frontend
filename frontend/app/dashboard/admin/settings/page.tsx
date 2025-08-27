'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Landmark,
  Route,
  Settings,
  Database
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const settingsSections = [
  {
    title: 'Komplekslər',
    description: 'Layihə və komplekslərin idarəsi',
    icon: Building2,
    href: '/dashboard/admin/settings/complexes',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Rayonlar',
    description: 'Şəhər rayonlarının idarəsi',
    icon: MapPin,
    href: '/dashboard/admin/settings/districts',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Küçələr',
    description: 'Küçə adlarının idarəsi',
    icon: Route,
    href: '/dashboard/admin/settings/streets',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Sənəd Növləri',
    description: 'Mülkiyyət sənəd növləri',
    icon: FileText,
    href: '/dashboard/admin/settings/document-types',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Filiallar',
    description: 'Şirkət filiallarının idarəsi',
    icon: Landmark,
    href: '/dashboard/admin/settings/branches',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  }
];

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout title="Sistem Tənzimləməsi">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem Məlumatları</h1>
            <p className="text-gray-600">
              Əmlak sistemində istifadə olunan əsas məlumatları idarə edin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsSections.map((section) => {
              const IconComponent = section.icon;
              
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${section.bgColor}`}>
                          <IconComponent className={`h-6 w-6 ${section.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">{section.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        İdarə Et
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* System Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-gray-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sistem Versiyası</p>
                    <p className="text-2xl font-bold">v1.0.0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sistem Statusu</p>
                    <p className="text-2xl font-bold text-green-600">Aktiv</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Son Yeniləmə</p>
                    <p className="text-lg font-bold">Bu gün</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}