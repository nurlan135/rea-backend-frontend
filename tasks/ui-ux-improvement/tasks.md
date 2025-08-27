# UI/UX Implementation Tasks for AI Agent

## CONTEXT
You are implementing a comprehensive UI/UX improvement for the REA INVEST real estate management system. The system is built with Next.js 15, TypeScript, React 19, and Tailwind CSS v4. You must follow the specifications in `requirements.md` and `design.md` files.

## CRITICAL CONSTRAINTS
1. **DO NOT** modify any backend API endpoints or database schemas
2. **DO NOT** break existing functionality while improving UI
3. **MUST** maintain Azerbaijani language for all UI text
4. **MUST** ensure all changes are mobile responsive
5. **MUST** follow the PRD document specifications exactly

## TASK EXECUTION ORDER

### Phase 1: Foundation Setup [PRIORITY: CRITICAL]

#### Task 1.1: Update Tailwind Configuration
**Location**: `frontend/tailwind.config.ts`
**Actions**:
1. Add custom color palette from design.md
2. Configure font families (Inter, JetBrains Mono)
3. Add spacing scale and breakpoints
4. Enable dark mode support (class-based)
5. Add animation utilities (fadeIn, countUp, pulse)

#### Task 1.2: Create Design Tokens
**Location**: `frontend/styles/design-tokens.css`
**Actions**:
1. Create CSS custom properties for colors
2. Define typography scale variables
3. Set up spacing system variables
4. Add shadow and border-radius tokens
5. Configure transition timing functions

#### Task 1.3: Install Required Dependencies
**Actions**:
```bash
cd frontend
npm install lucide-react framer-motion recharts @tanstack/react-table @tanstack/react-query react-hot-toast react-hook-form @hookform/resolvers zod
```

### Phase 2: Component Library Enhancement [PRIORITY: HIGH]

#### Task 2.1: Create Core UI Components
**Location**: `frontend/components/ui/`
**Create these files**:

1. **badge.tsx** - Status badges with color variants
   - Variants: default, success, warning, danger, info
   - Sizes: sm, md, lg
   - With optional icon support

2. **data-table.tsx** - Reusable data table
   - Server-side pagination
   - Sortable columns
   - Row selection
   - Mobile responsive (card view)

3. **kpi-card.tsx** - KPI display cards
   - Number animation
   - Trend indicator
   - Sparkline support
   - Loading skeleton

4. **timeline.tsx** - Vertical timeline component
   - For approval workflows
   - Status indicators
   - Timestamps

5. **empty-state.tsx** - Empty state displays
   - Custom illustrations
   - Action buttons
   - Helpful messages

6. **loading-skeleton.tsx** - Skeleton loaders
   - Card skeleton
   - Table skeleton
   - Form skeleton

#### Task 2.2: Enhance Existing Components
**Update these files**:
1. `button.tsx` - Add size variants and loading state
2. `card.tsx` - Add hover effects and shadow variants
3. `input.tsx` - Add error states and help text
4. `select.tsx` - Add search functionality
5. `dialog.tsx` - Add size variants and animations

### Phase 3: Layout Components [PRIORITY: HIGH]

#### Task 3.1: Create Dashboard Layout
**Location**: `frontend/components/layouts/dashboard-layout.tsx`
**Requirements**:
- Collapsible sidebar (240px width)
- Role-based navigation items
- User profile dropdown
- Notification bell icon
- Breadcrumb navigation
- Mobile hamburger menu

#### Task 3.2: Create Page Headers
**Location**: `frontend/components/layouts/page-header.tsx`
**Requirements**:
- Title and description
- Action buttons area
- Filter/search bar
- View toggle (grid/list)

### Phase 4: Dashboard Implementation [PRIORITY: CRITICAL]

#### Task 4.1: Role-Based Dashboards
**Location**: `frontend/app/dashboard/`

**Create role-specific components**:

1. **director-dashboard.tsx**
   - Net profit trend chart (Recharts line chart)
   - Pipeline conversion funnel
   - Branch comparison table
   - Top agents leaderboard

2. **manager-dashboard.tsx**
   - Team KPIs grid (4 cards)
   - Missed calls widget
   - Booking conversion by agent (bar chart)
   - Tasks/follow-ups list

3. **agent-dashboard.tsx**
   - My active listings (grid view)
   - My bookings (status cards)
   - Today's tasks timeline
   - Recent communications log

#### Task 4.2: KPI Widgets
**Location**: `frontend/components/dashboard/kpi-widgets/`
**Create these widgets**:
1. `conversion-rate.tsx` - Circular progress
2. `revenue-trend.tsx` - Line chart with area fill
3. `property-stats.tsx` - Stat cards grid
4. `booking-summary.tsx` - Donut chart
5. `expense-breakdown.tsx` - Horizontal bar chart

### Phase 5: Property Management UI [PRIORITY: CRITICAL]

#### Task 5.1: Property Listing Page
**Location**: `frontend/app/properties/page.tsx`
**Implement**:
1. Advanced filter sidebar (collapsible)
   - Price range slider
   - Room count selector
   - Area input fields
   - Location multiselect
   - Property type checkboxes
2. Grid/List view toggle
3. Sort dropdown (price, date, area)
4. Lazy loading with intersection observer
5. Quick action buttons on cards

#### Task 5.2: Property Card Component
**Location**: `frontend/components/properties/property-card.tsx`
**Features**:
1. Image carousel (max 5 images)
2. Price and key metrics display
3. Status badge (colored)
4. Quick actions (view, edit, book)
5. Hover effects with shadow
6. Mobile swipe gestures

#### Task 5.3: Property Detail Page
**Location**: `frontend/app/properties/[id]/page.tsx`
**Implement**:
1. Hero image gallery with lightbox
2. Sticky action bar
3. Tabbed interface:
   - Details tab (property info grid)
   - Expenses tab (expense table)
   - Bookings tab (booking timeline)
   - Communications tab (call/message log)
4. Approval workflow timeline
5. Share and print buttons

### Phase 6: Booking System UI [PRIORITY: HIGH]

#### Task 6.1: Booking Creation Wizard
**Location**: `frontend/components/bookings/booking-wizard.tsx`
**Steps**:
1. Customer selection (with search)
2. Property confirmation
3. Booking details (dates, deposit)
4. Review and submit
**Features**:
- Progress indicator
- Form validation with Zod
- Back/Next navigation
- Auto-save draft

#### Task 6.2: Booking Management
**Location**: `frontend/app/bookings/page.tsx`
**Implement**:
1. Kanban board view by status
2. Calendar view for end dates
3. Expiring bookings alert banner
4. Convert to sale modal with confirmation
5. Bulk actions toolbar

### Phase 7: Communication Center [PRIORITY: MEDIUM]

#### Task 7.1: Call Log Interface
**Location**: `frontend/components/communications/call-log.tsx`
**Features**:
1. Quick add floating action button
2. Duration input with timer
3. Entity selector (customer/property)
4. Notes textarea with character count
5. Recent calls sidebar

#### Task 7.2: Communication Journal
**Location**: `frontend/components/communications/journal.tsx`
**Display**:
1. Timeline view of all communications
2. Filter by type (call/sms/whatsapp)
3. Search by content
4. Entity relationship links

### Phase 8: Reports & Export UI [PRIORITY: MEDIUM]

#### Task 8.1: Report Dashboard
**Location**: `frontend/app/reports/page.tsx`
**Implement**:
1. Widget grid with drag-and-drop
2. Date range picker with presets
3. Refresh button with loading state
4. Export queue status

#### Task 8.2: Export Modal
**Location**: `frontend/components/reports/export-modal.tsx`
**Features**:
1. Format selection (XLSX/CSV)
2. Column checkbox list
3. Date range inputs
4. Preview button
5. Progress indicator

### Phase 9: Mobile Optimizations [PRIORITY: LOW]

#### Task 9.1: Responsive Components
**Update all components for mobile**:
1. Bottom sheet modals for mobile
2. Swipeable property cards
3. Collapsible table to cards
4. Touch-friendly inputs (min 44px)
5. Pull-to-refresh on lists

#### Task 9.2: Mobile Navigation
**Location**: `frontend/components/mobile/`
**Create**:
1. `bottom-tabs.tsx` - Main navigation
2. `mobile-menu.tsx` - Hamburger menu
3. `action-sheet.tsx` - Context menus

### Phase 10: Polish & Animation [PRIORITY: LOW]

#### Task 10.1: Add Micro-interactions
**Using Framer Motion**:
1. Page transitions (fade + slide)
2. Card hover effects
3. Number count animations
4. Success confirmations (checkmark)
5. Loading states (skeleton shimmer)

#### Task 10.2: Implement Notifications
**Using React Hot Toast**:
1. Success messages (green)
2. Error alerts (red)
3. Info notifications (blue)
4. Warning messages (amber)
5. Custom notification with actions

## VALIDATION CHECKLIST

After completing each phase, verify:

### Functionality
- [ ] All existing features still work
- [ ] Forms validate correctly
- [ ] API calls handle errors gracefully
- [ ] Navigation works on all devices

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images lazy load properly

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible

### Responsiveness
- [ ] Desktop (1440px) layout correct
- [ ] Tablet (768px) layout adapts
- [ ] Mobile (375px) fully functional
- [ ] Touch targets minimum 44px

### Localization
- [ ] All text in Azerbaijani
- [ ] Currency displays as ₼ (AZN)
- [ ] Date format: DD.MM.YYYY
- [ ] Phone format: +994 XX XXX XX XX

## ERROR HANDLING

If you encounter issues:

1. **Build errors**: Check TypeScript types and imports
2. **Style conflicts**: Use Tailwind's `!` important modifier sparingly
3. **API errors**: Don't modify backend, adapt frontend instead
4. **Performance issues**: Implement virtual scrolling for long lists
5. **State management**: Use React Query for server state

## TESTING APPROACH

Test each component with:
1. Different screen sizes
2. Various data states (empty, loading, error, success)
3. User interactions (click, hover, keyboard)
4. Edge cases (long text, many items)

## COMPLETION CRITERIA

The UI/UX improvement is complete when:
1. All 10 phases are implemented
2. Validation checklist passes
3. No console errors or warnings
4. Performance metrics met
5. Mobile experience smooth
6. Accessibility standards met

## IMPORTANT NOTES FOR AI AGENT

1. **Read PRD first**: Always refer to `/docs/prd.md` for business logic
2. **Check existing code**: Understand current implementation before changing
3. **Incremental changes**: Make small, testable changes
4. **Preserve functionality**: Never break working features
5. **Ask if uncertain**: Query user for clarification on ambiguous requirements
6. **Document changes**: Add comments for complex logic
7. **Use TypeScript**: Ensure all components are properly typed
8. **Follow conventions**: Match existing code style and patterns
9. **Test thoroughly**: Verify each component works before moving on
10. **Optimize images**: Use Next.js Image component with proper sizing

Start with Phase 1 and proceed sequentially. Good luck!