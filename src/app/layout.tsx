import './globals.css'
import ServerConditionalLayout from '@/components/server-conditional-layout'
import type { ReactNode } from 'react'

export const metadata = { title: 'ManagerOS', description: 'Manager-only MVP' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='min-h-screen bg-background text-foreground antialiased'>
        <ServerConditionalLayout>{children}</ServerConditionalLayout>
      </body>
    </html>
  )
}
