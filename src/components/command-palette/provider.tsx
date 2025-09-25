'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface CommandPaletteContextValue {
  isOpen: boolean
  setOpen: (_open: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const setOpen = useCallback((open: boolean) => setIsOpen(open), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ isOpen, setOpen, toggle }),
    [isOpen, setOpen, toggle]
  )

  return (
    <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

