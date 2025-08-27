"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, SearchInput } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { SimpleTable } from "@/components/ui/simple-table"
import { KPICard, KPIGrid } from "@/components/ui/kpi-card"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Building, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp,
  Home,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"

interface PropertyManagementProps {
  className?: string
}

export default function PropertyManagement({ className }: PropertyManagementProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        stats: {
          totalProperties: 156,
          activeListings: 89,
          soldThisMonth: 23,
          averagePrice: 85000
        },
        properties: [
          {
            id: 1,
            title: "3 otaqlı mənzil, Yasamal rayonu",
            type: "apartment",
            price: 95000,
            address: "Yasamal rayonu, H.Əliyev pr. 123",
            area: 85,
            rooms: 3,
            status: "active",
            views: 245,
            bookings: 3,
            agent: "Leyla Həsənova",
            createdAt: "2024-01-15",
            images: 8,
            description: "Təmir olunmuş, mərkəzi istilik sistemi, lift"
          },
          {
            id: 2,
            title: "2 otaqlı mənzil, Nəsimi rayonu", 
            type: "apartment",
            price: 72000,
            address: "Nəsimi rayonu, Azadlıq pr. 45",
            area: 65,
            rooms: 2,
            status: "booked",
            views: 189,
            bookings: 1,
            agent: "Orxan Əliyev",
            createdAt: "2024-01-12",
            images: 12,
            description: "Yeni tikili, panoram mənzərə"
          },
          {
            id: 3,
            title: "4 otaqlı ev, Xəzər rayonu",
            type: "house", 
            price: 145000,
            address: "Xəzər rayonu, Mərdəkan qəs.",
            area: 180,
            rooms: 4,
            status: "sold",
            views: 67,
            bookings: 0,
            agent: "Rəşad İbrahimov",
            createdAt: "2024-01-08",
            images: 15,
            description: "Həyət evi, qaraj, bağ"
          },
          {
            id: 4,
            title: "1 otaqlı mənzil, Səbail rayonu",
            type: "apartment",
            price: 58000,
            address: "Səbail rayonu, Neftçilər pr. 78",
            area: 45,
            rooms: 1,
            status: "pending",
            views: 123,
            bookings: 0,
            agent: "Günel Məmmədova",
            createdAt: "2024-01-18",
            images: 6,
            description: "Şəhər mərkəzi, metro yaxınlığı"
          }
        ]
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Aktiv</Badge>
      case 'booked':
        return <Badge variant="secondary">Rezerv edilib</Badge>
      case 'sold':
        return <Badge variant="success">Satılıb</Badge>
      case 'pending':
        return <Badge variant="warning">Gözləyir</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'booked':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'sold':
        return <DollarSign className="h-4 w-4 text-green-700" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const propertyColumns = [
    {
      key: 'title',
      label: 'Əmlak',
      render: (value: string, row: any) => (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getStatusIcon(row.status)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground truncate">{value}</div>
            <div className="text-sm text-muted-foreground truncate flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {row.address}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {row.area}m² • {row.rooms} otaq • {row.images} şəkil
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Qiymət',
      render: (value: number) => (
        <div className="font-semibold text-foreground">
          ₼ {value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'performance',
      label: 'Performans', 
      render: (value: any, row: any) => (
        <div className="text-sm">
          <div className="flex items-center text-muted-foreground">
            <Eye className="h-3 w-3 mr-1" />
            {row.views} baxış
          </div>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            {row.bookings} rezerv
          </div>
        </div>
      )
    },
    {
      key: 'agent',
      label: 'Agent',
      render: (value: string) => (
        <div className="text-sm font-medium">{value}</div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (value: any, row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              Ətraflı bax
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Redaktə et
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeInUp">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Əmlak İdarəetməsi
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Bütün əmlak elanlarınızı idarə edin və izləyin • Cəmi {data?.stats.totalProperties} əmlak
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg">
            <Eye className="h-4 w-4 mr-2" />
            Analitika
          </Button>
          <Button size="lg" className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Əmlak Əlavə Et
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <KPIGrid columns={4}>
        <KPICard
          title="Ümumi Əmlaklar"
          value={data.stats.totalProperties}
          icon={<Building className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+12',
            label: 'bu ay'
          }}
        />
        <KPICard
          title="Aktiv Elanlar"
          value={data.stats.activeListings}
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+8%',
            label: 'bu həftə'
          }}
        />
        <KPICard
          title="Bu Ay Satılan"
          value={data.stats.soldThisMonth}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+15%',
            label: 'keçən aya nisbətən'
          }}
        />
        <KPICard
          title="Orta Qiymət"
          value={`₼ ${data.stats.averagePrice.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+3%',
            label: 'bazar ortalaması'
          }}
        />
      </KPIGrid>

      {/* Filters and Search */}
      <Card variant="ghost" className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Enhanced Search */}
            <div className="flex-1">
              <SearchInput
                placeholder="Əmlak axtar (başlıq, ünvan, agent)..."
                value={searchTerm}
                onSearch={setSearchTerm}
                clearable
                className="h-11"
              />
            </div>

            {/* Status Filter with Select */}
            <div className="min-w-[160px]">
              <Select
                options={[
                  { value: "all", label: "Bütün statuslar" },
                  { value: "active", label: "Aktiv" },
                  { value: "booked", label: "Rezerv edilmiş" },
                  { value: "sold", label: "Satılmış" },
                  { value: "pending", label: "Gözləyən" }
                ]}
                value={statusFilter}
                onValueChange={setStatusFilter}
                placeholder="Status seçin"
              />
            </div>

            {/* Type Filter with Select */}
            <div className="min-w-[140px]">
              <Select
                options={[
                  { value: "all", label: "Bütün növlər" },
                  { value: "apartment", label: "Mənzil" },
                  { value: "house", label: "Ev" },
                  { value: "office", label: "Ofis" },
                  { value: "shop", label: "Mağaza" }
                ]}
                placeholder="Növ seçin"
              />
            </div>

            {/* Advanced Filter Toggle */}
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Əmlak Siyahısı
          </CardTitle>
          <CardDescription>
            Bütün əmlak elanlarınız və onların statusu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            data={data.properties}
            columns={propertyColumns}
            loading={false}
            searchTerm={searchTerm}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card clickable className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center h-24 p-6">
            <Plus className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Yeni Əmlak</span>
          </CardContent>
        </Card>
        <Card clickable className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center h-24 p-6">
            <Edit className="h-8 w-8 mb-2 text-success group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Toplu Redaktə</span>
          </CardContent>
        </Card>
        <Card clickable className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center h-24 p-6">
            <TrendingUp className="h-8 w-8 mb-2 text-info group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Analitika</span>
          </CardContent>
        </Card>
        <Card clickable className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center h-24 p-6">
            <MapPin className="h-8 w-8 mb-2 text-warning group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Xəritədə Göstər</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}