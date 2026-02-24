'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell, Check, Clock } from 'lucide-react'
import { getSnoozeOptions, isValidSnoozeMinutes } from '@/lib/task-reminders'
import { toast } from 'sonner'

interface TaskReminderBannerProps {
  deliveryId: string
  taskId: string
  taskDueDate: Date | null
  onDismiss: () => void
}

export function TaskReminderBanner({
  deliveryId,
  taskId,
  taskDueDate,
  onDismiss,
}: TaskReminderBannerProps) {
  const router = useRouter()
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const [isSnoozing, setIsSnoozing] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [customSnoozeMinutes, setCustomSnoozeMinutes] = useState(15)

  const handleAcknowledge = useCallback(async () => {
    setIsAcknowledging(true)
    try {
      const res = await fetch('/api/task-reminders/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to acknowledge')
      }
      onDismiss()
      router.replace(`/tasks/${taskId}`)
      toast.success('Reminder acknowledged')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to acknowledge')
    } finally {
      setIsAcknowledging(false)
    }
  }, [deliveryId, taskId, onDismiss, router])

  const handleSnooze = useCallback(
    async (snoozeMinutes: number) => {
      if (!taskDueDate || !isValidSnoozeMinutes(snoozeMinutes, taskDueDate)) {
        toast.error('Invalid snooze time')
        return
      }
      setIsSnoozing(true)
      setSnoozeOpen(false)
      try {
        const res = await fetch('/api/task-reminders/snooze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deliveryId, snoozeMinutes }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error ?? 'Failed to snooze')
        }
        onDismiss()
        router.replace(`/tasks/${taskId}`)
        const at = new Date(Date.now() + snoozeMinutes * 60 * 1000)
        toast.success(
          `Reminder snoozed until ${at.toLocaleTimeString(undefined, { timeStyle: 'short' })}`
        )
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to snooze')
      } finally {
        setIsSnoozing(false)
      }
    },
    [deliveryId, taskId, taskDueDate, onDismiss, router]
  )

  const snoozeOptions = taskDueDate ? getSnoozeOptions(taskDueDate) : []

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm'>
      <div className='flex items-center gap-2'>
        <Bell className='h-4 w-4 text-muted-foreground' />
        <span>You were reminded about this task.</span>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={handleAcknowledge}
          disabled={isAcknowledging || isSnoozing}
        >
          <Check className='h-4 w-4 mr-1' />
          Acknowledge
        </Button>
        {taskDueDate && (
          <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                disabled={isAcknowledging || isSnoozing}
              >
                <Clock className='h-4 w-4 mr-1' />
                Snooze
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-56'>
              <div className='space-y-2'>
                <p className='text-sm font-medium'>Remind again in</p>
                {snoozeOptions.map(opt => (
                  <Button
                    key={opt.minutes}
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start'
                    onClick={() => handleSnooze(opt.minutes)}
                  >
                    {opt.label}
                  </Button>
                ))}
                <div className='flex items-center gap-2 pt-2 border-t'>
                  <input
                    type='number'
                    min={1}
                    className='input w-20 text-sm'
                    value={customSnoozeMinutes}
                    onChange={e =>
                      setCustomSnoozeMinutes(
                        Math.max(1, parseInt(e.target.value, 10) || 1)
                      )
                    }
                  />
                  <span className='text-xs text-muted-foreground'>min</span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleSnooze(customSnoozeMinutes)}
                    disabled={
                      !isValidSnoozeMinutes(customSnoozeMinutes, taskDueDate)
                    }
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}
