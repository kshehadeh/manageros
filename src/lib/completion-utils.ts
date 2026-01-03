/**
 * Centralized completion percentage calculation utilities
 * This file provides a single source of truth for all completion-related calculations
 */

import { COMPLETED_STATUSES, TaskStatus } from './task-status'

/**
 * Interface for objects that have tasks with status information
 */
interface TaskWithStatus {
  status: string
}

/**
 * Interface for objects that have task counts and task arrays
 */
interface TaskContainer {
  _count: {
    tasks: number
  }
  tasks: TaskWithStatus[]
}

/**
 * Calculate completion percentage for a collection of tasks
 * @param tasks Array of tasks with status information
 * @returns Completion percentage (0-100)
 */
function calculateTaskCompletionPercentage(tasks: TaskWithStatus[]): number {
  if (tasks.length === 0) return 0

  // Count completed tasks (status 'done' or 'dropped')
  const completedTasks = tasks.filter(task =>
    COMPLETED_STATUSES.includes(task.status as TaskStatus)
  ).length

  return Math.round((completedTasks / tasks.length) * 100)
}

/**
 * Calculate completion percentage for an initiative or other task container
 * @param container Object with task count and task array
 * @returns Completion percentage (0-100)
 */
export function calculateInitiativeCompletionPercentage(
  container: TaskContainer
): number {
  const totalTasks = container._count.tasks
  if (totalTasks === 0) return 0

  return calculateTaskCompletionPercentage(container.tasks)
}
