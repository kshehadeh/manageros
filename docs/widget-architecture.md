# Widget Architecture Documentation

## Overview

The ManagerOS dashboard uses a self-contained, module-based widget architecture. Each widget is a self-contained module that exports information about how to present itself, how to fetch related data, and how to render. Widgets are React Server Components that handle their own data fetching and rendering logic, following Next.js 13+ App Router patterns.

## Table of Contents

- [Core Components](#core-components)
- [Widget Types](#widget-types)
- [Dashboard Integration](#dashboard-integration)
- [Design Patterns](#design-patterns)
- [Current Limitations](#current-limitations)
- [Future Considerations](#future-considerations)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Core Components

### WidgetCard Component

The `WidgetCard` component is the foundational building block for all dashboard widgets. It's a client component that provides consistent styling and layout.

**Location**: `src/components/widgets/widget-card.tsx`

**Props**:

```typescript
interface WidgetCardProps {
  title: string // Widget title displayed in header
  titleIcon?: ReactNode // Optional icon (must be JSX, not component reference)
  children: ReactNode // Widget content
  minWidth?: string // Minimum width for responsive layout
  className?: string // Additional CSS classes
  // Note: No onClick prop - interactivity handled by wrapper component
}
```

**Important Notes**:

- `WidgetCard` is a **client component** (`'use client'`)
- `titleIcon` accepts `ReactNode` (JSX), not component references
- No `onClick` prop - interactivity is handled by `PeopleDashboardWidgetsClient` wrapper
- Icons must be rendered as JSX elements in server components before passing

**Features**:

- Consistent card styling with dotted border separator
- Centered header with optional icon
- Flexible content area
- Responsive sizing support

**Example Usage (from Server Component)**:

```typescript
const IconComponent = metadata.icon

return (
  <WidgetCard
    title={metadata.title}
    titleIcon={IconComponent ? <IconComponent className='w-3 h-3 text-muted-foreground' /> : undefined}
    minWidth={metadata.minWidth}
  >
    <div className="flex items-center justify-center">
      <span className="text-4xl font-bold font-mono">42</span>
    </div>
  </WidgetCard>
)
```

## Widget Types

### Stats Card Widgets

**Location**: `src/components/widgets/*-widget.tsx`

**Available Widgets**:

- **Total People** (`total-people`) - Total number of people in organization
- **Direct Reports** (`direct-reports`) - Number of direct reports (requires linked person)
- **1:1s Needed** (`reports-without-recent-one-on-one`) - Reports needing 1:1 meetings
- **360s Needed** (`reports-without-recent-feedback-360`) - Reports needing 360 feedback
- **Max Reports Exceeded** (`managers-exceeding-max-reports`) - Managers exceeding max reports rule

**Visibility Logic**:

- `total-people`: Always visible
- `direct-reports`: Visible if user has linked person
- `1:1s-needed`: Visible if user has linked person AND has direct reports
- `360s-needed`: Visible if user has linked person AND has direct reports
- `max-reports-exceeded`: Visible if organization has max reports rule configured

### Chart Widgets

**Location**: `src/components/widgets/*-widget.tsx`

**Available Widgets**:

- **Team Breakdown** (`team-chart`) - Team distribution bar chart
- **Job Role Breakdown** (`job-role-chart`) - Job role distribution pie chart

**Pattern**: Chart widgets use separate client components for Recharts:

```typescript
// Widget file (server component)
import { TeamBreakdownChart } from './team-breakdown-chart'  // Client component

export const teamBreakdownWidget: Widget = {
  // ... metadata, checkVisibility, fetchData ...

  render(data, metadata, _context) {
    const { data: chartData } = data as TeamBreakdownData

    return (
      <WidgetCard title={metadata.title} minWidth={metadata.minWidth}>
        <TeamBreakdownChart data={chartData} />  {/* Client component */}
      </WidgetCard>
    )
  },
}
```

**Client Chart Components**:

- `team-breakdown-chart.tsx` - Client component for bar chart (uses Recharts)
- `job-role-breakdown-chart.tsx` - Client component for pie chart (uses Recharts)

These are separate `'use client'` components because Recharts requires browser APIs and cannot run in server components.

**Chart Features**:

- **Pie Charts**: Show percentage labels, custom tooltips, color-coded legend
- **Bar Charts**: Vertical layout, custom tooltips, responsive sizing
- **Legend**: Truncated text for long names, vertically centered when positioned right

**Color Palette**:

- Uses theme-aware colors that work in both light and dark modes
- Status-specific colors for status-related charts (currently unused)
- Consistent color assignment across chart types

## Dashboard Integration

### People Dashboard Server

**Component**: `PeopleDashboardServer`  
**Location**: `src/components/people/people-dashboard-server.tsx`

The dashboard server component orchestrates widget rendering. It:

- Creates widget context from user data
- Queries widget registry for all widgets
- Checks visibility for each widget
- Fetches data for visible widgets in parallel
- Renders widgets grouped by category
- Passes rendered widgets to client component for interactivity

**Structure**:

```typescript
export async function PeopleDashboardServer() {
  const context: WidgetContext = { /* user data */ }
  const allWidgets = widgetRegistry.getAll()

  // Check visibility and fetch data
  const visibleWidgets = await Promise.all(
    allWidgets.map(async widget => {
      const visibility = await widget.checkVisibility(context)
      if (!visibility.visible) return null

      const data = await widget.fetchData(context)
      return {
        widgetId: widget.metadata.id,
        widgetElement: widget.render(data, widget.metadata, context),
        minWidth: widget.metadata.minWidth,
      }
    })
  )

  // Group by category and render
  return (
    <div className="space-y-4">
      <PageSection>
        <PeopleDashboardWidgetsClient widgets={statsWidgets} />
      </PageSection>
      <PageSection>
        <PeopleDashboardWidgetsClient widgets={chartWidgets} />
      </PageSection>
    </div>
  )
}
```

**Future Enhancement**:
The component can be extended to accept a `dashboardConfig` prop for widget customization:

```typescript
interface DashboardConfig {
  visibleWidgets?: string[]
  widgetOrder?: string[]
  widgetSizes?: Record<string, { width?: string; height?: string }>
}
```

## Design Patterns

### Self-Contained Modules

Each widget is a complete, self-contained module that:

- Defines its own metadata
- Implements visibility logic
- Handles its own data fetching
- Renders its own UI

**Benefits**:

- Easy to add new widgets (just create a new file)
- Widgets are independent and testable
- Clear separation of concerns
- Type-safe with TypeScript interfaces

### Widget Registry Pattern

Widgets register themselves in a central registry:

```typescript
// src/components/widgets/index.ts
import { widgetRegistry } from './registry'
import { totalPeopleWidget } from './total-people-widget'
// ... other widgets

widgetRegistry.registerAll([
  totalPeopleWidget,
  directReportsWidget,
  // ... more widgets
])
```

**Benefits**:

- Centralized widget discovery
- Easy to filter by category
- Supports future customization features

### Server/Client Component Separation

**Server Components** (widgets):

- Handle data fetching
- Render static UI
- Pass data to client components
- Cannot use browser APIs or event handlers

**Client Components** (wrappers, charts):

- Handle interactivity (clicks, modals)
- Use browser APIs (Recharts, etc.)
- Receive data from server components
- Cannot directly access database

**Boundary Rules**:

- ✅ Server components can render client components
- ✅ Server components can pass serializable data to client components
- ❌ Server components cannot pass functions/classes to client components
- ❌ Server components cannot pass component references (must render as JSX)

### Icon Handling Pattern

Icons must be rendered as JSX in server components:

```typescript
// ✅ CORRECT
const IconComponent = metadata.icon
return (
  <WidgetCard
    titleIcon={IconComponent ? <IconComponent className='...' /> : undefined}
  />
)

// ❌ WRONG - Cannot pass component reference
return (
  <WidgetCard titleIcon={metadata.icon} />  // Error!
)
```

### Interactivity Pattern

Interactivity is handled by client wrapper, not widget props:

```typescript
// ✅ CORRECT - Client wrapper handles clicks
<div onClick={() => handleClick(widgetId)}>
  {widgetElement}  {/* Server-rendered widget */}
</div>

// ❌ WRONG - Cannot pass onClick from server component
<WidgetCard onClick={handleClick} />  // Error!
```

## Current Limitations

1. **No User Customization**: Widget visibility and order are hardcoded (widget registry exists but user preferences not yet implemented)
2. **No Widget Reordering**: Layout is fixed and cannot be changed by users
3. **Limited Widget Sizing**: Only `minWidth` is configurable, no height control
4. **Limited Widget Types**: Only stats cards and charts currently exist
5. **No Widget Settings**: Individual widget configuration not exposed to users
6. **Widget Registry Exists**: Centralized registry is implemented and ready for user preferences

## Future Considerations

### Planned Enhancements

#### 1. User Preferences Integration

Store widget preferences in `UserSettings`:

```typescript
interface UserSettings {
  // ... existing settings
  dashboardWidgets: {
    visible: string[]
    order: string[]
    sizes: Record<string, { width?: string; height?: string }>
  }
}
```

#### 2. Dashboard Configuration API

Accept configuration prop for customization:

```typescript
interface DashboardConfig {
  visibleWidgets?: string[]
  widgetOrder?: string[]
  widgetSizes?: Record<string, WidgetSize>
}

<PeopleDashboardServer
  dashboardConfig={userDashboardConfig}
/>
```

Note: The widget system is self-contained - widgets fetch their own data, so no `stats` prop is needed.

#### 3. Widget Reordering

- Drag-and-drop interface for reordering widgets
- Settings-based reordering with up/down buttons
- Save order to user preferences

#### 4. Widget Sizing

- Allow users to control widget sizes
- Support for different size presets (small, medium, large)
- Responsive breakpoints for different screen sizes

#### 5. More Widget Types

- Time-series charts
- Table widgets
- List widgets
- Custom content widgets

#### 6. Widget Settings

- Per-widget configuration options
- Settings panel for each widget type
- Save settings to user preferences

### Implementation Notes

- Widget IDs are already in place for customization support
- Widget registry pattern is implemented and working
- `WidgetCard` component is flexible enough for new widget types
- Widgets are self-contained modules that fetch their own data
- Legacy components (`PeopleStatsCards`, `PeopleBreakdownCharts`, `PeopleDashboardClient`) have been removed in favor of the widget system

## Best Practices

### 1. Always Use WidgetCard

Don't create custom card components for dashboard widgets. Use `WidgetCard` for consistency.

❌ **Bad**:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Custom Widget</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

✅ **Good**:

```typescript
<WidgetCard title="Custom Widget">
  ...
</WidgetCard>
```

### 2. Register Widgets

Always register widgets in the registry file.

✅ **Good**:

```typescript
// src/components/widgets/index.ts
import { widgetRegistry } from './registry'
import { myWidget } from './my-widget'

widgetRegistry.registerAll([
  // ... existing widgets
  myWidget,
])
```

### 3. Use Widget Interface

Always implement the `Widget` interface for consistency.

```typescript
export const myWidget: Widget = {
  metadata: {
    /* ... */
  },
  checkVisibility: async context => {
    /* ... */
  },
  fetchData: async context => {
    /* ... */
  },
  render: (data, metadata, context) => {
    /* ... */
  },
}
```

### 4. Type Safety

Use TypeScript interfaces for widget data structures.

```typescript
interface MyWidgetData {
  value: number
  // ... other properties
}

render(data: unknown, metadata, context) {
  const { value } = data as MyWidgetData
  // ...
}
```

### 5. Responsive Design

Use `minWidth` and flexbox for responsive layouts.

```typescript
<WidgetCard
  minWidth="200px"
  className="flex-1 min-w-0"
>
  ...
</WidgetCard>
```

### 6. Error Handling

Handle errors gracefully in data fetching.

```typescript
async fetchData(context) {
  try {
    const data = await prisma.person.count({...})
    return { count: data }
  } catch (error) {
    console.error('Failed to fetch widget data:', error)
    return { count: 0 }
  }
}
```

## Examples

### Creating a New Stats Widget

```typescript
// src/components/widgets/new-widget.tsx
import { NewIcon } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface NewWidgetData {
  value: number
}

export const newWidget: Widget = {
  metadata: {
    id: 'new-widget',
    title: 'New Widget',
    icon: NewIcon,
    minWidth: '160px',
    defaultVisible: true,
    category: 'stats',
    description: 'Description of new widget',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    // Add visibility logic
    if (!context.hasLinkedPerson) {
      return { visible: false, reason: 'No linked person' }
    }
    return { visible: true }
  },

  async fetchData(context: WidgetContext): Promise<NewWidgetData> {
    // Fetch data
    const value = await prisma.person.count({
      where: { organizationId: context.organizationId }
    })
    return { value }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { value } = data as NewWidgetData
    const IconComponent = metadata.icon

    return (
      <WidgetCard
        title={metadata.title}
        titleIcon={IconComponent ? <IconComponent className='w-3 h-3 text-muted-foreground' /> : undefined}
        minWidth={metadata.minWidth}
        className='flex-1 min-w-0'
      >
        <div className='flex items-center justify-center'>
          <span className='text-4xl font-bold font-mono'>{value}</span>
        </div>
      </WidgetCard>
    )
  },
}
```

Then register in `src/components/widgets/index.ts`:

```typescript
import { newWidget } from './new-widget'

widgetRegistry.registerAll([
  // ... existing widgets
  newWidget,
])
```

### Creating a New Chart Widget

```typescript
// 1. Create client chart component
// src/components/widgets/new-chart.tsx
'use client'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export function NewChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width='100%' height={200}>
      <PieChart>
        <Pie data={data} dataKey='value'>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

// 2. Create widget module
// src/components/widgets/new-chart-widget.tsx
import { WidgetCard } from '@/components/widgets'
import { NewChart } from './new-chart'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

export const newChartWidget: Widget = {
  metadata: {
    id: 'new-chart',
    title: 'New Chart',
    minWidth: '320px',
    defaultVisible: true,
    category: 'charts',
  },

  async checkVisibility(context) {
    // Check if data exists
    return { visible: true }
  },

  async fetchData(context) {
    // Fetch and prepare chart data
    const data = await fetchChartData(context)
    return { data }
  },

  render(data, metadata, _context) {
    const { data: chartData } = data as { data: Array<{ name: string; value: number }> }

    return (
      <WidgetCard title={metadata.title} minWidth={metadata.minWidth}>
        <NewChart data={chartData} />
      </WidgetCard>
    )
  },
}
```

### Adding Interactivity to Widget

Interactivity is handled by the client wrapper component, not the widget itself:

```typescript
// In src/components/people/people-dashboard-widgets.tsx
const handleWidgetClick = async (widgetId: string) => {
  switch (widgetId) {
    case 'new-widget':
      router.push('/target-page')
      break
    case 'another-widget': {
      const data = await fetchWidgetData()
      setModalData(data)
      setModalOpen(true)
      break
    }
  }
}

// Widgets are automatically wrapped if their ID is in clickableWidgetIds
const clickableWidgetIds = [
  'new-widget',
  'another-widget',
  // ... other clickable widgets
]
```

## Related Documentation

- [Shared Layout Components](./shared-layout-components.md) - PageSection and other layout components
- [User Interface Rules](../.cursor/rules/user-interface.mdc) - UI guidelines
- [Coding Standards](../.cursor/rules/coding-standards.mdc) - Code style guidelines

## Related Files

- `src/components/widgets/types.ts` - Widget type definitions
- `src/components/widgets/registry.ts` - Widget registry
- `src/components/widgets/index.ts` - Widget registration
- `src/components/widgets/*-widget.tsx` - Individual widget modules
- `src/components/widgets/*-chart.tsx` - Client chart components
- `src/components/widgets/widget-card.tsx` - Base widget card component
- `src/components/people/people-dashboard-server.tsx` - Dashboard server component
- `src/components/people/people-dashboard-widgets.tsx` - Dashboard client wrapper
- `src/lib/user-settings.ts` - User preferences (future: widget settings)
