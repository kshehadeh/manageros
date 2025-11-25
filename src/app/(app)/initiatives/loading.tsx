import { DataTableLoading } from '@/components/ui/data-table-loading'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Rocket, Plus } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <DataTableLoading
      title='Initiatives'
      titleIcon={Rocket}
      subtitle={<Skeleton className='h-5 w-5 rounded' />}
      actions={
        <Button disabled className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Create Initiative
        </Button>
      }
      columns={[
        { width: '60px', skeletonWidth: '8px' },
        { minWidth: '300px', skeletonWidth: '24px' },
        { width: '150px', skeletonWidth: '16px' },
        { width: '120px', skeletonWidth: '20px' },
        { width: '100px', skeletonWidth: '16px' },
      ]}
      renderRow={index => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className='h-5 w-5 rounded-full' />
          </TableCell>
          <TableCell>
            <div className='flex items-start gap-2'>
              <Skeleton className='h-5 w-5 rounded-full mt-1' />
              <div className='space-y-1 flex-1'>
                <Skeleton className='h-4 w-48' />
                <Skeleton className='h-3 w-32' />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-24' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-4 w-20' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-16 rounded-full' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-8 w-8 rounded-md' />
          </TableCell>
        </TableRow>
      )}
    />
  )
}
