/**
 * Centralized initiative status types and utilities
 * This file provides a single source of truth for all initiative status-related functionality
 */

import type { BadgeVariant } from '@/components/ui/badge'

// Initiative status enum - matches the database schema
export const INITIATIVE_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  DONE: 'done',
  CANCELED: 'canceled',
} as const

// Type for initiative status values
export type InitiativeStatus =
  (typeof INITIATIVE_STATUS)[keyof typeof INITIATIVE_STATUS]

// All possible initiative statuses
export const ALL_INITIATIVE_STATUSES: InitiativeStatus[] = [
  INITIATIVE_STATUS.PLANNED,
  INITIATIVE_STATUS.IN_PROGRESS,
  INITIATIVE_STATUS.PAUSED,
  INITIATIVE_STATUS.DONE,
  INITIATIVE_STATUS.CANCELED,
]

// Human-readable labels for each status
export const INITIATIVE_STATUS_LABELS: Record<InitiativeStatus, string> = {
  [INITIATIVE_STATUS.PLANNED]: 'Planned',
  [INITIATIVE_STATUS.IN_PROGRESS]: 'In Progress',
  [INITIATIVE_STATUS.PAUSED]: 'Paused',
  [INITIATIVE_STATUS.DONE]: 'Done',
  [INITIATIVE_STATUS.CANCELED]: 'Canceled',
}

// Badge variants for each status
export const INITIATIVE_STATUS_VARIANTS: Record<
  InitiativeStatus,
  BadgeVariant
> = {
  [INITIATIVE_STATUS.PLANNED]: 'secondary',
  [INITIATIVE_STATUS.IN_PROGRESS]: 'default',
  [INITIATIVE_STATUS.PAUSED]: 'secondary',
  [INITIATIVE_STATUS.DONE]: 'success',
  [INITIATIVE_STATUS.CANCELED]: 'destructive',
}

// UI variants for Badge component
export const INITIATIVE_STATUS_UI_VARIANTS: Record<
  InitiativeStatus,
  'neutral' | 'warning' | 'error' | 'success'
> = {
  [INITIATIVE_STATUS.PLANNED]: 'neutral',
  [INITIATIVE_STATUS.IN_PROGRESS]: 'warning',
  [INITIATIVE_STATUS.PAUSED]: 'neutral',
  [INITIATIVE_STATUS.DONE]: 'success',
  [INITIATIVE_STATUS.CANCELED]: 'error',
}

// Status groups for filtering and organization
export const IN_PROGRESS_STATUSES: InitiativeStatus[] = [
  INITIATIVE_STATUS.IN_PROGRESS,
]

export const COMPLETED_STATUSES: InitiativeStatus[] = [
  INITIATIVE_STATUS.DONE,
  INITIATIVE_STATUS.CANCELED,
]

export const ACTIVE_STATUSES: InitiativeStatus[] = [
  INITIATIVE_STATUS.PLANNED,
  INITIATIVE_STATUS.IN_PROGRESS,
  INITIATIVE_STATUS.PAUSED,
]

// Utility functions
export const initiativeStatusUtils = {
  /**
   * Get the human-readable label for an initiative status
   */
  getLabel: (status: InitiativeStatus): string =>
    INITIATIVE_STATUS_LABELS[status],

  /**
   * Get the badge variant for an initiative status
   */
  getVariant: (status: InitiativeStatus): BadgeVariant =>
    INITIATIVE_STATUS_VARIANTS[status],

  /**
   * Get the UI variant for an initiative status
   */
  getUIVariant: (
    status: InitiativeStatus
  ): 'neutral' | 'warning' | 'error' | 'success' =>
    INITIATIVE_STATUS_UI_VARIANTS[status],

  /**
   * Check if a status indicates work in progress
   */
  isInProgress: (status: InitiativeStatus): boolean =>
    IN_PROGRESS_STATUSES.includes(status),

  /**
   * Check if a status indicates completion
   */
  isCompleted: (status: InitiativeStatus): boolean =>
    COMPLETED_STATUSES.includes(status),

  /**
   * Check if a status indicates active work (not completed)
   */
  isActive: (status: InitiativeStatus): boolean =>
    ACTIVE_STATUSES.includes(status),

  /**
   * Get all statuses as options for select elements
   */
  getSelectOptions: () =>
    ALL_INITIATIVE_STATUSES.map(status => ({
      value: status,
      label: INITIATIVE_STATUS_LABELS[status],
    })),

  /**
   * Validate if a string is a valid initiative status
   */
  isValid: (status: string): status is InitiativeStatus =>
    ALL_INITIATIVE_STATUSES.includes(status as InitiativeStatus),
}

// Type guard function
export function isInitiativeStatus(status: string): status is InitiativeStatus {
  return initiativeStatusUtils.isValid(status)
}
