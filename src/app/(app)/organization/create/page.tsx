'use client'

import { useState } from 'react'
import { Building } from 'lucide-react'
import { createOrganization } from '@/lib/actions/organization'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateOrganizationPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await createOrganization(formData)

      // Redirect to dashboard with a full page reload to ensure fresh data
      // This ensures the session is refreshed and the dashboard shows the new organization
      window.location.href = '/dashboard'
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: 'name' | 'slug', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const sections: FormSection[] = [
    {
      content: (
        <>
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
            />
            <p className='text-xs text-muted-foreground'>
              Used in URLs. Only lowercase letters, numbers, and hyphens
              allowed.
            </p>
          </div>
        </>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title='Create Organization'
        titleIcon={Building}
        subtitle='Create a new organization to get started with ManagerOS'
      />
      <FormTemplate
        sections={sections}
        onSubmit={handleSubmit}
        submitButton={{
          text: 'Create Organization',
          loadingText: 'Creating organization...',
          icon: Building,
        }}
        generalError={error}
        isSubmitting={isLoading}
      />
    </PageContainer>
  )
}
