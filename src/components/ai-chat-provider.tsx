'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AIChatContextType {
  isAIChatOpen: boolean
  setIsAIChatOpen: (_open: boolean) => void
  toggleAIChat: () => void
  openedViaKeyboard: boolean
  setOpenedViaKeyboard: (_opened: boolean) => void
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined)

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [openedViaKeyboard, setOpenedViaKeyboard] = useState(false)

  const toggleAIChat = () => {
    setIsAIChatOpen(!isAIChatOpen)
  }

  return (
    <AIChatContext.Provider
      value={{
        isAIChatOpen,
        setIsAIChatOpen,
        toggleAIChat,
        openedViaKeyboard,
        setOpenedViaKeyboard,
      }}
    >
      {children}
    </AIChatContext.Provider>
  )
}

export function useAIChat() {
  const context = useContext(AIChatContext)
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider')
  }
  return context
}
