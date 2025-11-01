import { Button } from '@/components/ui/button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Handshake } from 'lucide-react'
import { OneOnOneDataTable } from '@/components/oneonones/data-table'
import { PageSection } from '@/components/ui/page-section'

export default async function OneOnOnesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-baseline gap-2'>
              <Handshake className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>1:1s</h1>
            </div>
            <p className='page-section-subtitle'>
              Your 1:1 meetings with anyone in your organization (only visible
              to participants)
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/oneonones/new'>New 1:1</Link>
          </Button>
        </div>
      </div>
      <PageSection>
        <OneOnOneDataTable
          settingsId='oneonones-list'
          limit={50}
          enablePagination={false}
          hideFilters={false}
        />
      </PageSection>
    </div>
  )
}
