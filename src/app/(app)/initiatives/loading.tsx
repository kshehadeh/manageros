import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Button } from '@/components/ui/button'
import { Rocket, Plus } from 'lucide-react'
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
      <PageHeader>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Rocket className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Initiatives</h1>
              <Skeleton className='h-5 w-5 rounded' />
            </div>
          </div>
          <Button disabled className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Initiative
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <PageSection>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[60px]'>
                    <Skeleton className='h-4 w-8' />
                  </TableHead>
                  <TableHead className='min-w-[300px]'>
                    <Skeleton className='h-4 w-24' />
                  </TableHead>
                  <TableHead className='w-[150px]'>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead className='w-[120px]'>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead className='w-[100px]'>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
