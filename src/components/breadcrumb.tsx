'use client'

import { Link } from '@/components/ui/link'
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { useBreadcrumb } from './breadcrumb-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function BreadcrumbSkeleton() {
  return (
    <div className='flex items-center gap-1'>
      <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
      <span className='text-muted-foreground text-xs'>Loading...</span>
    </div>
  )
}

export default function Breadcrumb() {
  const { breadcrumbs } = useBreadcrumb()

  // Show dropdown on mobile (sm and below), regular breadcrumb on larger screens
  return (
    <>
      {/* Desktop breadcrumb */}
      <nav className='hidden sm:flex items-center space-x-2 text-sm'>
        {breadcrumbs.map((item, index) => (
          <div
            key={`${item.href}-${index}`}
            className='flex items-center space-x-2'
          >
            {index > 0 && (
              <ChevronRight className='h-4 w-4 text-muted-foreground' />
            )}
            {item.isLoading ? (
              <BreadcrumbSkeleton />
            ) : index === breadcrumbs.length - 1 ? (
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

      {/* Mobile breadcrumb dropdown */}
      <div className='sm:hidden'>
        <DropdownMenu>
          <DropdownMenuTrigger className='flex items-center space-x-1 text-sm text-foreground font-medium hover:text-foreground/80 transition-colors'>
            {breadcrumbs[breadcrumbs.length - 1]?.isLoading ? (
              <BreadcrumbSkeleton />
            ) : (
              <>
                <span className='truncate max-w-[120px]'>
                  {breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard'}
                </span>
                <ChevronDown className='h-4 w-4 text-muted-foreground' />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            {breadcrumbs.map((item, index) => (
              <DropdownMenuItem
                key={`${item.href}-${index}`}
                asChild={!item.isLoading}
                disabled={item.isLoading}
              >
                {item.isLoading ? (
                  <div className='w-full px-2 py-1.5'>
                    <BreadcrumbSkeleton />
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`w-full ${
                      index === breadcrumbs.length - 1
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
