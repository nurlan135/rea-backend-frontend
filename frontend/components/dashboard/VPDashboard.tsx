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
  DollarSign, 
  Target, 
  PieChart,
  Briefcase,
  Building,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  BarChart3
} from "lucide-react"

interface VPDashboardProps {
  className?: string
}

export default function VPDashboard({ className }: VPDashboardProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        budgetMetrics: {
          totalBudget: 2450000,
          allocatedBudget: 1870000,
          spentBudget: 1340000,
          remainingBudget: 1110000,
          budgetUtilization: 76.3,
          monthlyROI: 18.4
        },
        pendingBudgets: [
          {
            id: '1',
            title: 'Yasamal bölgəsi marketing kampaniyası',
            role: 'Manager',
            user: 'Elçin Məmmədov',
            status: 'pending' as const,
            timestamp: '3 saat əvvəl',
            amount: 45000,
            notes: 'Q1 üçün digital marketing büdcəsi'
          },
          {
            id: '2',
            title: 'Yeni ofis avadanlıqları',
            role: 'Director',
            user: 'Rəşad İbrahimov',
            status: 'current' as const,
            timestamp: '1 gün əvvəl',
            amount: 28500,
            notes: 'İT avadanlıqları və ofis mebeli'
          }
        ],
        departmentBudgets: [
          {
            id: 1,
            department: 'Satış və Marketing',
            allocated: 650000,
            spent: 485000,
            remaining: 165000,
            utilization: 74.6,
            manager: 'Elçin Məmmədov'
          },
          {
            id: 2,
            department: 'İT və Texnologiya',
            allocated: 320000,
            spent: 278000,
            remaining: 42000,
            utilization: 86.9,
            manager: 'Səməd Həsənov'
          },
          {
            id: 3,
            department: 'İnsan Resursları',
            allocated: 280000,
            spent: 195000,
            remaining: 85000,
            utilization: 69.6,
            manager: 'Leyla Qasımova'
          },
          {
            id: 4,
            department: 'Maliyyə',
            allocated: 450000,
            spent: 382000,
            remaining: 68000,
            utilization: 84.9,
            manager: 'Orxan Əliyev'
          }
        ],
        quarterlyTargets: {
          revenue: { target: 1200000, achieved: 847000, percentage: 70.6 },
          deals: { target: 85, achieved: 63, percentage: 74.1 },
          clients: { target: 450, achieved: 328, percentage: 72.9 }
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

  const budgetColumns = [
    { 
      key: 'department', 
      label: 'Departament',
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium">{value}</span>
          <div className="text-xs text-muted-foreground">{row.manager}</div>
        </div>
      )
    },
    { 
      key: 'allocated', 
      label: 'Ayrılmış',
      render: (value: number) => `₼ ${value.toLocaleString()}`
    },
    { 
      key: 'spent', 
      label: 'Xərclənmiş',
      render: (value: number) => `₼ ${value.toLocaleString()}`
    },
    { 
      key: 'remaining', 
      label: 'Qalan',
      render: (value: number) => (
        <span className={value < 50000 ? 'text-red-600 font-medium' : ''}>
          ₼ {value.toLocaleString()}
        </span>
      )
    },
    { 
      key: 'utilization', 
      label: 'İstifadə',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-secondary rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                value > 90 ? 'bg-red-500' : value > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">VP Paneli</h1>
          <p className="text-muted-foreground">
            Büdcə idarəçiliği və strateji planlaşdırma
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Büdcə Hesabatı
          </Button>
          <Button>
            <PieChart className="h-4 w-4 mr-2" />
            Büdcə Analizi
          </Button>
        </div>
      </div>

      {/* Budget Overview KPIs */}
      <KPIGrid columns={3}>
        <KPICard
          title="Ümumi Büdcə"
          value={`₼ ${data.budgetMetrics.totalBudget.toLocaleString()}`}
          icon={<Briefcase className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+8%',
            label: 'keçən rübə nisbətən'
          }}
        />
        <KPICard
          title="Xərclənmiş Büdcə"
          value={`₼ ${data.budgetMetrics.spentBudget.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: `${data.budgetMetrics.budgetUtilization}%`,
            label: 'istifadə edilib'
          }}
        />
        <KPICard
          title="ROI (Gəlir Nisbəti)"
          value={`${data.budgetMetrics.monthlyROI}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+2.3%',
            label: 'keçən aya nisbətən'
          }}
        />
      </KPIGrid>

      {/* Budget Status Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Rüblük Hədəflər
            </CardTitle>
            <CardDescription>
              Bu rübün əsas performans göstəriciləri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Gəlir Hədəfi</span>
                  <span className="text-sm text-muted-foreground">
                    ₼ {data.quarterlyTargets.revenue.achieved.toLocaleString()} / 
                    ₼ {data.quarterlyTargets.revenue.target.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${data.quarterlyTargets.revenue.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {data.quarterlyTargets.revenue.percentage}% tamamlandı
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Satış Sayı</span>
                  <span className="text-sm text-muted-foreground">
                    {data.quarterlyTargets.deals.achieved} / {data.quarterlyTargets.deals.target}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.quarterlyTargets.deals.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {data.quarterlyTargets.deals.percentage}% tamamlandı
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Yeni Müştərilər</span>
                  <span className="text-sm text-muted-foreground">
                    {data.quarterlyTargets.clients.achieved} / {data.quarterlyTargets.clients.target}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.quarterlyTargets.clients.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {data.quarterlyTargets.clients.percentage}% tamamlandı
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Gözləyən Büdcə Təsdiqi
            </CardTitle>
            <CardDescription>
              Sizin təsdiqinizi gözləyən büdcə təklifləri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalTimeline 
              steps={data.pendingBudgets.map((budget: any) => ({
                ...budget,
                title: `${budget.title} - ₼ ${budget.amount.toLocaleString()}`,
                description: budget.notes
              }))}
              onStepClick={(step) => console.log('Budget approval clicked:', step)}
            />
            <Button className="w-full mt-4">
              Bütün Təklifləri İncələ
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Department Budget Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Departament Büdcəsi Analizi
          </CardTitle>
          <CardDescription>
            Departamentlər üzrə büdcə istifadəsi və performans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            data={data.departmentBudgets}
            columns={budgetColumns}
            loading={false}
          />
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qalan Büdcə</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₼ {data.budgetMetrics.remainingBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Bu rüb üçün qalan məbləğ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ayrılmış Büdcə</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₼ {data.budgetMetrics.allocatedBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Departamentlərə paylanmış
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Büdcə İstifadəsi</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.budgetMetrics.budgetUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              Planlaşdırılmış büdcədən
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aylıq ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{data.budgetMetrics.monthlyROI}%</div>
            <p className="text-xs text-muted-foreground">
              Sərmayənin gəliri
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}