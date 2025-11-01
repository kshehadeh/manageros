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
