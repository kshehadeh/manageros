# Shared Layout Components

This document describes the shared layout components used across all entity detail pages and list pages in ManagerOS. These components provide a consistent structure and enable centralized layout management.

## Overview

All entity pages should use the shared layout components instead of CSS classes directly. This ensures visual consistency and makes it easy to update the look and feel across all pages by modifying a single component.

## Components

### PageContainer

The top-level wrapper for all pages. Provides consistent spacing between major sections.

**Location**: `@/components/ui/page-container`

**Props**:

- `children`: ReactNode - Page content
- `className?`: string - Additional CSS classes

**Usage**:

```tsx
import { PageContainer } from '@/components/ui/page-container'

;<PageContainer>{/* Page content */}</PageContainer>
```

### PageHeader

Handles page headers with title, subtitle, icon, and actions. Supports both simple and complex header layouts.

**Location**: `@/components/ui/page-header`

**Props**:

- `title?`: string | ReactNode - Page title
- `titleIcon?`: LucideIcon | React.ElementType - Icon to display next to title
- `subtitle?`: string | ReactNode - Subtitle text
- `actions?`: ReactNode - Action buttons/dropdowns (rendered on the right)
- `children?`: ReactNode - Custom header content (for complex layouts)
- `className?`: string - Additional CSS classes

**Usage - Simple Header**:

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { Rocket } from 'lucide-react'

;<PageHeader
  title='Initiatives'
  titleIcon={Rocket}
  subtitle='Manage your organization initiatives'
  actions={<Button>Create</Button>}
/>
```

**Usage - Complex Header with Children**:

```tsx
<PageHeader>
  <div className='flex items-start justify-between'>
    <div className='flex-1'>
      <div className='flex items-center gap-3 mb-2'>
        <Rocket className='h-6 w-6' />
        <h1 className='page-title'>{initiative.title}</h1>
        <Badge>{initiative.status}</Badge>
      </div>
      <div className='page-section-subtitle'>{initiative.description}</div>
    </div>
    <InitiativeActionsDropdown initiativeId={initiative.id} />
  </div>
</PageHeader>
```

**Note**: When using `children`, the `title`, `subtitle`, and `actions` props are ignored. Include actions within the children if needed.

### PageContent

Wraps the main content area and handles two-column layout structure (main content + sidebar).

**Location**: `@/components/ui/page-content`

**Props**:

- `children`: ReactNode - Content (typically `PageMain` and `PageSidebar`)
- `className?`: string - Additional CSS classes

**Usage**:

```tsx
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'

;<PageContent>
  <PageMain>{/* Main content */}</PageMain>
  <PageSidebar>{/* Sidebar content */}</PageSidebar>
</PageContent>
```

### PageMain

Wraps the main content column. Applies `flex-1 min-w-0` for proper flex behavior.

**Location**: `@/components/ui/page-main`

**Props**:

- `children`: ReactNode - Main content
- `className?`: string - Additional CSS classes

**Usage**:

```tsx
import { PageMain } from '@/components/ui/page-main'

;<PageMain>
  <div className='space-y-6'>
    <PageSection>{/* Content sections */}</PageSection>
  </div>
</PageMain>
```

### PageSidebar

Wraps the sidebar column. Applies responsive width (`w-full lg:w-80 lg:shrink-0`).

**Location**: `@/components/ui/page-sidebar`

**Props**:

- `children`: ReactNode - Sidebar content
- `className?`: string - Additional CSS classes

**Usage**:

```tsx
import { PageSidebar } from '@/components/ui/page-sidebar'

;<PageSidebar>
  <PageSection header={<SectionHeader icon={Users} title='Participants' />}>
    {/* Sidebar content */}
  </PageSection>
</PageSidebar>
```

### SectionContent

Optional wrapper for section content areas. Provides consistent spacing within sections.

**Location**: `@/components/ui/section-content`

**Props**:

- `children`: ReactNode - Section content
- `className?`: string - Additional CSS classes

**Usage**:

```tsx
import { SectionContent } from '@/components/ui/section-content'

;<PageSection>
  <SectionContent>{/* Section content */}</SectionContent>
</PageSection>
```

## Complete Examples

### Entity Detail Page

```tsx
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { FileText, Users } from 'lucide-react'

export default function EntityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const entity = await getEntity(params.id)

  return (
    <PageContainer>
      <PageHeader
        title={entity.name}
        titleIcon={FileText}
        subtitle={entity.description}
        actions={<EntityActionsDropdown entityId={entity.id} />}
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            <PageSection
              header={<SectionHeader icon={FileText} title='Details' />}
            >
              {/* Main content */}
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          <PageSection header={<SectionHeader icon={Users} title='Related' />}>
            {/* Sidebar content */}
          </PageSection>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
```

### List Page

```tsx
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { ListTodo, Plus } from 'lucide-react'

export default function EntityListPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Tasks'
        titleIcon={ListTodo}
        subtitle='Manage and track all tasks'
        actions={
          <Button asChild>
            <Link href='/tasks/new'>
              <Plus className='h-4 w-4' />
              Create Task
            </Link>
          </Button>
        }
      />

      <PageContent>
        <PageSection>
          <EntityDataTable />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
```

### Complex Header Example

For headers with custom layouts (e.g., badges, multiple elements):

```tsx
<PageHeader>
  <div className='flex items-start justify-between'>
    <div className='flex-1'>
      <div className='flex items-center gap-3 mb-2'>
        <Rocket className='h-6 w-6' />
        <h1 className='page-title'>{initiative.title}</h1>
        <Rag rag={initiative.rag} />
        <Badge>{completionRate}% complete</Badge>
      </div>
      <div className='page-section-subtitle'>{initiative.description}</div>
      {/* Additional metadata */}
    </div>
    <InitiativeActionsDropdown initiativeId={initiative.id} />
  </div>
</PageHeader>
```

## Migration Guide

### Before (Using CSS Classes)

```tsx
<div className='page-container'>
  <div className='page-header'>
    <div className='flex items-start justify-between'>
      <div className='flex-1'>
        <h1 className='page-title'>{title}</h1>
      </div>
      <ActionsDropdown />
    </div>
  </div>

  <div className='flex flex-col lg:flex-row gap-6'>
    <div className='flex-1 min-w-0'>{/* Main content */}</div>
    <div className='w-full lg:w-80 lg:shrink-0'>{/* Sidebar */}</div>
  </div>
</div>
```

### After (Using Shared Components)

```tsx
<PageContainer>
  <PageHeader title={title} actions={<ActionsDropdown />} />

  <PageContent>
    <PageMain>{/* Main content */}</PageMain>
    <PageSidebar>{/* Sidebar */}</PageSidebar>
  </PageContent>
</PageContainer>
```

## Benefits

1. **Consistency**: All pages follow the same visual structure
2. **Maintainability**: Update all pages by modifying shared components
3. **Type Safety**: TypeScript ensures correct prop usage
4. **Flexibility**: Supports both simple and complex layouts
5. **Responsive**: Built-in responsive behavior for mobile/tablet/desktop

## Best Practices

1. **Always use shared components** instead of CSS classes for layout structure
2. **Use `PageHeader` with props** for simple headers, use `children` for complex layouts
3. **Wrap content in `PageContent`** when using two-column layouts
4. **Use `PageMain` and `PageSidebar`** to clearly separate main content from sidebar
5. **Keep entity-specific components** (e.g., `TaskSidebar`, `InitiativeSidebar`) for their content, but use shared components for layout structure

## Related Components

- `PageSection`: For content sections within pages
- `SectionHeader`: For section titles with icons
- `SectionContent`: Optional wrapper for section content

## See Also

- [Entity Detail Page Standards](./entity-detail-page-standards.md)
- [PageSection Component](./page-section-component.md)
- [User Interface Rules](../.cursor/rules/user-interface.mdc)
