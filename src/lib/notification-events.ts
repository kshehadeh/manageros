/**
 * Notification event utilities
 * Used to coordinate updates between notification components
 */

export const NOTIFICATION_UPDATED_EVENT = 'notification-updated'

/**
 * Dispatch a notification update event
 * This triggers all notification components to refresh their data
 */
export function dispatchNotificationUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATED_EVENT))
  }
}
