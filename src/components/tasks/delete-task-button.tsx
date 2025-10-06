'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTask } from '@/lib/actions/task'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'

interface DeleteTaskButtonProps {
  taskId: string
}

export function DeleteTaskButton({ taskId }: DeleteTaskButtonProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handleDelete() {
    try {
      await deleteTask(taskId)
      toast.success('Task deleted successfully')
      router.push('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete task'
      )
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        variant='outline'
        size='icon'
      >
        <Trash2 className='w-4 h-4' />
        <span className='sr-only'>Delete Task</span>
      </Button>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Task'
        entityName='task'
      />
    </>
  )
}
