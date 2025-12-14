'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  toggleOnboardingTemplateActive,
  deleteOnboardingTemplate,
  setDefaultOnboardingTemplate,
  duplicateOnboardingTemplate,
} from '@/lib/actions/onboarding-template'
import {
  Pencil,
  Trash2,
  ClipboardList,
  Copy,
  Star,
  MoreHorizontal,
  Users,
  Briefcase,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type {
  OnboardingTemplate,
  OnboardingPhase,
  Team,
  JobRole,
} from '@/generated/prisma'

type TemplateWithRelations = OnboardingTemplate & {
  team: Pick<Team, 'id' | 'name'> | null
  jobRole: Pick<JobRole, 'id' | 'title'> | null
  phases: (OnboardingPhase & { items: { id: string }[] })[]
  _count: {
    instances: number
  }
}

interface OnboardingTemplatesListProps {
  templates: TemplateWithRelations[]
}

export function OnboardingTemplatesList({
  templates,
}: OnboardingTemplatesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      await toggleOnboardingTemplateActive(id)
      router.refresh()
    } catch (error) {
      console.error('Error toggling template:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to toggle template'
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(null)
    try {
      await deleteOnboardingTemplate(id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to delete template'
      )
    }
  }

  const handleSetDefault = async (id: string) => {
    setActionLoading(id)
    try {
      await setDefaultOnboardingTemplate(id)
      router.refresh()
    } catch (error) {
      console.error('Error setting default template:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to set default template'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setActionLoading(id)
    try {
      await duplicateOnboardingTemplate(id)
      router.refresh()
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to duplicate template'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const getTotalItems = (template: TemplateWithRelations) => {
    return template.phases.reduce((acc, phase) => acc + phase.items.length, 0)
  }

  if (templates.length === 0) {
    return (
      <div className='text-center py-8'>
        <ClipboardList className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
        <p className='text-muted-foreground mb-4'>
          No onboarding templates configured
        </p>
        <Button asChild>
          <a href='/organization/onboarding-templates/new'>
            Create your first template
          </a>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Structure</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map(template => (
            <TableRow key={template.id}>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{template.name}</span>
                  {template.isDefault && (
                    <Badge variant='secondary' className='text-xs'>
                      <Star className='w-3 h-3 mr-1' />
                      Default
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className='text-sm text-muted-foreground mt-1 line-clamp-1'>
                    {template.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className='flex flex-col gap-1'>
                  {template.team && (
                    <Badge variant='outline' className='w-fit text-xs'>
                      <Users className='w-3 h-3 mr-1' />
                      {template.team.name}
                    </Badge>
                  )}
                  {template.jobRole && (
                    <Badge variant='outline' className='w-fit text-xs'>
                      <Briefcase className='w-3 h-3 mr-1' />
                      {template.jobRole.title}
                    </Badge>
                  )}
                  {!template.team && !template.jobRole && (
                    <span className='text-sm text-muted-foreground'>
                      Organization-wide
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className='text-sm'>
                  <span className='font-medium'>{template.phases.length}</span>{' '}
                  <span className='text-muted-foreground'>phases</span>
                  <span className='mx-1'>·</span>
                  <span className='font-medium'>
                    {getTotalItems(template)}
                  </span>{' '}
                  <span className='text-muted-foreground'>items</span>
                </div>
              </TableCell>
              <TableCell>
                <div className='text-sm'>
                  <span className='font-medium'>
                    {template._count.instances}
                  </span>{' '}
                  <span className='text-muted-foreground'>
                    {template._count.instances === 1 ? 'instance' : 'instances'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={template.isActive}
                  onCheckedChange={() => handleToggle(template.id)}
                  disabled={togglingId === template.id}
                />
              </TableCell>
              <TableCell className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={actionLoading === template.id}
                    >
                      <MoreHorizontal className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/organization/onboarding-templates/${template.id}`
                        )
                      }
                    >
                      <Pencil className='w-4 h-4 mr-2' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(template.id)}
                    >
                      <Copy className='w-4 h-4 mr-2' />
                      Duplicate
                    </DropdownMenuItem>
                    {!template.isDefault && (
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(template.id)}
                      >
                        <Star className='w-4 h-4 mr-2' />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() => setDeletingId(template.id)}
                      disabled={template._count.instances > 0}
                    >
                      <Trash2 className='w-4 h-4 mr-2' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={open => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Onboarding Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone. Templates with active onboarding instances cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
