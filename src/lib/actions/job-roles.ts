'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

// Validation schemas
const jobRoleSchema = z.object({
  title: z
    .string()
    .min(1, 'Job role title is required')
    .max(100, 'Job role title must be less than 100 characters'),
  description: z.string().optional(),
  levelId: z.string().min(1, 'Level is required'),
  domainId: z.string().min(1, 'Domain is required'),
})

const jobLevelSchema = z.object({
  name: z
    .string()
    .min(1, 'Level name is required')
    .max(100, 'Level name must be less than 100 characters'),
  order: z.number().int().min(0).default(0),
})

const jobDomainSchema = z.object({
  name: z
    .string()
    .min(1, 'Domain name is required')
    .max(100, 'Domain name must be less than 100 characters'),
})

export type JobRoleFormData = z.infer<typeof jobRoleSchema>
export type JobLevelFormData = z.infer<typeof jobLevelSchema>
export type JobDomainFormData = z.infer<typeof jobDomainSchema>

// JobRole Actions
export async function getJobRoles() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await prisma.jobRole.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      include: {
        level: true,
        domain: true,
        people: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { level: { order: 'asc' } },
        { domain: { name: 'asc' } },
        { title: 'asc' },
      ],
    })
  } catch (error) {
    console.error('Error fetching job roles:', error)
    return []
  }
}

export async function getJobRole(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization to view job roles')
    }

    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        level: true,
        domain: true,
        people: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            status: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }

    return jobRole
  } catch (error) {
    console.error('Error fetching job role:', error)
    throw error
  }
}

export async function getJobRolesForSelection() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await prisma.jobRole.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      select: {
        id: true,
        title: true,
        level: {
          select: {
            name: true,
          },
        },
        domain: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { level: { order: 'asc' } },
        { domain: { name: 'asc' } },
        { title: 'asc' },
      ],
    })
  } catch (error) {
    console.error('Error fetching job roles for selection:', error)
    return []
  }
}

export async function createJobRole(data: JobRoleFormData) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization to create job roles')
    }

    const validatedData = jobRoleSchema.parse(data)

    // Check permissions - only admins can create job roles
    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can create job roles'
      )
    }

    // Validate that level and domain belong to this organization
    const [level, domain] = await Promise.all([
      prisma.jobLevel.findFirst({
        where: {
          id: validatedData.levelId,
          organizationId: user.managerOSOrganizationId,
        },
      }),
      prisma.jobDomain.findFirst({
        where: {
          id: validatedData.domainId,
          organizationId: user.managerOSOrganizationId,
        },
      }),
    ])

    if (!level) {
      throw new Error('Job level not found or access denied')
    }

    if (!domain) {
      throw new Error('Job domain not found or access denied')
    }

    // Check if job role with this title already exists
    const existingRole = await prisma.jobRole.findFirst({
      where: {
        title: validatedData.title,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (existingRole) {
      throw new Error(
        'A job role with this title already exists in your organization'
      )
    }

    const jobRole = await prisma.jobRole.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        levelId: validatedData.levelId,
        domainId: validatedData.domainId,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        level: true,
        domain: true,
      },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return jobRole
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map(e => e.message).join(', '))
    }
    throw error
  }
}

export async function updateJobRole(
  id: string,
  data: Partial<JobRoleFormData>
) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization to update job roles')
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can update job roles'
      )
    }

    const validatedData = jobRoleSchema.partial().parse(data)

    // Validate that job role belongs to this organization
    const existingRole = await prisma.jobRole.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!existingRole) {
      throw new Error('Job role not found or access denied')
    }

    // If updating level or domain, validate they belong to this organization
    if (validatedData.levelId) {
      const level = await prisma.jobLevel.findFirst({
        where: {
          id: validatedData.levelId,
          organizationId: user.managerOSOrganizationId,
        },
      })

      if (!level) {
        throw new Error('Job level not found or access denied')
      }
    }

    if (validatedData.domainId) {
      const domain = await prisma.jobDomain.findFirst({
        where: {
          id: validatedData.domainId,
          organizationId: user.managerOSOrganizationId,
        },
      })

      if (!domain) {
        throw new Error('Job domain not found or access denied')
      }
    }

    // If updating title, check for duplicates
    if (validatedData.title && validatedData.title !== existingRole.title) {
      const duplicateRole = await prisma.jobRole.findFirst({
        where: {
          title: validatedData.title,
          organizationId: user.managerOSOrganizationId,
          id: { not: id },
        },
      })

      if (duplicateRole) {
        throw new Error(
          'A job role with this title already exists in your organization'
        )
      }
    }

    const updatedRole = await prisma.jobRole.update({
      where: { id },
      data: validatedData,
      include: {
        level: true,
        domain: true,
      },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return updatedRole
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map(e => e.message).join(', '))
    }
    throw error
  }
}

export async function deleteJobRole(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization to delete job roles')
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can delete job roles'
      )
    }

    // Validate that job role belongs to this organization
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        people: true,
      },
    })

    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }

    // Check if job role is assigned to people
    if (jobRole.people.length > 0) {
      throw new Error(
        'Cannot delete job role that is assigned to people. Please reassign people to other roles first.'
      )
    }

    await prisma.jobRole.delete({
      where: { id },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map(e => e.message).join(', '))
    }
    throw error
  }
}

// JobLevel Actions
export async function getJobLevels() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await prisma.jobLevel.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching job levels:', error)
    return []
  }
}

export async function getJobLevelsForSelection() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await prisma.jobLevel.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching job levels for selection:', error)
    return []
  }
}

export async function createJobLevel(data: JobLevelFormData) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to create job levels'
      )
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can manage job levels'
      )
    }

    const validatedData = jobLevelSchema.parse(data)

    // Check if level with this name already exists
    const existingLevel = await prisma.jobLevel.findFirst({
      where: {
        name: validatedData.name,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (existingLevel) {
      throw new Error(
        'A job level with this name already exists in your organization'
      )
    }

    // Get the highest order value and add 1
    const maxOrderLevel = await prisma.jobLevel.findFirst({
      where: { organizationId: user.managerOSOrganizationId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const nextOrder = (maxOrderLevel?.order ?? -1) + 1

    const jobLevel = await prisma.jobLevel.create({
      data: {
        name: validatedData.name,
        order: nextOrder,
        organizationId: user.managerOSOrganizationId,
      },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return jobLevel
  } catch (error) {
    console.error('Error creating job level:', error)
    throw error
  }
}

export async function updateJobLevel(
  id: string,
  data: Partial<JobLevelFormData>
) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to update job levels'
      )
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can update job levels'
      )
    }

    const validatedData = jobLevelSchema.partial().parse(data)

    // Validate that level belongs to this organization
    const jobLevel = await prisma.jobLevel.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!jobLevel) {
      throw new Error('Job level not found or access denied')
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== jobLevel.name) {
      const duplicateLevel = await prisma.jobLevel.findFirst({
        where: {
          name: validatedData.name,
          organizationId: user.managerOSOrganizationId,
          id: { not: id },
        },
      })

      if (duplicateLevel) {
        throw new Error(
          'A job level with this name already exists in your organization'
        )
      }
    }

    const updatedLevel = await prisma.jobLevel.update({
      where: { id },
      data: validatedData,
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return updatedLevel
  } catch (error) {
    console.error('Error updating job level:', error)
    throw error
  }
}

export async function updateJobLevelOrder(
  levels: { id: string; order: number }[]
) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to update job level order'
      )
    }

    if (user.role !== 'ADMIN') {
      throw new Error(
        'Only organization administrators can update job level order'
      )
    }

    // Update all levels in a transaction
    await prisma.$transaction(
      levels.map(({ id, order }) =>
        prisma.jobLevel.updateMany({
          where: {
            id,
            organizationId: user.managerOSOrganizationId!,
          },
          data: { order },
        })
      )
    )

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return { success: true }
  } catch (error) {
    console.error('Error updating job level order:', error)
    throw error
  }
}

export async function deleteJobLevel(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to delete job levels'
      )
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can delete job levels'
      )
    }

    // Validate that level belongs to this organization
    const jobLevel = await prisma.jobLevel.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        jobRoles: true,
      },
    })

    if (!jobLevel) {
      throw new Error('Job level not found or access denied')
    }

    // Check if job roles are using this level
    if (jobLevel.jobRoles.length > 0) {
      throw new Error(
        'Cannot delete job level that has job roles assigned to it. Please reassign job roles to other levels first.'
      )
    }

    await prisma.jobLevel.delete({
      where: { id },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return { success: true }
  } catch (error) {
    console.error('Error deleting job level:', error)
    throw error
  }
}

// JobDomain Actions
export async function getJobDomains() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await prisma.jobDomain.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching job domains:', error)
    return []
  }
}

export async function getJobDomainsForSelection() {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return []
    }

    return await prisma.jobDomain.findMany({
      where: { organizationId: user.managerOSOrganizationId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching job domains for selection:', error)
    return []
  }
}

export async function createJobDomain(data: JobDomainFormData) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to create job domains'
      )
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can manage job domains'
      )
    }

    const validatedData = jobDomainSchema.parse(data)

    // Check if domain with this name already exists
    const existingDomain = await prisma.jobDomain.findFirst({
      where: {
        name: validatedData.name,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (existingDomain) {
      throw new Error(
        'A job domain with this name already exists in your organization'
      )
    }

    const jobDomain = await prisma.jobDomain.create({
      data: {
        name: validatedData.name,
        organizationId: user.managerOSOrganizationId,
      },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return jobDomain
  } catch (error) {
    console.error('Error creating job domain:', error)
    throw error
  }
}

export async function updateJobDomain(
  id: string,
  data: Partial<JobDomainFormData>
) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to update job domains'
      )
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can update job domains'
      )
    }

    const validatedData = jobDomainSchema.partial().parse(data)

    // Validate that domain belongs to this organization
    const jobDomain = await prisma.jobDomain.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!jobDomain) {
      throw new Error('Job domain not found or access denied')
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== jobDomain.name) {
      const duplicateDomain = await prisma.jobDomain.findFirst({
        where: {
          name: validatedData.name,
          organizationId: user.managerOSOrganizationId,
          id: { not: id },
        },
      })

      if (duplicateDomain) {
        throw new Error(
          'A job domain with this name already exists in your organization'
        )
      }
    }

    const updatedDomain = await prisma.jobDomain.update({
      where: { id },
      data: validatedData,
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return updatedDomain
  } catch (error) {
    console.error('Error updating job domain:', error)
    throw error
  }
}

export async function deleteJobDomain(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error(
        'User must belong to an organization to delete job domains'
      )
    }

    if (!isAdminOrOwner(user)) {
      throw new Error(
        'Only organization administrators or owners can delete job domains'
      )
    }

    // Validate that domain belongs to this organization
    const jobDomain = await prisma.jobDomain.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
      include: {
        jobRoles: true,
      },
    })

    if (!jobDomain) {
      throw new Error('Job domain not found or access denied')
    }

    // Check if job roles are using this domain
    if (jobDomain.jobRoles.length > 0) {
      throw new Error(
        'Cannot delete job domain that has job roles assigned to it. Please reassign job roles to other domains first.'
      )
    }

    await prisma.jobDomain.delete({
      where: { id },
    })

    revalidatePath('/organization/settings')
    revalidatePath('/organization/job-roles')

    return { success: true }
  } catch (error) {
    console.error('Error deleting job domain:', error)
    throw error
  }
}
