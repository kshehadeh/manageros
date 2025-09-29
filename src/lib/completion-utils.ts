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
export function calculateTaskCompletionPercentage(
  tasks: TaskWithStatus[]
): number {
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

/**
 * Count completed tasks from a collection
 * @param tasks Array of tasks with status information
 * @returns Number of completed tasks
 */
export function countCompletedTasks(tasks: TaskWithStatus[]): number {
  return tasks.filter(task =>
    COMPLETED_STATUSES.includes(task.status as TaskStatus)
  ).length
}

/**
 * Count active (incomplete) tasks from a collection
 * @param tasks Array of tasks with status information
 * @returns Number of active tasks
 */
export function countActiveTasks(tasks: TaskWithStatus[]): number {
  return tasks.filter(
    task => !COMPLETED_STATUSES.includes(task.status as TaskStatus)
  ).length
}

/**
 * Get completion statistics for a collection of tasks
 * @param tasks Array of tasks with status information
 * @returns Object with completion statistics
 */
export function getTaskCompletionStats(tasks: TaskWithStatus[]) {
  const total = tasks.length
  const completed = countCompletedTasks(tasks)
  const active = countActiveTasks(tasks)
  const percentage = calculateTaskCompletionPercentage(tasks)

  return {
    total,
    completed,
    active,
    percentage,
  }
}

/**
 * Utility functions for completion calculations
 */
export const completionUtils = {
  /**
   * Calculate completion percentage for tasks
   */
  calculatePercentage: calculateTaskCompletionPercentage,

  /**
   * Calculate completion percentage for initiatives
   */
  calculateInitiativePercentage: calculateInitiativeCompletionPercentage,

  /**
   * Count completed tasks
   */
  countCompleted: countCompletedTasks,

  /**
   * Count active tasks
   */
  countActive: countActiveTasks,

  /**
   * Get comprehensive completion statistics
   */
  getStats: getTaskCompletionStats,

  /**
   * Check if a task is completed
   */
  isTaskCompleted: (task: TaskWithStatus): boolean =>
    COMPLETED_STATUSES.includes(task.status as TaskStatus),

  /**
   * Check if a task is active (not completed)
   */
  isTaskActive: (task: TaskWithStatus): boolean =>
    !COMPLETED_STATUSES.includes(task.status as TaskStatus),
}
