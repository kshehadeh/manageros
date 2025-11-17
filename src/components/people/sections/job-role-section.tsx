import { prisma } from '@/lib/db'

import { JobRoleSectionClient } from './job-role-section-client'
import { PageSection } from '@/components/ui/page-section'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
interface JobRoleSectionProps {
  personId: string
  personName: string
  currentJobRole?: {
    id: string
    title: string
    level: {
      id: string
      name: string
    }
    domain: {
      id: string
      name: string
    }
  } | null
}

export async function JobRoleSection({
  personId,
  personName,
  currentJobRole,
}: JobRoleSectionProps) {
  const user = await getCurrentUser()

  if (!(await getActionPermission(user, 'job-role.view', personId))) {
    return null
  }

  // Use provided currentJobRole or fetch person data if not provided (for backward compatibility)
  let personJobRole = currentJobRole
  let personNameToUse = personName

  if (!personJobRole || !personNameToUse) {
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        organizationId: user.managerOSOrganizationId || '',
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

    personJobRole = personJobRole || person.jobRole
    personNameToUse = personNameToUse || person.name
  }

  // Get all available job roles for the organization
  const jobRoles = await prisma.jobRole.findMany({
    where: {
      organizationId: user.managerOSOrganizationId || '',
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
    <PageSection>
      <JobRoleSectionClient
        personId={personId}
        personName={personNameToUse}
        currentJobRole={personJobRole}
        availableJobRoles={jobRoles}
      />
    </PageSection>
  )
}
