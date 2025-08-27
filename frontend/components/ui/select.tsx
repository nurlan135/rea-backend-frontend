"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, ChevronUp, Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Radix Select Components (Primary Implementation)
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const selectTriggerVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input",
        filled: "bg-muted border-transparent focus:bg-background focus:border-input",
        ghost: "border-transparent hover:bg-accent focus:bg-accent"
      },
      size: {
        sm: "h-8 px-2.5 text-sm",
        default: "h-9 px-3",
        lg: "h-10 px-4",
        xl: "h-12 px-4 text-base"
      },
      state: {
        default: "",
        error: "border-destructive focus:border-destructive focus:ring-destructive/20",
        success: "border-success focus:border-success focus:ring-success/20",
        warning: "border-warning focus:border-warning focus:ring-warning/20"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default"
    }
  }
)

interface SelectTriggerProps 
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, variant, size, state, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ variant, size, state }), className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// Enhanced Select Component with REA INVEST specific features
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
}

interface EnhancedSelectProps extends VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  searchable?: boolean
  clearable?: boolean
  className?: string
  label?: string
  description?: string
  error?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
}

const EnhancedSelect = React.forwardRef<HTMLButtonElement, EnhancedSelectProps>(
  ({ 
    options, 
    value, 
    defaultValue, 
    placeholder = "Seçin...", 
    disabled, 
    loading,
    searchable,
    clearable,
    className, 
    variant, 
    size, 
    state,
    label,
    description,
    error,
    onValueChange,
    onClear,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")
    const [searchTerm, setSearchTerm] = React.useState("")
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
      }
    }, [value])

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchTerm("")
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => opt.value === selectedValue)
    
    const filteredOptions = searchable 
      ? options.filter(option => 
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue)
      setIsOpen(false)
      setSearchTerm("")
      onValueChange?.(optionValue)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedValue("")
      onClear?.()
      onValueChange?.("")
    }

    const effectiveState = error ? "error" : state

    const content = (
      <div className="relative" ref={dropdownRef}>
        <button
          ref={ref}
          type="button"
          className={cn(selectTriggerVariants({ variant, size, state: effectiveState }), className)}
          disabled={disabled || loading}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <span className={cn("block truncate", !selectedOption && "text-muted-foreground")}>
            {loading ? "Yüklənir..." : selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center space-x-1">
            {clearable && selectedValue && !disabled && !loading && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleClear}
                tabIndex={-1}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
            ) : (
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
            )}
          </div>
        </button>

        {isOpen && !disabled && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  placeholder="Axtar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  {searchable && searchTerm ? "Nəticə tapılmadı" : "Seçim yoxdur"}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left hover:bg-accent focus:bg-accent focus:outline-none transition-colors flex items-center justify-between",
                      option.disabled && "opacity-50 cursor-not-allowed",
                      selectedValue === option.value && "bg-accent"
                    )}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                  >
                    <div className="flex flex-col items-start">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      )}
                    </div>
                    {selectedValue === option.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )

    if (!label && !description && !error) {
      return content
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className={cn(
            "text-sm font-medium leading-none",
            disabled && "opacity-50",
            error && "text-destructive"
          )}>
            {label}
          </label>
        )}
        {content}
        {description && !error && (
          <p className={cn(
            "text-xs text-muted-foreground",
            disabled && "opacity-50"
          )}>
            {description}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
EnhancedSelect.displayName = "EnhancedSelect"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  EnhancedSelect,
  selectTriggerVariants,
  type SelectOption,
  type EnhancedSelectProps,
  type SelectTriggerProps
}