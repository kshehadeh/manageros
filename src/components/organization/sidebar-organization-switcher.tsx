'use client'

import { useState, useRef } from 'react'
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

  // Get organizations from the list
  // userMemberships is a paginated list, access via .data
  const organizations =
    userMemberships?.data?.map(membership => membership.organization) || []

  // Get the active organization ID
  const activeOrganizationId = activeOrganization?.id || null

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

  // Show empty state if no organizations
  if (organizations.length === 0) {
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
