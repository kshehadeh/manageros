'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteReportInstance } from '@/lib/actions/report'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteReportButtonProps {
  instanceId: string
}

export function DeleteReportButton({ instanceId }: DeleteReportButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteReportInstance(instanceId)
      toast.success('Report run deleted successfully')
      router.push('/reports')
    } catch (error) {
      console.error('Failed to delete report instance:', error)
      toast.error('Failed to delete report run')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' size='sm'>
          <Trash2 className='h-4 w-4 mr-2' />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Report Run</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this report run? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
