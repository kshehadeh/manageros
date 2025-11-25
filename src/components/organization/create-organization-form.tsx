'use client'

import { useState, useCallback } from 'react'
import { useOrganizationList } from '@clerk/nextjs'
import { Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// Configuration for retry mechanism
const MAX_RETRIES = 10
const INITIAL_DELAY_MS = 100
const MAX_DELAY_MS = 2000

export function CreateOrganizationForm() {
  const { createOrganization, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(
    'Creating Organization...'
  )
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Wait for organization to be set as active with retry logic
  const waitForOrganizationActive = useCallback(
    async (orgId: string): Promise<boolean> => {
      let delay = INITIAL_DELAY_MS

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        // Wait before checking
        await new Promise(resolve => setTimeout(resolve, delay))

        // Check if the organization is now active
        // We verify by checking if activeOrganization matches the created org
        // Since useOrganization updates reactively, we need to check via API
        try {
          const response = await fetch('/api/organization/memberships')
          if (response.ok) {
            const data = await response.json()
            const isActive = data.organizations?.some(
              (org: { id: string }) => org.id === orgId
            )
            if (isActive) {
              return true
            }
          }
        } catch {
          // Continue retrying on error
        }

        // Exponential backoff with max delay cap
        delay = Math.min(delay * 1.5, MAX_DELAY_MS)
        setLoadingMessage(
          `Setting up organization... (${attempt + 1}/${MAX_RETRIES})`
        )
      }

      return false
    },
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createOrganization || !setActive) {
      setError('Organization creation is not available')
      return
    }

    setIsLoading(true)
    setError('')
    setLoadingMessage('Creating Organization...')

    try {
      // Create organization using Clerk's method
      const organization = await createOrganization({
        name: formData.name,
        slug: formData.slug,
      })

      setLoadingMessage('Activating organization...')

      // Set the newly created organization as active
      await setActive({
        organization: organization.id,
      })

      setLoadingMessage('Verifying setup...')

      // Wait for organization to be fully active with retry logic
      const isActive = await waitForOrganizationActive(organization.id)

      if (!isActive) {
        // Even if verification times out, proceed with redirect
        // The getCurrentUser function will handle creating the organization in our database
        console.warn(
          'Organization activation verification timed out, proceeding with redirect'
        )
      }

      // Use window.location for a hard redirect to ensure state is cleared
      // This forces a full page reload with the new organization context
      // The auth sync will handle creating the organization in our database
      window.location.href = '/dashboard'
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      )
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: 'name' | 'slug', value: string) => {
    if (field === 'slug') {
      // User is manually editing the slug
      setSlugManuallyEdited(true)
      setFormData(prev => ({
        ...prev,
        slug: value,
      }))
    } else if (field === 'name') {
      // Update the name
      setFormData(prev => ({
        ...prev,
        name: value,
      }))

      // Auto-generate slug from name if it hasn't been manually edited
      if (!slugManuallyEdited) {
        const generatedSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        setFormData(prev => ({
          ...prev,
          slug: generatedSlug,
        }))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>
            Organization Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='name'
            type='text'
            required
            placeholder='Acme Corp'
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='slug'>
            Organization Slug <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='slug'
            type='text'
            required
            placeholder='acme-corp'
            value={formData.slug}
            onChange={e => handleInputChange('slug', e.target.value)}
            disabled={isLoading}
          />
          <p className='text-xs text-muted-foreground'>
            Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
          </p>
        </div>
      </div>

      <Button type='submit' disabled={isLoading} className='w-full'>
        <Building2 className='w-4 h-4 mr-2' />
        {isLoading ? loadingMessage : 'Create Organization'}
      </Button>
    </form>
  )
}
