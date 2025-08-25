import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // REA INVEST 2025 Design System
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "var(--primary-blue)",
          50: "var(--primary-light)",
          500: "var(--primary-blue)", 
          600: "var(--primary-hover)",
          700: "var(--primary-dark)",
        },
        
        // Status colors
        success: {
          DEFAULT: "var(--success-green)",
          50: "var(--success-light)",
          500: "var(--success-green)",
          600: "var(--success-dark)",
        },
        
        warning: {
          DEFAULT: "var(--warning-amber)",
          50: "var(--warning-light)", 
          500: "var(--warning-amber)",
          600: "var(--warning-dark)",
        },
        
        danger: {
          DEFAULT: "var(--danger-red)",
          50: "var(--danger-light)",
          500: "var(--danger-red)",
          600: "var(--danger-dark)",
        },
        
        info: {
          DEFAULT: "var(--info-cyan)",
          50: "var(--info-light)",
          500: "var(--info-cyan)",
          600: "var(--info-dark)",
        },
        
        // Gray scale
        gray: {
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          400: "var(--gray-400)",
          500: "var(--gray-500)",
          600: "var(--gray-600)",
          700: "var(--gray-700)",
          800: "var(--gray-800)",
          900: "var(--gray-900)",
          950: "var(--gray-950)",
        },
        
        // Status workflow colors
        status: {
          pending: "var(--status-pending)",
          active: "var(--status-active)",
          sold: "var(--status-sold)",
          expired: "var(--status-expired)",
          converted: "var(--status-converted)",
          draft: "var(--status-draft)",
          approved: "var(--status-approved)",
          rejected: "var(--status-rejected)",
        },
        
        // shadcn/ui color system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      
      // Border radius system
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      
      // Font family
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      
      // Font sizes
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
      },
      
      // Font weights
      fontWeight: {
        light: "var(--font-light)",
        normal: "var(--font-normal)",
        medium: "var(--font-medium)",
        semibold: "var(--font-semibold)",
        bold: "var(--font-bold)",
        extrabold: "var(--font-extrabold)",
      },
      
      // Line heights
      lineHeight: {
        tight: "var(--line-height-tight)",
        snug: "var(--line-height-snug)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
        loose: "var(--line-height-loose)",
      },
      
      // Letter spacing
      letterSpacing: {
        tight: "var(--letter-spacing-tight)",
        normal: "var(--letter-spacing-normal)",
        wide: "var(--letter-spacing-wide)",
      },
      
      // Spacing system
      spacing: {
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        11: "var(--space-11)",
        12: "var(--space-12)",
        14: "var(--space-14)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
        28: "var(--space-28)",
        32: "var(--space-32)",
      },
      
      // Box shadow system
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)", 
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
      },
      
      // Transition system
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "350ms",
        slower: "500ms",
      },
      
      // Custom animations
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.6s ease-out", 
        "fade-in-scale": "fadeInScale 0.4s ease-out",
        "slide-in-right": "slideInRight 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.5s ease-out",
        "count-up": "countUp 0.8s ease-out",
        "pulse": "pulse 2s ease-in-out infinite",
        "spin": "spin 1s linear infinite",
        "bounce": "bounce 1s infinite",
        "scale-in": "scaleIn 0.3s ease-out",
        "shimmer": "shimmer 2s infinite",
        "skeleton-wave": "skeletonWave 1.6s ease-in-out infinite",
      },
      
      // Z-index scale
      zIndex: {
        dropdown: "var(--z-index-dropdown)",
        sticky: "var(--z-index-sticky)",
        fixed: "var(--z-index-fixed)",
        "modal-backdrop": "var(--z-index-modal-backdrop)",
        modal: "var(--z-index-modal)",
        popover: "var(--z-index-popover)",
        tooltip: "var(--z-index-tooltip)",
        toast: "var(--z-index-toast)",
      },
      
      // Responsive breakpoints
      screens: {
        xs: "var(--screen-xs)",
        sm: "var(--screen-sm)",
        md: "var(--screen-md)",
        lg: "var(--screen-lg)",
        xl: "var(--screen-xl)",
        "2xl": "var(--screen-2xl)",
      },
      
      // Gradient support
      backgroundImage: {
        "primary-gradient": "var(--primary-gradient)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;