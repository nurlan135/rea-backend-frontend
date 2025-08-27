'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApprovalButton } from '@/components/approvals/ApprovalButton';
import { ApprovalStatusBadge } from '@/components/approvals/ApprovalStatusBadge';
import { DataTable } from '@/components/ui/data-table';
import { Clock, Building, Calendar, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingProperty, PendingApprovalsResponse } from '@/types/approval';

const categoryLabels = {
  residential: 'Yaşayış',
  commercial: 'Qeyri-yaşayış'
};

const listingTypeLabels = {
  agency_owned: 'Agentlik',
  branch_owned: 'Filial', 
  brokerage: 'Vasitəçilik'
};

export default function ManagerApprovalsPage() {
  const { user, getAuthHeaders } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetcher function for SWR
  const fetcher = async (url: string): Promise<PendingApprovalsResponse> => {
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch pending approvals');
    }
    
    return response.json();
  };

  // SWR for real-time data fetching
  const { data, error, mutate, isLoading } = useSWR<PendingApprovalsResponse>(
    'http://localhost:8000/api/properties/approvals/pending',
    fetcher,
    {
      refreshInterval: 30000, // Auto refresh every 30 seconds
      revalidateOnFocus: true,
      key: `pending-approvals-${refreshKey}` // Force refresh with key change
    }
  );

  const handleApprovalSuccess = (propertyId: string, action: string) => {
    console.log(`${action} success for property ${propertyId}`);
    
    // Optimistically update the local data
    if (data?.success && data.data?.approvals) {
      const updatedData = {
        ...data,
        data: {
          ...data.data,
          approvals: data.data.approvals.filter(p => p.id !== propertyId)
        }
      };
      mutate(updatedData, false);
    }
    
    // Force a fresh fetch after a short delay
    setTimeout(() => {
      mutate();
      setRefreshKey(prev => prev + 1);
    }, 1000);
  };

  const handleManualRefresh = () => {
    mutate();
    setRefreshKey(prev => prev + 1);
  };

  if (error) {
    return (
      <DashboardLayout title="Təsdiqlər - Xəta">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Xəta baş verdi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Təsdiq gözləyən əmlaklar yüklənə bilmədi.</p>
            <Button onClick={handleManualRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenidən Yüklə
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const properties = data?.success && data.data?.approvals ? data.data.approvals : [];

  const columns = [
    {
      accessorKey: 'code',
      header: 'Kod',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      accessorKey: 'property_category',
      header: 'Kateqoriya',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span>{categoryLabels[row.original.property_category] || row.original.property_category}</span>
          <span className="text-gray-500">•</span>
          <span className="text-sm text-gray-600">{row.original.property_subcategory}</span>
        </div>
      ),
    },
    {
      accessorKey: 'listing_type',
      header: 'Tip',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
          {listingTypeLabels[row.original.listing_type] || row.original.listing_type}
        </span>
      ),
    },
    {
      accessorKey: 'area_m2',
      header: 'Sahə',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <span>{row.original.area_m2} m²</span>
      ),
    },
    {
      accessorKey: 'buy_price_azn',
      header: 'Qiymət',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <div className="text-right">
          {row.original.buy_price_azn ? (
            <span className="font-semibold text-green-600">
              {Number(row.original.buy_price_azn).toLocaleString()} AZN
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Yaradılma',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{new Date(row.original.created_at).toLocaleDateString('az-AZ')}</span>
          {row.original.days_pending && (
            <span className="text-yellow-600">({row.original.days_pending} gün)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_by',
      header: 'Yaradan',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-500" />
          <span>
            {row.original.created_by_first_name && row.original.created_by_last_name
              ? `${row.original.created_by_first_name} ${row.original.created_by_last_name}`
              : 'Məlum deyil'
            }
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <ApprovalStatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'actions',
      header: 'Əməliyyatlar',
      cell: ({ row }: { row: { original: PendingProperty } }) => (
        <div className="flex gap-2">
          <ApprovalButton
            propertyId={row.original.id}
            propertyCode={row.original.code}
            action="approve"
            onSuccess={handleApprovalSuccess}
          />
          <ApprovalButton
            propertyId={row.original.id}
            propertyCode={row.original.code}
            action="reject"
            onSuccess={handleApprovalSuccess}
          />
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Təsdiqlər">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Təsdiq Gözləyənlər
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : properties.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Təsdiqi gözləyən əmlaklar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bu Ay Təsdiqlər
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Tezliklə əlavə ediləcək
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Orta Baxış Vaxtı
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Tezliklə əlavə ediləcək
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Təsdiq Gözləyən Əmlaklar</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Aşağıda təsdiqi gözləyən bütün əmlaklar göstərilir
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Yenilə
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Yüklənir...</span>
                </div>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Təsdiq gözləyən əmlak yoxdur
                </h3>
                <p className="text-gray-500">
                  Bütün əmlaklar təsdiqlənib və ya heç bir yeni əmlak əlavə edilməyib.
                </p>
              </div>
            ) : (
              <DataTable 
                title="Təsdiq Gözləyən Əmlaklar" 
                columns={columns} 
                data={properties} 
                loading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}