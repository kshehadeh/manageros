import { PersonImportForm } from '@/components/people/person-import-form'

export default function ImportPeoplePage() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Import People</h2>
      </div>

      <PersonImportForm />
    </div>
  )
}
