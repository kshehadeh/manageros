import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, X, Plus, Expand, Shrink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { AssistantChatTransport } from '@assistant-ui/react-ai-sdk'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'

import { ManagerOSThread } from '@/components/assistant-ui/manageros-thread'
import { AssistantErrorBoundary } from '@/components/assistant-ui/assistant-error-boundary'

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
  // Memoize the transport to prevent recreating it on every render
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: '/api/chat',
      }),
    []
  )

  // Configure the chat runtime for assistant-ui
  const runtime = useChatRuntime({
    transport,
  })

  // Track thread state reactively
  const [threadState, setThreadState] = useState(() =>
    runtime.thread.getState()
  )

  // Use a ref to store the runtime to avoid dependency issues
  const runtimeRef = useRef(runtime)
  runtimeRef.current = runtime

  // Subscribe to thread state changes (only once on mount)
  useEffect(() => {
    let mounted = true

    const unsubscribe = runtimeRef.current.thread.subscribe(() => {
      if (!mounted) return

      const newState = runtimeRef.current.thread.getState()

      // Only update if the state actually changed (compare messages length and isRunning)
      setThreadState(prevState => {
        // Skip update if component is unmounted
        if (!mounted) return prevState

        if (
          prevState.isRunning !== newState.isRunning ||
          prevState.messages.length !== newState.messages.length
        ) {
          return newState
        }
        return prevState
      })
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, []) // Empty deps - only subscribe once, runtimeRef is updated on each render

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
                threadState.isRunning || threadState.messages.length === 0
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
          <AssistantErrorBoundary>
            <ManagerOSThread exampleQuestions={exampleQuestions} />
          </AssistantErrorBoundary>
        </div>
      </div>
    </AssistantRuntimeProvider>
  )
}
