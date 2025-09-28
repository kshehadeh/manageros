import { getOneOnOnes } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { Eye, UserCheck } from 'lucide-react'
import { EditIconButton } from '@/components/edit-icon-button'

export default async function OneOnOnesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const items = await getOneOnOnes()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-baseline gap-2'>
              <UserCheck className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>1:1s</h1>
            </div>
            <p className='page-section-subtitle'>
              Your private 1:1 meetings (only visible to participants)
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/oneonones/new'>New 1:1</Link>
          </Button>
        </div>
      </div>
      <div className='page-section'>
        <div className='grid gap-3'>
          {items.map(i => (
            <div key={i.id} className='card'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/people/${i.manager.id}`}
                      className='font-medium link-hover'
                    >
                      {i.manager.name}
                    </Link>
                    <span className='text-muted-foreground'>→</span>
                    <Link
                      href={`/people/${i.report.id}`}
                      className='font-medium link-hover'
                    >
                      {i.report.name}
                    </Link>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='text-sm text-muted-foreground'>
                    {i.scheduledAt
                      ? new Date(i.scheduledAt).toLocaleString()
                      : 'TBD'}
                  </div>
                  <Button asChild variant='outline' size='icon'>
                    <Link href={`/oneonones/${i.id}`} aria-label='View 1:1'>
                      <Eye className='w-4 h-4' />
                    </Link>
                  </Button>
                  <EditIconButton
                    href={`/oneonones/${i.id}/edit`}
                    variant='outline'
                    size='sm'
                  />
                </div>
              </div>

              {i.notes && (
                <div>
                  <h4 className='text-sm font-medium mb-1'>Notes:</h4>
                  <ReadonlyNotesField
                    content={i.notes}
                    variant='compact'
                    showEmptyState={false}
                  />
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className='text-center py-8'>
              <div className='text-muted-foreground text-sm mb-4'>
                No 1:1s yet.
              </div>
              <Button asChild variant='outline'>
                <Link href='/oneonones/new'>Create your first 1:1</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
