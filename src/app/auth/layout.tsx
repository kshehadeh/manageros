import type { ReactNode } from 'react'
import { IndigoIcon } from '@/components/indigo-icon'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background text-foreground flex flex-col items-center justify-center p-4 min-h-screen'>
      <div className='mb-8'>
        <IndigoIcon width={60} height={50} color='currentColor' />
      </div>
      {children}
    </div>
  )
}
