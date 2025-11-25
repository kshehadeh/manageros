'use client'

import { useState } from 'react'
import { saveJiraCredentials, deleteJiraCredentials } from '@/lib/actions/jira'
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
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Trash2 } from 'lucide-react'

interface JiraCredentialsFormProps {
  initialCredentials?: {
    jiraUsername: string
    jiraBaseUrl: string
  } | null
  onSuccess?: () => void
}

export function JiraCredentialsForm({
  initialCredentials,
  onSuccess,
}: JiraCredentialsFormProps) {
  const [formData, setFormData] = useState({
    jiraUsername: initialCredentials?.jiraUsername || '',
    jiraApiKey: '',
    jiraBaseUrl: initialCredentials?.jiraBaseUrl || '',
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
      await saveJiraCredentials(formData)
      setIsFormDialogOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save Jira credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteJiraCredentials()
      setIsDeleteDialogOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete Jira credentials'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      jiraUsername: initialCredentials?.jiraUsername || '',
      jiraApiKey: '',
      jiraBaseUrl: initialCredentials?.jiraBaseUrl || '',
    })
    setError(null)
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Configure your Jira credentials to enable work activity tracking for
        your team members.
      </p>

      {initialCredentials ? (
        <div className='rounded-md bg-secondary/30 border p-4'>
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
            <div className='ml-3 flex-1'>
              <h4 className='text-sm font-medium text-foreground'>
                Jira credentials configured
              </h4>
              <div className='mt-1 text-sm text-foreground'>
                <p>Connected to: {initialCredentials.jiraBaseUrl}</p>
                <p>Username: {initialCredentials.jiraUsername}</p>
              </div>
            </div>
          </div>
          <div className='flex justify-end space-x-2 mt-4'>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm' onClick={resetForm}>
                  Update Credentials
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Jira Credentials</DialogTitle>
                  <DialogDescription>
                    Update your Jira integration settings.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='jiraBaseUrl'>Jira Base URL</Label>
                    <Input
                      type='url'
                      id='jiraBaseUrl'
                      value={formData.jiraBaseUrl}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          jiraBaseUrl: e.target.value,
                        }))
                      }
                      placeholder='https://yourcompany.atlassian.net'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      The base URL of your Jira instance
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='jiraUsername'>Username or Email</Label>
                    <Input
                      type='text'
                      id='jiraUsername'
                      value={formData.jiraUsername}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          jiraUsername: e.target.value,
                        }))
                      }
                      placeholder='your.email@company.com'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      Your Jira username or email address
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='jiraApiKey'>API Token</Label>
                    <Input
                      type='password'
                      id='jiraApiKey'
                      value={formData.jiraApiKey}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          jiraApiKey: e.target.value,
                        }))
                      }
                      placeholder='Enter your Jira API token'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      Generate an API token from your Jira account settings
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
                <Button
                  variant='destructive'
                  size='sm'
                  aria-label='Delete credentials'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Jira Credentials</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete your Jira credentials? This
                    action cannot be undone.
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
            No Jira credentials configured
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Get started by adding your Jira integration credentials.
          </p>
          <div className='mt-4'>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' onClick={resetForm}>
                  Add Credentials
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Jira Credentials</DialogTitle>
                  <DialogDescription>
                    Configure your Jira integration settings.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='jiraBaseUrl'>Jira Base URL</Label>
                    <Input
                      type='url'
                      id='jiraBaseUrl'
                      value={formData.jiraBaseUrl}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          jiraBaseUrl: e.target.value,
                        }))
                      }
                      placeholder='https://yourcompany.atlassian.net'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      The base URL of your Jira instance
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='jiraUsername'>Username or Email</Label>
                    <Input
                      type='text'
                      id='jiraUsername'
                      value={formData.jiraUsername}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          jiraUsername: e.target.value,
                        }))
                      }
                      placeholder='your.email@company.com'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      Your Jira username or email address
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='jiraApiKey'>API Token</Label>
                    <Input
                      type='password'
                      id='jiraApiKey'
                      value={formData.jiraApiKey}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          jiraApiKey: e.target.value,
                        }))
                      }
                      placeholder='Enter your Jira API token'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      Generate an API token from your Jira account settings
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
