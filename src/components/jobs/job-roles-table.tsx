'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { MarkdownEditor } from '@/components/markdown-editor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createJobRole, updateJobRole, deleteJobRole } from '@/lib/actions'
import { type JobRoleFormData } from '@/lib/actions/job-roles'
import {
  Edit2,
  Trash2,
  Eye,
  Plus,
  MoreHorizontal,
  Search,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface JobRole {
  id: string
  title: string
  description: string | null
  level: { id: string; name: string }
  domain: { id: string; name: string }
  people: Array<{ id: string; name: string }>
}

interface JobLevel {
  id: string
  name: string
}

interface JobDomain {
  id: string
  name: string
}

interface FilterState {
  keyword: string
  levelId: string
  domainId: string
}

interface JobRolesTableProps {
  jobRoles: JobRole[]
  levels: JobLevel[]
  domains: JobDomain[]
  onRefresh: () => void
}

export function JobRolesTable({
  jobRoles,
  levels,
  domains,
  onRefresh,
}: JobRolesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<JobRoleFormData>({
    title: '',
    description: '',
    levelId: '',
    domainId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    levelId: 'all',
    domainId: 'all',
  })
  const filterRef = useRef<HTMLDivElement>(null)

  // Close filter popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter job roles based on current filters
  const filteredJobRoles = jobRoles.filter(jobRole => {
    const matchesKeyword = jobRole.title
      .toLowerCase()
      .includes(filters.keyword.toLowerCase())
    const matchesLevel =
      filters.levelId === 'all' || jobRole.level.id === filters.levelId
    const matchesDomain =
      filters.domainId === 'all' || jobRole.domain.id === filters.domainId

    return matchesKeyword && matchesLevel && matchesDomain
  })

  const handleSubmit = async (e: React.FormEvent, id?: string) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (id) {
        await updateJobRole(id, formData)
        setEditingId(null)
        setIsDialogOpen(false)
      } else {
        await createJobRole(formData)
        setIsDialogOpen(false)
      }
      setFormData({
        title: '',
        description: '',
        levelId: '',
        domainId: '',
      })
      onRefresh()
    } catch (error) {
      console.error('Error submitting job role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (jobRole: JobRole) => {
    setEditingId(jobRole.id)
    setFormData({
      title: jobRole.title,
      description: jobRole.description || '',
      levelId: jobRole.level.id,
      domainId: jobRole.domain.id,
    })
    setIsDialogOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsDialogOpen(false)
    setFormData({
      title: '',
      description: '',
      levelId: '',
      domainId: '',
    })
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this job role? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await deleteJobRole(id)
      onRefresh()
    } catch (error) {
      console.error('Error deleting job role:', error)
    }
  }

  const startCreating = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      levelId: levels.length > 0 ? levels[0].id : '',
      domainId: domains.length > 0 ? domains[0].id : '',
    })
    setIsDialogOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Job Roles</h3>
        <Button
          onClick={startCreating}
          disabled={levels.length === 0 || domains.length === 0}
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Job Role
        </Button>
      </div>

      {levels.length === 0 || domains.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>
            Configure job levels and domains before creating job roles.
          </p>
        </div>
      ) : jobRoles.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>
            No job roles configured yet.
          </p>
          <Button onClick={startCreating}>Create first job role</Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Filter Controls */}
          <div className='relative' ref={filterRef}>
            <div className='flex items-center gap-3'>
              {/* Search Box */}
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search job roles...'
                  value={filters.keyword}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      keyword: e.target.value,
                    }))
                  }
                  className='pl-10'
                />
              </div>

              {/* Filter Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 ${
                  Object.values(filters).some(
                    filter => filter !== '' && filter !== 'all'
                  ) && 'border-primary bg-primary/10'
                }`}
              >
                <Filter className='h-4 w-4' />
                Filter
                {Object.values(filters).some(
                  filter => filter !== '' && filter !== 'all'
                ) && <div className='h-2 w-2 bg-primary rounded-full' />}
              </Button>
            </div>

            {/* Filter Popup */}
            {showFilters && (
              <div className='absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg p-4 z-50'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-medium'>Filters</h3>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowFilters(false)}
                    >
                      ×
                    </Button>
                  </div>

                  {/* Level Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Level</label>
                    <Select
                      value={filters.levelId}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, levelId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All levels' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All levels</SelectItem>
                        {levels.map(level => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Domain Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Domain</label>
                    <Select
                      value={filters.domainId}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, domainId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All domains' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All domains</SelectItem>
                        {domains.map(domain => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setFilters({
                          keyword: '',
                          levelId: 'all',
                          domainId: 'all',
                        })
                      }
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className='text-sm text-muted-foreground'>
            Showing {filteredJobRoles.length} of {jobRoles.length} job roles
          </div>
          {filteredJobRoles.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>
                No job roles match your filters.
              </p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow className='hover:bg-accent/50'>
                    <TableHead className='text-muted-foreground'>
                      Title
                    </TableHead>
                    <TableHead className='text-muted-foreground'>
                      Level
                    </TableHead>
                    <TableHead className='text-muted-foreground'>
                      Domain
                    </TableHead>
                    <TableHead className='text-muted-foreground w-[120px]'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobRoles.map(jobRole => (
                    <TableRow key={jobRole.id} className='hover:bg-accent/50'>
                      <TableCell className='font-medium'>
                        <div className='flex flex-col gap-1'>
                          <div>{jobRole.title}</div>
                          <div className='text-xs text-muted-foreground'>
                            {jobRole.people.length} person
                            {jobRole.people.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{jobRole.level.name}</TableCell>
                      <TableCell>{jobRole.domain.name}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/job-roles/${jobRole.id}`}
                                className='flex items-center'
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(jobRole)}
                            >
                              <Edit2 className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(jobRole.id)}
                              className='text-destructive focus:text-destructive'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Job Role' : 'Create Job Role'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={e => handleSubmit(e, editingId || undefined)}
            className='space-y-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='title'>Job Title *</Label>
                <Input
                  id='title'
                  type='text'
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder='e.g., Senior Software Engineer'
                  required
                />
              </div>
              <div>
                <Label htmlFor='level'>Level *</Label>
                <Select
                  value={formData.levelId}
                  onValueChange={value =>
                    setFormData({ ...formData, levelId: value })
                  }
                  required
                >
                  <SelectTrigger id='level'>
                    <SelectValue placeholder='Select a level' />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(level => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='domain'>Domain *</Label>
              <Select
                value={formData.domainId}
                onValueChange={value =>
                  setFormData({ ...formData, domainId: value })
                }
                required
              >
                <SelectTrigger id='domain'>
                  <SelectValue placeholder='Select a domain' />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(domain => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='description'>Description (Markdown)</Label>
              <MarkdownEditor
                value={formData.description || ''}
                onChange={value =>
                  setFormData({ ...formData, description: value })
                }
                placeholder='### Responsibilities...'
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.levelId ||
                  !formData.domainId
                }
              >
                {isSubmitting
                  ? editingId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingId
                    ? 'Update'
                    : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
