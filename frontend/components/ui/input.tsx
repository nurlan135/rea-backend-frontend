import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex w-full min-w-0 rounded-md border bg-background px-3 text-base shadow-xs transition-all duration-200 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-0",
        filled: "bg-muted border-transparent focus-visible:bg-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
        underlined: "border-0 border-b-2 border-b-border rounded-none bg-transparent focus-visible:border-b-primary shadow-none px-1",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-accent focus-visible:bg-accent focus-visible:border-border",
      },
      size: {
        sm: "h-8 px-2.5 text-sm",
        default: "h-9 px-3 py-1",
        lg: "h-10 px-4 text-base",
        xl: "h-12 px-4 text-lg"
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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

interface InputProps 
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  loading?: boolean
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, state, type, startIcon, endIcon, loading, ...props }, ref) => {
    return (
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          data-slot="input"
          className={cn(
            inputVariants({ variant, size, state }),
            startIcon && "pl-10",
            endIcon && "pr-10",
            loading && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {(endIcon || loading) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
            ) : (
              endIcon
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Password Input Component
interface PasswordInputProps extends Omit<InputProps, "type" | "endIcon"> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? "text" : "password"}
        endIcon={
          <button
            type="button"
            className="hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    )
  }
)
PasswordInput.displayName = "PasswordInput"

// Textarea Component
interface TextareaProps
  extends Omit<React.ComponentProps<"textarea">, "size">,
    Pick<VariantProps<typeof inputVariants>, "variant" | "size" | "state"> {
  resize?: "none" | "vertical" | "horizontal" | "both"
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", size = "default", state = "default", resize = "vertical", autoResize, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = React.useCallback((node: HTMLTextAreaElement) => {
      textareaRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }, [ref])

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea && autoResize) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [autoResize])

    React.useEffect(() => {
      adjustHeight()
    }, [adjustHeight, props.value])

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y", 
      horizontal: "resize-x",
      both: "resize"
    }

    return (
      <textarea
        data-slot="textarea"
        className={cn(
          inputVariants({ variant, size, state }),
          "min-h-[80px] py-2",
          resizeClasses[resize],
          className
        )}
        ref={combinedRef}
        onInput={autoResize ? adjustHeight : undefined}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

// Search Input Component  
interface SearchInputProps extends Omit<InputProps, "type" | "startIcon"> {
  onSearch?: (query: string) => void
  clearable?: boolean
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, clearable = true, value, onChange, ...props }, ref) => {
    const [searchValue, setSearchValue] = React.useState(value || "")
    
    React.useEffect(() => {
      setSearchValue(value || "")
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchValue(newValue)
      onChange?.(e)
      onSearch?.(newValue)
    }

    const handleClear = () => {
      setSearchValue("")
      onSearch?.("")
      if (onChange) {
        const event = { target: { value: "" } } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="search"
        value={searchValue}
        onChange={handleChange}
        startIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        endIcon={
          clearable && searchValue ? (
            <button
              type="button"
              className="hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
              onClick={handleClear}
              tabIndex={-1}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

export { 
  Input, 
  PasswordInput, 
  Textarea, 
  SearchInput, 
  inputVariants,
  type InputProps, 
  type PasswordInputProps, 
  type TextareaProps, 
  type SearchInputProps 
}
