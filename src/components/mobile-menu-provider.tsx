'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface MobileMenuContextType {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (_open: boolean) => void
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(
  undefined
)

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <MobileMenuContext.Provider
      value={{ isMobileMenuOpen, setIsMobileMenuOpen }}
    >
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext)
  if (context === undefined) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider')
  }
  return context
}
