/**
 * Centralized Data Table Styling
 *
 * This module contains all shared styling classes for data tables throughout the application.
 * By centralizing these styles, we can maintain consistent appearance and easily update
 * all tables from a single location.
 *
 * Usage:
 * import { dataTableStyles } from '@/components/common/data-table-styles'
 * <div className={dataTableStyles.container}>...</div>
 */

export const dataTableStyles = {
  // Main container that wraps the entire data table
  container: 'space-y-4',

  // Table wrapper (applies border and rounding)
  tableWrapper: 'rounded-md border overflow-hidden',

  // Alternative table wrapper with relative positioning for loading indicators
  tableWrapperRelative: 'rounded-md border relative',

  // Loading spinner container (positioned in top right of table)
  loadingSpinner:
    'absolute top-2 right-2 z-10 bg-background/80 rounded-full p-2',
  loadingSpinnerIcon:
    'h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent',

  // Table element classes
  table: {
    // Base table class (used when fixed layout is needed)
    base: '',
    fixed: 'table-fixed',
  },

  // Header styling
  header: {
    row: '',
    cell: '',
  },

  // Body styling
  body: {
    // Regular data row
    row: 'cursor-pointer hover:bg-muted/50 transition-colors',

    // Group header row
    groupRow: 'bg-muted/50',

    // Cell styling
    cell: '',

    // Group cell (spans all columns)
    groupCell: 'font-medium py-3',

    // Loading/empty state cell
    emptyCell: 'h-24 text-center',
  },

  // Group toggle button
  groupToggle:
    'flex items-center gap-2 hover:text-primary transition-colors w-full',

  // Filter bar (contains search, filters, grouping, sorting)
  filterBar: {
    container: 'space-y-4',

    // Top row with search and action buttons
    topRow: 'flex items-center justify-between gap-4',

    // Search input wrapper
    searchWrapper: 'relative flex-1 max-w-sm',
    searchIcon:
      'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
    searchInput: 'pl-9',

    // Right side controls (filter, grouping, sorting)
    controls: 'flex items-center gap-2',

    // Results count text
    resultsCount: 'text-sm text-muted-foreground',

    // Bottom row (filters + controls + count)
    bottomRow: 'flex items-center justify-between gap-4',
  },

  // Filter button styling
  filter: {
    button: 'flex items-center gap-2',
    buttonActive: 'flex items-center gap-2 border-primary bg-primary/5',
    indicator: 'h-2 w-2 bg-primary rounded-full',
    popoverContent: 'w-80',
    header: 'flex items-center justify-between',
    headerTitle: 'font-medium',
    clearButton: 'text-sm text-muted-foreground hover:text-foreground',
    content: 'space-y-4',
    section: 'space-y-2',
    sectionLabel: 'text-sm font-medium',
  },

  // Grouping dropdown
  grouping: {
    trigger: 'w-32',
  },

  // Sort control
  sort: {
    button: 'flex items-center gap-2',
    buttonActive: 'flex items-center gap-2 border-primary bg-primary/5',
    indicator: 'h-2 w-2 bg-primary rounded-full',
    popoverContent: 'w-80',
    header: 'flex items-center justify-between',
    headerTitle: 'font-medium',
    clearButton: 'text-sm text-muted-foreground hover:text-foreground',
    content: 'space-y-4',
    section: 'space-y-2',
    sectionLabel: 'text-sm font-medium',
  },

  // Pagination controls
  pagination: {
    container: 'flex items-center justify-between px-2',
    pageInfo: 'flex-1 text-sm text-muted-foreground',
    controls: 'flex items-center space-x-2',
  },
}

/**
 * Helper function to combine data table styles with custom classes
 * @param baseStyle - The base style from dataTableStyles
 * @param customClasses - Additional custom classes to apply
 * @returns Combined class string
 */
export function combineDataTableStyles(
  baseStyle: string,
  customClasses?: string
): string {
  return customClasses ? `${baseStyle} ${customClasses}` : baseStyle
}

/**
 * Data table icon sizes for consistency
 */
export const dataTableIconSizes = {
  small: 'h-4 w-4',
  medium: 'h-5 w-5',
  large: 'h-6 w-6',
}

/**
 * Data table spacing constants
 */
export const dataTableSpacing = {
  filterGap: 'gap-2',
  sectionGap: 'gap-4',
  controlGap: 'space-x-2',
}
