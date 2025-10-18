import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, X, Plus, Expand, Shrink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { DefaultChatTransport } from 'ai'
import { useCallback } from 'react'

import { ManagerOSThread } from '@/components/assistant-ui/manageros-thread'

interface ManagerOSAssistantSidebarProps {
  isOpen: boolean
  onClose: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  exampleQuestions?: string[]
}

export const ManagerOSAssistantSidebar: FC<ManagerOSAssistantSidebarProps> = ({
  isOpen,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  exampleQuestions,
}) => {
  // Configure the chat runtime for assistant-ui
  const runtime = useChatRuntime({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  // Handler to start a new chat
  const handleNewChat = useCallback(() => {
    // Reset the thread to start a new chat
    runtime.thread.reset()
  }, [runtime])

  if (!isOpen) return null

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div
        className={cn(
          'fixed top-0 h-full bg-card shadow-lg z-[60] flex flex-col',
          // Mobile: always fullscreen (use inset to ensure full coverage)
          'inset-x-0 w-screen',
          // Desktop: sidebar mode unless fullscreen
          'md:inset-x-auto md:w-96 md:right-0 md:border-l',
          // Desktop fullscreen mode
          isFullscreen && 'md:inset-x-0 md:w-full md:border-l-0'
        )}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-2'>
            <Bot className='h-5 w-5 text-primary' />
            <h2 className='font-semibold'>AI Chat</h2>
          </div>
          <div className='flex items-center gap-1'>
            {/* New Chat button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleNewChat}
              disabled={
                runtime.thread.getState().isRunning ||
                runtime.thread.getState().messages.length === 0
              }
              title='Start a new chat'
            >
              <Plus className='h-4 w-4' />
            </Button>
            {/* Desktop fullscreen toggle - hidden on mobile */}
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggleFullscreen}
              className='hidden md:flex'
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Shrink className='h-4 w-4' />
              ) : (
                <Expand className='h-4 w-4' />
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              title='Close chat'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Chat Thread */}
        <div className='flex-1 overflow-hidden'>
          <ManagerOSThread exampleQuestions={exampleQuestions} />
        </div>
      </div>
    </AssistantRuntimeProvider>
  )
}
