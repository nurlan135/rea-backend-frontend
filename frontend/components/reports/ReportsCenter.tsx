"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPICard, KPIGrid } from "@/components/ui/kpi-card"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Building,
  DollarSign,
  Users,
  Phone,
  Mail,
  FileSpreadsheet,
  Printer,
  Share2,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  Clock
} from "lucide-react"

interface ReportsCenterProps {
  className?: string
}

export default function ReportsCenter({ className }: ReportsCenterProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        stats: {
          totalReports: 45,
          scheduledReports: 12,
          exportedToday: 8,
          automatedReports: 15
        },
        reportCategories: [
          {
            id: 'sales',
            title: 'Satış Hesabatları',
            description: 'Satış performansı və gəlir analizi',
            icon: DollarSign,
            count: 12,
            reports: [
              { name: 'Aylıq Satış Hesabatı', lastGenerated: '2024-01-22', format: 'PDF' },
              { name: 'Agent Performansı', lastGenerated: '2024-01-21', format: 'Excel' },
              { name: 'Gəlir Analizi', lastGenerated: '2024-01-20', format: 'PDF' }
            ]
          },
          {
            id: 'properties',
            title: 'Əmlak Hesabatları', 
            description: 'Əmlak portfeli və bazar analizi',
            icon: Building,
            count: 8,
            reports: [
              { name: 'Əmlak Inventarı', lastGenerated: '2024-01-22', format: 'Excel' },
              { name: 'Bazar Qiymət Analizi', lastGenerated: '2024-01-19', format: 'PDF' },
              { name: 'Rayon üzrə Statistika', lastGenerated: '2024-01-18', format: 'Excel' }
            ]
          },
          {
            id: 'customers',
            title: 'Müştəri Hesabatları',
            description: 'Müştəri bazası və məmnuniyyət analizi', 
            icon: Users,
            count: 6,
            reports: [
              { name: 'Müştəri Bazası', lastGenerated: '2024-01-21', format: 'Excel' },
              { name: 'Məmnuniyyət Sorğusu', lastGenerated: '2024-01-20', format: 'PDF' },
              { name: 'Müştəri Segmentasiyası', lastGenerated: '2024-01-17', format: 'Excel' }
            ]
          },
          {
            id: 'communications',
            title: 'Ünsiyyət Hesabatları',
            description: 'Zəng və mesaj statistikaları',
            icon: Phone,
            count: 4,
            reports: [
              { name: 'Zəng Statistikaları', lastGenerated: '2024-01-22', format: 'Excel' },
              { name: 'SMS Kampaniya Nəticələri', lastGenerated: '2024-01-19', format: 'PDF' }
            ]
          }
        ],
        quickReports: [
          { 
            name: 'Bu ay satış hesabatı',
            description: 'Cari ayın satış performansı', 
            estimatedTime: '2-3 dəqiqə',
            formats: ['PDF', 'Excel']
          },
          {
            name: 'Agent performans xülasəsi',
            description: 'Bütün agentlərin performansı',
            estimatedTime: '3-5 dəqiqə', 
            formats: ['PDF', 'Excel']
          },
          {
            name: 'Əmlak portfeli',
            description: 'Aktiv əmlakların tam siyahısı',
            estimatedTime: '1-2 dəqiqə',
            formats: ['Excel', 'CSV']
          },
          {
            name: 'Müştəri əlaqə məlumatları',
            description: 'Bütün müştərilərin məlumatları',
            estimatedTime: '2-3 dəqiqə',
            formats: ['Excel', 'CSV']
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

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />
      case 'excel':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hesabat Mərkəzi</h1>
          <p className="text-muted-foreground">
            Biznes analizi və performans hesabatları
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenilə
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Xüsusi Hesabat
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <KPIGrid columns={4}>
        <KPICard
          title="Ümumi Hesabatlar"
          value={data.stats.totalReports}
          icon={<FileText className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+5',
            label: 'bu ay'
          }}
        />
        <KPICard
          title="Planlanmış Hesabatlar"
          value={data.stats.scheduledReports}
          icon={<Calendar className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+2',
            label: 'yeni'
          }}
        />
        <KPICard
          title="Bu gün ixrac"
          value={data.stats.exportedToday}
          icon={<Download className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+25%',
            label: 'dünənə nisbətən'
          }}
        />
        <KPICard
          title="Avtomatik Hesabatlar"
          value={data.stats.automatedReports}
          icon={<RefreshCw className="h-4 w-4" />}
          trend={{
            direction: 'neutral',
            value: '100%',
            label: 'uğurla çalışır'
          }}
        />
      </KPIGrid>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tez Hesabatlar
          </CardTitle>
          <CardDescription>
            Tez-tez istifadə edilən hesabatları bir kliklə yaradın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {data.quickReports.map((report: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{report.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {report.estimatedTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {report.formats.map((format: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-1">
                        {getFormatIcon(format)}
                        <span className="text-xs">{format}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Yarat
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        {data.reportCategories.map((category: any) => {
          const IconComponent = category.icon
          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className="h-5 w-5 mr-2" />
                    {category.title}
                  </div>
                  <Badge variant="outline">{category.count} hesabat</Badge>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.reports.slice(0, 3).map((report: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFormatIcon(report.format)}
                        <div>
                          <div className="font-medium text-sm">{report.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Son: {report.lastGenerated}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    Bütün {category.title}ni göstər
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            İxrac və Paylaşım
          </CardTitle>
          <CardDescription>
            Hesabatları müxtəlif formatda ixrac edin və paylaşın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
              <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">PDF Format</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Peşəkar hesabatlar üçün ideal
              </p>
              <Button variant="outline" size="sm">
                PDF yaradın
              </Button>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
              <FileSpreadsheet className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Excel Format</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Dəyişiklik və analiz üçün
              </p>
              <Button variant="outline" size="sm">
                Excel yaradın
              </Button>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
              <Printer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Çap et</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Birbaşa printer göndər
              </p>
              <Button variant="outline" size="sm">
                Çap edin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Planlanmış Hesabatlar
          </CardTitle>
          <CardDescription>
            Avtomatik yaranan hesabatlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Həftəlik Satış Hesabatı</div>
                  <div className="text-xs text-muted-foreground">Hər Bazar ertəsi 09:00</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Aktiv</Badge>
                <Button size="sm" variant="outline">Redaktə</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm">Aylıq Agent Performansı</div>
                  <div className="text-xs text-muted-foreground">Hər ayın 1-də 10:00</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Aktiv</Badge>
                <Button size="sm" variant="outline">Redaktə</Button>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Planlanmış Hesabat
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}