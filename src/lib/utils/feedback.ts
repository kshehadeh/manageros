/**
 * Utility functions for feedback-related operations
 */

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
