import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { JobRoleSectionClient } from './job-role-section-client'

interface JobRoleSectionProps {
  personId: string
}

export async function JobRoleSection({ personId }: JobRoleSectionProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    return null
  }

  // Get person with job role information
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: session.user.organizationId,
    },
    include: {
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
    },
  })

  if (!person) {
    return null
  }

  // Get all available job roles for the organization
  const jobRoles = await prisma.jobRole.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    include: {
      level: true,
      domain: true,
    },
    orderBy: [
      { domain: { name: 'asc' } },
      { level: { order: 'asc' } },
      { title: 'asc' },
    ],
  })

  return (
    <section>
      <JobRoleSectionClient
        personId={personId}
        personName={person.name}
        currentJobRole={person.jobRole}
        availableJobRoles={jobRoles}
      />
    </section>
  )
}
