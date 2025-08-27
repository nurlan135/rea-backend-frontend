"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SimpleTable } from "@/components/ui/simple-table"
import { KPICard, KPIGrid } from "@/components/ui/kpi-card"
import { BookingTimeline } from "@/components/ui/timeline"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  MessageSquare,
  MapPin,
  Building,
  User,
  CalendarDays
} from "lucide-react"

interface BookingManagementProps {
  className?: string
}

export default function BookingManagement({ className }: BookingManagementProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        stats: {
          totalBookings: 45,
          confirmedBookings: 28,
          pendingBookings: 12,
          completedBookings: 156
        },
        bookings: [
          {
            id: 1,
            propertyTitle: "3 otaqlı mənzil, Yasamal",
            propertyAddress: "Yasamal rayonu, H.Əliyev pr. 123",
            customerName: "Rəşad Məmmədov",
            customerPhone: "+994 55 123 45 67",
            customerEmail: "resad.mammadov@gmail.com",
            bookingDate: "2024-01-22",
            bookingTime: "14:00",
            status: "confirmed",
            agent: "Leyla Həsənova",
            createdAt: "2024-01-18",
            notes: "Ailə ilə birlikdə baxmaq istəyir. Kredit imkanları haqqında məlumat verilməlidir.",
            propertyPrice: 95000,
            viewingDuration: 60
          },
          {
            id: 2,
            propertyTitle: "2 otaqlı mənzil, Nəsimi",
            propertyAddress: "Nəsimi rayonu, Azadlıq pr. 45", 
            customerName: "Aynur Qasımova",
            customerPhone: "+994 70 987 65 43",
            customerEmail: "aynur.gasimova@mail.ru",
            bookingDate: "2024-01-23",
            bookingTime: "16:30",
            status: "pending",
            agent: "Orxan Əliyev",
            createdAt: "2024-01-19",
            notes: "İlk dəfə mənzil alır, ətraflı məlumat lazımdır.",
            propertyPrice: 72000,
            viewingDuration: 45
          },
          {
            id: 3,
            propertyTitle: "4 otaqlı ev, Xəzər",
            propertyAddress: "Xəzər rayonu, Mərdəkan qəs.",
            customerName: "Elvin İbrahimov", 
            customerPhone: "+994 51 234 56 78",
            customerEmail: "elvin.ibrahimov@company.az",
            bookingDate: "2024-01-20",
            bookingTime: "11:00",
            status: "completed",
            agent: "Rəşad İbrahimov",
            createdAt: "2024-01-16",
            notes: "Müştəri məmnun qaldı, təklif verəcək.",
            propertyPrice: 145000,
            viewingDuration: 90
          },
          {
            id: 4,
            propertyTitle: "1 otaqlı mənzil, Səbail",
            propertyAddress: "Səbail rayonu, Neftçilər pr. 78",
            customerName: "Nərmin Həsənova",
            customerPhone: "+994 77 345 67 89", 
            customerEmail: "nermin.h@outlook.com",
            bookingDate: "2024-01-25",
            bookingTime: "13:30",
            status: "cancelled",
            agent: "Günel Məmmədova",
            createdAt: "2024-01-20",
            notes: "Müştəri digər variant seçdi.",
            propertyPrice: 58000,
            viewingDuration: 30
          }
        ],
        recentActivities: [
          {
            id: '1',
            action: 'Yeni rezervasiya edildi',
            timestamp: '15 dəqiqə əvvəl',
            user: 'Leyla Həsənova',
            details: 'Rəşad Məmmədov - Yasamal mənzil',
            status: 'success'
          },
          {
            id: '2', 
            action: 'Rezervasiya təsdiqləndi',
            timestamp: '1 saat əvvəl',
            user: 'Orxan Əliyev',
            details: 'Aynur Qasımova - Nəsimi mənzil',
            status: 'success'
          },
          {
            id: '3',
            action: 'Rezervasiya ləğv edildi', 
            timestamp: '3 saat əvvəl',
            user: 'Günel Məmmədova',
            details: 'Müştəri tərəfindən ləğv edildi',
            status: 'error'
          }
        ]
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Təsdiqlənib</Badge>
      case 'pending':
        return <Badge variant="secondary">Gözləyir</Badge>
      case 'completed':
        return <Badge variant="success">Tamamlandı</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Ləğv edilib</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-700" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const bookingColumns = [
    {
      key: 'property',
      label: 'Əmlak',
      render: (value: any, row: any) => (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getStatusIcon(row.status)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground truncate">{row.propertyTitle}</div>
            <div className="text-sm text-muted-foreground truncate flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {row.propertyAddress}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ₼ {row.propertyPrice.toLocaleString()}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Müştəri',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-foreground">{row.customerName}</div>
          <div className="text-sm text-muted-foreground">{row.customerPhone}</div>
          <div className="text-xs text-muted-foreground">{row.customerEmail}</div>
        </div>
      )
    },
    {
      key: 'datetime',
      label: 'Tarix və Vaxt',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-foreground">{row.bookingDate}</div>
          <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {row.bookingTime}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.viewingDuration} dəqiqə
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
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
            <DropdownMenuItem>
              <Phone className="h-4 w-4 mr-2" />
              Müştəriyə zəng et
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS göndər
            </DropdownMenuItem>
            {row.status === 'pending' && (
              <>
                <DropdownMenuItem className="text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Təsdiqlə
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <XCircle className="h-4 w-4 mr-2" />
                  Ləğv et
                </DropdownMenuItem>
              </>
            )}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rezervasiya İdarəetməsi</h1>
          <p className="text-muted-foreground">
            Bütün rezervasiyalarınızı idarə edin və izləyin
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Rezervasiya
        </Button>
      </div>

      {/* Stats Cards */}
      <KPIGrid columns={4}>
        <KPICard
          title="Ümumi Rezervasiyalar"
          value={data.stats.totalBookings}
          icon={<Calendar className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+8',
            label: 'bu həftə'
          }}
        />
        <KPICard
          title="Təsdiqlənmiş"
          value={data.stats.confirmedBookings}
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+12%',
            label: 'bu ay'
          }}
        />
        <KPICard
          title="Gözləyən"
          value={data.stats.pendingBookings}
          icon={<Clock className="h-4 w-4" />}
          trend={{
            direction: 'neutral',
            value: '0',
            label: 'dəyişiklik yox'
          }}
        />
        <KPICard
          title="Tamamlanmış"
          value={data.stats.completedBookings}
          icon={<Building className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+23%',
            label: 'bu il'
          }}
        />
      </KPIGrid>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tez Əməliyyatlar</CardTitle>
              <CardDescription>
                Tez-tez istifadə edilən əməliyyatlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Rezervasiya
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Bu gün rezervasiyalar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Gözləyən təsdiq
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Müştəri zəngləri
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Son Aktivlər
              </CardTitle>
              <CardDescription>
                Rezervasiyalarla bağlı son dəyişikliklər
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingTimeline events={data.recentActivities} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rezervasiya axtar (müştəri, əmlak, agent)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status filteri
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Hamısı
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>
                  Təsdiqlənmiş
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  Gözləyən
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                  Tamamlanmış
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                  Ləğv edilmiş
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Filter */}
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Tarix filteri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Rezervasiya Siyahısı
          </CardTitle>
          <CardDescription>
            Bütün rezervasiyalar və onların statusu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            data={data.bookings}
            columns={bookingColumns}
            loading={false}
            searchTerm={searchTerm}
          />
        </CardContent>
      </Card>
    </div>
  )
}