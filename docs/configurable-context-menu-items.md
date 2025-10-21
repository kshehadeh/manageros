# Configurable Context Menu Items

## Overview

The generic data table now supports configurable detail and edit context menu items through the `onViewDetails` and `onEdit` configuration options. This allows you to override the default behavior for these specific menu items while keeping the default behavior for other items like delete.

## Features

- **Selective Override**: Override only the detail and edit menu items while keeping default behavior for other items
- **Entity Access**: Access to the full entity object and entity ID in the callback
- **Backward Compatible**: Existing configurations continue to work without changes
- **Type Safe**: Full TypeScript support with proper typing

## Usage

### Basic Configuration

```tsx
import type { DataTableConfig } from '@/components/common/generic-data-table'

export const myDataTableConfig: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration

  // Override the "View Details" menu item
  onViewDetails: ({ entityId, entity, close }) => {
    // Custom logic for viewing details
    console.log('Viewing details for:', entity)
    router.push(`/custom-details/${entityId}`)
    close()
  },

  // Override the "Edit" menu item
  onEdit: ({ entityId, entity, close }) => {
    // Custom logic for editing
    console.log('Editing:', entity)
    router.push(`/custom-edit/${entityId}`)
    close()
  },

  // Other context menu items (like delete) will use default behavior
  deleteAction: deleteMyEntity,
}
```

### Advanced Example with Custom Logic

```tsx
export const advancedDataTableConfig: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration

  onViewDetails: ({ entityId, entity, close }) => {
    // Check entity state before navigating
    if (entity.status === 'draft') {
      toast.info('Cannot view draft items')
      close()
      return
    }

    // Navigate to a different route based on entity type
    const route =
      entity.type === 'special'
        ? `/special-view/${entityId}`
        : `/standard-view/${entityId}`

    router.push(route)
    close()
  },

  onEdit: ({ entityId, entity, close }) => {
    // Check permissions
    if (!entity.canEdit) {
      toast.error('You do not have permission to edit this item')
      close()
      return
    }

    // Open edit modal instead of navigating
    setEditModalOpen(true)
    setEditEntityId(entityId)
    close()
  },
}
```

### Using with Custom Context Menu Items

If you need complete control over all context menu items, you can still use the `contextMenuItems` property:

```tsx
export const fullCustomConfig: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration

  // Complete custom context menu
  contextMenuItems: ({ entityId, entity, close, refetch, onDelete }) => (
    <>
      <ContextMenuItem
        onClick={() => {
          handleCustomAction(entityId)
          close()
        }}
        icon={<CustomIcon className='h-4 w-4' />}
      >
        Custom Action
      </ContextMenuItem>
      <DeleteMenuItem onDelete={onDelete} close={close} />
    </>
  ),
}
```

## Migration Guide

### From Default Context Menu Items

If you're currently using the default context menu items and want to customize just the detail and edit actions:

**Before:**

```tsx
export const config: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration
  // Uses default ViewDetailsMenuItem and EditMenuItem
}
```

**After:**

```tsx
export const config: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration

  onViewDetails: ({ entityId, entity, close }) => {
    // Your custom logic
    router.push(`/custom-details/${entityId}`)
    close()
  },

  onEdit: ({ entityId, entity, close }) => {
    // Your custom logic
    router.push(`/custom-edit/${entityId}`)
    close()
  },
}
```

### From Custom Context Menu Items

If you're currently using `contextMenuItems` but only need to customize the detail and edit actions, you can simplify:

**Before:**

```tsx
export const config: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration

  contextMenuItems: ({ entityId, entity, close, refetch, onDelete }) => (
    <>
      <ContextMenuItem
        onClick={() => {
          router.push(`/custom-details/${entityId}`)
          close()
        }}
        icon={<Eye className='h-4 w-4' />}
      >
        View Details
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => {
          router.push(`/custom-edit/${entityId}`)
          close()
        }}
        icon={<Edit className='h-4 w-4' />}
      >
        Edit
      </ContextMenuItem>
      <DeleteMenuItem onDelete={onDelete} close={close} />
    </>
  ),
}
```

**After:**

```tsx
export const config: DataTableConfig<MyEntity, MyFilters> = {
  // ... other configuration

  onViewDetails: ({ entityId, entity, close }) => {
    router.push(`/custom-details/${entityId}`)
    close()
  },

  onEdit: ({ entityId, entity, close }) => {
    router.push(`/custom-edit/${entityId}`)
    close()
  },

  deleteAction: deleteMyEntity, // Delete will use default behavior
}
```

## API Reference

### `onViewDetails`

**Type:** `(params: { entityId: string; entity: TData; close: () => void }) => void`

**Description:** Called when the user clicks the "View Details" context menu item.

**Parameters:**

- `entityId`: The ID of the entity
- `entity`: The full entity object
- `close`: Function to close the context menu

### `onEdit`

**Type:** `(params: { entityId: string; entity: TData; close: () => void }) => void`

**Description:** Called when the user clicks the "Edit" context menu item.

**Parameters:**

- `entityId`: The ID of the entity
- `entity`: The full entity object
- `close`: Function to close the context menu

## Benefits

1. **Simplified Configuration**: No need to recreate the entire context menu for simple customizations
2. **Better Performance**: Avoids recreating React components unnecessarily
3. **Type Safety**: Full TypeScript support with proper entity typing
4. **Flexibility**: Can still use `contextMenuItems` for complete control when needed
5. **Consistency**: Maintains consistent UI/UX across the application
