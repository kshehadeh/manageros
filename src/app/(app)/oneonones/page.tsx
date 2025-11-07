import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Handshake } from 'lucide-react'
import { OneOnOneDataTable } from '@/components/oneonones/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'

export default async function OneOnOnesPage() {
  return (
    <PageContainer>
      <PageHeader
        title='1:1s'
        titleIcon={Handshake}
        subtitle='Your 1:1 meetings with anyone in your organization (only visible to participants)'
        actions={
          <Button asChild variant='outline'>
            <Link href='/oneonones/new'>New 1:1</Link>
          </Button>
        }
      />
      <PageContent>
        <PageSection>
          <OneOnOneDataTable
            settingsId='oneonones-list'
            limit={50}
            enablePagination={false}
            hideFilters={false}
          />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
