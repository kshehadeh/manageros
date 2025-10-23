'use client'

import { useEffect } from 'react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { useAIChat } from '@/components/ai-chat-provider'
import { ManagerOSAssistantSidebar } from '@/components/assistant-ui/manageros-assistant-sidebar'

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const { settings, updateSetting } = useUserSettings()
  const { openedViaKeyboard, setOpenedViaKeyboard } = useAIChat()

  // Note: Scroll locking is handled by Radix UI components (Dialog, etc.)
  // No custom scroll locking needed here

  // Handle Escape key to close the AI chat
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus input when opened via keyboard
  useEffect(() => {
    if (isOpen && openedViaKeyboard) {
      // Small delay to ensure the sidebar is fully rendered
      const timeoutId = setTimeout(() => {
        // Focus the composer input in the assistant-ui thread
        const composerInput = document.querySelector(
          '[aria-label="Message input"]'
        ) as HTMLTextAreaElement
        composerInput?.focus()
        setOpenedViaKeyboard(false) // Reset the flag
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, openedViaKeyboard, setOpenedViaKeyboard])

  const exampleQuestions = [
    'List initiatives that are currently in progress',
    'Show me all high priority tasks',
    'What teams do we have?',
    'Find meetings scheduled for this week',
  ]

  return (
    <>
      {/* Mobile overlay - blocks interaction with page behind chat */}
      {isOpen && (
        <div
          className='md:hidden fixed inset-0 bg-black/50 z-50'
          onClick={onClose}
          aria-hidden='true'
        />
      )}

      <ManagerOSAssistantSidebar
        isOpen={isOpen}
        onClose={onClose}
        isFullscreen={settings.chatWindowSettings.isFullscreen}
        onToggleFullscreen={() =>
          updateSetting('chatWindowSettings', {
            ...settings.chatWindowSettings,
            isFullscreen: !settings.chatWindowSettings.isFullscreen,
          })
        }
        exampleQuestions={exampleQuestions}
      />
    </>
  )
}
