import { getOneOnOneById } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface OneOnOneViewPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OneOnOneViewPage ({ params }: OneOnOneViewPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  try {
    const oneOnOne = await getOneOnOneById(id)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">1:1 Meeting</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Meeting between {oneOnOne.manager.name} and {oneOnOne.report.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/oneonones/${oneOnOne.id}/edit`}
              className="btn bg-blue-600 hover:bg-blue-700"
            >
              Edit Meeting
            </Link>
            <Link 
              href="/oneonones" 
              className="btn bg-neutral-700 hover:bg-neutral-600"
            >
              Back to 1:1s
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Meeting Details */}
          <section className="card">
            <h3 className="font-semibold mb-4">Meeting Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Manager:</span>
                <div className="text-sm text-neutral-400">
                  <Link 
                    href={`/people/${oneOnOne.manager.id}`} 
                    className="hover:text-blue-400"
                  >
                    {oneOnOne.manager.name}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {oneOnOne.manager.email} • {oneOnOne.manager.role || 'No role'}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium">Report:</span>
                <div className="text-sm text-neutral-400">
                  <Link 
                    href={`/people/${oneOnOne.report.id}`} 
                    className="hover:text-blue-400"
                  >
                    {oneOnOne.report.name}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {oneOnOne.report.email} • {oneOnOne.report.role || 'No role'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Scheduled Date:</span>
                <div className="text-sm text-neutral-400">
                  {oneOnOne.scheduledAt 
                    ? new Date(oneOnOne.scheduledAt).toLocaleString()
                    : 'Not scheduled'
                  }
                </div>
              </div>

            </div>
          </section>
        </div>

        {/* Meeting Notes */}
        <section className="card">
          <h3 className="font-semibold mb-4">Meeting Notes</h3>
          <div className="text-sm text-neutral-400">
            {oneOnOne.notes ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{oneOnOne.notes}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No notes recorded yet
              </div>
            )}
          </div>
        </section>
      </div>
    )
  } catch (error) {
    console.error('Error loading one-on-one:', error)
    notFound()
  }
}
