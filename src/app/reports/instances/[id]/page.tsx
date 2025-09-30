import { getReportInstance } from '@/lib/actions'
import { requireAuth } from '@/lib/auth-utils'
import ReactMarkdown from 'react-markdown'

export default async function ReportInstancePage({ params }: { params: { id: string } }) {
  await requireAuth({ requireOrganization: true })
  const instance = await getReportInstance(params.id)

  const markdown = (instance as any).outputMarkdown as string | undefined

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>{instance.reportName}</h1>
        <p className='text-muted-foreground'>Ran at {new Date(instance.createdAt).toLocaleString()}</p>
      </div>

      {markdown ? (
        <section className='prose max-w-none dark:prose-invert'>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </section>
      ) : null}
    </div>
  )
}

