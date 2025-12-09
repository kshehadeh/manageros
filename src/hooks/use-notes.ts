import { useState, useEffect, useCallback } from 'react'
import type { NoteWithAttachments } from '@/types/notes'

interface NoteFilters {
  search?: string
  entityType?: string[]
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface NotesResponse {
  notes: NoteWithAttachments[]
  currentUserId?: string
  pagination: PaginationInfo
}

interface UseNotesOptions {
  page?: number
  limit?: number
  filters?: NoteFilters
  immutableFilters?: NoteFilters
  sort?: string
  enabled?: boolean
}

export function useNotes({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseNotesOptions = {}) {
  const [data, setData] = useState<NotesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      // Handle search filter
      if (filters?.search) {
        searchParams.set('search', filters.search)
      }

      // Handle entityType filter (array)
      if (filters?.entityType && filters.entityType.length > 0) {
        searchParams.set('entityType', filters.entityType.join(','))
      }

      if (sort) {
        searchParams.set('sort', sort)
      }

      if (Object.keys(immutableFilters || {}).length > 0) {
        searchParams.set('immutableFilters', JSON.stringify(immutableFilters))
      }

      const response = await fetch(`/api/notes?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch notes')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters, immutableFilters, sort, enabled])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const refetch = useCallback(() => {
    fetchNotes()
  }, [fetchNotes])

  const updateItem = useCallback(
    (noteId: string, updates: Partial<NoteWithAttachments>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedNotes = prevData.notes.map(note =>
          note.id === noteId ? { ...note, ...updates } : note
        )

        return { ...prevData, notes: updatedNotes }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateItem,
  }
}
