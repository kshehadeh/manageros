# Breadcrumb System

## Overview

The breadcrumb system provides consistent navigation across the application. Breadcrumbs are set explicitly by each page component, ensuring reliable and predictable behavior without race conditions.

## Architecture

### Core Components

1. **BreadcrumbProvider** (`src/components/breadcrumb-provider.tsx`)
   - Provides breadcrumb state via React Context
   - Wraps the application in `src/app/(app)/layout.tsx`
   - Manages breadcrumb state at the application level

2. **PageBreadcrumbSetter** (`src/components/page-breadcrumb-setter.tsx`)
   - Client component that sets breadcrumbs synchronously
   - Uses `useLayoutEffect` to set breadcrumbs before paint (prevents race conditions)
   - Accepts breadcrumbs as props from server components

3. **Breadcrumb** (`src/components/breadcrumb.tsx`)
   - Displays breadcrumbs in the top bar
   - Shows desktop breadcrumb trail and mobile dropdown
   - Automatically renders based on context state

### Hooks

- **useBreadcrumb()** - Access breadcrumb context (read breadcrumbs, set breadcrumbs)
- **useSetBreadcrumbs()** - Set breadcrumbs from client components (uses `useLayoutEffect`)
- **usePageBreadcrumbs()** - Convenience hook that prepends Dashboard breadcrumb

## Usage Pattern

### Server Components (Recommended)

All pages should set breadcrumbs in their server component using `PageBreadcrumbSetter`:

```tsx
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function MyPage({ params }: MyPageProps) {
  // Fetch data...
  const entity = await getEntity(id)

  // Define breadcrumbs
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Entities', href: '/entities' },
    { name: entity.name, href: `/entities/${entity.id}` },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>{/* Page content */}</PageContainer>
    </PageBreadcrumbSetter>
  )
}
```

### Client Components (For Dynamic Content)

If you need to set breadcrumbs from a client component (e.g., when content is dynamic), use the hooks:

```tsx
'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

export function MyClientComponent({ entityName, entityId }: Props) {
  usePageBreadcrumbs([
    { name: 'Entities', href: '/entities' },
    { name: entityName, href: `/entities/${entityId}` },
  ])

  return <>{/* Component content */}</>
}
```

## Best Practices

### 1. Always Include Dashboard

Every breadcrumb trail should start with Dashboard (except the Dashboard page itself):

```tsx
const breadcrumbs = [
  { name: 'Dashboard', href: '/dashboard' },
  // ... rest of breadcrumbs
]
```

### 2. Use Descriptive Names

Use clear, user-friendly names for breadcrumb items:

```tsx
// Good
{ name: 'John Doe', href: '/people/123' }
{ name: 'Q4 Planning Initiative', href: '/initiatives/456' }

// Avoid
{ name: 'User 123', href: '/people/123' }
{ name: 'Initiative', href: '/initiatives/456' }
```

### 3. Match URL Structure

Breadcrumbs should reflect the URL hierarchy:

```tsx
// URL: /people/123/feedback-campaigns/456
const breadcrumbs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'People', href: '/people' },
  { name: personName, href: '/people/123' },
  { name: 'Feedback 360', href: '/people/123/feedback-campaigns' },
  { name: campaignName, href: '/people/123/feedback-campaigns/456' },
]
```

### 4. List Pages

All list pages should set breadcrumbs:

```tsx
// /tasks/page.tsx
const breadcrumbs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Tasks', href: '/tasks' },
]
```

### 5. Detail Pages

Detail pages should include the parent list and entity name:

```tsx
// /tasks/[id]/page.tsx
const breadcrumbs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Tasks', href: '/tasks' },
  { name: task.title, href: `/tasks/${task.id}` },
]
```

### 6. Edit/Create Pages

Edit and create pages should include the full hierarchy:

```tsx
// /tasks/[id]/edit/page.tsx
const breadcrumbs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Tasks', href: '/tasks' },
  { name: task.title, href: `/tasks/${task.id}` },
  { name: 'Edit', href: `/tasks/${task.id}/edit` },
]
```

## Implementation Details

### Why useLayoutEffect?

The system uses `useLayoutEffect` instead of `useEffect` to set breadcrumbs synchronously before the browser paints. This prevents:

- Race conditions with page rendering
- "Loading..." flashes
- Breadcrumbs appearing after content

### No Automatic Fallback

Unlike the old system, there is **no automatic breadcrumb handler**. Every page must explicitly set its breadcrumbs. This ensures:

- Predictable behavior
- No race conditions
- Clear ownership of breadcrumb logic

### Type Safety

Breadcrumb items are typed:

```typescript
interface BreadcrumbItem {
  name: string
  href: string
}
```

The `isLoading` property has been removed - breadcrumbs are always available when set.

## Migration from Old System

If you encounter old breadcrumb client components, they should be replaced with the new pattern:

**Old Pattern (Deprecated):**

```tsx
// Old client wrapper component
export function EntityBreadcrumbClient({ name, id, children }) {
  usePageBreadcrumbs([
    { name: 'Entities', href: '/entities' },
    { name, href: `/entities/${id}` },
  ])
  return <>{children}</>
}

// Page
return (
  <EntityBreadcrumbClient name={entity.name} id={entity.id}>
    {/* content */}
  </EntityBreadcrumbClient>
)
```

**New Pattern:**

```tsx
// Page (server component)
const breadcrumbs = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Entities', href: '/entities' },
  { name: entity.name, href: `/entities/${entity.id}` },
]

return (
  <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
    {/* content */}
  </PageBreadcrumbSetter>
)
```

## Common Patterns

### Simple List Page

```tsx
export default async function TasksPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Tasks', href: '/tasks' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>{/* Page content */}</PageContainer>
    </PageBreadcrumbSetter>
  )
}
```

### Detail Page with Dynamic Data

```tsx
export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const task = await getTask(id)

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Tasks', href: '/tasks' },
    { name: task.title, href: `/tasks/${task.id}` },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>{/* Page content */}</PageContainer>
    </PageBreadcrumbSetter>
  )
}
```

### Nested Routes

```tsx
export default async function CampaignResponsesPage({ params }: Props) {
  const { id, campaignId } = await params
  const person = await getPerson(id)
  const campaign = await getCampaign(campaignId)

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: person.name, href: `/people/${id}` },
    { name: 'Feedback 360', href: `/people/${id}/feedback-campaigns` },
    {
      name: campaign.name,
      href: `/people/${id}/feedback-campaigns/${campaignId}`,
    },
    {
      name: 'Responses',
      href: `/people/${id}/feedback-campaigns/${campaignId}/responses`,
    },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      {/* Page content */}
    </PageBreadcrumbSetter>
  )
}
```

## Troubleshooting

### Breadcrumbs Not Updating

If breadcrumbs aren't updating when navigating:

1. Check that the page has `PageBreadcrumbSetter` with breadcrumbs prop
2. Verify breadcrumbs array is defined before the return statement
3. Ensure breadcrumbs include the current page's path

### Breadcrumbs Showing Previous Page

This happens when a page doesn't set breadcrumbs. Every page must explicitly set its breadcrumbs - there's no automatic fallback.

### "Loading..." in Breadcrumbs

This should not happen with the new system. If you see it:

1. Check that `PageBreadcrumbSetter` is being used (not old client components)
2. Verify breadcrumbs are passed as props (not set via hooks in client components)
3. Ensure `useLayoutEffect` is being used (not `useEffect`)

## Files Reference

- `src/components/breadcrumb-provider.tsx` - Context provider
- `src/components/page-breadcrumb-setter.tsx` - Client component for setting breadcrumbs
- `src/components/breadcrumb.tsx` - Display component
- `src/lib/hooks/use-breadcrumb.ts` - Hooks for client components
- `src/app/(app)/layout.tsx` - Provider setup
