import { redirect } from 'next/navigation'
import { PersonImportForm } from '@/components/person-import-form'
import { getCurrentUser } from '@/lib/auth-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ImportPeoplePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Import People</h2>
        <Button asChild variant='outline'>
          <Link href='/people'>Back to People</Link>
        </Button>
      </div>

      <PersonImportForm />
    </div>
  )
}
