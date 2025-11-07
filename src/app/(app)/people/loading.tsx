import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Button } from '@/components/ui/button'
import { User, UserPlus, Upload, Workflow } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='People'
        titleIcon={User}
        subtitle={<Skeleton className='h-5 w-5 rounded' />}
        actions={
          <div className='flex flex-wrap items-center gap-3'>
            <Button
              disabled
              variant='outline'
              className='flex items-center gap-2'
            >
              <Workflow className='w-4 h-4' />
              <span className='hidden sm:inline'>Chart</span>
            </Button>
            <Button
              disabled
              variant='outline'
              className='flex items-center gap-2'
            >
              <Upload className='w-4 h-4' />
              <span className='hidden sm:inline'>Import CSV</span>
            </Button>
            <Button disabled className='flex items-center gap-2'>
              <UserPlus className='w-4 h-4' />
              <span className='hidden sm:inline'>Create Person</span>
            </Button>
          </div>
        }
      />

      <PageContent>
        <PageSection className='-mx-3 md:mx-0'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[250px]'>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead className='w-[150px]'>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                  <TableHead className='w-[150px]'>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead className='w-[150px]'>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead className='w-[100px]'>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Skeleton className='h-10 w-10 rounded-full' />
                        <div className='flex flex-col space-y-1'>
                          <Skeleton className='h-4 w-32' />
                          <Skeleton className='h-3 w-40' />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-28' />
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
                ))}
              </TableBody>
            </Table>
          </div>
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
