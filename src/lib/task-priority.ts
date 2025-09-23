/**
 * Centralized task priority types and utilities
 * This file provides a single source of truth for all task priority-related functionality
 */

// Task priority enum - matches the database schema (1-5 scale)
export const TASK_PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  VERY_LOW: 5,
} as const

// Type for task priority values
export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY]

// Human-readable labels for each priority
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.CRITICAL]: 'Critical',
  [TASK_PRIORITY.HIGH]: 'High',
  [TASK_PRIORITY.MEDIUM]: 'Medium',
  [TASK_PRIORITY.LOW]: 'Low',
  [TASK_PRIORITY.VERY_LOW]: 'Very Low',
}

// Short labels for compact display
export const TASK_PRIORITY_SHORT_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.CRITICAL]: 'P1',
  [TASK_PRIORITY.HIGH]: 'P2',
  [TASK_PRIORITY.MEDIUM]: 'P3',
  [TASK_PRIORITY.LOW]: 'P4',
  [TASK_PRIORITY.VERY_LOW]: 'P5',
}

// CSS class variants for each priority (for badges, buttons, etc.)
export const TASK_PRIORITY_VARIANTS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.CRITICAL]: 'destructive',
  [TASK_PRIORITY.HIGH]: 'secondary',
  [TASK_PRIORITY.MEDIUM]: 'default',
  [TASK_PRIORITY.LOW]: 'outline',
  [TASK_PRIORITY.VERY_LOW]: 'secondary',
}

// Alternative variants for different UI contexts (matching task-status.ts pattern)
export const TASK_PRIORITY_UI_VARIANTS: Record<
  TaskPriority,
  'neutral' | 'warning' | 'error' | 'success'
> = {
  [TASK_PRIORITY.CRITICAL]: 'error',
  [TASK_PRIORITY.HIGH]: 'warning',
  [TASK_PRIORITY.MEDIUM]: 'neutral',
  [TASK_PRIORITY.LOW]: 'neutral',
  [TASK_PRIORITY.VERY_LOW]: 'neutral',
}

// RAG (Red-Amber-Green) color classes for priority display
export const TASK_PRIORITY_RAG_VARIANTS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.CRITICAL]: 'rag-red',
  [TASK_PRIORITY.HIGH]: 'rag-amber',
  [TASK_PRIORITY.MEDIUM]: 'badge',
  [TASK_PRIORITY.LOW]: 'badge',
  [TASK_PRIORITY.VERY_LOW]: 'badge',
}

// Array of all task priorities for iteration
export const ALL_TASK_PRIORITIES: TaskPriority[] = Object.values(TASK_PRIORITY)

// Array of high priority tasks (Critical and High)
export const HIGH_PRIORITY_TASKS: TaskPriority[] = [
  TASK_PRIORITY.CRITICAL,
  TASK_PRIORITY.HIGH,
]

// Array of low priority tasks (Low and Very Low)
export const LOW_PRIORITY_TASKS: TaskPriority[] = [
  TASK_PRIORITY.LOW,
  TASK_PRIORITY.VERY_LOW,
]

// Array of urgent priorities (Critical only)
export const URGENT_PRIORITIES: TaskPriority[] = [TASK_PRIORITY.CRITICAL]

// Utility functions
export const taskPriorityUtils = {
  /**
   * Get the human-readable label for a task priority
   */
  getLabel: (priority: TaskPriority): string => TASK_PRIORITY_LABELS[priority],

  /**
   * Get the short label for a task priority
   */
  getShortLabel: (priority: TaskPriority): string =>
    TASK_PRIORITY_SHORT_LABELS[priority],

  /**
   * Get the CSS variant class for a task priority
   */
  getVariant: (priority: TaskPriority): string =>
    TASK_PRIORITY_VARIANTS[priority],

  /**
   * Get the UI variant for a task priority
   */
  getUIVariant: (
    priority: TaskPriority
  ): 'neutral' | 'warning' | 'error' | 'success' =>
    TASK_PRIORITY_UI_VARIANTS[priority],

  /**
   * Get the RAG variant for a task priority
   */
  getRAGVariant: (priority: TaskPriority): string =>
    TASK_PRIORITY_RAG_VARIANTS[priority],

  /**
   * Check if a priority is high priority
   */
  isHighPriority: (priority: TaskPriority): boolean =>
    HIGH_PRIORITY_TASKS.includes(priority),

  /**
   * Check if a priority is low priority
   */
  isLowPriority: (priority: TaskPriority): boolean =>
    LOW_PRIORITY_TASKS.includes(priority),

  /**
   * Check if a priority is urgent
   */
  isUrgent: (priority: TaskPriority): boolean =>
    URGENT_PRIORITIES.includes(priority),

  /**
   * Get all priorities as options for select elements
   */
  getSelectOptions: () =>
    ALL_TASK_PRIORITIES.map(priority => ({
      value: priority,
      label: `${priority} - ${TASK_PRIORITY_LABELS[priority]}`,
    })),

  /**
   * Get all priorities as options for select elements with short labels
   */
  getSelectOptionsShort: () =>
    ALL_TASK_PRIORITIES.map(priority => ({
      value: priority,
      label: `${priority} - ${TASK_PRIORITY_LABELS[priority]}`,
      shortLabel: TASK_PRIORITY_SHORT_LABELS[priority],
    })),

  /**
   * Validate if a number is a valid task priority
   */
  isValid: (priority: number): priority is TaskPriority =>
    ALL_TASK_PRIORITIES.includes(priority as TaskPriority),

  /**
   * Get priority from a number, with fallback to default
   */
  fromNumber: (priority: number): TaskPriority => {
    if (taskPriorityUtils.isValid(priority)) {
      return priority
    }
    return DEFAULT_TASK_PRIORITY
  },
}

// Type guard function
export function isTaskPriority(priority: number): priority is TaskPriority {
  return taskPriorityUtils.isValid(priority)
}

// Default task priority
export const DEFAULT_TASK_PRIORITY: TaskPriority = TASK_PRIORITY.HIGH

// Priority comparison functions
export const priorityComparison = {
  /**
   * Compare two priorities (lower number = higher priority)
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  compare: (a: TaskPriority, b: TaskPriority): number => {
    if (a < b) return -1
    if (a > b) return 1
    return 0
  },

  /**
   * Check if priority a is higher than priority b
   */
  isHigher: (a: TaskPriority, b: TaskPriority): boolean => a < b,

  /**
   * Check if priority a is lower than priority b
   */
  isLower: (a: TaskPriority, b: TaskPriority): boolean => a > b,

  /**
   * Sort priorities from highest to lowest (1 to 5)
   */
  sortByPriority: (priorities: TaskPriority[]): TaskPriority[] =>
    [...priorities].sort(priorityComparison.compare),
}
