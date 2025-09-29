'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  createEntityLink,
  updateEntityLink,
  deleteEntityLink,
} from '@/lib/actions/entity-links'
import { getIconForUrl, getUrlTitle, getUrlType } from '@/lib/utils/link-icons'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface LinkDisplayProps {
  link: EntityLink
  onEdit?: (_link: EntityLink) => void
  onDelete?: (_linkId: string) => void
  showActions?: boolean
}

export function LinkDisplay({
  link,
  onEdit,
  onDelete,
  showActions = true,
}: LinkDisplayProps) {
  const IconComponent = getIconForUrl(link.url)
  const urlTitle = link.title || getUrlTitle(link.url)
  const urlType = getUrlType(link.url)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(link)
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(link.id)
    }
  }

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
              <IconComponent className='w-5 h-5 text-gray-600' />
            </div>
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1 min-w-0'>
                <h4 className='font-medium text-sm truncate'>{urlTitle}</h4>
                <a
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-blue-600 hover:text-blue-800 truncate block'
                >
                  {link.url}
                </a>
                {link.description && (
                  <p className='text-xs text-gray-600 mt-1 line-clamp-2'>
                    {link.description}
                  </p>
                )}
              </div>

              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className='h-4 w-4 mr-2' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className='text-red-600'
                    >
                      <Trash2 className='h-4 w-4 mr-2' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className='flex items-center gap-2 mt-2'>
              <Badge variant='secondary' className='text-xs'>
                {urlType}
              </Badge>
              <span className='text-xs text-gray-500'>
                Added{' '}
                {formatDistanceToNow(new Date(link.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface LinkFormProps {
  entityType: string
  entityId: string
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<EntityLink>
}

export function LinkForm({
  entityType,
  entityId,
  onSuccess,
  onCancel,
  initialData,
}: LinkFormProps) {
  const [formData, setFormData] = useState({
    url: initialData?.url || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      if (initialData?.id) {
        // Update existing link
        await updateEntityLink({
          id: initialData.id,
          ...formData,
        })
      } else {
        // Create new link
        await createEntityLink({
          ...formData,
          entityType,
          entityId,
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message })
      } else if (error && typeof error === 'object' && 'issues' in error) {
        const fieldErrors: Record<string, string> = {}
        ;(
          error as { issues: Array<{ path: string[]; message: string }> }
        ).issues.forEach(issue => {
          fieldErrors[issue.path[0]] = issue.message
        })
        setErrors(fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {errors.general && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
          {errors.general}
        </div>
      )}

      <div>
        <Label htmlFor='url'>URL *</Label>
        <Input
          id='url'
          type='url'
          value={formData.url}
          onChange={e => handleInputChange('url', e.target.value)}
          placeholder='https://example.com'
          className={errors.url ? 'border-red-500' : ''}
          required
        />
        {errors.url && (
          <p className='text-red-600 text-sm mt-1'>{errors.url}</p>
        )}
      </div>

      <div>
        <Label htmlFor='title'>Title</Label>
        <Input
          id='title'
          type='text'
          value={formData.title}
          onChange={e => handleInputChange('title', e.target.value)}
          placeholder='Optional title for the link'
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className='text-red-600 text-sm mt-1'>{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          placeholder='Optional description of what this link is for'
          className={errors.description ? 'border-red-500' : ''}
          rows={3}
        />
        {errors.description && (
          <p className='text-red-600 text-sm mt-1'>{errors.description}</p>
        )}
      </div>

      <div className='flex justify-end gap-2'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type='submit' disabled={isSubmitting || !formData.url.trim()}>
          {isSubmitting
            ? 'Saving...'
            : initialData?.id
              ? 'Update Link'
              : 'Add Link'}
        </Button>
      </div>
    </form>
  )
}

interface LinkManagerProps {
  entityType: string
  entityId: string
  links: EntityLink[]
  onLinksChange?: () => void
}

export function LinkManager({
  entityType,
  entityId,
  links,
  onLinksChange,
}: LinkManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<EntityLink | null>(null)

  const handleAddLink = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditLink = (link: EntityLink) => {
    setEditingLink(link)
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteEntityLink({ id: linkId })
      if (onLinksChange) {
        onLinksChange()
      }
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false)
    setEditingLink(null)
    if (onLinksChange) {
      onLinksChange()
    }
  }

  const handleFormCancel = () => {
    setIsAddDialogOpen(false)
    setEditingLink(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-bold flex items-center gap-2'>
          <LinkIcon className='h-5 w-5' />
          Links ({links.length})
        </h3>
        <Button onClick={handleAddLink} size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Add Link
        </Button>
      </div>

      {links.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <LinkIcon className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>No links added yet</p>
          <p className='text-sm'>
            Add links to provide additional context and resources
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {links.map(link => (
            <LinkDisplay
              key={link.id}
              link={link}
              onEdit={handleEditLink}
              onDelete={handleDeleteLink}
            />
          ))}
        </div>
      )}

      {/* Add Link Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Add a link to provide additional context and resources for this{' '}
              {entityType.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            entityType={entityType}
            entityId={entityId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update the link details.</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <LinkForm
              entityType={entityType}
              entityId={entityId}
              initialData={editingLink}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
