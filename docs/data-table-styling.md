# Data Table Styling

## Overview

All data tables throughout the application now share a centralized styling system. This allows for consistent appearance across all tables and enables updating all table styles from a single location.

## Architecture

### Centralized Styles Module

Location: `src/components/common/data-table-styles.ts`

This module exports:

- `dataTableStyles`: An object containing all shared CSS classes for data tables
- `combineDataTableStyles()`: Helper function to combine base styles with custom classes
- `dataTableIconSizes`: Standard icon size constants
- `dataTableSpacing`: Standard spacing constants

### Style Categories

The `dataTableStyles` object is organized into the following categories:

#### Container Styles

- `container`: Main wrapper for the entire data table component
- `tableWrapper`: Standard table wrapper with border and rounding
- `tableWrapperRelative`: Alternative wrapper with relative positioning for loading indicators

#### Loading Indicators

- `loadingSpinner`: Container for loading spinner (positioned in top right)
- `loadingSpinnerIcon`: Animated spinner icon

#### Table Structure

- `table.base`: Base table class
- `table.fixed`: Fixed layout table class
- `header.row`: Header row styling
- `header.cell`: Header cell styling

#### Body Styles

- `body.row`: Regular data row with hover effects
- `body.groupRow`: Group header row styling
- `body.cell`: Standard cell styling
- `body.groupCell`: Group cell (spans all columns)
- `body.emptyCell`: Loading/empty state cell

#### Group Controls

- `groupToggle`: Button for expanding/collapsing groups

#### Filter Bar

- `filterBar.container`: Main filter bar container
- `filterBar.topRow`: Top row with search and action buttons
- `filterBar.searchWrapper`: Search input wrapper
- `filterBar.searchIcon`: Search icon positioning
- `filterBar.searchInput`: Search input field
- `filterBar.controls`: Right side controls container
- `filterBar.resultsCount`: Results count text
- `filterBar.bottomRow`: Bottom row with filters and controls

#### Filter Controls

- `filter.button`: Filter button (inactive state)
- `filter.buttonActive`: Filter button (active state)
- `filter.indicator`: Active filter indicator dot
- `filter.popoverContent`: Filter popover width
- `filter.header`: Filter popover header
- `filter.headerTitle`: Filter title
- `filter.clearButton`: Clear filters button
- `filter.content`: Filter content container
- `filter.section`: Individual filter section
- `filter.sectionLabel`: Filter section label

#### Grouping Dropdown

- `grouping.trigger`: Grouping dropdown trigger width

#### Sort Controls

- `sort.button`: Sort button (inactive state)
- `sort.buttonActive`: Sort button (active state)
- `sort.indicator`: Active sort indicator dot
- `sort.popoverContent`: Sort popover width
- `sort.header`: Sort popover header
- `sort.headerTitle`: Sort title
- `sort.clearButton`: Clear sort button
- `sort.content`: Sort content container
- `sort.section`: Individual sort section
- `sort.sectionLabel`: Sort section label

#### Pagination

- `pagination.container`: Pagination controls container
- `pagination.pageInfo`: Page information text
- `pagination.controls`: Pagination button group

## Updated Data Tables

The following data table components have been updated to use the centralized styles:

1. **People Data Table** (`src/components/people/data-table.tsx`)
2. **Tasks Data Table** (`src/components/tasks/data-table.tsx`)
3. **One-on-Ones Data Table** (`src/components/oneonones/data-table.tsx`)
4. **Meetings Data Table** (`src/components/meetings/data-table.tsx`)
5. **Feedback Data Table** (`src/components/feedback/data-table.tsx`)
6. **Initiatives Data Table** (`src/components/initiatives/data-table.tsx`)
7. **Teams Data Table** (`src/components/teams/data-table.tsx`)
8. **Shared Meetings Table** (`src/components/meetings/shared-meetings-table.tsx`)
9. **Meeting Instance Table** (`src/components/meetings/meeting-instance-table.tsx`)

## Usage

### Basic Usage

Import the centralized styles in your data table component:

```typescript
import { dataTableStyles } from '@/components/common/data-table-styles'
```

Then use the appropriate style classes:

```tsx
<div className={dataTableStyles.container}>
  <div className={dataTableStyles.tableWrapper}>
    <Table>
      <TableHeader>
        <TableRow className={dataTableStyles.header.row}>{/* ... */}</TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className={dataTableStyles.body.row}>{/* ... */}</TableRow>
      </TableBody>
    </Table>
  </div>
</div>
```

### Combining with Custom Classes

Use the helper function to combine base styles with custom classes:

```typescript
import { combineDataTableStyles } from '@/components/common/data-table-styles'

const className = combineDataTableStyles(
  dataTableStyles.body.row,
  'custom-additional-class'
)
```

## Benefits

1. **Consistency**: All tables share the same visual appearance
2. **Maintainability**: Update all tables by modifying a single file
3. **Type Safety**: TypeScript provides autocomplete and type checking
4. **Scalability**: Easy to add new style variations or extend existing ones
5. **Documentation**: All styles are documented in one place

## Customization

To customize the appearance of all data tables:

1. Open `src/components/common/data-table-styles.ts`
2. Modify the desired style classes
3. Save the file - all tables will automatically use the new styles

### Example: Changing Row Hover Effect

```typescript
export const dataTableStyles = {
  // ...
  body: {
    // Change from muted/50 to a different opacity or color
    row: 'cursor-pointer hover:bg-accent/30 transition-colors',
    // ...
  },
  // ...
}
```

## Migration Guide

If you need to create a new data table:

1. Import the centralized styles module
2. Use the appropriate style classes from `dataTableStyles`
3. For custom styling needs, combine base styles with custom classes using `combineDataTableStyles()`

## Testing

After making changes to the centralized styles:

1. Run TypeScript compiler: `bunx tsc --noEmit`
2. Test each data table page to ensure styling is applied correctly
3. Check responsive behavior on different screen sizes

## Future Enhancements

Potential improvements to consider:

1. Theme-aware styling (light/dark mode variations)
2. Density options (compact, normal, comfortable)
3. Color scheme variants for different data types
4. Animation configurations
5. Accessibility enhancements (high contrast modes)
