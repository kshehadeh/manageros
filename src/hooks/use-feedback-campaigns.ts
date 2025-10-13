import { useState, useEffect, useCallback } from 'react'

export interface FeedbackCampaignListItem {
  id: string
  userId: string
  targetPersonId: string
  templateId: string | null
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
  targetPerson: {
    id: string
    name: string
    email: string
  }
  template: {
    id: string
    name: string
    description?: string
  } | null
  _count: {
    responses: number
    completedResponses: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface FeedbackCampaignsResponse {
  campaigns: FeedbackCampaignListItem[]
  pagination: PaginationInfo
}

interface FeedbackCampaignFilters {
  status?: string
  [key: string]: string | undefined
}

interface UseFeedbackCampaignsOptions {
  page?: number
  limit?: number
  filters?: FeedbackCampaignFilters
  immutableFilters?: FeedbackCampaignFilters
  sort?: string
  enabled?: boolean
}

export function useFeedbackCampaigns({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseFeedbackCampaignsOptions = {}) {
  const [data, setData] = useState<FeedbackCampaignsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedbackCampaigns = useCallback(async () => {
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
        ...Object.fromEntries(
          Object.entries(filters || {}).filter(
            ([_, value]) => value !== undefined && value !== ''
          )
        ),
      })

      // Add sort parameter if provided
      if (sort) {
        searchParams.set('sort', sort)
      }

      // Add immutable filters as JSON-encoded parameter
      if (Object.keys(immutableFilters || {}).length > 0) {
        searchParams.set('immutableFilters', JSON.stringify(immutableFilters))
      }

      const response = await fetch(`/api/feedback-campaigns?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch feedback campaigns')
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
    fetchFeedbackCampaigns()
  }, [fetchFeedbackCampaigns])

  const refetch = useCallback(() => {
    fetchFeedbackCampaigns()
  }, [fetchFeedbackCampaigns])

  const updateCampaign = useCallback(
    (campaignId: string, updates: Partial<FeedbackCampaignListItem>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedCampaigns = prevData.campaigns.map(campaign =>
          campaign.id === campaignId ? { ...campaign, ...updates } : campaign
        )

        return { ...prevData, campaigns: updatedCampaigns }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateCampaign,
  }
}
