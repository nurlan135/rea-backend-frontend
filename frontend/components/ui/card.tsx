import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "border shadow-sm hover:shadow-md hover:-translate-y-0.5",
        elevated: "shadow-lg hover:shadow-xl hover:-translate-y-1",
        bordered: "border-2 border-border hover:border-primary/20 hover:shadow-sm",
        ghost: "border-0 shadow-none hover:bg-accent/50 hover:shadow-sm",
        interactive: "border shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer active:translate-y-0 active:shadow-md",
        outline: "border-dashed border-2 border-muted-foreground/25 bg-transparent hover:border-primary/50 hover:bg-accent/10"
      },
      size: {
        default: "py-6",
        sm: "py-4",
        lg: "py-8",
        xl: "py-10"
      },
      padding: {
        default: "",
        none: "p-0",
        sm: "p-4",
        lg: "p-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      padding: "default"
    }
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  loading?: boolean
  clickable?: boolean
}

function Card({ className, variant, size, padding, loading, clickable, children, ...props }: CardProps) {
  if (loading) {
    return (
      <div
        data-slot="card"
        className={cn(
          cardVariants({ variant: "default", size, padding }),
          "animate-pulse relative overflow-hidden",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="space-y-4 opacity-50">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-20 bg-muted rounded" />
          <div className="flex space-x-2">
            <div className="h-8 bg-muted rounded flex-1" />
            <div className="h-8 bg-muted rounded w-20" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot="card"
      className={cn(
        cardVariants({ 
          variant: clickable ? "interactive" : variant, 
          size, 
          padding 
        }),
        clickable && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onClick?.(e as any)
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.ComponentProps<"div"> {
  bordered?: boolean
}

function CardHeader({ className, bordered, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        bordered && "border-b border-border pb-6",
        "[.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

interface CardTitleProps extends React.ComponentProps<"h3"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div"
}

function CardTitle({ className, as: Component = "h3", ...props }: CardTitleProps) {
  return (
    <Component
      data-slot="card-title"
      className={cn("leading-none font-semibold text-card-foreground tracking-tight", className)}
      {...props}
    />
  )
}

interface CardDescriptionProps extends React.ComponentProps<"p"> {
  as?: "p" | "div" | "span"
}

function CardDescription({ className, as: Component = "p", ...props }: CardDescriptionProps) {
  return (
    <Component
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

interface CardContentProps extends React.ComponentProps<"div"> {
  noPadding?: boolean
}

function CardContent({ className, noPadding, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(!noPadding && "px-6", "flex-1", className)}
      {...props}
    />
  )
}

interface CardFooterProps extends React.ComponentProps<"div"> {
  bordered?: boolean
  justify?: "start" | "center" | "end" | "between"
}

function CardFooter({ className, bordered, justify = "start", ...props }: CardFooterProps) {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center", 
    end: "justify-end",
    between: "justify-between"
  }

  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6",
        justifyClasses[justify],
        bordered && "border-t border-border pt-6",
        "[.border-t]:pt-6",
        className
      )}
      {...props}
    />
  )
}

// Skeleton Card Component
function CardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Card 
      className={cn("animate-pulse", className)} 
      loading
      {...props} 
    />
  )
}

// Status Card Component  
interface StatusCardProps extends CardProps {
  status?: "success" | "warning" | "error" | "info"
  statusText?: string
}

function StatusCard({ 
  className, 
  status, 
  statusText,
  children, 
  ...props 
}: StatusCardProps) {
  const statusColors = {
    success: "border-l-success bg-success/5",
    warning: "border-l-warning bg-warning/5", 
    error: "border-l-destructive bg-destructive/5",
    info: "border-l-info bg-info/5"
  }

  return (
    <Card
      className={cn(
        "border-l-4",
        status && statusColors[status],
        className
      )}
      {...props}
    >
      {statusText && (
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === "success" && "bg-success",
              status === "warning" && "bg-warning",
              status === "error" && "bg-destructive", 
              status === "info" && "bg-info"
            )} />
            <span className="text-sm font-medium">{statusText}</span>
          </div>
        </CardHeader>
      )}
      {children}
    </Card>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardSkeleton,
  StatusCard,
  cardVariants,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardDescriptionProps,
  type CardContentProps,
  type CardFooterProps,
  type StatusCardProps
}
