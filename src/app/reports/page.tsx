import { listAvailableReports, listReportInstances } from '@/lib/actions'
import { requireAuth } from '@/lib/auth-utils'
import Link from 'next/link'

export default async function ReportsPage() {
  await requireAuth({ requireOrganization: true })

  const [reports, recent] = await Promise.all([
    listAvailableReports(),
    listReportInstances(10),
  ])

  return (
    <div className='p-6 space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold'>Reports</h1>
        <p className='text-muted-foreground'>
          Run data reports and view recent runs
        </p>
      </div>

      <section className='space-y-3'>
        <h2 className='text-xl font-medium'>Available reports</h2>
        <ul className='space-y-2'>
          {reports.map(r => (
            <li
              key={r.codeId}
              className='flex items-center justify-between border rounded p-3'
            >
              <div>
                <div className='font-medium'>{r.name}</div>
                {r.description ? (
                  <div className='text-sm text-muted-foreground'>
                    {r.description}
                  </div>
                ) : null}
              </div>
              <Link className='underline' href={`/reports/${r.codeId}/run`}>
                Run
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-medium'>Recent runs</h2>
        <ul className='space-y-2'>
          {recent.map(i => (
            <li
              key={i.id}
              className='flex items-center justify-between border rounded p-3'
            >
              <div>
                <div className='font-medium'>{i.reportName}</div>
                <div className='text-sm text-muted-foreground'>
                  {new Date(i.createdAt).toLocaleString()} · {i.status}
                </div>
              </div>
              <Link className='underline' href={`/reports/instances/${i.id}`}>
                View
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
