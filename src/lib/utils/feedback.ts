/**
 * Utility functions for feedback-related operations
 */

export type FeedbackKind = 'praise' | 'concern' | 'note'

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'

/**
 * Get the display label for a feedback kind
 */
export function getKindLabel(kind: string): string {
  switch (kind) {
    case 'praise':
      return 'Praise'
    case 'concern':
      return 'Concern'
    case 'note':
      return 'Note'
    default:
      return 'Unknown'
  }
}

/**
 * Get the badge variant for a feedback kind
 */
export function getKindVariant(kind: string): BadgeVariant {
  switch (kind) {
    case 'praise':
      return 'success'
    case 'concern':
      return 'error'
    case 'note':
      return 'info'
    default:
      return 'neutral'
  }
}

/**
 * Get the icon for a feedback kind
 */
export function getKindIcon(kind: string): string {
  switch (kind) {
    case 'praise':
      return '👍'
    case 'concern':
      return '⚠️'
    case 'note':
      return '📝'
    default:
      return '💬'
  }
}
