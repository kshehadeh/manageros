'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useOrganizationList, useOrganization } from '@clerk/nextjs'
import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { Link } from '../ui/link'

export function SidebarOrganizationSwitcher() {
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const { organization: activeOrganization } = useOrganization()
  const [isSelecting, setIsSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSwitchingRef = useRef(false)
  const lastActiveOrgRef = useRef<string | null>(null)

  // Get organizations from the list
  // userMemberships is a paginated list, access via .data
  const organizations =
    userMemberships?.data?.map(membership => membership.organization) || []

  // Get the active organization ID
  const activeOrganizationId = activeOrganization?.id || null

  // Function to revalidate memberships from Clerk
  const revalidateMemberships = useCallback(async () => {
    if (userMemberships?.revalidate) {
      try {
        await userMemberships.revalidate()
      } catch (err) {
        console.error('Failed to revalidate memberships:', err)
      }
    }
  }, [userMemberships])

  // Detect when active organization changes or is removed
  useEffect(() => {
    // If we had an active org and now we don't, the org was likely deleted
    if (lastActiveOrgRef.current && !activeOrganizationId && isLoaded) {
      // Revalidate the memberships list to remove stale data
      revalidateMemberships()
    }
    lastActiveOrgRef.current = activeOrganizationId
  }, [activeOrganizationId, isLoaded, revalidateMemberships])

  // Also revalidate when the component mounts or window regains focus
  useEffect(() => {
    const handleFocus = () => {
      revalidateMemberships()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [revalidateMemberships])

  const handleValueChange = async (organizationId: string) => {
    // Prevent multiple simultaneous switches
    if (isSwitchingRef.current) {
      return
    }

    // Don't switch if it's already the active organization
    if (organizationId === activeOrganizationId) {
      return
    }

    if (!setActive) {
      setError('Organization management is not available')
      return
    }

    try {
      isSwitchingRef.current = true
      setIsSelecting(true)
      setError(null)

      // Set the selected organization as active using Clerk
      await setActive({
        organization: organizationId,
      })

      // Dispatch custom event to notify listeners
      window.dispatchEvent(new CustomEvent('organization:changed'))

      // Use window.location for a hard redirect to prevent render loops
      // This forces a full page reload with the new organization context
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Failed to switch organization:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to switch organization'
      )
      isSwitchingRef.current = false
      setIsSelecting(false)
    }
  }

  // Show loading state while organizations are being fetched
  if (!isLoaded) {
    return (
      <div className='flex items-center gap-sm'>
        <Loading className='w-4 h-4' />
        <span className='text-xs text-muted-foreground'>Loading...</span>
      </div>
    )
  }

  // If there's no active organization but we have cached organizations,
  // the user's organization was likely deleted - show the create link
  // This handles the case where Clerk's cache is stale
  const hasNoActiveOrg = !activeOrganizationId
  const hasOnlyStaleOrgs =
    hasNoActiveOrg &&
    organizations.length > 0 &&
    !organizations.some(org => org.id === activeOrganizationId)

  // Show empty state if no organizations OR if only stale cached orgs remain
  if (organizations.length === 0 || hasOnlyStaleOrgs) {
    return (
      <div className='text-xs text-muted-foreground flex items-center gap-sm'>
        <Building2 className='w-4 h-4' />
        <Link href='/organization/new'>Create Organization</Link>
      </div>
    )
  }

  // Show error if there's an error state
  if (error) {
    return <div className='text-sm text-destructive'>{error}</div>
  }

  return (
    <Select
      value={activeOrganizationId || undefined}
      onValueChange={handleValueChange}
      disabled={isSelecting}
    >
      <SelectTrigger className='h-auto py-xs px-sm text-sm text-muted-foreground bg-muted border-none shadow-none hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:outline-none'>
        <SelectValue placeholder='Select organization' />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(org => (
          <SelectItem key={org.id} value={org.id}>
            <div className='flex items-center gap-sm'>
              <Building2 className='h-4 w-4' />
              <span>{org.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
