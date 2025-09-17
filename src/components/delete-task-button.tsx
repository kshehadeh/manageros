'use client'

import { useState } from 'react'
import { deleteTask } from '@/lib/actions'

interface DeleteTaskButtonProps {
  taskId: string
}

export function DeleteTaskButton({ taskId }: DeleteTaskButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteTask(taskId)
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
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className='btn bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className='btn bg-neutral-700 hover:bg-neutral-600'
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className='btn bg-red-600 hover:bg-red-700'
    >
      Delete Task
    </button>
  )
}
