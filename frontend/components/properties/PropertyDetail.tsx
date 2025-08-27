"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleTable } from "@/components/ui/simple-table"
import { Timeline } from "@/components/ui/timeline"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { 
  ArrowLeft,
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Eye, 
  Calendar,
  Heart,
  Share2,
  Edit,
  Phone,
  MessageSquare,
  Star,
  TrendingUp,
  Camera,
  FileText,
  Clock,
  User,
  DollarSign
} from "lucide-react"

interface PropertyDetailProps {
  propertyId: string
  className?: string
}

export default function PropertyDetail({ propertyId, className }: PropertyDetailProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)

  // Mock data - in real app this would come from API
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        property: {
          id: parseInt(propertyId),
          title: "3 otaqlı mənzil, Yasamal rayonu",
          type: "apartment",
          price: 95000,
          address: "Yasamal rayonu, H.Əliyev pr. 123, mənzil 45",
          area: 85,
          rooms: 3,
          bathrooms: 2,
          floor: 8,
          totalFloors: 12,
          buildingYear: 2018,
          status: "active",
          views: 245,
          bookings: 3,
          agent: {
            name: "Leyla Həsənova",
            phone: "+994 50 123 45 67",
            email: "leyla@rea-invest.com",
            avatar: null
          },
          createdAt: "2024-01-15",
          updatedAt: "2024-01-20", 
          images: [
            "/property-1.jpg",
            "/property-2.jpg", 
            "/property-3.jpg",
            "/property-4.jpg",
            "/property-5.jpg",
            "/property-6.jpg",
            "/property-7.jpg",
            "/property-8.jpg"
          ],
          description: "Yasamal rayonunda yerləşən 3 otaqlı mənzil. Təmir olunmuş, mərkəzi istilik sistemi, lift, təhlükəsizlik sistemi. Yaxın məsafədə məktəb, uşaq bağçası, ticarət mərkəzləri və metro stansiyası var.",
          features: [
            "Təmir olunmuş",
            "Mərkəzi istilik",
            "Lift",
            "Balkon",
            "Təhlükəsizlik sistemi", 
            "Parklanma yeri",
            "İnternet",
            "Kabel TV"
          ],
          location: {
            district: "Yasamal",
            neighborhood: "H.Əliyev prospekti",
            nearbyPlaces: [
              { name: "28 May metro stansiyası", distance: "300m" },
              { name: "Gənclik Mall", distance: "500m" },
              { name: "153 nömrəli məktəb", distance: "200m" },
              { name: "Heydər Əliyev Parkı", distance: "800m" }
            ]
          }
        },
        statistics: {
          dailyViews: [12, 8, 15, 22, 18, 25, 19],
          monthlyViews: 245,
          totalBookings: 3,
          inquiries: 8,
          avgTimeOnPage: "2m 34s"
        },
        bookings: [
          {
            id: 1,
            customerName: "Rəşad Məmmədov",
            phone: "+994 55 987 65 43",
            date: "2024-01-18",
            time: "14:00",
            status: "confirmed",
            notes: "Ailə ilə baxmaq istəyir"
          },
          {
            id: 2,
            customerName: "Aynur Qasımova", 
            phone: "+994 70 123 45 67",
            date: "2024-01-20",
            time: "16:30",
            status: "pending",
            notes: "Kredit imkanları haqqında məlumat istəyir"
          }
        ],
        activities: [
          {
            id: '1',
            title: 'Rezervasiya edildi',
            description: 'Rəşad Məmmədov tərəfindən',
            timestamp: '2 saat əvvəl',
            status: 'completed' as const
          },
          {
            id: '2',
            title: 'Qiymət yeniləndi',
            description: '98.000₼ → 95.000₼',
            timestamp: '1 gün əvvəl',
            status: 'completed' as const
          },
          {
            id: '3',
            title: 'Yeni şəkillər əlavə edildi',
            description: '3 yeni şəkil yükləndi',
            timestamp: '3 gün əvvəl',
            status: 'completed' as const
          }
        ]
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [propertyId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

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

  const bookingColumns = [
    {
      key: 'customerName',
      label: 'Müştəri',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.phone}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Tarix',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.time}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'confirmed' ? 'default' : 'secondary'}>
          {value === 'confirmed' ? 'Təsdiqlənib' : 'Gözləyir'}
        </Badge>
      )
    },
    {
      key: 'notes',
      label: 'Qeydlər',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value || '-'}</span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{data.property.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{data.property.address}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Redaktə et
          </Button>
        </div>
      </div>

      {/* Property Info Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-lg">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <span>{data.property.images.length} şəkil mövcuddur</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  {getStatusBadge(data.property.status)}
                </div>
              </div>
              <div className="p-4">
                <Button variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Bütün Şəkilləri Göstər ({data.property.images.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Əmlak Təfərrüatları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <Square className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="font-semibold">{data.property.area}m²</div>
                  <div className="text-sm text-muted-foreground">Sahə</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="font-semibold">{data.property.rooms}</div>
                  <div className="text-sm text-muted-foreground">Otaq</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="font-semibold">{data.property.bathrooms}</div>
                  <div className="text-sm text-muted-foreground">Hamam</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="font-semibold text-primary">{data.property.floor}</div>
                  <div className="text-sm text-muted-foreground">Mərtəbə</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <div className="font-medium mb-2">Bina məlumatları</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>İnşa ili: {data.property.buildingYear}</div>
                    <div>Ümumi mərtəbə: {data.property.totalFloors}</div>
                    <div>Mərtəbə: {data.property.floor}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Statistika</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {data.property.views} baxış
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {data.property.bookings} rezerv
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {data.statistics.inquiries} sorğu
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Təsvir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {data.property.description}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Xüsusiyyətlər</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.property.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Məkan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-2">Yaxın məsafədə</div>
                  <div className="space-y-2">
                    {data.property.location.nearbyPlaces.map((place: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{place.name}</span>
                        <Badge variant="outline">{place.distance}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Xəritədə Göstər
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-primary">
                  ₼ {data.property.price.toLocaleString()}
                </div>
                <div className="space-y-2">
                  <Button className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Rezervasiya Et
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Zəng Et
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Mesaj
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium">
                      {data.property.agent.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{data.property.agent.name}</div>
                    <div className="text-sm text-muted-foreground">{data.property.agent.email}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    {data.property.agent.phone}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mesaj göndər
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Son Aktivlər
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={data.activities} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Rezervasiyalar
          </CardTitle>
          <CardDescription>
            Bu əmlak üçün edilmiş rezervasiyalar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            data={data.bookings}
            columns={bookingColumns}
            loading={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}