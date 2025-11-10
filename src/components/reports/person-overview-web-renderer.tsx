'use client'

import { Link } from '@/components/ui/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { taskStatusUtils } from '@/lib/task-status'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Target,
  GitPullRequest,
  Ticket,
} from 'lucide-react'
import type { TaskStatus } from '@/lib/task-status'

export interface PersonOverviewWebRendererProps {
  output: {
    person: { id: string; name: string }
    period: { fromDate: string; toDate: string }
    metrics: {
      completedTasksCount: number
      initiativesCount: number
      activeJiraTicketsCount: number
      activePrsCount: number
    }
    completedTasks: Array<{
      id: string
      title: string
      status: string
      updatedAt?: string | null
      completedAt?: string | null
      initiativeId?: string | null
    }>
    initiatives: Array<{
      id: string
      title: string
      summary: string | null
      status: string
      openTasks: Array<{
        id: string
        title: string
        status: string
        updatedAt?: string | null
        completedAt?: string | null
        initiativeId?: string | null
      }>
      completedTasks: Array<{
        id: string
        title: string
        status: string
        updatedAt?: string | null
        completedAt?: string | null
        initiativeId?: string | null
      }>
    }>
    githubPrs?: Array<{
      title: string
      repo: string
      state: string
      mergedAt?: string | null
      createdAt: string
      updatedAt: string
    }>
    jiraTickets?: Array<{
      key: string
      title: string
      status: string
      project: string
      issueType: string
      priority?: string
      lastUpdated: string
      created: string
    }>
  }
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

function getStatusIcon(status: string) {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('done') || statusLower.includes('completed')) {
    return <CheckCircle2 className='h-4 w-4 text-green-600' />
  }
  if (statusLower.includes('doing') || statusLower.includes('in progress')) {
    return <Clock className='h-4 w-4 text-blue-600' />
  }
  if (statusLower.includes('blocked')) {
    return <AlertCircle className='h-4 w-4 text-red-600' />
  }
  return <Circle className='h-4 w-4 text-gray-400' />
}

function getStatusVariant(
  status: string
): 'success' | 'warning' | 'error' | 'neutral' {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('done') || statusLower.includes('completed')) {
    return 'success'
  }
  if (statusLower.includes('doing') || statusLower.includes('in progress')) {
    return 'warning'
  }
  if (statusLower.includes('blocked')) {
    return 'error'
  }
  return 'neutral'
}

export function PersonOverviewWebRenderer({
  output,
}: PersonOverviewWebRendererProps) {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>{output.person.name}</h1>
        <p className='text-muted-foreground mt-2'>
          Period: {formatDate(output.period.fromDate)} →{' '}
          {formatDate(output.period.toDate)}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completed Tasks
            </CardTitle>
            <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {output.metrics.completedTasksCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Initiatives</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {output.metrics.initiativesCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Jira Tickets</CardTitle>
            <Ticket className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {output.metrics.activeJiraTicketsCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pull Requests</CardTitle>
            <GitPullRequest className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {output.metrics.activePrsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {output.completedTasks.length === 0 ? (
            <p className='text-muted-foreground'>No completed tasks found</p>
          ) : (
            <div className='space-y-2'>
              {output.completedTasks.map(task => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className='flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors group'
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <CheckCircle2 className='h-4 w-4 text-green-600 shrink-0' />
                    <span className='font-medium group-hover:underline'>
                      {task.title}
                    </span>
                  </div>
                  {task.completedAt && (
                    <Badge variant='outline' className='text-xs'>
                      {formatDate(task.completedAt)}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiatives Section */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>Initiatives</h2>
        {output.initiatives.length === 0 ? (
          <Card>
            <CardContent className='py-8'>
              <p className='text-muted-foreground text-center'>
                No initiatives found
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {output.initiatives.map(initiative => (
              <Card key={initiative.id}>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <Link href={`/initiatives/${initiative.id}`}>
                        <CardTitle className='hover:underline'>
                          {initiative.title}
                        </CardTitle>
                      </Link>
                      {initiative.summary && (
                        <p className='text-sm text-muted-foreground mt-2'>
                          {initiative.summary}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        initiative.status.toLowerCase().includes('done') ||
                        initiative.status.toLowerCase().includes('completed')
                          ? 'success'
                          : initiative.status
                                .toLowerCase()
                                .includes('in progress')
                            ? 'warning'
                            : 'neutral'
                      }
                      className='ml-2'
                    >
                      {initiative.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Open Tasks */}
                  {initiative.openTasks.length > 0 && (
                    <div>
                      <h4 className='text-sm font-semibold mb-2'>Open Tasks</h4>
                      <div className='space-y-1'>
                        {initiative.openTasks.map(task => (
                          <Link
                            key={task.id}
                            href={`/tasks/${task.id}`}
                            className='flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group text-sm'
                          >
                            {getStatusIcon(task.status)}
                            <span className='flex-1 group-hover:underline'>
                              {task.title}
                            </span>
                            <Badge
                              variant={getStatusVariant(task.status)}
                              className='text-xs'
                            >
                              {taskStatusUtils.getLabel(
                                task.status as TaskStatus
                              )}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks in Period */}
                  {initiative.completedTasks.length > 0 && (
                    <div>
                      <h4 className='text-sm font-semibold mb-2'>
                        Completed This Period
                      </h4>
                      <div className='space-y-1'>
                        {initiative.completedTasks.map(task => (
                          <Link
                            key={task.id}
                            href={`/tasks/${task.id}`}
                            className='flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group text-sm'
                          >
                            <CheckCircle2 className='h-4 w-4 text-green-600' />
                            <span className='flex-1 group-hover:underline'>
                              {task.title}
                            </span>
                            {task.completedAt && (
                              <Badge variant='outline' className='text-xs'>
                                {formatDate(task.completedAt)}
                              </Badge>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {initiative.openTasks.length === 0 &&
                    initiative.completedTasks.length === 0 && (
                      <p className='text-sm text-muted-foreground'>
                        No tasks assigned to you for this initiative
                      </p>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
