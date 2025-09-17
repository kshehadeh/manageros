'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganization } from '@/lib/actions'
import { useSession } from 'next-auth/react'

export default function CreateOrganizationPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { update: updateSession } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await createOrganization(formData)

      // Update the session to reflect the new organization
      await updateSession()

      router.push('/')
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-neutral-100'>
            Create Organization
          </h2>
          <p className='mt-2 text-center text-sm text-neutral-400'>
            Create a new organization to get started with ManagerOS
          </p>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded'>
              {error}
            </div>
          )}
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-neutral-300'
              >
                Organization Name
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                className='input mt-1'
                placeholder='Acme Corp'
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor='slug'
                className='block text-sm font-medium text-neutral-300'
              >
                Organization Slug
              </label>
              <input
                id='slug'
                name='slug'
                type='text'
                required
                className='input mt-1'
                placeholder='acme-corp'
                value={formData.slug}
                onChange={handleInputChange}
              />
              <p className='mt-1 text-xs text-neutral-500'>
                Used in URLs. Only lowercase letters, numbers, and hyphens
                allowed.
              </p>
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='btn w-full justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
            >
              {isLoading ? 'Creating organization...' : 'Create organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
