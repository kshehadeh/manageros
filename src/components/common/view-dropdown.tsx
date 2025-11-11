'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Group,
  ArrowUpDown,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewOption {
  value: string
  label: string
}

interface ViewDropdownProps {
  // Grouping
  groupingValue: string
  onGroupingChange: (_value: string) => void
  groupingOptions: ViewOption[]

  // Sorting
  sortField: string
  sortDirection: 'asc' | 'desc'
  onSortChange: (_field: string, _direction: 'asc' | 'desc') => void
  sortOptions: ViewOption[]

  // Filtering
  hasActiveFilters: boolean
  onClearFilters: () => void
  filterContent: React.ReactNode

  // Customization
  title?: string
  className?: string
}

export function ViewDropdown({
  groupingValue,
  onGroupingChange,
  groupingOptions,
  sortField,
  sortDirection,
  onSortChange,
  sortOptions,
  hasActiveFilters,
  onClearFilters,
  filterContent,
  title = 'View',
  className,
}: ViewDropdownProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Check if sections should be shown
  const hasGroupingOptions = groupingOptions && groupingOptions.length > 0
  const hasSortOptions = sortOptions && sortOptions.length > 0
  const hasFilterContent = filterContent !== null && filterContent !== undefined

  // Count active settings (only for available sections)
  const activeCount = [
    hasGroupingOptions && groupingValue !== 'none' ? 1 : 0,
    hasSortOptions && sortField ? 1 : 0,
    hasFilterContent && hasActiveFilters ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  const hasActiveSettings = activeCount > 0

  const dialogContent = (
    <div className='space-y-2xl'>
      {/* Grouping Section - only show if there are grouping options */}
      {hasGroupingOptions && (
        <div className='space-y-lg'>
          <div className='flex items-center gap-md'>
            <Group className='h-4 w-4' />
            <h3 className='font-medium'>Grouping</h3>
          </div>
          <Select value={groupingValue} onValueChange={onGroupingChange}>
            <SelectTrigger>
              <SelectValue placeholder='Select grouping' />
            </SelectTrigger>
            <SelectContent>
              {groupingOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sorting Section - only show if there are sort options */}
      {hasSortOptions && (
        <div className='space-y-lg'>
          <div className='flex items-center gap-md'>
            <ArrowUpDown className='h-4 w-4' />
            <h3 className='font-medium'>Sorting</h3>
          </div>
          <div className='space-y-md'>
            <Select
              value={sortField || 'none'}
              onValueChange={value =>
                onSortChange(value === 'none' ? '' : value, sortDirection)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Select sort field' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No sorting</SelectItem>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {sortField && (
              <Select
                value={sortDirection}
                onValueChange={value =>
                  onSortChange(sortField, value as 'asc' | 'desc')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='asc'>Ascending</SelectItem>
                  <SelectItem value='desc'>Descending</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* Filtering Section - only show if there is filter content */}
      {hasFilterContent && (
        <div className='space-y-lg'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-md'>
              <Filter className='h-4 w-4' />
              <h3 className='font-medium'>Filters</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearFilters}
                className='text-sm text-muted-foreground hover:text-foreground'
              >
                Clear all
              </Button>
            )}
          </div>
          {filterContent}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop: Popover */}
      <div className='hidden md:block'>
        <Popover open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              size='icon-lg'
              className={cn(
                'flex items-center gap-md px-md',
                hasActiveSettings && 'border-primary bg-primary/5',
                className
              )}
            >
              <Settings className='h-4 w-4' />
              {title}
              {hasActiveSettings && (
                <Badge className='h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground'>
                  {activeCount}
                </Badge>
              )}
              <ChevronDown className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='end' side='bottom' sideOffset={4}>
            <div className='space-y-xl'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium'>View Settings</h3>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsDesktopOpen(false)}
                  className='h-6 w-6 p-0'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              {dialogContent}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Full-screen Dialog */}
      <div className='md:hidden'>
        <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DialogTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className={cn(
                'flex items-center gap-md',
                hasActiveSettings && 'border-primary bg-primary/5',
                className
              )}
            >
              <Settings className='h-4 w-4' />
              {title}
              {hasActiveSettings && (
                <Badge className='h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground'>
                  {activeCount}
                </Badge>
              )}
              <ChevronDown className='h-4 w-4' />
            </Button>
          </DialogTrigger>
          <DialogContent className='max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>View Settings</DialogTitle>
            </DialogHeader>
            {dialogContent}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
