"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const selectVariants = cva(
  "flex w-full items-center justify-between rounded-md border bg-background px-3 text-sm transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-0",
        filled: "bg-muted border-transparent focus-visible:bg-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
        ghost: "border-transparent bg-transparent hover:bg-accent focus-visible:bg-accent focus-visible:border-border",
      },
      size: {
        sm: "h-8 px-2.5 text-sm",
        default: "h-9 px-3",
        lg: "h-10 px-4",
        xl: "h-12 px-4 text-base"
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        success: "border-success focus-visible:border-success focus-visible:ring-success/20",
        warning: "border-warning focus-visible:border-warning focus-visible:ring-warning/20"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default"
    }
  }
)

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends VariantProps<typeof selectVariants> {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  searchable?: boolean
  clearable?: boolean
  className?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
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

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          ref={ref}
          type="button"
          className={cn(selectVariants({ variant, size, state }), className)}
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
                    <span>{option.label}</span>
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
  }
)
Select.displayName = "Select"

export { Select, selectVariants, type SelectProps, type SelectOption }