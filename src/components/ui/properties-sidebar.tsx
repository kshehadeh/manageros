'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PropertyItem {
  key: string
  label: string
  icon?: LucideIcon
  value: ReactNode
}

interface PropertiesSidebarProps {
  properties: PropertyItem[]
  className?: string
}

export function PropertiesSidebar({
  properties,
  className,
}: PropertiesSidebarProps) {
  if (properties.length === 0) return null

  return (
    <div className={cn('text-sm', className)}>
      <table className='w-full'>
        <tbody>
          {properties.map(property => (
            <tr key={property.key}>
              <td className='py-sm pr-lg'>
                <div className='flex items-center gap-md text-muted-foreground'>
                  {property.icon && (
                    <property.icon className='w-3.5 h-3.5 shrink-0' />
                  )}
                  <span className='font-medium whitespace-nowrap'>
                    {property.label}
                  </span>
                </div>
              </td>
              <td className='py-sm'>{property.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

PropertiesSidebar.displayName = 'PropertiesSidebar'
