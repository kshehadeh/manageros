import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className='bg-neutral-950 flex items-center justify-center'>
      {children}
    </div>
  )
}
