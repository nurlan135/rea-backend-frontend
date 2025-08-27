# UI/UX Design Specifications for REA INVEST

## Design System Foundation

### 1. Color Palette

#### Primary Colors
```css
--primary-blue: #0066CC;      /* Main brand color */
--primary-hover: #0052A3;     /* Hover state */
--primary-light: #E6F0FF;     /* Background tints */

--success-green: #00A651;     /* Approved, Active */
--warning-amber: #FFB800;     /* Pending, Warning */
--danger-red: #DC3545;        /* Rejected, Expired */
--info-cyan: #17A2B8;         /* Information */
```

#### Neutral Colors
```css
--gray-900: #1A1A1A;          /* Primary text */
--gray-700: #4A4A4A;          /* Secondary text */
--gray-500: #7A7A7A;          /* Muted text */
--gray-300: #D1D1D1;          /* Borders */
--gray-100: #F5F5F5;          /* Backgrounds */
--white: #FFFFFF;             /* Cards, modals */
```

#### Status Colors (for badges/indicators)
```css
--status-pending: #FFB800;    /* Gözləmədə */
--status-active: #00A651;     /* Aktiv */
--status-sold: #6C757D;       /* Satılıb */
--status-expired: #DC3545;    /* Müddəti bitib */
--status-converted: #0066CC;  /* Çevrildi */
```

### 2. Typography

#### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

#### Type Scale
```css
--text-xs: 0.75rem;     /* 12px - badges, labels */
--text-sm: 0.875rem;    /* 14px - secondary text */
--text-base: 1rem;      /* 16px - body text */
--text-lg: 1.125rem;    /* 18px - subtitles */
--text-xl: 1.25rem;     /* 20px - section headers */
--text-2xl: 1.5rem;     /* 24px - page titles */
--text-3xl: 2rem;       /* 32px - dashboard numbers */
--text-4xl: 2.5rem;     /* 40px - hero metrics */
```

#### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 3. Spacing System

```css
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

### 4. Layout Grid

#### Desktop (1440px)
- Container: 1280px max-width
- Columns: 12
- Gutter: 24px
- Margin: 80px

#### Tablet (768px - 1439px)
- Container: 100% - 48px
- Columns: 8
- Gutter: 20px
- Margin: 24px

#### Mobile (320px - 767px)
- Container: 100% - 32px
- Columns: 4
- Gutter: 16px
- Margin: 16px

### 5. Component Specifications

#### 5.1 Cards
```css
.property-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  background: white;
  padding: 20px;
  transition: all 0.2s ease;
}

.property-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}
```

#### 5.2 Buttons
```css
/* Primary Button */
.btn-primary {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### 5.3 Form Elements
```css
.input-field {
  height: 40px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
}
```

#### 5.4 Status Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-active {
  background: var(--status-active);
  color: white;
}
```

### 6. Page Layouts

#### 6.1 Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │    Main Content Area    │
│                   │                         │
│  - Logo           │  ┌───────────────────┐ │
│  - Navigation     │  │   KPI Cards Row   │ │
│  - User Menu      │  └───────────────────┘ │
│                   │                         │
│                   │  ┌───────────────────┐ │
│                   │  │   Charts Grid     │ │
│                   │  └───────────────────┘ │
│                   │                         │
│                   │  ┌───────────────────┐ │
│                   │  │   Data Table      │ │
│                   │  └───────────────────┘ │
└─────────────────────────────────────────────┘
```

#### 6.2 Property Listing Layout
```
┌─────────────────────────────────────────────┐
│           Search Bar & Filters              │
├─────────────────────────────────────────────┤
│  Sidebar Filters │   Property Grid/List     │
│  (Collapsible)   │                         │
│                  │  ┌──────┐ ┌──────┐     │
│  □ Satılıq       │  │Card 1│ │Card 2│     │
│  □ Kirayə        │  └──────┘ └──────┘     │
│                  │                         │
│  Qiymət:         │  ┌──────┐ ┌──────┐     │
│  [Min] - [Max]   │  │Card 3│ │Card 4│     │
│                  │  └──────┘ └──────┘     │
│                  │                         │
│                  │     [Pagination]        │
└─────────────────────────────────────────────┘
```

#### 6.3 Property Detail Layout
```
┌─────────────────────────────────────────────┐
│        Image Gallery (60%)  │  Info (40%)  │
│                             │              │
│  [Main Image]               │  ₼ 250,000   │
│                             │  3 otaq      │
│  [Thumb][Thumb][Thumb]      │  85 m²       │
│                             │              │
├─────────────────────────────────────────────┤
│  [Details] [Expenses] [Bookings] [Calls]   │
│                                             │
│  Tab Content Area                           │
│                                             │
└─────────────────────────────────────────────┘
```

### 7. Interaction Patterns

#### 7.1 Loading States
- Skeleton screens for cards
- Shimmer effect for text
- Spinner for actions
- Progress bar for exports

#### 7.2 Empty States
- Illustration + message
- Clear call-to-action
- Helpful suggestions

#### 7.3 Error States
- Red border on invalid fields
- Inline error messages
- Toast notifications for system errors
- Retry actions where applicable

#### 7.4 Success Feedback
- Green checkmark animations
- Success toasts (auto-dismiss 3s)
- Confetti for major achievements

### 8. Animations

#### Micro-interactions
```css
/* Page transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Number counters */
@keyframes countUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Loading pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 9. Mobile Adaptations

#### Touch Targets
- Minimum 44x44px touch areas
- 8px spacing between tappable elements

#### Mobile Navigation
- Bottom tab bar for main sections
- Hamburger menu for secondary items
- Swipe gestures for navigation

#### Responsive Tables
- Horizontal scroll for wide tables
- Card view for mobile devices
- Collapsible rows for details

### 10. Accessibility Guidelines

#### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: clear focus states

#### Keyboard Navigation
- Tab order follows visual flow
- Skip links for main content
- Escape key closes modals

#### Screen Readers
- Semantic HTML elements
- ARIA labels for icons
- Live regions for dynamic content

### 11. Dark Mode (Future)

#### Color Adjustments
```css
[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2A2A2A;
  --text-primary: #E4E4E4;
  --text-secondary: #A0A0A0;
  --border-color: #3A3A3A;
}
```

### 12. Icon System

Using Lucide React icons:
- Size variants: 16px, 20px, 24px
- Stroke width: 1.5px
- Consistent metaphors across app

Common icons:
- 🏠 Properties: Home
- 📅 Bookings: Calendar
- 💰 Expenses: DollarSign
- 📞 Calls: Phone
- 📊 Reports: BarChart
- 👤 Users: User
- ⚙️ Settings: Settings