'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useBreadcrumb } from './breadcrumb-provider'

export default function Breadcrumb() {
  const { breadcrumbs } = useBreadcrumb()

  return (
    <nav className='flex items-center space-x-2 text-sm'>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className='flex items-center space-x-2'>
          {index > 0 && (
            <ChevronRight className='h-4 w-4 text-muted-foreground' />
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className='text-foreground font-medium'>{item.name}</span>
          ) : (
            <Link
              href={item.href}
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
