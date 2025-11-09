import { useState, useEffect, useCallback } from 'react'

interface OrganizationMember {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  person?: {
    id: string
    name: string
    role: string | null
    status: string
    team?: {
      id: string
      name: string
    } | null
  } | null
}

interface OrganizationMembersFilters {
  search?: string
  role?: string
}

interface UseOrganizationMembersOptions {
  filters?: OrganizationMembersFilters
  immutableFilters?: OrganizationMembersFilters
  sort?: string
  enabled?: boolean
}

export function useOrganizationMembers({
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseOrganizationMembersOptions = {}) {
  const [data, setData] = useState<{ members: OrganizationMember[] } | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Merge filters with immutable filters (immutable takes precedence)
      const mergedFilters = {
        ...filters,
        ...immutableFilters,
      }

      // Convert filters to search params
      const searchParams = new URLSearchParams()

      if (mergedFilters.search) {
        searchParams.set('search', mergedFilters.search)
      }

      if (mergedFilters.role) {
        searchParams.set('role', mergedFilters.role)
      }

      // Add sort parameter if provided
      if (sort) {
        searchParams.set('sort', sort)
      }

      const response = await fetch(`/api/organization/members?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || 'Failed to fetch organization members'
        )
      }

      const result = await response.json()
      // Return data in the format expected by GenericDataTable
      setData({ members: result.members || [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [filters, immutableFilters, sort, enabled])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const refetch = useCallback(() => {
    fetchMembers()
  }, [fetchMembers])

  // Listen for member deletion events to automatically refresh the list
  useEffect(() => {
    const handleMemberDeleted = () => {
      refetch()
    }

    window.addEventListener('organization-member:deleted', handleMemberDeleted)

    return () => {
      window.removeEventListener(
        'organization-member:deleted',
        handleMemberDeleted
      )
    }
  }, [refetch])

  const updateMember = useCallback(
    (memberId: string, updates: Partial<OrganizationMember>) => {
      setData(prevData => {
        if (!prevData) return prevData

        return {
          members: prevData.members.map(member =>
            member.id === memberId ? { ...member, ...updates } : member
          ),
        }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateMember,
  }
}
