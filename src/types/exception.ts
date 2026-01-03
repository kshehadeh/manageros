/**
 * Types for exceptions
 */

export type ExceptionSeverity = 'warning' | 'urgent'

export type ExceptionStatus = 'active' | 'acknowledged' | 'ignored' | 'resolved'

export type ExceptionEntityType =
  | 'Person'
  | 'Initiative'
  | 'OneOnOne'
  | 'FeedbackCampaign'

export interface Exception {
  id: string
  ruleId: string
  organizationId: string
  severity: ExceptionSeverity
  entityType: ExceptionEntityType
  entityId: string
  message: string
  metadata: Record<string, unknown> | null
  notificationId: string | null
  status: ExceptionStatus
  acknowledgedAt: Date | null
  ignoredAt: Date | null
  resolvedAt: Date | null
  acknowledgedBy: string | null
  ignoredBy: string | null
  resolvedBy: string | null
  createdAt: Date
  updatedAt: Date
  rule?: {
    id: string
    name: string
    ruleType: string
  }
  notification?: {
    id: string
    title: string
    message: string
    type: string
  }
}

export interface CreateExceptionInput {
  ruleId: string
  organizationId: string
  severity: ExceptionSeverity
  entityType: ExceptionEntityType
  entityId: string
  message: string
  metadata?: Record<string, unknown>
}

export interface ExceptionFilters {
  status?: ExceptionStatus
  severity?: ExceptionSeverity
  ruleType?: string
  ruleId?: string
  entityType?: ExceptionEntityType
  entityId?: string
}
