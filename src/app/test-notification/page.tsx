import { createTestNotification } from '@/lib/test-notification'
import { Button } from '@/components/ui/button'

export default function TestNotificationPage() {
  async function handleCreateTestNotification() {
    'use server'
    try {
      await createTestNotification()
    } catch (error) {
      console.error('Failed to create test notification:', error)
    }
  }

  return (
    <div className='container mx-auto py-6'>
      <h1 className='text-2xl font-bold mb-4'>Test Notification System</h1>
      <p className='text-muted-foreground mb-6'>
        Click the button below to create a test notification. Check the bell
        icon in the top right corner to see it.
      </p>

      <form action={handleCreateTestNotification}>
        <Button type='submit'>Create Test Notification</Button>
      </form>
    </div>
  )
}
