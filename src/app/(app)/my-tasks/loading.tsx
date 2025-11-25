import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckSquare, Plus } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title='My Tasks'
      titleIcon={CheckSquare}
      subtitle='Track and manage tasks assigned to you'
      actions={
        <Button disabled className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Create Task
        </Button>
      }
      columns={[
        { minWidth: '400px', skeletonWidth: '20px' },
        { width: '120px', skeletonWidth: '16px' },
        { width: '120px', skeletonWidth: '12px' },
        { width: '150px', skeletonWidth: '20px' },
        { width: '120px', skeletonWidth: '16px' },
      ]}
      renderRow={index => (
        <TableRow key={index}>
          <TableCell>
            <div className='flex items-start gap-3'>
              <Skeleton className='h-4 w-4 rounded mt-0.5' />
              <div className='space-y-1 flex-1'>
                <Skeleton className='h-4 w-56' />
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-20 rounded-full' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-16 rounded-full' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-28' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-24' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-8 w-8 rounded-md' />
          </TableCell>
        </TableRow>
      )}
    />
  )
}
