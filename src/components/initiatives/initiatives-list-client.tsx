'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { InitiativeDataTable } from './data-table'

export function InitiativesListClient() {
  const searchParams = useSearchParams()

  // Read status and RAG from URL params
  const statusParam = searchParams.get('status')
  const ragParam = searchParams.get('rag')
  const immutableFilters = useMemo(() => {
    const filters: {
      status?: string | string[]
      rag?: string | string[]
    } = {}

    if (statusParam) {
      // Handle comma-separated values (for multiple statuses)
      const statuses = statusParam.split(',').filter(Boolean)
      if (statuses.length > 0) {
        filters.status = statuses.length === 1 ? statuses[0] : statuses
      }
    }

    if (ragParam) {
      // Handle comma-separated values (for multiple RAG statuses)
      const rags = ragParam.split(',').filter(Boolean)
      if (rags.length > 0) {
        filters.rag = rags.length === 1 ? rags[0] : rags
      }
    }

    return Object.keys(filters).length > 0 ? filters : undefined
  }, [statusParam, ragParam])

  return (
    <InitiativeDataTable
      enablePagination={true}
      immutableFilters={immutableFilters}
    />
  )
}
