'use client'

import React from 'react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { MoreHorizontal } from 'lucide-react'
import { useToleranceRules } from '@/hooks/use-tolerance-rules'
import { useToleranceRulesTableSettings } from '@/hooks/use-tolerance-rules-table-settings'
import {
  toggleToleranceRule,
  deleteToleranceRule,
} from '@/lib/actions/tolerance-rules'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import type {
  ToleranceRule,
  Feedback360Config,
  InitiativeCheckInConfig,
  ManagerSpanConfig,
  MaxReportsConfig,
  OneOnOneFrequencyConfig,
  ToleranceRuleConfig,
} from '@/types/tolerance-rule'

// Component for the toggle switch
function ToleranceRuleToggleSwitch({
  rule,
  refetch,
}: {
  rule: ToleranceRule
  refetch: () => void
}) {
  const [toggling, setToggling] = React.useState(false)

  const handleToggle = async (checked: boolean) => {
    setToggling(true)
    try {
      await toggleToleranceRule(rule.id, checked)
      refetch()
    } catch (error) {
      console.error('Error toggling rule:', error)
      alert(error instanceof Error ? error.message : 'Failed to toggle rule')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Switch
      checked={rule.isEnabled}
      onCheckedChange={handleToggle}
      disabled={toggling}
      onClick={e => e.stopPropagation()}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ToleranceRuleItem extends ToleranceRule {}

type ToleranceRulesFilters = {
  search?: string
  ruleType?: string
  isEnabled?: string
}

const getRuleTypeLabel = (ruleType: string) => {
  switch (ruleType) {
    case 'one_on_one_frequency':
      return '1:1 Frequency'
    case 'initiative_checkin':
      return 'Initiative Check-In'
    case 'feedback_360':
      return '360 Feedback'
    case 'manager_span':
      return 'Manager Span'
    case 'max_reports':
      return 'Max Reports'
    default:
      return ruleType
  }
}

const getConfigSummary = (rule: ToleranceRule) => {
  const config = rule.config as ToleranceRuleConfig
  switch (rule.ruleType) {
    case 'one_on_one_frequency': {
      const oneOnOneConfig = config as OneOnOneFrequencyConfig
      return `Warning: ${oneOnOneConfig.warningThresholdDays} days, Urgent: ${oneOnOneConfig.urgentThresholdDays} days`
    }
    case 'initiative_checkin': {
      const initiativeConfig = config as InitiativeCheckInConfig
      return `Warning: ${initiativeConfig.warningThresholdDays} days`
    }
    case 'feedback_360': {
      const feedbackConfig = config as Feedback360Config
      return `Warning: ${feedbackConfig.warningThresholdMonths} months`
    }
    case 'manager_span': {
      const managerConfig = config as ManagerSpanConfig
      return `Max: ${managerConfig.maxDirectReports} reports`
    }
    case 'max_reports': {
      const maxReportsConfig = config as MaxReportsConfig
      return `Max: ${maxReportsConfig.maxReports} reports`
    }
    default:
      return 'N/A'
  }
}

export const toleranceRulesDataTableConfig: DataTableConfig<
  ToleranceRuleItem,
  ToleranceRulesFilters
> = {
  // Entity identification
  entityType: 'toleranceRule',
  entityName: 'Tolerance Rule',
  entityNamePlural: 'ToleranceRules',

  // Get ID from entity
  getId: (entity: ToleranceRuleItem) => entity.id,

  // Data fetching
  useDataHook: useToleranceRules,

  // Settings management
  useSettingsHook: useToleranceRulesTableSettings,

  onEdit: (router, params) => {
    router.push(`/organization/settings/tolerance-rules/${params.entityId}`)
  },

  onViewDetails: (router, params) => {
    router.push(`/organization/settings/tolerance-rules/${params.entityId}`)
  },

  onRowClick: (router, ruleId) => {
    router.push(`/organization/settings/tolerance-rules/${ruleId}`)
  },

  // Column definitions
  createColumns: ({ onButtonClick, grouping, visibleColumns, refetch }) => {
    const isGroupedByType = grouping && grouping.includes('ruleType')
    const isGroupedByStatus = grouping && grouping.includes('isEnabled')

    return [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        minSize: 200,
        maxSize: 400,
        cell: ({ row }) => {
          const rule = row.original
          return (
            <div className='flex flex-col gap-1'>
              <Link
                href={`/organization/settings/tolerance-rules/${rule.id}`}
                className='font-medium text-primary hover:text-highlight/90 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {rule.name}
              </Link>
              {rule.description && (
                <span className='text-xs text-muted-foreground line-clamp-1'>
                  {rule.description}
                </span>
              )}
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('name') === false,
        },
      },
      {
        id: 'ruleType',
        header: 'Type',
        accessorFn: row => getRuleTypeLabel(row.ruleType),
        cell: ({ row }) => {
          const rule = row.original
          return (
            <Badge variant='outline'>{getRuleTypeLabel(rule.ruleType)}</Badge>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('ruleType') === false ||
            Boolean(isGroupedByType),
        },
      },
      {
        id: 'configuration',
        header: 'Configuration',
        accessorFn: row => getConfigSummary(row),
        cell: ({ row }) => {
          const rule = row.original
          return (
            <span className='text-sm text-muted-foreground'>
              {getConfigSummary(rule)}
            </span>
          )
        },
        size: 250,
        minSize: 200,
        maxSize: 400,
        meta: {
          hidden: visibleColumns?.includes('configuration') === false,
        },
      },
      {
        id: 'isEnabled',
        header: 'Status',
        accessorFn: row => (row.isEnabled ? 'Enabled' : 'Disabled'),
        cell: ({ row }) => {
          const rule = row.original
          return <ToleranceRuleToggleSwitch rule={rule} refetch={refetch} />
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
        meta: {
          hidden:
            visibleColumns?.includes('isEnabled') === false ||
            Boolean(isGroupedByStatus),
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const rule = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, rule.id)
                }}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          hidden: false,
        },
      },
    ]
  },

  // Actions
  deleteAction: async (id: string) => {
    await deleteToleranceRule(id)
  },

  // UI configuration
  searchPlaceholder: 'Search tolerance rules...',
  emptyMessage: 'No tolerance rules found',
  loadingMessage: 'Loading tolerance rules...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'ruleType', label: 'Group by type' },
    { value: 'isEnabled', label: 'Group by status' },
  ],

  sortOptions: [
    { value: 'name', label: 'Name' },
    { value: 'ruleType', label: 'Type' },
    { value: 'isEnabled', label: 'Status' },
    { value: 'createdAt', label: 'Created' },
  ],
}
