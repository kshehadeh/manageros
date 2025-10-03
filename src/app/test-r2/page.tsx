import { R2ConfigTest } from '@/components/test/r2-config-test'

export default function TestPage() {
  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>R2 Configuration Test</h1>
        <div className='flex justify-center'>
          <R2ConfigTest />
        </div>
      </div>
    </div>
  )
}
