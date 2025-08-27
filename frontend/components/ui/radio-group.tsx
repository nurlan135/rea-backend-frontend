"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const radioVariants = cva(
  "peer shrink-0 rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6"
      },
      variant: {
        default: "border-input data-[state=checked]:border-primary",
        destructive: "border-input data-[state=checked]:border-destructive",
        success: "border-input data-[state=checked]:border-success"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

interface RadioProps
  extends Omit<React.ComponentProps<"input">, "size" | "type">,
    VariantProps<typeof radioVariants> {
  label?: string
  description?: string
  error?: string
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, size, variant, label, description, error, ...props }, ref) => {
    const dotSize = size === "sm" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5"

    const content = (
      <div className="flex items-start space-x-3">
        <div className="relative flex items-center">
          <input
            type="radio"
            className={cn(radioVariants({ size, variant }), className)}
            ref={ref}
            data-state={props.checked ? "checked" : "unchecked"}
            {...props}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className={cn(
                dotSize,
                "rounded-full transition-all duration-200",
                props.checked 
                  ? variant === "destructive" 
                    ? "bg-destructive scale-100" 
                    : variant === "success"
                    ? "bg-success scale-100"
                    : "bg-primary scale-100"
                  : "scale-0"
              )} 
            />
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex flex-col space-y-1">
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
            {description && (
              <p className={cn(
                "text-xs text-muted-foreground",
                props.disabled && "opacity-50"
              )}>
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        )}
      </div>
    )

    if (!label && !description && !error) {
      return (
        <div className="relative flex items-center">
          <input
            type="radio"
            className={cn(radioVariants({ size, variant }), className)}
            ref={ref}
            data-state={props.checked ? "checked" : "unchecked"}
            {...props}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className={cn(
                dotSize,
                "rounded-full transition-all duration-200",
                props.checked 
                  ? variant === "destructive" 
                    ? "bg-destructive scale-100" 
                    : variant === "success"
                    ? "bg-success scale-100"
                    : "bg-primary scale-100"
                  : "scale-0"
              )} 
            />
          </div>
        </div>
      )
    }

    return content
  }
)
Radio.displayName = "Radio"

// Radio Group Component
interface RadioGroupProps {
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  value?: string
  defaultValue?: string
  name: string
  orientation?: "horizontal" | "vertical"
  className?: string
  size?: VariantProps<typeof radioVariants>["size"]
  variant?: VariantProps<typeof radioVariants>["variant"]
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ 
    options, 
    value, 
    defaultValue, 
    name, 
    orientation = "vertical", 
    className, 
    size, 
    variant, 
    onValueChange, 
    ...props 
  }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
      }
    }, [value])

    const handleChange = (optionValue: string) => {
      setSelectedValue(optionValue)
      onValueChange?.(optionValue)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "space-y-3",
          orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0",
          className
        )}
        role="radiogroup"
        {...props}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            size={size}
            variant={variant}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            checked={selectedValue === option.value}
            onChange={() => handleChange(option.value)}
          />
        ))}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export { Radio, RadioGroup, radioVariants, type RadioProps, type RadioGroupProps }