import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckSquare } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title={<Skeleton className='h-8 w-32' />}
      titleIcon={CheckSquare}
      subtitle={<Skeleton className='h-5 w-64' />}
      actions={<Skeleton className='h-9 w-32 rounded-md' />}
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
