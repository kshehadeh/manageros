'use client'

import { useState } from 'react'
import {
  saveGithubCredentials,
  deleteGithubCredentials,
} from '@/lib/actions/github'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

interface GithubCredentialsFormProps {
  initialCredentials?: {
    githubUsername: string
  } | null
  onSuccess?: () => void
}

export function GithubCredentialsForm({
  initialCredentials,
  onSuccess,
}: GithubCredentialsFormProps) {
  const [formData, setFormData] = useState({
    githubUsername: initialCredentials?.githubUsername || '',
    githubPat: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await saveGithubCredentials(formData)
      setIsFormDialogOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save GitHub credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteGithubCredentials()
      setIsDeleteDialogOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete GitHub credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      githubUsername: initialCredentials?.githubUsername || '',
      githubPat: '',
    })
    setError(null)
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Configure your GitHub Personal Access Token to enable GitHub account
        linking for your team members.
      </p>

      {initialCredentials ? (
        <div className='rounded-md bg-secondary/30 border p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-emerald-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h4 className='text-sm font-medium text-foreground'>
                  GitHub credentials configured
                </h4>
                <div className='mt-1 text-sm text-foreground'>
                  <p>Username: {initialCredentials.githubUsername}</p>
                </div>
              </div>
            </div>
            <div className='flex space-x-2'>
              <Dialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm' onClick={resetForm}>
                    Update Credentials
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Update GitHub Credentials</DialogTitle>
                    <DialogDescription>
                      Update your GitHub integration settings.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                      <label
                        htmlFor='githubUsername'
                        className='block text-sm font-medium text-foreground'
                      >
                        GitHub Username
                      </label>
                      <input
                        type='text'
                        id='githubUsername'
                        value={formData.githubUsername}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            githubUsername: e.target.value,
                          }))
                        }
                        placeholder='your-github-username'
                        className='input'
                        required
                      />
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Your GitHub username
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor='githubPat'
                        className='block text-sm font-medium text-foreground'
                      >
                        Personal Access Token
                      </label>
                      <input
                        type='password'
                        id='githubPat'
                        value={formData.githubPat}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            githubPat: e.target.value,
                          }))
                        }
                        placeholder='Enter your GitHub Personal Access Token'
                        className='input'
                        required
                      />
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Generate a Personal Access Token from your GitHub
                        account settings
                      </p>
                    </div>

                    {error && (
                      <div className='rounded-md bg-destructive/20 border border-destructive p-3'>
                        <div className='text-sm text-destructive'>{error}</div>
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsFormDialogOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button type='submit' disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Credentials'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant='destructive' size='sm'>
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete GitHub Credentials</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your GitHub credentials?
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Delete Credentials'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      ) : (
        <div className='rounded-md border border-dashed p-6 text-center'>
          <div className='mx-auto h-12 w-12 text-muted-foreground'>
            <svg
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              className='h-full w-full'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='mt-2 text-sm font-medium text-foreground'>
            No GitHub credentials configured
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Get started by adding your GitHub integration credentials.
          </p>
          <div className='mt-4'>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' onClick={resetForm}>
                  Add Credentials
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle>Add GitHub Credentials</DialogTitle>
                  <DialogDescription>
                    Configure your GitHub integration settings.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label
                      htmlFor='githubUsername'
                      className='block text-sm font-medium text-foreground'
                    >
                      GitHub Username
                    </label>
                    <input
                      type='text'
                      id='githubUsername'
                      value={formData.githubUsername}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          githubUsername: e.target.value,
                        }))
                      }
                      placeholder='your-github-username'
                      className='input'
                      required
                    />
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Your GitHub username
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor='githubPat'
                      className='block text-sm font-medium text-foreground'
                    >
                      Personal Access Token
                    </label>
                    <input
                      type='password'
                      id='githubPat'
                      value={formData.githubPat}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          githubPat: e.target.value,
                        }))
                      }
                      placeholder='Enter your GitHub Personal Access Token'
                      className='input'
                      required
                    />
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Generate a Personal Access Token from your GitHub account
                      settings
                    </p>
                  </div>

                  {error && (
                    <div className='rounded-md bg-destructive/20 border border-destructive p-3'>
                      <div className='text-sm text-destructive'>{error}</div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setIsFormDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type='submit' disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Credentials'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  )
}
