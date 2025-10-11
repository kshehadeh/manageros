'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAIChat } from '@/components/ai-chat-provider'

interface CommandPaletteContextValue {
  isOpen: boolean
  setOpen: (_open: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
)

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { toggleAIChat, setOpenedViaKeyboard } = useAIChat()

  const setOpen = useCallback((open: boolean) => setIsOpen(open), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl + K: Open command palette
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }

      // Cmd/Ctrl + J: Open AI chat
      if (isMod && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setOpenedViaKeyboard(true)
        toggleAIChat()
      }

      // Helper function to check if we're in an input-like element or if a modal/popover is open
      const shouldIgnoreKeyPress = (target: HTMLElement): boolean => {
        // Check the element itself
        const tagName = target.tagName
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        ) {
          return true
        }

        // Check for contentEditable
        if (target.contentEditable === 'true') {
          return true
        }

        // Check for ARIA roles that indicate text input
        const role = target.getAttribute('role')
        if (
          role === 'textbox' ||
          role === 'searchbox' ||
          role === 'combobox' ||
          role === 'spinbutton'
        ) {
          return true
        }

        // Check if we're inside a contenteditable element
        let parent = target.parentElement
        while (parent) {
          if (parent.contentEditable === 'true') {
            return true
          }
          parent = parent.parentElement
        }

        // Check if any Radix UI component is open (Select, Dialog, Popover, etc.)
        // Radix uses data-state="open" on open components
        const hasOpenRadixComponent = document.querySelector(
          '[data-state="open"][role="dialog"], [data-state="open"][role="menu"], [data-state="open"] [role="listbox"]'
        )
        if (hasOpenRadixComponent) {
          return true
        }

        // Check if any modal/dialog is currently open
        const hasOpenDialog = document.querySelector(
          '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'
        )
        if (hasOpenDialog) {
          return true
        }

        // Check if the target or any parent has data-state="open" (Radix pattern)
        let checkParent = target as HTMLElement | null
        while (checkParent) {
          if (checkParent.getAttribute('data-state') === 'open') {
            return true
          }
          checkParent = checkParent.parentElement
        }

        return false
      }

      // Q: Open task creation dialog (only when not in input/textarea)
      if (e.key.toLowerCase() === 'q' && !isMod) {
        const target = e.target as HTMLElement

        if (!shouldIgnoreKeyPress(target)) {
          e.preventDefault()
          const ev = new CustomEvent('command:openCreateTaskModal')
          window.dispatchEvent(ev)
        }
      }

      // E: Open edit form for current detail page (only when not in input/textarea)
      if (e.key.toLowerCase() === 'e' && !isMod) {
        const target = e.target as HTMLElement

        if (!shouldIgnoreKeyPress(target)) {
          e.preventDefault()
          const ev = new CustomEvent('command:openEditForm')
          window.dispatchEvent(ev)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleAIChat, setOpenedViaKeyboard])

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ isOpen, setOpen, toggle }),
    [isOpen, setOpen, toggle]
  )

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx)
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider'
    )
  return ctx
}
