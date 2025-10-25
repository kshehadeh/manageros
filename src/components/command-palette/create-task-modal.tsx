'use client'

import { useEffect, useState, useRef } from 'react'
import {
  TaskQuickEditDialog,
  type TaskQuickEditDialogRef,
} from '@/components/tasks/task-quick-edit-dialog'

export function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [initiativeId, setInitiativeId] = useState<string | undefined>(
    undefined
  )
  const taskDialogRef = useRef<TaskQuickEditDialogRef>(null)

  useEffect(() => {
    function onOpen(event: CustomEvent) {
      setOpen(true)
      setInitiativeId(event.detail?.initiativeId)
    }
    window.addEventListener(
      'command:openCreateTaskModal',
      onOpen as EventListener
    )
    return () =>
      window.removeEventListener(
        'command:openCreateTaskModal',
        onOpen as EventListener
      )
  }, [])

  // Focus the textarea when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        taskDialogRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <TaskQuickEditDialog
      ref={taskDialogRef}
      open={open}
      onOpenChange={setOpen}
      initiativeId={initiativeId}
      onSuccess={() => {
        setOpen(false)
        setInitiativeId(undefined)
      }}
    />
  )
}
