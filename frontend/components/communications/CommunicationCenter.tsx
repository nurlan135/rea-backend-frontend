"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SimpleTable } from "@/components/ui/simple-table"
import { KPICard, KPIGrid } from "@/components/ui/kpi-card"
import { CommunicationTimeline } from "@/components/ui/timeline"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MessageSquare, 
  Phone, 
  Search, 
  Filter,
  Plus,
  Send,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Mail,
  Smartphone,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Reply,
  Forward,
  Trash2
} from "lucide-react"

interface CommunicationCenterProps {
  className?: string
}

export default function CommunicationCenter({ className }: CommunicationCenterProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        stats: {
          totalCalls: 234,
          totalSMS: 89,
          totalEmails: 45,
          totalWhatsApp: 67
        },
        communications: [
          {
            id: 1,
            type: "call",
            direction: "out",
            contact: {
              name: "Rəşad Məmmədov",
              phone: "+994 55 123 45 67",
              email: "resad@gmail.com"
            },
            property: "3 otaqlı mənzil, Yasamal",
            duration: 324, // seconds
            timestamp: "2024-01-22 14:30",
            status: "completed",
            agent: "Leyla Həsənova",
            notes: "Müştəri rezervasiya üçün zəng etdi. Sabah 16:00-da görüş təyin edildi.",
            recordings: true
          },
          {
            id: 2,
            type: "sms",
            direction: "out",
            contact: {
              name: "Aynur Qasımova", 
              phone: "+994 70 987 65 43",
              email: "aynur@mail.ru"
            },
            property: "2 otaqlı mənzil, Nəsimi",
            message: "Salam! Rezervasiyanız təsdiqləndi. Sabah saat 16:30-da görüşərik. REA INVEST",
            timestamp: "2024-01-22 13:15",
            status: "delivered",
            agent: "Orxan Əliyev"
          },
          {
            id: 3,
            type: "whatsapp",
            direction: "in",
            contact: {
              name: "Elvin İbrahimov",
              phone: "+994 51 234 56 78", 
              email: "elvin@company.az"
            },
            property: "4 otaqlı ev, Xəzər",
            message: "Salam, evin qiymətində endirim mümkündür?",
            timestamp: "2024-01-22 12:45",
            status: "read",
            agent: "Rəşad İbrahimov"
          },
          {
            id: 4,
            type: "email",
            direction: "out",
            contact: {
              name: "Nərmin Həsənova",
              phone: "+994 77 345 67 89",
              email: "nermin.h@outlook.com"
            },
            property: "1 otaqlı mənzil, Səbail",
            subject: "Əmlak dokumentləri və qiymət təfərrüatları",
            timestamp: "2024-01-22 11:20",
            status: "sent",
            agent: "Günel Məmmədova",
            attachments: 3
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'call',
            direction: 'in',
            timestamp: '5 dəqiqə əvvəl',
            duration: 180,
            message: 'Gələn zəng: +994 55 123 45 67',
            status: 'completed',
            user: 'Leyla Həsənova'
          },
          {
            id: '2',
            type: 'sms',
            direction: 'out',
            timestamp: '15 dəqiqə əvvəl',
            message: 'SMS göndərildi: Aynur Qasımova',
            status: 'delivered',
            user: 'Orxan Əliyev'
          },
          {
            id: '3',
            type: 'whatsapp', 
            direction: 'in',
            timestamp: '25 dəqiqə əvvəl',
            message: 'WhatsApp mesajı alındı',
            status: 'read',
            user: 'Rəşad İbrahimov'
          }
        ]
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getTypeIcon = (type: string, direction?: string) => {
    switch (type) {
      case 'call':
        if (direction === 'in') return <PhoneIncoming className="h-4 w-4 text-green-600" />
        if (direction === 'out') return <PhoneOutgoing className="h-4 w-4 text-blue-600" />
        return <Phone className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'whatsapp':
        return <Smartphone className="h-4 w-4 text-green-600" />
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'call':
        return <Badge variant="default">Zəng</Badge>
      case 'sms':
        return <Badge variant="secondary">SMS</Badge>
      case 'whatsapp':
        return <Badge variant="success">WhatsApp</Badge>
      case 'email':
        return <Badge variant="outline">Email</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getStatusBadge = (status: string, type: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Tamamlandı</Badge>
      case 'delivered':
        return <Badge variant="default">Çatdırıldı</Badge>
      case 'read':
        return <Badge variant="secondary">Oxundu</Badge>
      case 'sent':
        return <Badge variant="outline">Göndərildi</Badge>
      case 'failed':
        return <Badge variant="destructive">Uğursuz</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const communicationColumns = [
    {
      key: 'type',
      label: 'Növ',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(row.type, row.direction)}
          </div>
          <div>
            {getTypeBadge(row.type)}
            {row.direction === 'in' && (
              <div className="text-xs text-muted-foreground mt-1">Gələn</div>
            )}
            {row.direction === 'out' && (
              <div className="text-xs text-muted-foreground mt-1">Gedən</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Əlaqə',
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium text-foreground">{row.contact.name}</div>
          <div className="text-sm text-muted-foreground">{row.contact.phone}</div>
          {row.contact.email && (
            <div className="text-xs text-muted-foreground">{row.contact.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'content',
      label: 'Məzmun',
      render: (value: any, row: any) => (
        <div className="max-w-xs">
          {row.property && (
            <div className="text-sm font-medium text-foreground mb-1">
              {row.property}
            </div>
          )}
          {row.type === 'call' && row.duration && (
            <div className="text-sm text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(row.duration)}
            </div>
          )}
          {row.message && (
            <div className="text-sm text-muted-foreground truncate">
              {row.message}
            </div>
          )}
          {row.subject && (
            <div className="text-sm text-muted-foreground">
              {row.subject}
            </div>
          )}
          {row.notes && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {row.notes}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string, row: any) => getStatusBadge(value, row.type)
    },
    {
      key: 'timestamp',
      label: 'Vaxt',
      render: (value: string, row: any) => (
        <div>
          <div className="text-sm font-medium">
            {new Date(value).toLocaleDateString('az-AZ')}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(value).toLocaleTimeString('az-AZ', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
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
            {row.type === 'call' && (
              <DropdownMenuItem>
                <PhoneCall className="h-4 w-4 mr-2" />
                Zəng et
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Reply className="h-4 w-4 mr-2" />
              Cavab ver
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward className="h-4 w-4 mr-2" />
              Yönləndir
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ünsiyyət Mərkəzi</h1>
          <p className="text-muted-foreground">
            Bütün ünsiyyət kanallarınızı bir yerdə idarə edin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <PhoneCall className="h-4 w-4 mr-2" />
            Zəng et
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Mesaj göndər
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <KPIGrid columns={4}>
        <KPICard
          title="Ümumi Zənglər"
          value={data.stats.totalCalls}
          icon={<Phone className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+15%',
            label: 'bu həftə'
          }}
        />
        <KPICard
          title="SMS Mesajları"
          value={data.stats.totalSMS}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+8%',
            label: 'bu ay'
          }}
        />
        <KPICard
          title="WhatsApp"
          value={data.stats.totalWhatsApp}
          icon={<Smartphone className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+25%',
            label: 'yeni kanal'
          }}
        />
        <KPICard
          title="Email-lər"
          value={data.stats.totalEmails}
          icon={<Mail className="h-4 w-4" />}
          trend={{
            direction: 'neutral',
            value: '0%',
            label: 'sabit'
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
                Tez ünsiyyət əməliyyatları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <PhoneCall className="h-4 w-4 mr-2" />
                Zəng et
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS göndər
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Smartphone className="h-4 w-4 mr-2" />
                WhatsApp mesajı
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email göndər
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Son Ünsiyyət Aktivliyi
              </CardTitle>
              <CardDescription>
                Ən son ünsiyyət fəaliyyətləri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommunicationTimeline 
                communications={data.recentActivity}
                onCommunicationClick={(comm) => console.log('Communication clicked:', comm)}
              />
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
                placeholder="Ünsiyyət axtar (ad, telefon, məzmun)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Növ filteri
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                  Hamısı
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("call")}>
                  Zənglər
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("sms")}>
                  SMS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("whatsapp")}>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("email")}>
                  Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direction Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  İstiqamət
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Hamısı</DropdownMenuItem>
                <DropdownMenuItem>Gələn</DropdownMenuItem>
                <DropdownMenuItem>Gedən</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Communications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Ünsiyyət Tarixçəsi
          </CardTitle>
          <CardDescription>
            Bütün ünsiyyət fəaliyyətləriniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            data={data.communications}
            columns={communicationColumns}
            loading={false}
            searchTerm={searchTerm}
          />
        </CardContent>
      </Card>
    </div>
  )
}