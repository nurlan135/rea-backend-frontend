"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KPICard, KPIGrid } from "@/components/ui/kpi-card"
import { SimpleTable } from "@/components/ui/simple-table"
import { ApprovalTimeline } from "@/components/ui/timeline"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Users, 
  Building, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  Target,
  Shield
} from "lucide-react"

interface DirectorDashboardProps {
  className?: string
}

export default function DirectorDashboard({ className }: DirectorDashboardProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        kpis: {
          totalRevenue: 487500,
          totalProperties: 156,
          totalAgents: 24,
          approvalsPending: 8,
          monthlyGrowth: 12.5,
          customerSatisfaction: 94.2
        },
        pendingApprovals: [
          {
            id: '1',
            title: 'Yeni əmlak elanı - Yasamal',
            role: 'Manager',
            user: 'Elçin Məmmədov',
            status: 'pending' as const,
            timestamp: '2 saat əvvəl',
            reason: 'Bölgə üzrə yüksək qiymət təklifi'
          },
          {
            id: '2',
            title: 'Böyük məbləğli satış - 250K',
            role: 'VP',
            user: 'Aygün Qasımova',
            status: 'pending' as const,
            timestamp: '4 saat əvvəl'
          },
          {
            id: '3',
            title: 'Xüsusi endirim tətbiqi',
            role: 'Manager', 
            user: 'Rəşad İbrahimov',
            status: 'current' as const,
            timestamp: '1 gün əvvəl'
          }
        ],
        topPerformers: [
          {
            id: 1,
            name: 'Leyla Həsənova',
            role: 'Agent',
            branch: 'Mərkəz filialı',
            deals: 8,
            revenue: 124000,
            growth: '+15%'
          },
          {
            id: 2,
            name: 'Orxan Əliyev', 
            role: 'Manager',
            branch: 'Yasamal filialı',
            deals: 12,
            revenue: 89500,
            growth: '+22%'
          },
          {
            id: 3,
            name: 'Günel Məmmədova',
            role: 'Agent',
            branch: 'Nəsimi filialı', 
            deals: 6,
            revenue: 76200,
            growth: '+8%'
          }
        ],
        systemHealth: {
          apiStatus: 'healthy',
          dbConnections: 45,
          activeUsers: 18,
          systemLoad: 23,
          errorRate: 0.1
        }
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

  const performerColumns = [
    { 
      key: 'name', 
      label: 'Ad Soyad',
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium">{value}</span>
          <div className="text-xs text-muted-foreground">{row.role}</div>
        </div>
      )
    },
    { 
      key: 'branch', 
      label: 'Filial',
      render: (value: string) => <span className="text-sm">{value}</span>
    },
    { 
      key: 'deals', 
      label: 'Satışlar',
      render: (value: number) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    { 
      key: 'revenue', 
      label: 'Gəlir',
      render: (value: number) => `₼ ${value.toLocaleString()}`
    },
    { 
      key: 'growth', 
      label: 'Artım',
      render: (value: string) => (
        <span className="text-green-600 text-sm font-medium">{value}</span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Direktor Paneli</h1>
          <p className="text-muted-foreground">
            Şirkət performansı və strateji göstəricilər
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Hesabat Al
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analitika
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <KPIGrid columns={3}>
        <KPICard
          title="Ümumi Gəlir"
          value={`₼ ${data.kpis.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: `+${data.kpis.monthlyGrowth}%`,
            label: 'bu ay'
          }}
        />
        <KPICard
          title="Ümumi Əmlaklar"
          value={data.kpis.totalProperties}
          icon={<Building className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+12',
            label: 'bu həftə'
          }}
        />
        <KPICard
          title="Aktiv Agentlər"
          value={data.kpis.totalAgents}
          icon={<Users className="h-4 w-4" />}
          trend={{
            direction: 'neutral',
            value: '0',
            label: 'dəyişiklik yoxdur'
          }}
        />
      </KPIGrid>

      {/* Secondary KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gözləyən Təsdiqlər</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.kpis.approvalsPending}</div>
            <p className="text-xs text-muted-foreground">
              Təcili diqqət tələb edir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müştəri Məmnuniyyəti</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.kpis.customerSatisfaction}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% keçən aya nisbətən
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistem Sağlamlığı</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-600">Sağlam</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bütün sistemlər normal işləyir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Approvals & Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Gözləyən Təsdiqlər
            </CardTitle>
            <CardDescription>
              Sizin təsdiqinizi gözləyən əməliyyatlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalTimeline 
              steps={data.pendingApprovals}
              onStepClick={(step) => console.log('Approval clicked:', step)}
            />
            <div className="mt-4">
              <Button className="w-full">
                Bütün Təsdiqləri Göstər
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Sistem İcmalı
            </CardTitle>
            <CardDescription>
              Sistem performansı və istifadə statistikaları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aktiv İstifadəçilər</span>
                <Badge variant="outline">{data.systemHealth.activeUsers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">DB Bağlantıları</span>
                <Badge variant="outline">{data.systemHealth.dbConnections}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sistem Yükü</span>
                <Badge 
                  variant={data.systemHealth.systemLoad < 50 ? "secondary" : "destructive"}
                >
                  {data.systemHealth.systemLoad}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Xəta Nisbəti</span>
                <Badge 
                  variant={data.systemHealth.errorRate < 1 ? "secondary" : "destructive"}
                >
                  {data.systemHealth.errorRate}%
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ətraflı Sistem Hesabatı
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Ən Yaxşı Performans Göstərənlər
          </CardTitle>
          <CardDescription>
            Bu ay ən yüksək nəticə göstərən əməkdaşlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            data={data.topPerformers}
            columns={performerColumns}
            loading={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}