# Instagram Analytics Dashboard - Design Guidelines

## Design Approach

**Selected Approach**: Design System (Utility-Focused Dashboard)

This is a data-heavy analytics dashboard requiring clarity, consistency, and efficient information display. The design prioritizes usability and data comprehension over decorative elements, following established dashboard design patterns from systems like Linear, Notion, and modern SaaS platforms.

**Key Principles**:
- Data-first hierarchy with clear visual relationships
- Consistent component patterns for cognitive efficiency
- Minimal cognitive load through familiar interactions
- Professional, focused aesthetic without distraction

---

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (Base Theme):
- Background: 222 47% 11% (deep slate base)
- Card/Surface: 224 71% 4% (slightly elevated dark)
- Border: 216 34% 17% (subtle separation)
- Foreground: 213 31% 91% (high contrast text)
- Muted: 223 47% 11% (secondary surfaces)
- Muted Foreground: 215 16% 47% (secondary text)

**Accent Colors**:
- Primary: 213 94% 68% (bright blue for actions/CTAs)
- Chart 1: 173 58% 39% (teal for follower data)
- Chart 2: 197 37% 24% (deep blue for engagement)
- Chart 3: 142 69% 58% (green for positive metrics)
- Chart 4: 280 65% 60% (purple for performance)
- Chart 5: 47 96% 53% (amber for alerts/warnings)

**Semantic Colors**:
- Success/Positive: 142 69% 58% (green)
- Destructive/Negative: 0 73% 62% (red)
- Warning: 47 96% 53% (amber)

### B. Typography

**Font Family**: System font stack for optimal performance
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

**Type Scale**:
- Page Titles: text-2xl (24px) font-bold
- Section Headers: text-lg (18px) font-semibold
- Card Titles: text-lg (18px) font-semibold
- Body Text: text-sm (14px) font-normal
- Secondary/Meta: text-xs (12px) text-muted-foreground
- Stat Values: text-2xl (24px) font-bold
- Small Stats: text-lg (18px) font-semibold

**Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### C. Layout System

**Spacing Primitives** (Tailwind units):
- Primary spacing: 4, 6 (for tight groupings)
- Section spacing: 6, 8 (for component separation)
- Page padding: 6 (24px consistent page margins)
- Card padding: 6 (internal card spacing)
- Gap between elements: 4, 6

**Container Structure**:
- Fixed sidebar: w-64 (256px)
- Main content: flex-1 with p-6
- Max-width for forms: max-w-2xl
- Dashboard grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

**Responsive Breakpoints**:
- Mobile: Base (< 768px) - single column stacks
- Tablet: md: (768px+) - 2 columns where appropriate
- Desktop: lg: (1024px+) - full multi-column layouts

### D. Component Library

**Navigation**:
- Fixed sidebar with 64px logo area, nav items with icons
- Active state: bg-primary/10 text-primary
- Hover state: hover:bg-muted text-foreground transition
- Bottom user profile with avatar and connection status

**Cards & Surfaces**:
- Base card: bg-card border border-border rounded-lg
- Hover cards: hover:shadow-lg transition-shadow
- Stat cards: p-6 with icon, value, and change indicator
- Chart cards: with CardHeader/CardTitle and CardContent

**Data Visualization**:
- Simple bar charts with color-coded bars and labels
- Horizontal progress bars for comparisons (demographics, video types)
- Line indicators for current status/progress
- Table layouts with striped hover states

**Tables**:
- Header: bg-muted/50 with text-sm font-medium text-muted-foreground
- Rows: border-b border-border with hover:bg-muted/30
- Cell padding: p-4
- Action icons: text-muted-foreground hover:text-foreground

**Forms & Inputs**:
- Input fields: bg-input border border-border rounded px-3 py-2
- Select dropdowns: with SelectTrigger/SelectContent pattern
- Switches: for boolean toggles (auto-tag, notifications)
- Labels: text-sm font-medium mb-2

**Buttons**:
- Primary: bg-primary text-primary-foreground hover:bg-primary/90
- Outline: border border-border hover:bg-muted
- Destructive: variant="destructive" for stop/cancel actions
- Icon buttons: with Font Awesome icons, mr-2 spacing
- Disabled state: disabled:opacity-50

**Status Indicators**:
- Badges: rounded-full with appropriate color (success/warning/info)
- Pulsing dots: w-2 h-2 rounded-full animate-pulse for "active" states
- Progress bars: bg-muted with colored fill and transition-all

**Modals/Dialogs**:
- Centered overlay with max-w-sm or max-w-md
- Close button: top-right text-muted-foreground
- Actions: flex gap-3 with primary and cancel buttons
- Content padding and spacing for readability

**Time Filter Controls**:
- Horizontal button group in bg-muted rounded-lg p-1
- Active filter: bg-primary text-primary-foreground
- Inactive: text-muted-foreground hover:text-foreground
- Options: 7d, 14d, 30d, 90d, 180d, YTD, All

### E. Data Display Patterns

**Statistics Cards Layout**:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Icon container: w-8 h-8 or w-12 h-12 rounded-lg with bg-{color}/10
- Change indicator: Small arrow icon + text with appropriate color
- Clear hierarchy: label → value → change

**Chart Sections**:
- Full-width or 2-column grid for chart comparisons
- Chart titles with optional metric selectors
- Legend with colored dots matching chart colors
- Consistent height (h-64 or similar)

**Table Design**:
- Thumbnail/icon in first column with caption
- Data columns: views, likes, comments, engagement
- Action column: icon buttons for view/tag/edit
- Pagination: centered with Previous/Page numbers/Next

**Empty States**:
- Centered icon (w-16 h-16 bg-muted rounded-full)
- Heading and descriptive text
- Optional CTA button

---

## Specific Page Patterns

**Dashboard Overview**:
- Header with page title, description, and time filters + Run Scraper button
- 4-column stats grid (followers, total reels, avg engagement, last run)
- 2-column chart grid (followers growth, video type performance)
- Full-width reels table
- Scraper status panel (2-column grid)

**Configuration Page**:
- Max-width form container (max-w-2xl)
- Card sections for grouping: Scraper Settings, Instagram Account
- Form fields with labels, inputs, selects, and switches
- Info callout with icon and muted background
- Save buttons with loading states

**Reel Analytics**:
- 5-column stats grid
- Performance chart
- 2/3 + 1/3 layout: Top Reels table + Video Type breakdown
- Full-width All Reels table with filters

**Followers Page**:
- 6-column stats grid (total, new, growth rate, unfollows, net, avg daily)
- Full-width growth chart
- 2/3 + 1/3 layout: Demographics + Recent Followers sidebar

**Video Tagging**:
- Grid of reel cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card structure: thumbnail, caption, stats grid, tag button
- Modal for tagging with video preview and type selector

**Run History**:
- 5-column summary stats
- Expandable run entries with status badges
- Detailed metrics grid within each entry
- Error messages with red background highlight

---

## Interaction Guidelines

**Loading States**: 
- Skeleton loaders with animate-pulse
- Maintain layout structure during loading
- Use bg-muted for placeholder elements

**Hover Effects**:
- Subtle transitions (transition-colors, transition-shadow)
- Cards lift on hover (hover:shadow-lg)
- Buttons brighten/darken slightly
- Table rows highlight (hover:bg-muted/30)

**Status Feedback**:
- Toast notifications for success/error
- Inline validation for forms
- Disabled states for pending actions
- Progress indicators for long-running operations

**Icons**:
- Font Awesome throughout for consistency
- Use semantic icons (fa-video, fa-users, fa-chart-line, fa-cog)
- Icon + text pattern for buttons: icon mr-2, then text
- Icon-only buttons in action columns

---

## Images

**No large hero images** - This is a utility dashboard focused on data display. All visual elements are functional (charts, tables, stat cards) rather than decorative imagery.