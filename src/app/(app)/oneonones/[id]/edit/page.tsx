import { getOneOnOneById } from '@/lib/actions/oneonone'
import { OneOnOneForm } from '@/components/oneonone-form'
import { OneOnOneDetailClient } from '@/components/oneonone-detail-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Handshake } from 'lucide-react'

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
    const oneOnOne = await getOneOnOneById(id)

    return (
      <OneOnOneDetailClient
        managerName={oneOnOne.manager.name}
        reportName={oneOnOne.report.name}
        oneOnOneId={oneOnOne.id}
      >
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold flex items-center gap-2'>
              <Handshake className='w-5 h-5' />
              Edit 1:1 Meeting
            </h2>
            <div className='flex items-center gap-2'>
              <Button asChild variant='outline'>
                <Link href={`/oneonones/${id}`}>View Meeting</Link>
              </Button>
            </div>
          </div>

          <OneOnOneForm existingOneOnOne={oneOnOne} />
        </div>
      </OneOnOneDetailClient>
    )
  } catch (error) {
    console.error('Error loading one-on-one:', error)
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold flex items-center gap-2'>
            <Handshake className='w-5 h-5' />
            Edit 1:1 Meeting
          </h2>
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
