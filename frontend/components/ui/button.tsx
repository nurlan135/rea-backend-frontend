import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm btn-primary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0",
        link: 
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-white shadow-sm hover:bg-success/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        warning:
          "bg-warning text-white shadow-sm hover:bg-warning/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        info:
          "bg-info text-white shadow-sm hover:bg-info/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        gradient:
          "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm btn-primary",
      },
      size: {
        xs: "h-7 px-2.5 text-xs has-[>svg]:px-2",
        sm: "h-8 px-3 text-sm has-[>svg]:px-2.5",
        default: "h-9 px-4 has-[>svg]:px-3",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-11 px-8 text-base has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  icon,
  iconPosition = "left",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const isDisabled = disabled || loading

  const content = (
    <>
      {loading && (
        <Loader2 className="animate-spin" />
      )}
      {!loading && icon && iconPosition === "left" && (
        <span className="button-icon">{icon}</span>
      )}
      <span className={loading ? "opacity-0" : ""}>
        {loading && loadingText ? loadingText : children}
      </span>
      {!loading && icon && iconPosition === "right" && (
        <span className="button-icon">{icon}</span>
      )}
    </>
  )

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonProps }
