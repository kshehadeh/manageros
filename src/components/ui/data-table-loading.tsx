import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { LucideIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReactNode } from 'react'

interface ColumnConfig {
  width?: string
  minWidth?: string
  skeletonWidth?: string
  skeletonHeight?: string
  className?: string
}

interface DataTableLoadingProps {
  title: string | ReactNode
  titleIcon: LucideIcon
  subtitle?: string | ReactNode
  actions?: ReactNode
  columns: ColumnConfig[]
  rowCount?: number
  renderRow?: (index: number) => ReactNode
  pageSectionClassName?: string
}

export function DataTableLoading({
  title,
  titleIcon: TitleIcon,
  subtitle,
  actions,
  columns,
  rowCount = 10,
  renderRow,
  pageSectionClassName,
}: DataTableLoadingProps) {
  const defaultRenderRow = (index: number) => (
    <TableRow key={index}>
      {columns.map((column, colIndex) => (
        <TableCell key={colIndex} className={column.className}>
          <Skeleton
            className={column.skeletonHeight || 'h-4'}
            style={{
              width: column.skeletonWidth || '100%',
            }}
          />
        </TableCell>
      ))}
    </TableRow>
  )

  return (
    <PageContainer>
      <PageHeader
        title={title}
        titleIcon={TitleIcon}
        subtitle={subtitle}
        actions={actions}
      />

      <PageContent>
        <PageSection className={pageSectionClassName}>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead
                      key={index}
                      className={column.className}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                      }}
                    >
                      <Skeleton
                        className={column.skeletonHeight || 'h-4'}
                        style={{
                          width: column.skeletonWidth || '100%',
                        }}
                      />
                    </TableHead>
                  ))}
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: rowCount }).map((_, i) =>
                  renderRow ? renderRow(i) : defaultRenderRow(i)
                )}
              </TableBody>
            </Table>
          </div>
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
