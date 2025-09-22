import { getDirectReports } from '@/lib/actions'
import { DirectReportCard } from '@/components/direct-report-card'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function DirectReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const [directReports, currentPerson] = await Promise.all([
    getDirectReports(),
    prisma.person.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
    }),
  ])

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Direct Reports</h1>
          <p className='text-neutral-400 mt-1'>
            Manage and view your team members
          </p>
        </div>
        <div className='text-sm text-neutral-500'>
          {directReports.length} report{directReports.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Direct Reports Cards */}
      {directReports.length === 0 ? (
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
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {directReports.map(report => (
            <DirectReportCard
              key={report.id}
              report={report}
              variant='detailed'
              showActions={true}
              currentPerson={currentPerson}
              isAdmin={isAdmin(session.user)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
