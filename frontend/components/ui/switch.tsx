"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        default: "h-6 w-11",
        lg: "h-7 w-13"
      },
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-success data-[state=unchecked]:bg-input"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0", 
        lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

// Radix-based Switch Component (Primary Implementation)
interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  label?: string
  description?: string
  labelPosition?: "left" | "right"
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size, variant, label, description, labelPosition = "right", ...props }, ref) => {
  const switchElement = (
    <SwitchPrimitives.Root
      className={cn(switchVariants({ size, variant }), className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={switchThumbVariants({ size })}
      />
    </SwitchPrimitives.Root>
  )

  if (!label && !description) {
    return switchElement
  }

  const labelElement = (
    <div className="flex flex-col">
      {label && (
        <label 
          htmlFor={props.id}
          className={cn(
            "text-sm font-medium leading-none cursor-pointer",
            props.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </label>
      )}
      {description && (
        <p className={cn(
          "text-xs text-muted-foreground mt-1",
          props.disabled && "opacity-50"
        )}>
          {description}
        </p>
      )}
    </div>
  )

  return (
    <div className={cn(
      "flex items-center space-x-3",
      labelPosition === "left" && "flex-row-reverse space-x-reverse"
    )}>
      {switchElement}
      {labelElement}
    </div>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

// Enhanced Switch Component (Alternative implementation with more features)
interface EnhancedSwitchProps
  extends Omit<React.ComponentProps<"input">, "size" | "type">,
    VariantProps<typeof switchVariants> {
  label?: string
  description?: string
  labelPosition?: "left" | "right"
  error?: string
}

const EnhancedSwitch = React.forwardRef<HTMLInputElement, EnhancedSwitchProps>(
  ({ className, size, variant, label, description, labelPosition = "right", error, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || false)

    React.useEffect(() => {
      if (props.checked !== undefined) {
        setChecked(props.checked)
      }
    }, [props.checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setChecked(e.target.checked)
      props.onChange?.(e)
    }

    const switchElement = (
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(switchVariants({ size, variant }), className)}
          data-state={checked ? "checked" : "unchecked"}
          role="switch"
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              const syntheticEvent = {
                target: { checked: !checked },
                currentTarget: { checked: !checked }
              } as React.ChangeEvent<HTMLInputElement>
              handleChange(syntheticEvent)
            }
          }}
        >
          <span
            className={switchThumbVariants({ size })}
            data-state={checked ? "checked" : "unchecked"}
          />
        </div>
      </div>
    )

    if (!label && !description && !error) {
      return switchElement
    }

    const labelElement = (
      <div className="flex flex-col">
        {label && (
          <label 
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer",
              props.disabled && "opacity-50 cursor-not-allowed",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
        )}
        {description && !error && (
          <p className={cn(
            "text-xs text-muted-foreground mt-1",
            props.disabled && "opacity-50"
          )}>
            {description}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </div>
    )

    return (
      <div className={cn(
        "flex items-center space-x-3",
        labelPosition === "left" && "flex-row-reverse space-x-reverse"
      )}>
        {switchElement}
        {labelElement}
      </div>
    )
  }
)
EnhancedSwitch.displayName = "EnhancedSwitch"

// Switch Group Component
interface SwitchGroupProps {
  switches: Array<{
    id: string
    label: string
    description?: string
    checked?: boolean
    disabled?: boolean
  }>
  orientation?: "horizontal" | "vertical"
  className?: string
  size?: VariantProps<typeof switchVariants>["size"]
  variant?: VariantProps<typeof switchVariants>["variant"]
  labelPosition?: "left" | "right"
  onValueChange?: (switchId: string, checked: boolean) => void
}

const SwitchGroup = React.forwardRef<HTMLDivElement, SwitchGroupProps>(
  ({ 
    switches, 
    orientation = "vertical", 
    className, 
    size, 
    variant, 
    labelPosition,
    onValueChange, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-4",
          orientation === "horizontal" && "flex flex-wrap gap-6 space-y-0",
          className
        )}
        {...props}
      >
        {switches.map((switchItem) => (
          <Switch
            key={switchItem.id}
            id={switchItem.id}
            size={size}
            variant={variant}
            label={switchItem.label}
            description={switchItem.description}
            labelPosition={labelPosition}
            checked={switchItem.checked}
            disabled={switchItem.disabled}
            onCheckedChange={(checked) => onValueChange?.(switchItem.id, checked)}
          />
        ))}
      </div>
    )
  }
)
SwitchGroup.displayName = "SwitchGroup"

export { 
  Switch, 
  EnhancedSwitch,
  SwitchGroup, 
  switchVariants, 
  type SwitchProps, 
  type EnhancedSwitchProps,
  type SwitchGroupProps 
}