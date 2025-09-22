import Link from 'next/link'
import { PersonActionsDropdown } from '@/components/person-actions-dropdown'
import { Person, Team } from '@prisma/client'

// Define the type for a person with all the relations needed for direct reports
// This is flexible enough to handle different query patterns used across the app
type DirectReport = Person & {
  team?:
    | Team
    | {
        id: string
        name: string
      }
    | null
  user?: {
    id: string
    name: string
    email: string
  } | null
  reports?: Person[]
  manager?: Person | null
  _count?: {
    oneOnOnes: number
    feedback: number
    tasks: number
    reports: number
  }
}

interface DirectReportCardProps {
  report: DirectReport
  variant?: 'simple' | 'detailed' | 'compact'
  showActions?: boolean
  currentPerson?: Person | null
  isAdmin?: boolean
  className?: string
}

export function DirectReportCard({
  report,
  variant = 'simple',
  showActions = false,
  currentPerson,
  isAdmin = false,
  className = '',
}: DirectReportCardProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'rag-green'
      case 'inactive':
        return 'rag-red'
      default:
        return 'rag-amber'
    }
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors ${className}`}
      >
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <Link
              href={`/people/${report.id}`}
              className='text-lg font-semibold text-white hover:text-blue-400 transition-colors'
            >
              {report.name}
            </Link>
            {report.role && (
              <p className='text-sm text-neutral-400 mt-1'>{report.role}</p>
            )}
            {report.email && (
              <p className='text-xs text-neutral-500 mt-1'>{report.email}</p>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                report.status === 'active'
                  ? 'bg-green-900/20 text-green-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {report.status}
            </span>
          </div>
        </div>

        {/* Team */}
        {report.team && (
          <div className='mb-4'>
            <span className='text-xs text-neutral-500'>Team:</span>
            <span className='text-sm text-neutral-300 ml-1'>
              {report.team.name}
            </span>
          </div>
        )}

        {/* Statistics */}
        {report._count && (
          <div className='grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800'>
            <div className='text-center'>
              <div className='text-xl font-bold text-blue-400'>
                {report._count.oneOnOnes}
              </div>
              <div className='text-xs text-neutral-500'>1:1s</div>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold text-green-400'>
                {report._count.feedback}
              </div>
              <div className='text-xs text-neutral-500'>Feedback</div>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold text-purple-400'>
                {report._count.tasks}
              </div>
              <div className='text-xs text-neutral-500'>Tasks</div>
            </div>
            <div className='text-center'>
              <div className='text-xl font-bold text-orange-400'>
                {report._count.reports}
              </div>
              <div className='text-xs text-neutral-500'>Reports</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2 mt-4 pt-4 border-t border-neutral-800'>
          <Link
            href={`/people/${report.id}`}
            className='flex-1 text-center px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors'
          >
            View Profile
          </Link>
          <Link
            href={`/oneonones/new?reportId=${report.id}`}
            className='flex-1 text-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
          >
            Add 1:1 Meeting
          </Link>
          <Link
            href={`/people/${report.id}`}
            className='flex-1 text-center px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors'
          >
            Add Feedback
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div>
          <Link
            href={`/people/${report.id}`}
            className='font-medium hover:text-blue-400'
          >
            {report.name}
          </Link>
          <div className='text-neutral-400 text-sm'>{report.role ?? ''}</div>
          <div className='text-xs text-neutral-500 mt-1'>
            {report.team?.name && (
              <span>
                Team:{' '}
                <Link
                  href={`/teams/${report.team.id}`}
                  className='hover:text-blue-400'
                >
                  {report.team.name}
                </Link>
              </span>
            )}
            {report._count?.reports && report._count.reports > 0 && (
              <span>
                {' '}
                • {report._count.reports} report
                {report._count.reports !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(report.status)}`}>
          {report.status.replace('_', ' ')}
        </span>
      </div>
    )
  }

  // Default 'simple' variant
  return (
    <div className={`border border-neutral-800 rounded-xl p-3 ${className}`}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Link
              href={`/people/${report.id}`}
              className='font-medium hover:text-blue-400'
            >
              {report.name}
            </Link>
            <span className={`badge ${getStatusBadgeClass(report.status)}`}>
              {report.status.replace('_', ' ')}
            </span>
          </div>
          <div className='text-sm text-neutral-400'>{report.role ?? ''}</div>
          <div className='text-xs text-neutral-500'>{report.email}</div>
          {report.team && (
            <div className='text-xs text-neutral-500 mt-1'>
              Team: {report.team.name}
            </div>
          )}
        </div>
        {showActions && currentPerson && (
          <PersonActionsDropdown
            person={{
              ...report,
              team:
                report.team && 'createdAt' in report.team ? report.team : null,
              reports: report.reports || [],
              manager: report.manager || null,
            }}
            currentPerson={currentPerson}
            isAdmin={isAdmin}
            size='sm'
          />
        )}
      </div>
    </div>
  )
}
