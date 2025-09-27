import { ReadonlyNotesFieldDemo } from '@/components/readonly-notes-field-demo'

export default function ReadonlyNotesFieldTestPage() {
  return (
    <div className='container mx-auto py-8'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold mb-2'>
          Readonly Notes Field Component
        </h1>
        <p className='text-muted-foreground'>
          A component for displaying markdown content with automatic link
          detection and rich formatting.
        </p>
      </div>

      <ReadonlyNotesFieldDemo />
    </div>
  )
}
