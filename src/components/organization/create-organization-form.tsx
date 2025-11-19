'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationList } from '@clerk/nextjs'
import { Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function CreateOrganizationForm() {
  const router = useRouter()
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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createOrganization || !setActive) {
      setError('Organization creation is not available')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create organization using Clerk's method
      const organization = await createOrganization({
        name: formData.name,
        slug: formData.slug,
      })

      // Set the newly created organization as active
      await setActive({
        organization: organization.id,
      })

      // Redirect to dashboard after successful creation
      // The auth sync will handle creating the organization in our database
      router.push('/dashboard')
      router.refresh()
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
        {isLoading ? 'Creating Organization...' : 'Create Organization'}
      </Button>
    </form>
  )
}
