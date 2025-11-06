'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Sidebar from './sidebar'
import { getSidebarData } from '@/lib/actions/organization'
import type { User as NextAuthUser } from 'next-auth'

interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
}

interface PersonData {
  id: string
  name: string
  email: string | null
  avatar: string | null
}

interface SidebarData {
  user: NextAuthUser
  person: PersonData | null
  navigation: NavItem[]
}

type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated'

export default function SidebarClient() {
  const { data: session, status } = useSession()
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSidebarData() {
      if (status === 'loading') {
        return
      }

      if (status === 'unauthenticated' || !session) {
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
  }, [session, status])

  // Always show skeleton during loading to prevent hydration mismatch
  if (isLoading || status === 'loading') {
    return <Sidebar />
  }

  // If no session, render the unauthenticated sidebar
  if (
    !sidebarData ||
    !session ||
    (status as SessionStatus) === 'unauthenticated'
  ) {
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
