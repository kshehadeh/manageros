'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationSlug: '',
    createOrganization: false,
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organizationName: formData.createOrganization
            ? formData.organizationName
            : undefined,
          organizationSlug: formData.createOrganization
            ? formData.organizationSlug
            : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create account')
      }

      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(
          'Account created but failed to sign in. Please try signing in manually.'
        )
      } else {
        router.push('/')
      }
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
            Create your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <Link
              href='/auth/signin'
              className='font-medium text-indigo-600 hover:text-indigo-500'
            >
              sign in to your existing account
            </Link>
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
                Full Name
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='John Doe'
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Email Address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='john@example.com'
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className='border-t border-gray-200 pt-6'>
              <div className='flex items-center'>
                <input
                  id='createOrganization'
                  name='createOrganization'
                  type='checkbox'
                  className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                  checked={formData.createOrganization}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      createOrganization: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor='createOrganization'
                  className='ml-2 block text-sm text-gray-900'
                >
                  Create a new organization
                </label>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                If unchecked, you&apos;ll need to be invited to an existing
                organization to access the platform.
              </p>
            </div>

            {formData.createOrganization && (
              <>
                <div>
                  <label
                    htmlFor='organizationName'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Organization Name
                  </label>
                  <input
                    id='organizationName'
                    name='organizationName'
                    type='text'
                    required={formData.createOrganization}
                    className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                    placeholder='Acme Corp'
                    value={formData.organizationName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor='organizationSlug'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Organization Slug
                  </label>
                  <input
                    id='organizationSlug'
                    name='organizationSlug'
                    type='text'
                    required={formData.createOrganization}
                    className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                    placeholder='acme-corp'
                    value={formData.organizationSlug}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    Used in URLs. Only lowercase letters, numbers, and hyphens
                    allowed.
                  </p>
                </div>
              </>
            )}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='Password'
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700'
              >
                Confirm Password
              </label>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='Confirm Password'
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
