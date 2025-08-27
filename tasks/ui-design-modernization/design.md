# REA INVEST UI/UX Design Modernization Guide

## Design Philosophy
REA INVEST-in müasir və peşəkar əmlak idarəetmə platforması olaraq, 2025-ci ilin ən qabaqcıl dizayn trendlərini tətbiq edir.

## Color System

### Primary Colors
```css
--primary-blue: #0066CC;      /* Main brand color */
--primary-hover: #0052A3;      /* Hover state */
--primary-light: #E6F0FF;      /* Light background */
--primary-gradient: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
```

### Status Colors
```css
--status-pending: #FFB800;     /* Gözləmədə */
--status-active: #00A651;      /* Aktiv */
--status-sold: #6C757D;        /* Satılıb */
--status-expired: #DC3545;     /* Müddəti bitib */
--status-converted: #0066CC;   /* Çevrildi */
```

### Neutral Colors
```css
--gray-950: #0A0A0A;           /* Darkest */
--gray-900: #1A1A1A;
--gray-800: #2D2D2D;
--gray-700: #4A4A4A;
--gray-600: #5E5E5E;
--gray-500: #7A7A7A;
--gray-400: #9E9E9E;
--gray-300: #D1D1D1;
--gray-200: #E8E8E8;
--gray-100: #F5F5F5;
--gray-50: #FAFAFA;
--white: #FFFFFF;
```

## Typography Scale

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 2rem;       /* 32px */
--text-4xl: 2.5rem;     /* 40px */
--text-5xl: 3rem;       /* 48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System
```css
--space-0: 0;
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
```

## Border Radius
```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Pill shape */
```

## Shadows
```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
```

## Component Design Patterns

### 1. Dashboard Cards
- Tile-based layout with hover effects
- Real-time data updates with smooth transitions
- Interactive charts and graphs
- Quick action buttons

### 2. Data Tables
- Clean header with search and filters
- Row hover states
- Inline actions
- Pagination controls
- Responsive mobile view

### 3. Forms
- Floating labels or top labels
- Clear validation messages
- Progressive disclosure
- Auto-save indicators
- Smart defaults

### 4. Navigation
- Collapsible sidebar with icons
- Breadcrumb navigation
- Tab navigation for sections
- Mobile hamburger menu

### 5. Modals & Overlays
- Smooth fade-in animations
- Backdrop blur effect
- Focus trap
- Close on escape/outside click

## Animation & Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
--transition-slower: 500ms ease-in-out;

/* Easing functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## Responsive Breakpoints
```css
--screen-xs: 475px;     /* Extra small devices */
--screen-sm: 640px;     /* Small devices */
--screen-md: 768px;     /* Medium devices */
--screen-lg: 1024px;    /* Large devices */
--screen-xl: 1280px;    /* Extra large devices */
--screen-2xl: 1536px;   /* 2X large devices */
```

## Dark Mode Support
```css
/* Light mode (default) */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #1A1A1A;
  --text-secondary: #4A4A4A;
}

/* Dark mode */
:root.dark {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2D2D2D;
  --text-primary: #FFFFFF;
  --text-secondary: #D1D1D1;
}
```

## Accessibility Guidelines
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader friendly markup
- ARIA labels and roles

## Performance Targets
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.8s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## Icon System
- Primary: Lucide React icons
- Secondary: Custom SVG icons
- Size variants: 16px, 20px, 24px, 32px
- Consistent stroke width: 2px

## Grid System
- 12-column grid
- Container max-width: 1536px
- Gutter: 24px (desktop), 16px (mobile)
- Responsive columns