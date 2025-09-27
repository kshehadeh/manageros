'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QuickTaskForm } from '@/components/quick-task-form'

export function CreateTaskModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onOpen() {
      setOpen(true)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <QuickTaskForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
