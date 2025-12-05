'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { toleranceRulesDataTableConfig } from './tolerance-rules-data-table-config'

interface ToleranceRulesDataTableProps {
  onToleranceRuleUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    ruleType?: string
    isEnabled?: string
  }
}

export function ToleranceRulesDataTable(props: ToleranceRulesDataTableProps) {
  return <GenericDataTable config={toleranceRulesDataTableConfig} {...props} />
}
