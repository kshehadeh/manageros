'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Plus, Play, Loader2, ChevronDown, Pickaxe } from 'lucide-react'
import { runToleranceCheck } from '@/lib/actions/tolerance-rules'
import { toast } from 'sonner'

export function ToleranceRulesActionsDropdown() {
  const [isRunning, setIsRunning] = useState(false)
  const router = useRouter()

  const handleRunCheck = async () => {
    setIsRunning(true)
    try {
      const result = await runToleranceCheck()

      if (result.errors.length > 0) {
        toast.warning(
          `Tolerance check completed with ${result.exceptionsCreated} exceptions created, but ${result.errors.length} error(s) occurred`,
          {
            description: result.errors.slice(0, 3).join('; '),
          }
        )
      } else if (result.exceptionsCreated > 0) {
        toast.success(
          `Tolerance check completed successfully. ${result.exceptionsCreated} exception(s) created.`
        )
      } else {
        toast.success('Tolerance check completed. No new exceptions found.')
      }

      router.refresh()
    } catch (error) {
      console.error('Error running tolerance check:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to run tolerance check'
      )
    } finally {
      setIsRunning(false)
    }
  }

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
          <Link
            href='/organization/settings/tolerance-rules/new'
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Plus className='w-4 h-4' />
            Create Rule
          </Link>
          <button
            type='button'
            onClick={() => {
              handleRunCheck()
              close()
            }}
            disabled={isRunning}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isRunning ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Running Check...
              </>
            ) : (
              <>
                <Play className='w-4 h-4' />
                Run Check Now
              </>
            )}
          </button>
        </div>
      )}
    </ActionDropdown>
  )
}
