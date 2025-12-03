'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { runToleranceCheck } from '@/lib/actions/tolerance-rules'
import { toast } from 'sonner'
import { Play, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RunToleranceCheckButton() {
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
    <Button onClick={handleRunCheck} disabled={isRunning} variant='outline'>
      {isRunning ? (
        <>
          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
          Running Check...
        </>
      ) : (
        <>
          <Play className='w-4 h-4 mr-2' />
          Run Check Now
        </>
      )}
    </Button>
  )
}
