'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Handshake } from 'lucide-react'
import type { ActionResult } from '@/lib/ai/tools/create-oneonone-action-tool'
import { cn } from '@/lib/utils'

interface ActionButtonProps {
  action: ActionResult
  className?: string
}

export function ActionButton({ action, className }: ActionButtonProps) {
  const router = useRouter()

  if (action.actionType !== 'navigate' || !action.url) {
    return null
  }

  const handleClick = () => {
    router.push(action.url!)
  }

  // Determine button label based on action type and metadata
  const getButtonLabel = (): string => {
    if (
      action.metadata?.participant1Name &&
      action.metadata?.participant2Name
    ) {
      return `Create 1:1 with ${action.metadata.participant2Name}`
    }
    if (action.metadata?.participant2Name) {
      return `Create 1:1 with ${action.metadata.participant2Name}`
    }
    return 'Create 1:1 Meeting'
  }

  return (
    <Button
      onClick={handleClick}
      variant='outline'
      className={cn('flex items-center gap-2', className)}
    >
      <Handshake className='w-4 h-4' />
      {getButtonLabel()}
    </Button>
  )
}
