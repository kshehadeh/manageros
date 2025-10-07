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
  const { toggleAIChat } = useAIChat()

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
        toggleAIChat()
      }

      // Q: Open task creation dialog (only when not in input/textarea)
      if (e.key.toLowerCase() === 'q' && !isMod) {
        const target = e.target as HTMLElement
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'

        if (!isInput) {
          e.preventDefault()
          const ev = new CustomEvent('command:openCreateTaskModal')
          window.dispatchEvent(ev)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleAIChat])

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
