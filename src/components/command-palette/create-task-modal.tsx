'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  QuickTaskForm,
  type QuickTaskFormRef,
} from '@/components/tasks/quick-task-form'

export function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [initiativeId, setInitiativeId] = useState<string | undefined>(
    undefined
  )
  const quickTaskFormRef = useRef<QuickTaskFormRef>(null)

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
        quickTaskFormRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='md:max-w-[50vw] max-w-full'>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <QuickTaskForm
          ref={quickTaskFormRef}
          onSuccess={() => {
            setOpen(false)
            setInitiativeId(undefined)
          }}
          initiativeId={initiativeId}
        />
      </DialogContent>
    </Dialog>
  )
}
