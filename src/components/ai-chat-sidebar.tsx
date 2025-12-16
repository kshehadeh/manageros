'use client'

import { useEffect } from 'react'
import { Bot, X, Expand, Shrink } from 'lucide-react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { useAIChat } from '@/components/ai-chat-provider'
import { Chat } from '@/components/ai-elements'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEFAULT_EXAMPLE_QUESTIONS } from '@/lib/ai/constants'

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const { settings, updateSetting } = useUserSettings()
  const { openedViaKeyboard, setOpenedViaKeyboard } = useAIChat()
  const isFullscreen = settings.chatWindowSettings.isFullscreen

  const toggleFullscreen = () => {
    updateSetting('chatWindowSettings', {
      ...settings.chatWindowSettings,
      isFullscreen: !isFullscreen,
    })
  }

  // Handle Escape key to close the AI chat (only when not typing in input)
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Check if the user is currently typing in an input field
        const target = event.target as HTMLElement
        const isInputElement =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true' ||
          target.getAttribute('role') === 'textbox' ||
          target.closest('[role="textbox"]') !== null ||
          target.closest('textarea') !== null ||
          target.closest('input') !== null

        // Only close if not typing in an input field
        if (!isInputElement) {
          event.preventDefault()
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus input when opened via keyboard or when sidebar becomes open
  useEffect(() => {
    if (!isOpen) return

    // Focus the input when sidebar opens (either via keyboard or otherwise)
    const timeoutId = setTimeout(() => {
      const composerInput = document.querySelector(
        '[aria-label="Message input"]'
      ) as HTMLTextAreaElement

      if (composerInput) {
        // Only focus if not already focused and if not disabled
        if (
          document.activeElement !== composerInput &&
          !composerInput.disabled &&
          composerInput.offsetParent !== null // Check if element is visible
        ) {
          composerInput.focus()
        }
      }

      // Reset the keyboard flag after focusing
      if (openedViaKeyboard) {
        setOpenedViaKeyboard(false)
      }
    }, 150) // Slightly longer delay to ensure DOM is ready

    return () => clearTimeout(timeoutId)
  }, [isOpen, openedViaKeyboard, setOpenedViaKeyboard])

  if (!isOpen) return null

  return (
    <>
      {/* Mobile overlay - blocks interaction with page behind chat */}
      <div
        className='md:hidden fixed inset-0 bg-black/50 z-50'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Sidebar container */}
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
            {/* Desktop fullscreen toggle - hidden on mobile */}
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleFullscreen}
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

        {/* Chat */}
        <div className='flex-1 overflow-hidden'>
          <ErrorBoundary>
            <Chat exampleQuestions={DEFAULT_EXAMPLE_QUESTIONS} />
          </ErrorBoundary>
        </div>
      </div>
    </>
  )
}
