import { getOneOnOneById } from '@/lib/actions/oneonone'
import { getPeopleForOneOnOne } from '@/lib/actions/person'
import { OneOnOneForm } from '@/components/oneonone-form'
import { OneOnOneDetailClient } from '@/components/oneonone-detail-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EditOneOnOnePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditOneOnOnePage({
  params,
}: EditOneOnOnePageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  try {
    const [oneOnOne, people] = await Promise.all([
      getOneOnOneById(id),
      getPeopleForOneOnOne(),
    ])

    return (
      <OneOnOneDetailClient
        managerName={oneOnOne.manager.name}
        reportName={oneOnOne.report.name}
        oneOnOneId={oneOnOne.id}
      >
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>Edit 1:1 Meeting</h2>
              <p className='text-sm text-neutral-400 mt-1'>
                Update meeting details and notes
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button asChild variant='outline'>
                <Link href={`/oneonones/${id}`}>View Meeting</Link>
              </Button>
            </div>
          </div>

          <OneOnOneForm people={people} existingOneOnOne={oneOnOne} />
        </div>
      </OneOnOneDetailClient>
    )
  } catch (error) {
    console.error('Error loading one-on-one:', error)
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>Edit 1:1 Meeting</h2>
            <p className='text-sm text-neutral-400 mt-1'>
              Update meeting details and notes
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button asChild variant='outline'>
              <Link href={`/oneonones/${id}`}>View Meeting</Link>
            </Button>
          </div>
        </div>

        <div className='card text-center py-8'>
          <h3 className='font-semibold mb-2'>Meeting Not Found</h3>
          <p className='text-sm text-neutral-400 mb-4'>
            The 1:1 meeting you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </div>
      </div>
    )
  }
}
