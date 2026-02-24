/**
 * Web Push helpers for task reminder notifications.
 * Requires env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and optionally VAPID_MAILTO (e.g. mailto:support@example.com).
 */

import webpush from 'web-push'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const mailto = process.env.VAPID_MAILTO ?? 'mailto:support@manageros.app'
  if (!publicKey || !privateKey) {
    throw new Error(
      'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set for Web Push'
    )
  }
  webpush.setVapidDetails(mailto, publicKey, privateKey)
  vapidConfigured = true
}

export interface StoredPushSubscription {
  endpoint: string
  auth: string
  p256dh: string
}

export interface TaskReminderPushPayload {
  type: 'task-reminder'
  deliveryId: string
  taskId: string
  taskTitle: string
  taskDueDate: string
}

/**
 * Send a Web Push notification to a subscription.
 * Subscription format matches what we store (endpoint, auth, p256dh).
 */
export async function sendPushNotification(
  subscription: StoredPushSubscription,
  payload: TaskReminderPushPayload
): Promise<boolean> {
  ensureVapid()
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
  }
  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24,
    })
    return true
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const code = (err as { statusCode: number }).statusCode
      if (code === 410 || code === 404) {
        return false
      }
    }
    throw err
  }
}

/**
 * Generate VAPID keys (run once, then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env).
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys()
}
