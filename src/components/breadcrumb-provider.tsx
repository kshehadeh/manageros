'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface BreadcrumbItem {
  name: string
  href: string
  isLoading?: boolean
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (_breadcrumbs: BreadcrumbItem[]) => void
  hasManualBreadcrumbs: boolean
  setHasManualBreadcrumbs: (_hasManual: boolean) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
)

interface BreadcrumbProviderProps {
  children: ReactNode
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: 'Dashboard', href: '/dashboard' },
  ])
  const [hasManualBreadcrumbs, setHasManualBreadcrumbs] = useState(false)

  return (
    <BreadcrumbContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs,
        hasManualBreadcrumbs,
        setHasManualBreadcrumbs,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider')
  }
  return context
}
