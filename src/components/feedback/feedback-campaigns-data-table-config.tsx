'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, MessageSquare } from 'lucide-react'
import type { FeedbackCampaignListItem } from '@/hooks/use-feedback-campaigns'
import { useFeedbackCampaigns } from '@/hooks/use-feedback-campaigns'
import { useFeedbackCampaignsTableSettings } from '@/hooks/use-feedback-campaigns-table-settings'
import { deleteFeedbackCampaign } from '@/lib/actions/feedback-campaign'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import { format } from 'date-fns'
import { FeedbackCampaignStatusBadge } from '@/components/feedback/feedback-campaign-status-badge'
import { ColumnDef } from '@tanstack/react-table'

interface FeedbackCampaignFilters extends Record<string, string | undefined> {
  search?: string
  status?: string
}

export const feedbackCampaignsDataTableConfig: DataTableConfig<
  FeedbackCampaignListItem,
  FeedbackCampaignFilters
> = {
  // Entity identification
  entityType: 'feedbackCampaign',
  entityName: 'Feedback Campaign',
  entityNamePlural: 'Campaigns',

  // Data fetching
  useDataHook: useFeedbackCampaigns,

  // Settings management
  useSettingsHook: useFeedbackCampaignsTableSettings,

  // Column definitions
  createColumns: ({ onButtonClick, visibleColumns }) => {
    return [
      {
        id: 'targetPerson',
        header: 'Target Person',
        accessorFn: row => row.targetPerson.name,
        cell: ({ row }) => {
          const campaign = row.original
          return (
            <div className='flex flex-col gap-1'>
              <Link
                href={`/people/${campaign.targetPerson.id}`}
                className='text-primary hover:text-highlight/90 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {campaign.targetPerson.name}
              </Link>
              {campaign.template && (
                <div className='text-xs text-muted-foreground'>
                  {campaign.template.name}
                </div>
              )}
            </div>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 300,
        meta: {
          hidden: visibleColumns?.includes('targetPerson') === false,
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: row => row.status,
        cell: ({ row }) => {
          const campaign = row.original
          const now = new Date()
          const startDate = new Date(campaign.startDate)
          const endDate = new Date(campaign.endDate)
          const isCurrentlyActive =
            campaign.status === 'active' && now >= startDate && now <= endDate
          const isPending = campaign.status === 'active' && now < startDate

          return (
            <FeedbackCampaignStatusBadge
              status={campaign.status}
              isCurrentlyActive={isCurrentlyActive}
              isPending={isPending}
            />
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: visibleColumns?.includes('status') === false,
        },
      },
      {
        id: 'dates',
        header: 'Dates',
        accessorFn: row => row.startDate,
        cell: ({ row }) => {
          const campaign = row.original
          const startDate = new Date(campaign.startDate)
          const endDate = new Date(campaign.endDate)

          return (
            <div className='flex flex-col gap-1 text-sm'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-3 w-3 text-muted-foreground' />
                <span className='text-muted-foreground'>Start:</span>
                <span>{format(startDate, 'MMM d, yyyy')}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='h-3 w-3 text-muted-foreground' />
                <span className='text-muted-foreground'>End:</span>
                <span>{format(endDate, 'MMM d, yyyy')}</span>
              </div>
            </div>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 250,
        meta: {
          hidden: visibleColumns?.includes('dates') === false,
        },
      },
      {
        id: 'responses',
        header: 'Responses',
        accessorFn: row => row._count.responses,
        cell: ({ row }) => {
          const campaign = row.original
          const totalResponses = campaign._count.responses
          const completedResponses = campaign._count.completedResponses

          return (
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <MessageSquare className='h-3 w-3 text-muted-foreground' />
                <span className='text-sm'>
                  {completedResponses} / {totalResponses} completed
                </span>
              </div>
            </div>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: visibleColumns?.includes('responses') === false,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const campaign = row.original
          return (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
              onClick={e => {
                e.stopPropagation()
                onButtonClick(e, campaign.id)
              }}
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        meta: {
          hidden: false,
        },
      },
    ] as ColumnDef<FeedbackCampaignListItem>[]
  },

  // Actions
  deleteAction: deleteFeedbackCampaign,

  onViewDetails: (router, { entityId, entity }) => {
    const campaign = entity as FeedbackCampaignListItem
    router.push(
      `/people/${campaign.targetPerson.id}/feedback-campaigns/${entityId}`
    )
  },

  onEdit: (router, { entityId, entity }) => {
    const campaign = entity as FeedbackCampaignListItem
    router.push(
      `/people/${campaign.targetPerson.id}/feedback-campaigns/${entityId}/edit`
    )
  },

  onRowClick: (router, entityId, entity) => {
    const campaign = entity as FeedbackCampaignListItem
    router.push(
      `/people/${campaign.targetPerson.id}/feedback-campaigns/${entityId}`
    )
  },

  // UI configuration
  searchPlaceholder: 'Search campaigns...',
  emptyMessage: 'No feedback campaigns found.',
  loadingMessage: 'Loading feedback campaigns...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'status', label: 'By Status' },
    { value: 'targetPerson', label: 'By Target Person' },
  ],

  sortOptions: [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'endDate', label: 'End Date' },
    { value: 'status', label: 'Status' },
    { value: 'targetPerson', label: 'Target Person' },
  ],

  // Global filter function
  globalFilterFn: (row, columnId, filterValue) => {
    const campaign = row.original
    const search = filterValue.toLowerCase()

    // Search in target person name
    if (campaign.targetPerson.name.toLowerCase().includes(search)) {
      return true
    }

    // Search in template name
    if (
      campaign.template?.name &&
      campaign.template.name.toLowerCase().includes(search)
    ) {
      return true
    }

    // Search in status
    if (campaign.status.toLowerCase().includes(search)) {
      return true
    }

    return false
  },
}
