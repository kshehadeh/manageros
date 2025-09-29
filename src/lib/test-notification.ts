'use server'

import { createNotification } from '@/lib/actions/notification'

export async function createTestNotification() {
  try {
    const notification = await createNotification({
      title: 'Welcome to ManagerOS!',
      message:
        'This is a test notification to demonstrate the new notification system. You can mark it as read or dismiss it.',
      type: 'info',
    })

    console.log('Test notification created:', notification)
    return notification
  } catch (error) {
    console.error('Failed to create test notification:', error)
    throw error
  }
}
