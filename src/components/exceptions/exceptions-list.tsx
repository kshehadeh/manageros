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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  acknowledgeException,
  ignoreException,
  resolveException,
} from '@/lib/actions/exceptions'
import type { Exception } from '@/types/exception'
import { CheckCircle2, XCircle, Eye, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ExceptionsListProps {
  exceptions: Exception[]
}

export function ExceptionsList({
  exceptions: initialExceptions,
}: ExceptionsListProps) {
  const router = useRouter()
  const [exceptions, setExceptions] = useState(initialExceptions)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusChange = async (
    exceptionId: string,
    status: 'acknowledged' | 'ignored' | 'resolved'
  ) => {
    setUpdatingId(exceptionId)
    try {
      switch (status) {
        case 'acknowledged':
          await acknowledgeException(exceptionId)
          break
        case 'ignored':
          await ignoreException(exceptionId)
          break
        case 'resolved':
          await resolveException(exceptionId)
          break
      }
      router.refresh()
      // Update local state
      setExceptions(prev =>
        prev.map(ex =>
          ex.id === exceptionId
            ? {
                ...ex,
                status,
                acknowledgedAt:
                  status === 'acknowledged' ? new Date() : ex.acknowledgedAt,
                ignoredAt: status === 'ignored' ? new Date() : ex.ignoredAt,
                resolvedAt: status === 'resolved' ? new Date() : ex.resolvedAt,
              }
            : ex
        )
      )
    } catch (error) {
      console.error('Error updating exception:', error)
      alert(
        error instanceof Error ? error.message : 'Failed to update exception'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='destructive'>Active</Badge>
      case 'acknowledged':
        return <Badge variant='default'>Acknowledged</Badge>
      case 'ignored':
        return <Badge variant='secondary'>Ignored</Badge>
      case 'resolved':
        return <Badge variant='outline'>Resolved</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return <Badge variant='destructive'>Urgent</Badge>
      case 'warning':
        return <Badge variant='outline'>Warning</Badge>
      default:
        return <Badge>{severity}</Badge>
    }
  }

  const getEntityLink = (exception: Exception) => {
    switch (exception.entityType) {
      case 'Person':
        return `/people/${exception.entityId}`
      case 'Initiative':
        return `/initiatives/${exception.entityId}`
      case 'OneOnOne':
        // For 1:1s, entityId is managerId-reportId
        return `/people/${exception.entityId.split('-')[0]}`
      case 'FeedbackCampaign':
        return `/people/${exception.entityId}/feedback-campaigns`
      default:
        return '#'
    }
  }

  const filteredExceptions = exceptions.filter(ex => {
    if (statusFilter !== 'all' && ex.status !== statusFilter) return false
    if (severityFilter !== 'all' && ex.severity !== severityFilter) return false
    return true
  })

  if (exceptions.length === 0) {
    return (
      <div className='text-center py-8'>
        <AlertCircle className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>No exceptions found</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex gap-4'>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='acknowledged'>Acknowledged</SelectItem>
            <SelectItem value='ignored'>Ignored</SelectItem>
            <SelectItem value='resolved'>Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by severity' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Severities</SelectItem>
            <SelectItem value='warning'>Warning</SelectItem>
            <SelectItem value='urgent'>Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rule</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExceptions.map(exception => (
            <TableRow key={exception.id}>
              <TableCell className='font-medium'>
                {exception.rule?.name || 'Unknown Rule'}
              </TableCell>
              <TableCell>{exception.message}</TableCell>
              <TableCell>{getSeverityBadge(exception.severity)}</TableCell>
              <TableCell>{getStatusBadge(exception.status)}</TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {formatDistanceToNow(exception.createdAt, { addSuffix: true })}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  {exception.status === 'active' && (
                    <>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleStatusChange(exception.id, 'acknowledged')
                        }
                        disabled={updatingId === exception.id}
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleStatusChange(exception.id, 'ignored')
                        }
                        disabled={updatingId === exception.id}
                      >
                        <XCircle className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleStatusChange(exception.id, 'resolved')
                        }
                        disabled={updatingId === exception.id}
                      >
                        <CheckCircle2 className='w-4 h-4' />
                      </Button>
                    </>
                  )}
                  <Button variant='ghost' size='sm' asChild>
                    <a href={getEntityLink(exception)}>View</a>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
