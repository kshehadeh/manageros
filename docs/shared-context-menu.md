# Shared Context Menu for Data Tables

## Overview

The shared context menu system provides a consistent way to add action menus to data tables throughout the application. This eliminates code duplication and ensures a uniform user experience.

## Components

### `useDataTableContextMenu` Hook

A custom hook that manages all the state and logic for the context menu.

**Returns:**

- `handleButtonClick`: Function to handle button clicks and position the menu
- `ContextMenuComponent`: Component to render the context menu
- `contextMenu`: The current context menu state (useful for debugging)
- `closeContextMenu`: Function to manually close the menu

### Context Menu Item Components

Pre-built menu items for common actions:

- `ContextMenuItem`: Generic menu item component
- `ViewDetailsMenuItem`: Navigates to entity detail page
- `EditMenuItem`: Navigates to entity edit page
- `DeleteMenuItem`: Triggers a delete action

## Usage Example

### In a Data Table Component

```tsx
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
} from '@/components/common/context-menu-items'

export function MyDataTable() {
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const columns = useMemo(
    () =>
      createMyColumns({
        onButtonClick: handleButtonClick, // Pass to columns
        // ... other options
      }),
    [handleButtonClick]
  )

  // ... rest of component

  return (
    <div>
      {/* Table rendering */}

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => (
          <>
            <ViewDetailsMenuItem
              entityId={entityId}
              entityType='teams' // or 'people', 'tasks', etc.
              close={close}
            />
            <EditMenuItem
              entityId={entityId}
              entityType='teams'
              close={close}
            />
            {/* Add custom items as needed */}
          </>
        )}
      </ContextMenuComponent>
    </div>
  )
}
```

### Custom Menu Items

You can add custom menu items alongside the standard ones:

```tsx
<ContextMenuComponent>
  {({ entityId, close }) => (
    <>
      <ViewDetailsMenuItem
        entityId={entityId}
        entityType='teams'
        close={close}
      />
      <EditMenuItem entityId={entityId} entityType='teams' close={close} />

      {/* Custom item */}
      <ContextMenuItem
        onClick={() => {
          handleCustomAction(entityId)
          close()
        }}
        icon={<CustomIcon className='h-4 w-4' />}
      >
        Custom Action
      </ContextMenuItem>
    </>
  )}
</ContextMenuComponent>
```

## Migration Guide

To migrate existing data tables to use the shared context menu:

1. **Import the hook and components:**

   ```tsx
   import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
   import {
     ViewDetailsMenuItem,
     EditMenuItem,
   } from '@/components/common/context-menu-items'
   ```

2. **Remove old context menu code:**
   - Remove `ContextMenuState` interface
   - Remove `useState` for context menu
   - Remove custom `handleButtonClick` function
   - Remove `useEffect` for closing menu on outside clicks
   - Remove manual context menu rendering

3. **Use the hook:**

   ```tsx
   const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()
   ```

4. **Update columns to use the hook's handleButtonClick:**

   ```tsx
   const columns = useMemo(
     () =>
       createColumns({
         onButtonClick: handleButtonClick,
         // ...
       }),
     [handleButtonClick /* other deps */]
   )
   ```

5. **Replace context menu rendering:**

   ```tsx
   <ContextMenuComponent>
     {({ entityId, close }) => (
       <>
         <ViewDetailsMenuItem
           entityId={entityId}
           entityType='your-entity'
           close={close}
         />
         <EditMenuItem
           entityId={entityId}
           entityType='your-entity'
           close={close}
         />
       </>
     )}
   </ContextMenuComponent>
   ```

## Tables Migrated

✅ **All 7 data tables successfully migrated!**

- [x] `teams/data-table.tsx` - **MIGRATED**
- [x] `people/data-table.tsx` - **MIGRATED**
- [x] `initiatives/data-table.tsx` - **MIGRATED**
- [x] `tasks/data-table.tsx` - **MIGRATED** (with custom Quick Edit action)
- [x] `oneonones/data-table.tsx` - **MIGRATED**
- [x] `meetings/shared-meetings-table.tsx` - **MIGRATED**
- [x] `meetings/meeting-instance-table.tsx` - **MIGRATED** (with custom ConfirmAction integration)

## Benefits

- **~400 lines of code eliminated** across all 7 tables
- **Consistent Behavior**: All menus position and behave identically
- **Single Source of Truth**: Updates to menu behavior happen in one place
- **Type Safety**: Fully typed with TypeScript - passes all type checks
- **Flexibility**: Easy to add custom menu items (as demonstrated in tasks and meeting-instances tables)
- **Reduced Maintenance**: Bug fixes and improvements benefit all tables automatically
- **Improved UX**: Uniform menu behavior across the entire application
