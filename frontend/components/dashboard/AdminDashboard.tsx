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
  Shield, 
  Users, 
  Server, 
  Activity,
  AlertTriangle,
  Database,
  Lock,
  FileText,
  Settings,
  Eye,
  UserPlus,
  HardDrive
} from "lucide-react"

interface AdminDashboardProps {
  className?: string
}

export default function AdminDashboard({ className }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        systemMetrics: {
          totalUsers: 847,
          activeUsers: 156,
          systemUptime: 99.97,
          storageUsed: 68.4,
          securityAlerts: 3,
          backupStatus: 'success'
        },
        securityEvents: [
          {
            id: '1',
            title: 'Uğursuz giriş cəhdi',
            description: 'IP: 192.168.1.100 - 5 dəfə səhv parol',
            timestamp: '15 dəqiqə əvvəl',
            status: 'failed' as const
          },
          {
            id: '2',
            title: 'Yeni istifadəçi əlavə edildi',
            description: 'Rəşad Məmmədov - Agent rolu',
            timestamp: '1 saat əvvəl',
            status: 'completed' as const
          },
          {
            id: '3',
            title: 'Sistem yenilənməsi',
            description: 'Təhlükəsizlik yamaqları quraşdırıldı',
            timestamp: '3 saat əvvəl',
            status: 'completed' as const
          }
        ],
        recentUsers: [
          {
            id: 1,
            name: 'Leyla Həsənova',
            email: 'leyla@rea-invest.com',
            role: 'Agent',
            branch: 'Mərkəz',
            lastActive: '5 dəq əvvəl',
            status: 'online'
          },
          {
            id: 2,
            name: 'Orxan Əliyev',
            email: 'orxan@rea-invest.com', 
            role: 'Manager',
            branch: 'Yasamal',
            lastActive: '2 saat əvvəl',
            status: 'offline'
          },
          {
            id: 3,
            name: 'Aygün Qasımova',
            email: 'aygun@rea-invest.com',
            role: 'VP',
            branch: 'Mərkəz',
            lastActive: '1 gün əvvəl',
            status: 'offline'
          }
        ],
        systemHealth: {
          database: 'healthy',
          api: 'healthy', 
          storage: 'warning',
          backup: 'healthy',
          monitoring: 'healthy'
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

  const userColumns = [
    { 
      key: 'name', 
      label: 'İstifadəçi',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${
            row.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <div>
            <span className="font-medium">{value}</span>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Rol',
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    { 
      key: 'branch', 
      label: 'Filial',
      render: (value: string) => <span className="text-sm">{value}</span>
    },
    { 
      key: 'lastActive', 
      label: 'Son Aktivlik',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'online' ? 'default' : 'secondary'}>
          {value === 'online' ? 'Onlayn' : 'Oflayn'}
        </Badge>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Paneli</h1>
          <p className="text-muted-foreground">
            Sistem idarəçiliyi və təhlükəsizlik monitorinqi
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Sistem Ayarları
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Yeni İstifadəçi
          </Button>
        </div>
      </div>

      {/* System Health KPIs */}
      <KPIGrid columns={3}>
        <KPICard
          title="Ümumi İstifadəçilər"
          value={data.systemMetrics.totalUsers}
          icon={<Users className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+12',
            label: 'bu həftə'
          }}
        />
        <KPICard
          title="Aktiv İstifadəçilər"
          value={data.systemMetrics.activeUsers}
          icon={<Activity className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+8%',
            label: 'bu gün'
          }}
        />
        <KPICard
          title="Sistem Yükü"
          value={`${data.systemMetrics.systemUptime}%`}
          icon={<Server className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+0.02%',
            label: 'bu ay'
          }}
        />
      </KPIGrid>

      {/* System Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaddaş İstifadəsi</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.systemMetrics.storageUsed}%</div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  data.systemMetrics.storageUsed > 80 ? 'bg-red-500' : 
                  data.systemMetrics.storageUsed > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.systemMetrics.storageUsed}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Təhlükəsizlik</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{data.systemMetrics.securityAlerts} xəbərdarlık</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Diqqət tələb edir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-600">Uğurlu</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Son: 2 saat əvvəl
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4K</div>
            <p className="text-xs text-muted-foreground">
              Bu gün yazılmış log
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security & Users */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Security Events */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Təhlükəsizlik Hadisələri
              </CardTitle>
              <CardDescription>
                Son təhlükəsizlik aktivlikləri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline items={data.securityEvents} />
              <Button variant="outline" className="w-full mt-4">
                Bütün Hadisələri Göstər
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Son İstifadəçilər
              </CardTitle>
              <CardDescription>
                Sistemə son daxil olan istifadəçilər
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleTable
                data={data.recentUsers}
                columns={userColumns}
                loading={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Sistem Sağlamlığı
          </CardTitle>
          <CardDescription>
            Bütün sistem komponentlərinin statusu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Object.entries(data.systemHealth).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    status === 'healthy' ? 'bg-green-500' : 
                    status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">
                    {key === 'database' ? 'Verilənlər bazası' :
                     key === 'api' ? 'API' :
                     key === 'storage' ? 'Yaddaş' :
                     key === 'backup' ? 'Backup' :
                     key === 'monitoring' ? 'Monitoring' : key}
                  </span>
                </div>
                <Badge variant={
                  status === 'healthy' ? 'secondary' : 
                  status === 'warning' ? 'destructive' : 'destructive'
                }>
                  {status === 'healthy' ? 'Sağlam' : 
                   status === 'warning' ? 'Xəbərdarlık' : 'Xəta'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="flex space-x-2 mt-4">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Sistem Hesabatı
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Sistem Ayarları
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Təhlükəsizlik Ayarları
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}