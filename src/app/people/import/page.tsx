import { redirect } from 'next/navigation'
import { PersonImportForm } from '@/components/person-import-form'
import { getCurrentUser } from '@/lib/auth-utils'

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
      </div>

      <PersonImportForm />
    </div>
  )
}
