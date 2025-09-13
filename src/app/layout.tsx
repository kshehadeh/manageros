import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = { title: 'ManagerOS', description: 'Manager-only MVP' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl p-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">ManagerOS</h1>
            <nav className="flex gap-3 text-sm">
              <Link href="/" className="btn">Home</Link>
              <Link href="/initiatives" className="btn">Initiatives</Link>
              <Link href="/people" className="btn">People</Link>
              <Link href="/oneonones" className="btn">1:1s</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
