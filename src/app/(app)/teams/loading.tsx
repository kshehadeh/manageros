import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Skeleton } from '@/components/ui/skeleton'
import { Users2 } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title={<Skeleton className='h-8 w-32' />}
      titleIcon={Users2}
      subtitle={<Skeleton className='h-5 w-64' />}
      actions={
        <div className='flex gap-2'>
          <Skeleton className='h-9 w-20 rounded-md' />
          <Skeleton className='h-9 w-28 rounded-md' />
          <Skeleton className='h-9 w-32 rounded-md' />
        </div>
      }
      columns={[
        { minWidth: '250px', skeletonWidth: '16px' },
        { width: '100px', skeletonWidth: '12px' },
        { width: '100px', skeletonWidth: '12px' },
        { width: '150px', skeletonWidth: '20px' },
      ]}
      renderRow={index => (
        <TableRow key={index}>
          <TableCell>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-0.5 flex-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-16' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-16' />
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
