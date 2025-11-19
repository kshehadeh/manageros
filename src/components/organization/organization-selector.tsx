'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationList } from '@clerk/nextjs'
import { Building2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string | null
}

interface OrganizationSelectorProps {
  organizations: Organization[]
}

export function OrganizationSelector({
  organizations,
}: OrganizationSelectorProps) {
  const router = useRouter()
  const { setActive } = useOrganizationList()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectOrganization = async (organizationId: string) => {
    if (!setActive) {
      setError('Organization management is not available')
      return
    }

    try {
      setSelectedId(organizationId)
      setIsSelecting(true)
      setError(null)

      // Set the selected organization as active using Clerk
      await setActive({
        organization: organizationId,
      })

      // Redirect to dashboard after successful selection
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Failed to switch organization:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to switch organization'
      )
      setIsSelecting(false)
      setSelectedId(null)
    }
  }

  if (organizations.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        <Building2 className='w-12 h-12 mx-auto mb-4 opacity-50' />
        <p>No organizations found</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-3'>
        {organizations.map(org => (
          <Card
            key={org.id}
            className='p-4 hover:border-primary/50 transition-colors cursor-pointer'
            onClick={() => handleSelectOrganization(org.id)}
          >
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10'>
                  <Building2 className='w-5 h-5 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold'>{org.name}</h3>
                  {org.slug && (
                    <p className='text-sm text-muted-foreground'>{org.slug}</p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleSelectOrganization(org.id)}
                disabled={isSelecting && selectedId === org.id}
                size='sm'
              >
                <CheckCircle2 className='w-4 h-4 mr-2' />
                {isSelecting && selectedId === org.id
                  ? 'Selecting...'
                  : 'Select'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
