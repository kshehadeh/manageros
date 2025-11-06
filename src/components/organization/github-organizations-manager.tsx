'use client'

import { useState, useEffect } from 'react'
import {
  getGithubOrganizations,
  addGithubOrganization,
  removeGithubOrganization,
} from '@/lib/actions/organization'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteModal } from '@/components/common/delete-modal'
import { Trash2, Plus } from 'lucide-react'
import { FaGithub as GithubIcon } from 'react-icons/fa'

interface GithubOrganization {
  id: string
  githubOrgName: string
  createdAt: Date | string
  updatedAt: Date | string
}

export function GithubOrganizationsManager() {
  const [organizations, setOrganizations] = useState<GithubOrganization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [newOrgName, setNewOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadOrganizations = async () => {
    try {
      setIsLoading(true)
      const orgs = await getGithubOrganizations()
      setOrganizations(orgs)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load GitHub organizations'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await addGithubOrganization(newOrgName)
      setNewOrgName('')
      setIsAddDialogOpen(false)
      await loadOrganizations()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add GitHub organization'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async () => {
    if (!deleteTargetId) return

    setIsSubmitting(true)
    setError(null)

    try {
      await removeGithubOrganization(deleteTargetId)
      setDeleteTargetId(null)
      await loadOrganizations()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to remove GitHub organization'
      )
      throw err // Re-throw so DeleteModal can handle the error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center py-4'>
        <div className='text-sm text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        Specify which GitHub organizations are associated with your ManagerOS
        organization. Only pull requests from repositories in these
        organizations will be included in metrics and activity tracking.
      </p>

      {error && (
        <div className='rounded-md bg-destructive/20 border border-destructive p-3'>
          <div className='text-sm text-destructive'>{error}</div>
        </div>
      )}

      {organizations.length === 0 ? (
        <div className='rounded-md border border-dashed p-6 text-center'>
          <div className='mx-auto h-12 w-12 text-muted-foreground flex items-center justify-center'>
            <GithubIcon className='h-full w-full' />
          </div>
          <h3 className='mt-2 text-sm font-medium text-foreground'>
            No GitHub organizations configured
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Add GitHub organizations to filter PR information to only include
            repositories from those organizations.
          </p>
          <div className='mt-4'>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' onClick={() => setNewOrgName('')}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add GitHub Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add GitHub Organization</DialogTitle>
                  <DialogDescription>
                    Enter the GitHub organization name (e.g.,
                    &quot;acme-corp&quot;)
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='githubOrgName'>Organization Name</Label>
                    <Input
                      type='text'
                      id='githubOrgName'
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      placeholder='acme-corp'
                      required
                      pattern='[a-zA-Z0-9_-]+'
                    />
                    <p className='text-xs text-muted-foreground'>
                      GitHub organization name (letters, numbers, hyphens, and
                      underscores only)
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
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type='submit' disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Add Organization'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-medium text-foreground'>
              Configured Organizations
            </h4>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setNewOrgName('')}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add GitHub Organization</DialogTitle>
                  <DialogDescription>
                    Enter the GitHub organization name (e.g.,
                    &quot;acme-corp&quot;)
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='githubOrgName'>Organization Name</Label>
                    <Input
                      type='text'
                      id='githubOrgName'
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      placeholder='acme-corp'
                      required
                      pattern='[a-zA-Z0-9_-]+'
                    />
                    <p className='text-xs text-muted-foreground'>
                      GitHub organization name (letters, numbers, hyphens, and
                      underscores only)
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
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type='submit' disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Add Organization'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className='space-y-2'>
            {organizations.map(org => (
              <div
                key={org.id}
                className='flex items-center justify-between rounded-md border p-3'
              >
                <div className='flex items-center gap-2'>
                  <GithubIcon className='h-5 w-5 text-muted-foreground' />
                  <span className='text-sm font-medium text-foreground'>
                    {org.githubOrgName}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setDeleteTargetId(org.id)}
                >
                  <Trash2 className='h-4 w-4 text-destructive' />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteTargetId !== null}
        onClose={() => {
          setDeleteTargetId(null)
          setError(null)
        }}
        onConfirm={handleRemove}
        title='Remove GitHub Organization'
        description={
          deleteTargetId
            ? `Are you sure you want to remove "${
                organizations.find(o => o.id === deleteTargetId)?.githubOrgName
              }"? This will stop filtering PRs from this organization.`
            : undefined
        }
        entityName='GitHub organization'
        isLoading={isSubmitting}
      />
    </div>
  )
}
