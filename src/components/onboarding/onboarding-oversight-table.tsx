'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  completeOnboarding,
  cancelOnboarding,
} from '@/lib/actions/onboarding-instance'
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Circle,
} from 'lucide-react'
import type { OnboardingStatus } from '@/generated/prisma'

interface OnboardingInstanceRow {
  id: string
  status: OnboardingStatus
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  person: {
    id: string
    name: string
    email: string | null
    avatar: string | null
    team: { id: string; name: string } | null
    jobRole: { id: string; title: string } | null
  }
  template: {
    id: string
    name: string
  }
  manager: {
    id: string
    name: string
    avatar: string | null
  } | null
  mentor: {
    id: string
    name: string
    avatar: string | null
  } | null
  progress: {
    total: number
    completed: number
    percentComplete: number
    requiredTotal: number
    requiredCompleted: number
  }
  isStuck?: boolean
  daysSinceActivity?: number
}

interface OnboardingOversightTableProps {
  instances: OnboardingInstanceRow[]
  showActions?: boolean
}

const STATUS_BADGES: Record<
  OnboardingStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: typeof Circle
  }
> = {
  NOT_STARTED: { label: 'Not Started', variant: 'secondary', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: Clock },
  COMPLETED: { label: 'Completed', variant: 'outline', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
}

export function OnboardingOversightTable({
  instances,
  showActions = true,
}: OnboardingOversightTableProps) {
  const router = useRouter()
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
    setCompletingId(null)
    try {
      await completeOnboarding(id)
      router.refresh()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to complete onboarding'
      )
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(null)
    try {
      await cancelOnboarding(id)
      router.refresh()
    } catch (error) {
      console.error('Error cancelling onboarding:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to cancel onboarding'
      )
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (instances.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>No onboarding instances found</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Started</TableHead>
            {showActions && (
              <TableHead className='text-right'>Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map(instance => {
            const statusConfig = STATUS_BADGES[instance.status]
            const StatusIcon = statusConfig.icon

            return (
              <TableRow key={instance.id}>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={instance.person.avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(instance.person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/people/${instance.person.id}`}
                        className='font-medium hover:underline'
                      >
                        {instance.person.name}
                      </Link>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        {instance.person.team && (
                          <span>{instance.person.team.name}</span>
                        )}
                        {instance.person.jobRole && (
                          <>
                            {instance.person.team && <span>·</span>}
                            <span>{instance.person.jobRole.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className='text-sm'>{instance.template.name}</span>
                </TableCell>
                <TableCell>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Progress
                        value={instance.progress.percentComplete}
                        className='w-20 h-2'
                      />
                      <span className='text-sm text-muted-foreground'>
                        {instance.progress.completed}/{instance.progress.total}
                      </span>
                    </div>
                    {instance.isStuck && (
                      <Badge variant='destructive' className='text-xs'>
                        <AlertTriangle className='w-3 h-3 mr-1' />
                        Stuck ({instance.daysSinceActivity}d)
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>
                    <StatusIcon className='w-3 h-3 mr-1' />
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {instance.manager ? (
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage
                          src={instance.manager.avatar || undefined}
                        />
                        <AvatarFallback className='text-xs'>
                          {getInitials(instance.manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-sm'>{instance.manager.name}</span>
                    </div>
                  ) : (
                    <span className='text-sm text-muted-foreground'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className='text-sm text-muted-foreground'>
                    {instance.startedAt
                      ? new Date(instance.startedAt).toLocaleDateString()
                      : instance.createdAt
                        ? new Date(instance.createdAt).toLocaleDateString()
                        : '—'}
                  </span>
                </TableCell>
                {showActions && (
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreHorizontal className='w-4 h-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem asChild>
                          <Link href={`/people/${instance.person.id}`}>
                            View Person
                          </Link>
                        </DropdownMenuItem>
                        {instance.status === 'IN_PROGRESS' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setCompletingId(instance.id)}
                              disabled={
                                instance.progress.requiredCompleted <
                                instance.progress.requiredTotal
                              }
                            >
                              <CheckCircle className='w-4 h-4 mr-2' />
                              Complete Onboarding
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-destructive'
                              onClick={() => setCancellingId(instance.id)}
                            >
                              <XCircle className='w-4 h-4 mr-2' />
                              Cancel Onboarding
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Complete Dialog */}
      <AlertDialog
        open={completingId !== null}
        onOpenChange={open => !open && setCompletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Onboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this onboarding as complete? This
              indicates the person has finished all required onboarding items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => completingId && handleComplete(completingId)}
            >
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog
        open={cancellingId !== null}
        onOpenChange={open => !open && setCancellingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Onboarding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this onboarding? This action
              cannot be undone. The person&apos;s progress will be preserved but
              they will no longer see the onboarding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => cancellingId && handleCancel(cancellingId)}
            >
              Cancel Onboarding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
