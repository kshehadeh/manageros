'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AIChatContextType {
  isAIChatOpen: boolean
  setIsAIChatOpen: (_open: boolean) => void
  toggleAIChat: () => void
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined)

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  const toggleAIChat = () => {
    setIsAIChatOpen(!isAIChatOpen)
  }

  return (
    <AIChatContext.Provider
      value={{
        isAIChatOpen,
        setIsAIChatOpen,
        toggleAIChat,
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
