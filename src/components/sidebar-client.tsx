'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Sidebar from './sidebar'
import { getSidebarData } from '@/lib/actions/organization'
import type { User } from '@/lib/auth-types'

interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
  requiresPermission?: string
}

interface PersonData {
  id: string
  name: string
  email: string | null
  avatar: string | null
}

interface SidebarData {
  user: User | null
  person: PersonData | null
  navigation: NavItem[]
}

export default function SidebarClient() {
  const { isLoaded, userId } = useAuth()
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSidebarData() {
      if (!isLoaded) {
        return
      }

      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getSidebarData()
        setSidebarData(data)
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSidebarData()
  }, [isLoaded, userId])

  // Always show skeleton during loading to prevent hydration mismatch
  if (isLoading || !isLoaded) {
    return <Sidebar />
  }

  // If no session, render the unauthenticated sidebar
  if (!sidebarData || !userId) {
    return <Sidebar />
  }

  // Handle case where user is null (error case)
  if (!sidebarData.user) {
    return <Sidebar />
  }

  return (
    <Sidebar
      navigation={sidebarData.navigation}
      serverSession={sidebarData.user}
      personData={
        sidebarData.person
          ? {
              id: sidebarData.person.id,
              name: sidebarData.person.name,
              email: sidebarData.person.email,
              avatar: sidebarData.person.avatar,
            }
          : null
      }
    />
  )
}
