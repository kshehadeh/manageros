import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PersonImportForm } from '@/components/person-import-form'

export default async function ImportPeoplePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!isAdmin(session.user)) {
    redirect('/people')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Import People from CSV
          </h1>
          <p className='mt-2 text-gray-600'>
            Upload a CSV file to import multiple people into your organization.
          </p>
        </div>

        <div className='bg-white shadow rounded-lg p-6'>
          <div className='mb-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-2'>
              CSV Format Requirements
            </h2>
            <div className='bg-gray-50 p-4 rounded-md'>
              <p className='text-sm text-gray-700 mb-2'>
                Your CSV file should have the following columns (in any order):
              </p>
              <ul className='text-sm text-gray-700 space-y-1'>
                <li>
                  <strong>name</strong> - Person&apos;s full name (required)
                </li>
                <li>
                  <strong>email</strong> - Person&apos;s email address
                  (required)
                </li>
                <li>
                  <strong>role</strong> - Person&apos;s job title/role
                  (optional)
                </li>
                <li>
                  <strong>team</strong> - Team name (optional, must match
                  existing team)
                </li>
                <li>
                  <strong>manager</strong> - Manager&apos;s name (optional, must
                  match existing person)
                </li>
              </ul>
            </div>
          </div>

          <div className='mb-6'>
            <h3 className='text-md font-medium text-gray-900 mb-2'>
              Example CSV Format
            </h3>
            <div className='bg-gray-50 p-4 rounded-md overflow-x-auto'>
              <pre className='text-sm text-gray-700'>
                {`name,email,role,team,manager
 John Doe,john.doe@company.com,Software Engineer,Engineering,
 Jane Smith,jane.smith@company.com,Senior Engineer,Engineering,John Doe
 Bob Johnson,bob.johnson@company.com,Product Manager,Product,
 Alice Brown,alice.brown@company.com,Designer,Design,Bob Johnson`}
              </pre>
            </div>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <PersonImportForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
