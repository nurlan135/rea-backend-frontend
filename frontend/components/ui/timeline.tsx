"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle, Circle, Clock, AlertCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type TimelineItemStatus = "completed" | "current" | "pending" | "failed" | "skipped"

export interface TimelineItemData {
  id: string
  title: string
  description?: string
  timestamp?: string
  status: TimelineItemStatus
  details?: React.ReactNode
  meta?: Record<string, any>
}

interface TimelineItemProps {
  item: TimelineItemData
  isLast?: boolean
  showConnector?: boolean
  onClick?: (item: TimelineItemData) => void
}

const TimelineItem = ({ item, isLast = false, showConnector = true, onClick }: TimelineItemProps) => {
  const getStatusIcon = (status: TimelineItemStatus) => {
    const iconClasses = "h-4 w-4"
    
    switch (status) {
      case "completed":
        return <CheckCircle className={cn(iconClasses, "text-green-600")} />
      case "current":
        return <Clock className={cn(iconClasses, "text-blue-600 animate-pulse")} />
      case "pending":
        return <Circle className={cn(iconClasses, "text-gray-400")} />
      case "failed":
        return <XCircle className={cn(iconClasses, "text-red-600")} />
      case "skipped":
        return <AlertCircle className={cn(iconClasses, "text-yellow-600")} />
    }
  }

  const getStatusColor = (status: TimelineItemStatus) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50"
      case "current":
        return "border-blue-200 bg-blue-50"
      case "pending":
        return "border-gray-200 bg-gray-50"
      case "failed":
        return "border-red-200 bg-red-50"
      case "skipped":
        return "border-yellow-200 bg-yellow-50"
    }
  }

  const getConnectorColor = (status: TimelineItemStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-200"
      case "current":
        return "bg-blue-200"
      default:
        return "bg-gray-200"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex items-start space-x-3"
    >
      {/* Timeline Icon */}
      <div className="flex-shrink-0 relative">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2",
          getStatusColor(item.status)
        )}>
          {getStatusIcon(item.status)}
        </div>
        
        {/* Connector Line */}
        {!isLast && showConnector && (
          <div className={cn(
            "absolute top-8 left-1/2 w-0.5 h-8 -translate-x-0.5",
            getConnectorColor(item.status)
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div 
          className={cn(
            "space-y-2",
            onClick && "cursor-pointer"
          )}
          onClick={() => onClick?.(item)}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {item.title}
            </h4>
            {item.timestamp && (
              <span className="text-xs text-gray-500">
                {item.timestamp}
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600">
              {item.description}
            </p>
          )}
          
          {item.details && (
            <div className="mt-2">
              {item.details}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface TimelineProps {
  items: TimelineItemData[]
  showConnectors?: boolean
  onItemClick?: (item: TimelineItemData) => void
  className?: string
}

export function Timeline({ 
  items, 
  showConnectors = true, 
  onItemClick, 
  className 
}: TimelineProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => (
        <TimelineItem
          key={item.id}
          item={item}
          isLast={index === items.length - 1}
          showConnector={showConnectors}
          onClick={onItemClick}
        />
      ))}
    </div>
  )
}

// Specialized Timeline for Approval Process
interface ApprovalTimelineProps {
  steps: {
    id: string
    title: string
    role: string
    user?: string
    status: TimelineItemStatus
    timestamp?: string
    notes?: string
    reason?: string
  }[]
  onStepClick?: (step: any) => void
}

export function ApprovalTimeline({ steps, onStepClick }: ApprovalTimelineProps) {
  const timelineItems: TimelineItemData[] = steps.map(step => ({
    id: step.id,
    title: step.title,
    description: step.user ? `${step.role} - ${step.user}` : step.role,
    timestamp: step.timestamp,
    status: step.status,
    details: (step.notes || step.reason) ? (
      <div className="text-xs space-y-1">
        {step.notes && (
          <p className="text-gray-600">{step.notes}</p>
        )}
        {step.reason && step.status === "skipped" && (
          <Badge variant="outline" className="text-yellow-700 bg-yellow-50">
            Səbəb: {step.reason}
          </Badge>
        )}
      </div>
    ) : null,
    meta: step
  }))

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Təsdiqləmə Prosesi</h3>
      </CardHeader>
      <CardContent>
        <Timeline 
          items={timelineItems} 
          onItemClick={onStepClick ? (item) => onStepClick(item.meta) : undefined}
        />
      </CardContent>
    </Card>
  )
}

// Communication Timeline for property/customer history
interface CommunicationTimelineProps {
  communications: {
    id: string
    type: "call" | "sms" | "whatsapp" | "email"
    direction: "in" | "out"
    timestamp: string
    duration?: number
    message?: string
    status?: string
    user: string
  }[]
  onCommunicationClick?: (communication: any) => void
}

export function CommunicationTimeline({ 
  communications, 
  onCommunicationClick 
}: CommunicationTimelineProps) {
  const getTypeIcon = (type: string) => {
    // You can add specific icons for each communication type
    return <Circle className="h-4 w-4" />
  }

  const timelineItems: TimelineItemData[] = communications.map(comm => {
    const title = comm.type === "call" 
      ? `${comm.direction === "in" ? "Gələn" : "Gedən"} zəng`
      : `${comm.type.toUpperCase()} mesajı`
    
    const description = `${comm.user}${comm.duration ? ` - ${comm.duration}s` : ""}`
    
    return {
      id: comm.id,
      title,
      description,
      timestamp: comm.timestamp,
      status: "completed" as TimelineItemStatus,
      details: comm.message ? (
        <div className="text-xs bg-gray-50 p-2 rounded border">
          <p className="text-gray-700">{comm.message}</p>
        </div>
      ) : null,
      meta: comm
    }
  })

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Əlaqə Tarixçəsi</h3>
      </CardHeader>
      <CardContent>
        <Timeline 
          items={timelineItems}
          onItemClick={onCommunicationClick ? (item) => onCommunicationClick(item.meta) : undefined}
        />
      </CardContent>
    </Card>
  )
}

// Booking Timeline for status changes
interface BookingTimelineProps {
  events: {
    id: string
    action: string
    timestamp: string
    user: string
    details?: string
    status: "success" | "info" | "warning" | "error"
  }[]
}

export function BookingTimeline({ events }: BookingTimelineProps) {
  const timelineItems: TimelineItemData[] = events.map(event => {
    let status: TimelineItemStatus
    switch (event.status) {
      case "success":
        status = "completed"
        break
      case "error":
        status = "failed"
        break
      case "warning":
        status = "skipped"
        break
      default:
        status = "completed"
    }

    return {
      id: event.id,
      title: event.action,
      description: event.user,
      timestamp: event.timestamp,
      status,
      details: event.details ? (
        <p className="text-xs text-gray-600">{event.details}</p>
      ) : null
    }
  })

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Bron Tarixçəsi</h3>
      </CardHeader>
      <CardContent>
        <Timeline items={timelineItems} />
      </CardContent>
    </Card>
  )
}