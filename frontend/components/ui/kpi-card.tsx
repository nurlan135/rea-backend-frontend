"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type TrendDirection = "up" | "down" | "neutral"

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    direction: TrendDirection
    value: string | number
    label?: string
  }
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
  className?: string
  formatValue?: (value: string | number) => string
}

export function KPICard({
  title,
  value,
  description,
  trend,
  icon,
  loading = false,
  onClick,
  className,
  formatValue,
}: KPICardProps) {
  const displayValue = formatValue ? formatValue(value) : value

  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4" />
      case "down":
        return <TrendingDown className="h-4 w-4" />
      case "neutral":
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      case "neutral":
        return "text-gray-500"
    }
  }

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-32"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-2xl font-bold mb-1"
        >
          {displayValue}
        </motion.div>
        {trend && (
          <div className={cn("flex items-center text-xs", getTrendColor(trend.direction))}>
            {getTrendIcon(trend.direction)}
            <span className="ml-1">
              {trend.value} {trend.label && `${trend.label}`}
            </span>
          </div>
        )}
        {description && !trend && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  )
}

// Animated Number Counter Component
interface AnimatedNumberProps {
  value: number
  duration?: number
  formatter?: (value: number) => string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  formatter = (v) => v.toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  const [isInView, setIsInView] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!isInView) return

    let startTime: number
    const startValue = displayValue
    const endValue = value

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = startValue + (endValue - startValue) * easeOutQuart
      
      setDisplayValue(Math.round(current))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, isInView, displayValue])

  return (
    <span ref={ref} className={className}>
      {formatter(displayValue)}
    </span>
  )
}

// KPI Grid Layout Component
interface KPIGridProps {
  children: React.ReactNode
  columns?: number
  className?: string
}

export function KPIGrid({ children, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2", 
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns as keyof typeof gridCols], className)}>
      {children}
    </div>
  )
}

// Specialized KPI Cards for REA INVEST

interface PropertyKPICardProps extends Omit<KPICardProps, "formatValue"> {
  currency?: string
}

export function PropertyKPICard({ currency = "₼", ...props }: PropertyKPICardProps) {
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(numValue)) return value.toString()
    
    return `${currency} ${numValue.toLocaleString("az-AZ")}`
  }

  return <KPICard {...props} formatValue={formatCurrency} />
}

interface PercentageKPICardProps extends Omit<KPICardProps, "formatValue"> {
  precision?: number
}

export function PercentageKPICard({ precision = 1, ...props }: PercentageKPICardProps) {
  const formatPercentage = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(numValue)) return value.toString()
    
    return `${numValue.toFixed(precision)}%`
  }

  return <KPICard {...props} formatValue={formatPercentage} />
}