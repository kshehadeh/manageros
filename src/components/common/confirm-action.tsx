'use client'

import { useState, type ReactNode } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmActionRenderProps {
  open: () => void
  isPending: boolean
}

interface ConfirmContentRenderProps {
  confirm: () => void
  cancel: () => void
  isPending: boolean
}

interface ConfirmActionProps {
  onConfirm: () => Promise<void> | void
  onCancel?: () => void
  onError?: (_error: unknown) => void
  onOpenChange?: (_open: boolean) => void
  renderTrigger: (_props: ConfirmActionRenderProps) => ReactNode
  renderConfirm?: (_props: ConfirmContentRenderProps) => ReactNode
  confirmMessage?: ReactNode
  confirmDescription?: ReactNode
  confirmLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  confirmVariant?: ButtonProps['variant']
  confirmSize?: ButtonProps['size']
  cancelVariant?: ButtonProps['variant']
  cancelSize?: ButtonProps['size']
  confirmClassName?: string
  cancelClassName?: string
  wrapperClassName?: string
  layout?: 'inline' | 'stacked'
  align?: 'start' | 'center' | 'end'
}

export function ConfirmAction({
  onConfirm,
  onCancel,
  onError,
  onOpenChange,
  renderTrigger,
  renderConfirm,
  confirmMessage = 'Are you sure?',
  confirmDescription,
  confirmLabel = 'Confirm',
  pendingLabel = 'Working...',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  confirmSize = 'sm',
  cancelVariant = 'outline',
  cancelSize = 'sm',
  confirmClassName,
  cancelClassName,
  wrapperClassName,
  layout = 'inline',
  align = 'start',
}: ConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const open = () => {
    if (isPending) return
    setIsConfirming(true)
    onOpenChange?.(true)
  }

  const close = () => {
    setIsConfirming(false)
    onOpenChange?.(false)
  }

  const cancel = () => {
    if (isPending) return
    close()
    onCancel?.()
  }

  const confirm = async () => {
    if (isPending) return
    setIsPending(true)
    try {
      await onConfirm()
      setIsPending(false)
      close()
    } catch (error) {
      setIsPending(false)
      onError?.(error)
    }
  }

  const directionClass =
    layout === 'stacked' ? 'flex-col items-stretch' : 'flex-row items-center'
  const alignClass =
    align === 'start'
      ? 'justify-start'
      : align === 'end'
        ? 'justify-end'
        : 'justify-center'

  if (!isConfirming) {
    return <>{renderTrigger({ open, isPending })}</>
  }

  if (renderConfirm) {
    return <>{renderConfirm({ confirm, cancel, isPending })}</>
  }

  return (
    <div
      className={cn('flex gap-2', directionClass, alignClass, wrapperClassName)}
    >
      {confirmMessage ? (
        <div className='text-sm text-muted-foreground'>
          {confirmMessage}
          {confirmDescription ? (
            <div className='text-xs text-muted-foreground/80 mt-1'>
              {confirmDescription}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          'flex gap-2',
          layout === 'stacked' ? 'flex-col md:flex-row' : 'flex-row',
          alignClass
        )}
      >
        <Button
          onClick={confirm}
          disabled={isPending}
          variant={confirmVariant}
          size={confirmSize}
          className={confirmClassName}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
        <Button
          onClick={cancel}
          disabled={isPending}
          variant={cancelVariant}
          size={cancelSize}
          className={cancelClassName}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}
