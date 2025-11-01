# Simple List Components

## Overview

Simple list components provide a standardized way to display lists of items throughout the ManagerOS application. These components ensure consistent styling, spacing, and behavior across all simple lists.

## Standardized Components

### SimpleListContainer

The container component that wraps the entire list section. It provides consistent padding, margins, and responsive behavior.

**Location**: `src/components/common/simple-list-container.tsx`

**Props**:

- `children`: ReactNode - The content to wrap
- `className?: string` - Additional CSS classes
- `withSection?: boolean` - Whether to render as a `<section>` element (default: `true`)

**Usage**:

```tsx
<SimpleListContainer className={className}>
  <SectionHeader title='My List' />
  {/* List items */}
</SimpleListContainer>
```

**Behavior**:

- When `withSection={true}`: Renders a `<section>` with `rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4`
- When `withSection={false}`: Renders a `<div>` with `space-y-0`

### SimpleListItem

A standardized item container that provides consistent styling for individual list items.

**Location**: `src/components/common/simple-list-item.tsx`

**Props**:

- `children`: ReactNode - The content of the list item
- `onClick?: () => void` - Optional click handler
- `className?: string` - Additional CSS classes

**Base Classes**: `flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors bg-muted/40 rounded-md mb-2 cursor-pointer`

All list items now have a consistent background, rounded corners, spacing, and pointer cursor for better visual consistency and user experience.

**Usage**:

```tsx
<SimpleListItem>
  <Link href='/item/1'>Item Title</Link>
  <Button>Action</Button>
</SimpleListItem>
```

### SimpleListItemsContainer

Container for the list of items that handles empty states and dividers.

**Location**: `src/components/common/simple-list-items-container.tsx`

**Props**:

- `children`: ReactNode - The list items
- `emptyStateText?: string` - Text to display when list is empty
- `isEmpty?: boolean` - Whether the list is empty (default: `false`)
- `className?: string` - Additional CSS classes
- `useDividers?: boolean` - Whether to show dividers between items (default: `true`)

**Usage**:

```tsx
<SimpleListItemsContainer
  isEmpty={items.length === 0}
  emptyStateText='No items found.'
>
  {items.map(item => (
    <SimpleListItem key={item.id}>...</SimpleListItem>
  ))}
</SimpleListItemsContainer>
```

## Simple Lists Using These Components

All simple lists in the application have been standardized to use these components:

1. **SimpleInitiativeList** (`src/components/initiatives/initiative-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with `withSection={false}`

2. **SimpleTaskList** (`src/components/tasks/task-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with section wrapper

3. **SimpleOneOnOneList** (`src/components/oneonones/oneonone-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with section wrapper

4. **SimpleLinkList** (`src/components/links/link-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with conditional section wrapper

5. **SimplePeopleList** (`src/components/people/person-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with conditional section wrapper

6. **SimpleFeedbackCampaignList** (`src/components/feedback/feedback-campaign-simple-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with section wrapper

7. **SimpleTeamList** (`src/components/teams/team-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with section wrapper

8. **MeetingList** (`src/components/meetings/meeting-list.tsx`)
   - Uses `SimpleListItem` (standardized with background and pointer cursor)
   - Uses `SimpleListContainer` with section wrapper

## Standard Patterns

### Complete List Example

```tsx
'use client'

import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

export function SimpleExampleList({ items, className = '' }) {
  const renderItem = item => (
    <SimpleListItem key={item.id}>
      <Link href={`/items/${item.id}`} className='flex-1'>
        <h3>{item.title}</h3>
      </Link>
      <Button variant='ghost' size='sm'>
        <MoreHorizontal className='h-4 w-4' />
      </Button>
    </SimpleListItem>
  )

  return (
    <SimpleListContainer className={className}>
      <SectionHeader title='Items' />
      <SimpleListItemsContainer
        isEmpty={items.length === 0}
        emptyStateText='No items found.'
      >
        {items.map(renderItem)}
      </SimpleListItemsContainer>
    </SimpleListContainer>
  )
}
```

### Without Section Wrapper

When the list is embedded in a section that already has its own wrapper:

```tsx
<SimpleListContainer withSection={false} className={className}>
  <SimpleListItemsContainer
    isEmpty={items.length === 0}
    emptyStateText='No items found.'
  >
    {items.map(renderItem)}
  </SimpleListItemsContainer>
</SimpleListContainer>
```

### Clickable Items

For items that should be clickable, use the `onClick` prop:

```tsx
<SimpleListItem onClick={() => router.push(`/item/${item.id}`)}>
  {/* Item content */}
</SimpleListItem>
```

Note: All items have `cursor-pointer` by default, so the pointer cursor will always be shown.

## Benefits

1. **Consistency**: All simple lists now have the same look and feel
2. **Maintainability**: Changes to list styling can be made in one place
3. **Flexibility**: Variants allow for different visual styles when needed
4. **Accessibility**: Standardized structure improves screen reader support
5. **Responsive Design**: Built-in responsive classes ensure mobile compatibility

## Migration Notes

If you encounter a simple list that hasn't been migrated yet:

1. Import the standardized components
2. Replace the container `<div>` or `<section>` with `SimpleListContainer`
3. Replace individual item `<div>` elements with `SimpleListItem` (no variant prop needed)
4. Replace the items wrapper `<div>` with `SimpleListItemsContainer`
5. All items automatically have background, rounded corners, spacing, and pointer cursor

## Future Enhancements

Potential future improvements:

- Loading states
- Skeleton components for lists
- Virtual scrolling for very long lists
- Animation variants for item additions/removals
