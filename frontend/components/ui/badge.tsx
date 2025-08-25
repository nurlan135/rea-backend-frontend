import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        success: "border-transparent bg-success text-white shadow hover:bg-success/80",
        warning: "border-transparent bg-warning text-white shadow hover:bg-warning/80",
        info: "border-transparent bg-info text-white shadow hover:bg-info/80",
        outline: "border-border text-foreground",
        // REA INVEST Status Variants
        pending: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200",
        active: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        sold: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
        expired: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        converted: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        // Property type variants
        sale: "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        rent: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        // Priority variants  
        high: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        medium: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        low: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

// Status text mappings for Azerbaijani
export const statusText = {
  pending: "Gözləmədə",
  active: "Aktiv", 
  sold: "Satılıb",
  expired: "Müddəti bitib",
  converted: "Çevrildi",
  sale: "Satılıq",
  rent: "Kirayə",
  high: "Yüksək",
  medium: "Orta",
  low: "Aşağı",
} as const

export type StatusType = keyof typeof statusText

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: StatusType
  showIcon?: boolean
}

function StatusBadge({ status, showIcon = false, children, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={status} {...props}>
      {children || statusText[status]}
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants }