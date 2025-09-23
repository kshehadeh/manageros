'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTask } from '@/lib/actions'

interface DeleteTaskButtonProps {
  taskId: string
}

export function DeleteTaskButton({ taskId }: DeleteTaskButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteTask(taskId)
      // Redirect to tasks list page after successful deletion
      router.push('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Error deleting task. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className='flex items-center gap-2'>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant='destructive'
          size='default'
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          variant='outline'
          size='default'
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => setShowConfirm(true)} variant='outline' size='icon'>
      <Trash2 className='w-4 h-4' />
      <span className='sr-only'>Delete Task</span>
    </Button>
  )
}
