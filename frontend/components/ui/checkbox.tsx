"use client"

import * as React from "react"
import { Check, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer shrink-0 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5", 
        lg: "h-6 w-6"
      },
      variant: {
        default: "border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary",
        destructive: "border-input data-[state=checked]:bg-destructive data-[state=checked]:border-destructive data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:border-destructive",
        success: "border-input data-[state=checked]:bg-success data-[state=checked]:border-success data-[state=indeterminate]:bg-success data-[state=indeterminate]:border-success"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

interface CheckboxProps 
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof checkboxVariants> {
  indeterminate?: boolean
  label?: string
  description?: string
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, size, variant, indeterminate, label, description, error, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null)
    const combinedRef = React.useCallback((node: HTMLInputElement) => {
      checkboxRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }, [ref])

    React.useEffect(() => {
      if (checkboxRef.current && indeterminate !== undefined) {
        checkboxRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    const IconComponent = indeterminate ? Minus : Check
    const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"

    const content = (
      <div className="flex items-start space-x-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className={cn(checkboxVariants({ size, variant }), className)}
            ref={combinedRef}
            data-state={indeterminate ? "indeterminate" : props.checked ? "checked" : "unchecked"}
            {...props}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <IconComponent 
              className={cn(
                iconSize,
                "text-primary-foreground opacity-0 transition-opacity duration-200",
                (props.checked || indeterminate) && "opacity-100"
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
            type="checkbox"
            className={cn(checkboxVariants({ size, variant }), className)}
            ref={combinedRef}
            data-state={indeterminate ? "indeterminate" : props.checked ? "checked" : "unchecked"}
            {...props}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <IconComponent 
              className={cn(
                iconSize,
                "text-primary-foreground opacity-0 transition-opacity duration-200",
                (props.checked || indeterminate) && "opacity-100"
              )} 
            />
          </div>
        </div>
      )
    }

    return content
  }
)
Checkbox.displayName = "Checkbox"

// Checkbox Group Component
interface CheckboxGroupProps {
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  value?: string[]
  defaultValue?: string[]
  orientation?: "horizontal" | "vertical"
  className?: string
  size?: VariantProps<typeof checkboxVariants>["size"]
  variant?: VariantProps<typeof checkboxVariants>["variant"]
  onValueChange?: (value: string[]) => void
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ options, value, defaultValue, orientation = "vertical", className, size, variant, onValueChange, ...props }, ref) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(value || defaultValue || [])

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValues(value)
      }
    }, [value])

    const handleChange = (optionValue: string, checked: boolean) => {
      const newValues = checked
        ? [...selectedValues, optionValue]
        : selectedValues.filter(v => v !== optionValue)
      
      setSelectedValues(newValues)
      onValueChange?.(newValues)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "space-y-3",
          orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0",
          className
        )}
        role="group"
        {...props}
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            id={option.value}
            size={size}
            variant={variant}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            checked={selectedValues.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
          />
        ))}
      </div>
    )
  }
)
CheckboxGroup.displayName = "CheckboxGroup"

export { Checkbox, CheckboxGroup, checkboxVariants, type CheckboxProps, type CheckboxGroupProps }