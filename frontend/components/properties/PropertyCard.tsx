"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Eye, 
  Calendar,
  Heart,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  MessageSquare
} from "lucide-react"

interface PropertyCardProps {
  property: {
    id: number
    title: string
    type: string
    price: number
    address: string
    area: number
    rooms: number
    bathrooms?: number
    status: string
    views: number
    bookings: number
    agent: string
    images: string[] | number
    description?: string
    createdAt: string
    isFavorite?: boolean
  }
  onView?: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onContact?: (id: number) => void
  onToggleFavorite?: (id: number) => void
  className?: string
}

export function PropertyCard({ 
  property, 
  onView, 
  onEdit, 
  onDelete, 
  onContact,
  onToggleFavorite,
  className 
}: PropertyCardProps) {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'apartment':
        return 'Mənzil'
      case 'house':
        return 'Ev'
      case 'office':
        return 'Ofis'
      case 'shop':
        return 'Mağaza'
      default:
        return type
    }
  }

  const imageCount = typeof property.images === 'number' ? property.images : property.images.length
  const mainImage = typeof property.images === 'object' && property.images.length > 0 
    ? property.images[0] 
    : '/placeholder-property.jpg'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 property-card">
        {/* Property Image */}
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          <div 
            className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
            style={{
              backgroundImage: typeof property.images === 'object' ? `url(${mainImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {typeof property.images === 'number' && (
              <div className="text-gray-500 text-center">
                <Square className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">{imageCount} şəkil</span>
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge(property.status)}
          </div>
          
          {/* Image Count */}
          {imageCount > 0 && (
            <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {imageCount} şəkil
            </div>
          )}
          
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-3 right-3 bg-white/80 hover:bg-white backdrop-blur-sm"
            onClick={() => onToggleFavorite?.(property.id)}
          >
            <Heart className={`h-4 w-4 ${property.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        <CardContent className="p-4">
          {/* Property Title & Type */}
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {property.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(property.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ətraflı bax
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(property.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Redaktə et
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Paylaş
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete?.(property.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Badge variant="outline" className="mr-2 text-xs">
                {getTypeLabel(property.type)}
              </Badge>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>

          {/* Property Details */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.area}m²</span>
            </div>
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.rooms} otaq</span>
            </div>
            {property.bathrooms && (
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                <span>{property.bathrooms}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-2xl font-bold text-primary">
              ₼ {property.price.toLocaleString()}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{property.views} baxış</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{property.bookings} rezerv</span>
            </div>
          </div>

          {/* Agent */}
          <div className="text-sm text-muted-foreground mb-4">
            <strong>Agent:</strong> {property.agent}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              className="flex-1"
              onClick={() => onView?.(property.id)}
            >
              Ətraflı Bax
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onContact?.(property.id)}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Property Grid Component
interface PropertyGridProps {
  properties: PropertyCardProps['property'][]
  onView?: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onContact?: (id: number) => void
  onToggleFavorite?: (id: number) => void
  loading?: boolean
  className?: string
}

export function PropertyGrid({ 
  properties, 
  loading, 
  className, 
  ...actions 
}: PropertyGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-200" />
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-8 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          {...actions}
        />
      ))}
    </div>
  )
}