'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { TableUrlConfig } from '@/lib/table-url-config'

interface TableSettings {
  filters: Record<string, unknown>
  sort: { field: string; direction: 'asc' | 'desc' }
  grouping: string
}

interface UseTableSettingsUrlSyncOptions {
  settings: TableSettings
  config: TableUrlConfig
  settingsId: string
  enabled?: boolean
}

/**
 * Hook to synchronize table settings with URL query parameters
 * Updates URL when settings change, enabling shareable filtered/sorted list URLs
 */
export function useTableSettingsUrlSync({
  settings,
  config,
  settingsId,
  enabled = true,
}: UseTableSettingsUrlSyncOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isInitialMount = useRef(true)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Only sync for default settings (main list pages), not custom views
  const shouldSync = enabled && settingsId === 'default'

  useEffect(() => {
    // Skip sync on initial mount to avoid overwriting URL params that were just read
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!shouldSync) return

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce URL updates to batch rapid changes
    debounceTimeoutRef.current = setTimeout(() => {
      const currentParams = new URLSearchParams(searchParams.toString())
      const newParams = new URLSearchParams()

      // Sync filters (only those explicitly defined in filterParamMap)
      const filterEntries = Object.entries(settings.filters).filter(
        ([key]) => key in config.filterParamMap
      )
      for (const [filterKey, filterValue] of filterEntries) {
        const paramName = config.filterParamMap[filterKey]
        const defaultValue = config.defaultValues[filterKey]

        // Check if value is default/empty
        // For arrays, check length (empty array = default)
        // For other values, use strict equality
        const isDefault =
          (Array.isArray(filterValue) && filterValue.length === 0) ||
          (Array.isArray(defaultValue) &&
            Array.isArray(filterValue) &&
            filterValue.length === 0) ||
          (!Array.isArray(filterValue) &&
            !Array.isArray(defaultValue) &&
            filterValue === defaultValue) ||
          filterValue === '' ||
          filterValue === null ||
          filterValue === undefined

        if (!isDefault) {
          // Convert value to URL param format
          if (Array.isArray(filterValue)) {
            // Arrays → comma-separated strings
            newParams.set(paramName, filterValue.join(','))
          } else {
            // Single values → string
            newParams.set(paramName, String(filterValue))
          }
        }
      }

      // Sync sort
      const sortParamName = config.sortParamName || 'sort'
      const defaultSort = config.defaultValues.sort as
        | { field: string; direction: string }
        | undefined

      if (settings.sort.field && settings.sort.field !== defaultSort?.field) {
        // Format: field:direction
        newParams.set(
          sortParamName,
          `${settings.sort.field}:${settings.sort.direction}`
        )
      }

      // Sync grouping
      const groupingParamName = config.groupingParamName || 'grouping'
      const defaultGrouping = config.defaultValues.grouping as
        | string
        | undefined

      if (settings.grouping && settings.grouping !== defaultGrouping) {
        newParams.set(groupingParamName, settings.grouping)
      }

      // Only update URL if it actually changed
      const newUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`
      const currentUrl = `${pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`

      // Compare URLs to avoid unnecessary updates
      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false })
      }
    }, 300) // 300ms debounce

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.filters,
    settings.sort,
    settings.grouping,
    config,
    settingsId,
    shouldSync,
    router,
    pathname,
    // Note: searchParams is intentionally NOT in dependencies to avoid infinite loops
    // We only read from it to compare current URL, not to trigger updates
  ])
}
