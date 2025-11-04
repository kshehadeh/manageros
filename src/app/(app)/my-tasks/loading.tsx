import { Loading } from '@/components/ui/loading'

export default function LoadingPage() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <div className='flex flex-col items-center space-y-4'>
        <Loading size='lg' />
        <p className='text-sm text-muted-foreground'>Loading my tasks...</p>
      </div>
    </div>
  )
}
