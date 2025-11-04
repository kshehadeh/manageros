import { PersonImportForm } from '@/components/people/person-import-form'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'

function ImportPeoplePageContent() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Import People</h2>
      </div>

      <PersonImportForm />
    </div>
  )
}

export default function ImportPeoplePage() {
  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <ImportPeoplePageContent />
      </RequireAuthServer>
    </Suspense>
  )
}
