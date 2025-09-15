'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganization } from '@/lib/actions'

export default function CreateOrganizationPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await createOrganization(formData)
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
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Create Organization
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Create a new organization to get started with ManagerOS
          </p>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
              {error}
            </div>
          )}
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700'
              >
                Organization Name
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='Acme Corp'
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor='slug'
                className='block text-sm font-medium text-gray-700'
              >
                Organization Slug
              </label>
              <input
                id='slug'
                name='slug'
                type='text'
                required
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='acme-corp'
                value={formData.slug}
                onChange={handleInputChange}
              />
              <p className='mt-1 text-xs text-gray-500'>
                Used in URLs. Only lowercase letters, numbers, and hyphens
                allowed.
              </p>
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {isLoading ? 'Creating organization...' : 'Create organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
