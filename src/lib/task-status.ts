/**
 * Centralized task status types and utilities
 * This file provides a single source of truth for all task status-related functionality
 */

import type { BadgeVariant } from '@/components/ui/badge'

// Task status enum - matches the database schema
export const TASK_STATUS = {
  TODO: 'todo',
  DOING: 'doing',
  BLOCKED: 'blocked',
  DONE: 'done',
  DROPPED: 'dropped',
} as const

// Type for task status values
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

// Human-readable labels for each status
const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUS.TODO]: 'To Do',
  [TASK_STATUS.DOING]: 'Doing',
  [TASK_STATUS.BLOCKED]: 'Blocked',
  [TASK_STATUS.DONE]: 'Done',
  [TASK_STATUS.DROPPED]: 'Dropped',
}

// Badge variants for each status
const TASK_STATUS_VARIANTS: Record<TaskStatus, BadgeVariant> = {
  [TASK_STATUS.TODO]: 'secondary',
  [TASK_STATUS.DOING]: 'warning',
  [TASK_STATUS.BLOCKED]: 'error',
  [TASK_STATUS.DONE]: 'success',
  [TASK_STATUS.DROPPED]: 'neutral',
}

// Alternative variants for different UI contexts
const TASK_STATUS_UI_VARIANTS: Record<
  TaskStatus,
  'neutral' | 'warning' | 'error' | 'success'
> = {
  [TASK_STATUS.TODO]: 'neutral',
  [TASK_STATUS.DOING]: 'warning',
  [TASK_STATUS.BLOCKED]: 'error',
  [TASK_STATUS.DONE]: 'success',
  [TASK_STATUS.DROPPED]: 'neutral',
}

// Array of all task statuses for iteration
export const ALL_TASK_STATUSES: TaskStatus[] = Object.values(TASK_STATUS)

// Array of task statuses that indicate work in progress
const IN_PROGRESS_STATUSES: TaskStatus[] = [
  TASK_STATUS.DOING,
  TASK_STATUS.BLOCKED,
]

// Array of task statuses that indicate completion
export const COMPLETED_STATUSES: TaskStatus[] = [
  TASK_STATUS.DONE,
  TASK_STATUS.DROPPED,
]

// Array of task statuses that indicate active work (not completed)
export const ACTIVE_STATUSES: TaskStatus[] = [
  TASK_STATUS.TODO,
  TASK_STATUS.DOING,
  TASK_STATUS.BLOCKED,
]

// Array of task statuses in logical workflow order for sorting/grouping
const TASK_STATUS_SORT_ORDER: TaskStatus[] = [
  TASK_STATUS.TODO,
  TASK_STATUS.DOING,
  TASK_STATUS.BLOCKED,
  TASK_STATUS.DROPPED,
  TASK_STATUS.DONE,
]

// Utility functions
export const taskStatusUtils = {
  /**
   * Get the human-readable label for a task status
   */
  getLabel: (status: TaskStatus): string => TASK_STATUS_LABELS[status],

  /**
   * Get the badge variant for a task status
   */
  getVariant: (status: TaskStatus): BadgeVariant =>
    TASK_STATUS_VARIANTS[status],

  /**
   * Get the UI variant for a task status
   */
  getUIVariant: (
    status: TaskStatus
  ): 'neutral' | 'warning' | 'error' | 'success' =>
    TASK_STATUS_UI_VARIANTS[status],

  /**
   * Check if a status indicates work in progress
   */
  isInProgress: (status: TaskStatus): boolean =>
    IN_PROGRESS_STATUSES.includes(status),

  /**
   * Check if a status indicates completion
   */
  isCompleted: (status: TaskStatus): boolean =>
    COMPLETED_STATUSES.includes(status),

  /**
   * Check if a status indicates active work (not completed)
   */
  isActive: (status: TaskStatus): boolean => ACTIVE_STATUSES.includes(status),

  /**
   * Get all statuses as options for select elements
   */
  getSelectOptions: () =>
    ALL_TASK_STATUSES.map(status => ({
      value: status,
      label: TASK_STATUS_LABELS[status],
    })),

  /**
   * Validate if a string is a valid task status
   */
  isValid: (status: string): status is TaskStatus =>
    ALL_TASK_STATUSES.includes(status as TaskStatus),

  /**
   * Get the sort order index for a task status (lower = earlier in workflow)
   */
  getSortOrder: (status: TaskStatus): number => {
    const index = TASK_STATUS_SORT_ORDER.indexOf(status)
    return index === -1 ? 999 : index // Unknown statuses go to the end
  },
}

// Default task status
export const DEFAULT_TASK_STATUS: TaskStatus = TASK_STATUS.TODO
