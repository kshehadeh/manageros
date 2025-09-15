import { getOneOnOnes } from '@/lib/actions'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default async function OneOnOnesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const items = await getOneOnOnes()
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>1:1s</h2>
          <p className='text-sm text-neutral-400 mt-1'>
            Your private 1:1 meetings (only visible to participants)
          </p>
        </div>
        <Link
          href='/oneonones/new'
          className='btn bg-blue-600 hover:bg-blue-700'
        >
          New 1:1
        </Link>
      </div>
      <div className='grid gap-3'>
        {items.map(i => (
          <div key={i.id} className='card'>
            <div className='flex items-center justify-between mb-3'>
              <div>
                <div className='flex items-center gap-2'>
                  <Link
                    href={`/people/${i.manager.id}`}
                    className='font-medium hover:text-blue-400'
                  >
                    {i.manager.name}
                  </Link>
                  <span className='text-neutral-400'>→</span>
                  <Link
                    href={`/people/${i.report.id}`}
                    className='font-medium hover:text-blue-400'
                  >
                    {i.report.name}
                  </Link>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <div className='text-sm text-neutral-400'>
                  {i.scheduledAt
                    ? new Date(i.scheduledAt).toLocaleString()
                    : 'TBD'}
                </div>
                <Link
                  href={`/oneonones/${i.id}`}
                  className='btn btn-sm bg-blue-600 hover:bg-blue-700'
                >
                  View
                </Link>
                <Link
                  href={`/oneonones/${i.id}/edit`}
                  className='btn btn-sm bg-neutral-700 hover:bg-neutral-600'
                >
                  Edit
                </Link>
              </div>
            </div>

            {i.notes && (
              <div>
                <h4 className='text-sm font-medium mb-1'>Notes:</h4>
                <div className='text-sm prose prose-sm max-w-none'>
                  <ReactMarkdown>{i.notes}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className='text-center py-8'>
            <div className='text-neutral-400 text-sm mb-4'>No 1:1s yet.</div>
            <Link
              href='/oneonones/new'
              className='btn bg-blue-600 hover:bg-blue-700'
            >
              Create your first 1:1
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
