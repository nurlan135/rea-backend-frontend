"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KPICard, KPIGrid } from "@/components/ui/kpi-card"
import { SimpleTable } from "@/components/ui/simple-table"
import { Timeline } from "@/components/ui/timeline"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  Calendar, 
  Phone, 
  TrendingUp, 
  Target,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Plus
} from "lucide-react"

interface AgentDashboardProps {
  className?: string
}

export default function AgentDashboard({ className }: AgentDashboardProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        kpis: {
          activeProperties: 8,
          activeBookings: 3,
          monthlyTarget: 15,
          monthlyCompleted: 7,
          todaysCalls: 12,
          monthlyCommission: 2400
        },
        recentActivities: [
          {
            id: '1',
            title: 'Yeni əmlak əlavə edildi',
            description: 'Yasamal rayonu, 3 otaqlı mənzil',
            timestamp: '10 dəqiqə əvvəl',
            status: 'completed' as const
          },
          {
            id: '2', 
            title: 'Müştəri zəngi',
            description: 'Rəşad Məmmədov - əmlak baxışı',
            timestamp: '25 dəqiqə əvvəl',
            status: 'completed' as const
          },
          {
            id: '3',
            title: 'Rezervasiya təsdiqləndi',
            description: 'Nəsimi rayonu, 2 otaqlı mənzil',
            timestamp: '1 saat əvvəl', 
            status: 'completed' as const
          }
        ],
        properties: [
          {
            id: 1,
            title: 'Yasamal rayonu, 3 otaqlı',
            price: 95000,
            status: 'active',
            views: 24,
            bookings: 2,
            createdAt: '2024-01-15'
          },
          {
            id: 2,
            title: 'Nəsimi rayonu, 2 otaqlı', 
            price: 72000,
            status: 'booked',
            views: 18,
            bookings: 1,
            createdAt: '2024-01-12'
          }
        ]
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const propertyColumns = [
    { 
      key: 'title', 
      label: 'Əmlak',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    { 
      key: 'price', 
      label: 'Qiymət',
      render: (value: number) => `₼ ${value.toLocaleString()}`
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : value === 'booked' ? 'secondary' : 'outline'}>
          {value === 'active' ? 'Aktiv' : value === 'booked' ? 'Rezerv edilib' : value}
        </Badge>
      )
    },
    { 
      key: 'views', 
      label: 'Baxış',
      render: (value: number) => value.toString()
    },
    { 
      key: 'bookings', 
      label: 'Rezerv',
      render: (value: number) => value.toString()
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Paneli</h1>
          <p className="text-muted-foreground">
            Bu gün sizin performansınız və aktiv əmlaklar
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Əmlak
        </Button>
      </div>

      {/* KPI Cards */}
      <KPIGrid columns={3}>
        <KPICard
          title="Aktiv Əmlaklar"
          value={data.kpis.activeProperties}
          icon={<Building className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+2',
            label: 'bu həftə'
          }}
        />
        <KPICard
          title="Aktiv Rezervlər"
          value={data.kpis.activeBookings}
          icon={<Calendar className="h-4 w-4" />}
          trend={{
            direction: 'neutral',
            value: '0',
            label: 'dəyişiklik yoxdur'
          }}
        />
        <KPICard
          title="Bu günkü zənglər"
          value={data.kpis.todaysCalls}
          icon={<Phone className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+4',
            label: 'dünənə nisbətən'
          }}
        />
      </KPIGrid>

      {/* Performance & Target Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Aylıq Performans
            </CardTitle>
            <CardDescription>
              Bu ay hədəfinizə nail olma vəziyyəti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tamamlanmış</span>
                <span className="text-sm text-muted-foreground">
                  {data.kpis.monthlyCompleted} / {data.kpis.monthlyTarget}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(data.kpis.monthlyCompleted / data.kpis.monthlyTarget) * 100}%` 
                  }}
                />
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600">
                  {Math.round((data.kpis.monthlyCompleted / data.kpis.monthlyTarget) * 100)}% tamamlandı
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Aylıq Komissiya
            </CardTitle>
            <CardDescription>
              Bu ay qazandığınız komissiya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                ₼ {data.kpis.monthlyCommission.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600">+12% keçən aya nisbətən</span>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Ətraflı Hesabat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Properties */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Son Aktivlər
              </CardTitle>
              <CardDescription>
                Sizin son fəaliyyətləriniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline items={data.recentActivities} />
            </CardContent>
          </Card>
        </div>

        {/* Active Properties */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Aktiv Əmlaklar
              </CardTitle>
              <CardDescription>
                Sizin hazırkı aktiv əmlak elanları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleTable
                data={data.properties}
                columns={propertyColumns}
                loading={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tez Əməliyyatlar</CardTitle>
          <CardDescription>
            Tez-tez istifadə etdiyiniz əməliyyatlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex-col">
              <Plus className="h-5 w-5 mb-1" />
              Yeni Əmlak
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-5 w-5 mb-1" />
              Rezervasiya
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Phone className="h-5 w-5 mb-1" />
              Müştəri Zəngi
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-5 w-5 mb-1" />
              Müştəri Bazası
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}