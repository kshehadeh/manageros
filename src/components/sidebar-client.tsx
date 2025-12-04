'use client'

import Sidebar from './sidebar'
import type { OrganizationBrief, UserBrief } from '@/lib/auth-types'
import { PersonBrief } from '../types/person'

interface NavItem {
  name: string
  href: string
  icon: string
  adminOnly?: boolean
  requiresPermission?: string
  badgeCount?: number
  badgeVariant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
}
interface SidebarData {
  user: UserBrief | null
  person: PersonBrief | null
  organization: OrganizationBrief | null
  navigation: NavItem[]
}

export default function SidebarClient({
  user,
  person,
  organization,
  navigation,
}: SidebarData) {
  // If no session, render the unauthenticated sidebar
  if (!user) {
    console.error('No user, person, or organization found', {
      user,
      person,
      organization,
    })
    return <Sidebar />
  }

  return (
    <Sidebar navigation={navigation} serverSession={user} personData={person} />
  )
}
