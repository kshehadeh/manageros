'use client'

import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Upload, UserPlus, ChevronDown, Pickaxe, Download } from 'lucide-react'
import {
  exportPeopleToCSV,
  type ExportPeopleFilters,
} from '@/lib/actions/csv-export'
import { toast } from 'sonner'

interface PeopleActionsDropdownProps {
  canCreatePeople: boolean
  canImportPeople: boolean
  filters?: ExportPeopleFilters
}

export function PeopleActionsDropdown({
  canCreatePeople,
  canImportPeople,
  filters,
}: PeopleActionsDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const csvContent = await exportPeopleToCSV(filters || {})

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `people-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('People exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to export people'
      )
    } finally {
      setIsExporting(false)
    }
  }

  // Export is always available, so dropdown is always shown

  return (
    <ActionDropdown
      trigger={({ toggle }) => (
        <Button
          variant='outline'
          size='sm'
          className='flex items-center gap-2'
          onClick={toggle}
        >
          <Pickaxe className='w-4 h-4' />
          <span className='hidden sm:inline'>Actions</span>
          <ChevronDown className='w-4 h-4' />
        </Button>
      )}
    >
      {({ close }) => (
        <div className='py-1'>
          {canCreatePeople && (
            <Link
              href='/people/new'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <UserPlus className='w-4 h-4' />
              Create Person
            </Link>
          )}
          {canImportPeople && (
            <Link
              href='/people/import'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Upload className='w-4 h-4' />
              Import CSV
            </Link>
          )}
          <button
            type='button'
            onClick={() => {
              handleExport()
              close()
            }}
            disabled={isExporting}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Download className='w-4 h-4' />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      )}
    </ActionDropdown>
  )
}
