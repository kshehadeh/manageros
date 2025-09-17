import Link from 'next/link'

interface DirectReport {
  id: string
  name: string
  email?: string | null
  role?: string | null
  status: string
  team?: {
    id: string
    name: string
  } | null
  user?: {
    id: string
    name: string
    email: string
  } | null
  _count: {
    oneOnOnes: number
    feedback: number
    tasks: number
    reports: number
  }
}

interface DirectReportsCardsProps {
  directReports: DirectReport[]
}

export function DirectReportsCards({ directReports }: DirectReportsCardsProps) {
  if (directReports.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-neutral-400 mb-2'>
          <svg
            className='mx-auto h-12 w-12'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-neutral-300 mb-1'>
          No Direct Reports
        </h3>
        <p className='text-neutral-500'>
          You don&apos;t have any direct reports yet.
        </p>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {directReports.map(report => (
        <div
          key={report.id}
          className='bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors'
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
      ))}
    </div>
  )
}
