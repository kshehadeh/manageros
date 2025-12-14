'use server'

import { prisma } from '@/lib/db'
import {
  onboardingTemplateSchema,
  type OnboardingTemplateFormData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

/**
 * Get all onboarding templates for the current organization
 */
export async function getOnboardingTemplates() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const templates = await prisma.onboardingTemplate.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      jobRole: {
        select: {
          id: true,
          title: true,
        },
      },
      phases: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      _count: {
        select: {
          instances: true,
        },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  return templates
}

/**
 * Get a single onboarding template by ID
 */
export async function getOnboardingTemplateById(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to view templates')
  }

  const template = await prisma.onboardingTemplate.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      jobRole: {
        select: {
          id: true,
          title: true,
        },
      },
      phases: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      _count: {
        select: {
          instances: true,
        },
      },
    },
  })

  if (!template) {
    throw new Error('Template not found or access denied')
  }

  return template
}

/**
 * Get templates that match a person's team or job role
 * Used for smart template suggestions when assigning onboarding
 */
export async function getSuggestedTemplatesForPerson(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  // Get the person's team and job role
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.managerOSOrganizationId,
    },
    select: {
      teamId: true,
      jobRoleId: true,
    },
  })

  if (!person) {
    return []
  }

  // Find templates that match the person's team, job role, or are default
  const templates = await prisma.onboardingTemplate.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
      isActive: true,
      OR: [
        { isDefault: true },
        ...(person.teamId ? [{ teamId: person.teamId }] : []),
        ...(person.jobRoleId ? [{ jobRoleId: person.jobRoleId }] : []),
      ],
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      jobRole: {
        select: {
          id: true,
          title: true,
        },
      },
      phases: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      },
    },
    orderBy: [
      // Prioritize exact matches
      { teamId: person.teamId ? 'asc' : 'desc' },
      { jobRoleId: person.jobRoleId ? 'asc' : 'desc' },
      { isDefault: 'desc' },
      { name: 'asc' },
    ],
  })

  return templates
}

/**
 * Create a new onboarding template
 */
export async function createOnboardingTemplate(
  formData: OnboardingTemplateFormData
) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can create templates')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to create templates')
  }

  // Validate the form data
  const validatedData = onboardingTemplateSchema.parse(formData)

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify job role belongs to user's organization if specified
  if (validatedData.jobRoleId) {
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id: validatedData.jobRoleId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }
  }

  // If this is marked as default, unset any existing default
  if (validatedData.isDefault) {
    await prisma.onboardingTemplate.updateMany({
      where: {
        organizationId: user.managerOSOrganizationId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })
  }

  // Create the template with phases and items
  const template = await prisma.onboardingTemplate.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      organizationId: user.managerOSOrganizationId,
      teamId: validatedData.teamId || null,
      jobRoleId: validatedData.jobRoleId || null,
      isDefault: validatedData.isDefault,
      isActive: validatedData.isActive,
      phases: {
        create: validatedData.phases.map((phase, phaseIndex) => ({
          name: phase.name,
          description: phase.description,
          sortOrder: phase.sortOrder ?? phaseIndex,
          items: {
            create: phase.items.map((item, itemIndex) => ({
              title: item.title,
              description: item.description,
              type: item.type,
              sortOrder: item.sortOrder ?? itemIndex,
              isRequired: item.isRequired,
              linkedTaskId: item.linkedTaskId || null,
              linkedMeetingId: item.linkedMeetingId || null,
              linkedInitiativeId: item.linkedInitiativeId || null,
              linkedUrl: item.linkedUrl || null,
              ownerType: item.ownerType || null,
            })),
          },
        })),
      },
    },
    include: {
      phases: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  revalidatePath('/organization/onboarding-templates')
  return template
}

/**
 * Update an existing onboarding template
 */
export async function updateOnboardingTemplate(
  id: string,
  formData: OnboardingTemplateFormData
) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can update templates')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to update templates')
  }

  // Validate the form data
  const validatedData = onboardingTemplateSchema.parse(formData)

  // Verify template belongs to user's organization
  const existingTemplate = await prisma.onboardingTemplate.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingTemplate) {
    throw new Error('Template not found or access denied')
  }

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify job role belongs to user's organization if specified
  if (validatedData.jobRoleId) {
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id: validatedData.jobRoleId,
        organizationId: user.managerOSOrganizationId,
      },
    })
    if (!jobRole) {
      throw new Error('Job role not found or access denied')
    }
  }

  // If this is marked as default, unset any existing default
  if (validatedData.isDefault && !existingTemplate.isDefault) {
    await prisma.onboardingTemplate.updateMany({
      where: {
        organizationId: user.managerOSOrganizationId,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    })
  }

  // Delete existing phases and items, then recreate
  // This is simpler than trying to diff and update
  await prisma.onboardingPhase.deleteMany({
    where: { templateId: id },
  })

  // Update the template with new phases and items
  const template = await prisma.onboardingTemplate.update({
    where: { id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
      teamId: validatedData.teamId || null,
      jobRoleId: validatedData.jobRoleId || null,
      isDefault: validatedData.isDefault,
      isActive: validatedData.isActive,
      phases: {
        create: validatedData.phases.map((phase, phaseIndex) => ({
          name: phase.name,
          description: phase.description,
          sortOrder: phase.sortOrder ?? phaseIndex,
          items: {
            create: phase.items.map((item, itemIndex) => ({
              title: item.title,
              description: item.description,
              type: item.type,
              sortOrder: item.sortOrder ?? itemIndex,
              isRequired: item.isRequired,
              linkedTaskId: item.linkedTaskId || null,
              linkedMeetingId: item.linkedMeetingId || null,
              linkedInitiativeId: item.linkedInitiativeId || null,
              linkedUrl: item.linkedUrl || null,
              ownerType: item.ownerType || null,
            })),
          },
        })),
      },
    },
    include: {
      phases: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  revalidatePath('/organization/onboarding-templates')
  revalidatePath(`/organization/onboarding-templates/${id}`)
  return template
}

/**
 * Delete an onboarding template
 */
export async function deleteOnboardingTemplate(id: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can delete templates')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to delete templates')
  }

  // Verify template belongs to user's organization
  const template = await prisma.onboardingTemplate.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      _count: {
        select: {
          instances: true,
        },
      },
    },
  })

  if (!template) {
    throw new Error('Template not found or access denied')
  }

  // Check if template is in use
  if (template._count.instances > 0) {
    throw new Error(
      'Cannot delete template that has active onboarding instances. Deactivate it instead.'
    )
  }

  // Delete the template (cascades to phases and items)
  await prisma.onboardingTemplate.delete({
    where: { id },
  })

  revalidatePath('/organization/onboarding-templates')
}

/**
 * Set a template as the organization default
 */
export async function setDefaultOnboardingTemplate(id: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can set default template'
    )
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify template belongs to user's organization
  const template = await prisma.onboardingTemplate.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!template) {
    throw new Error('Template not found or access denied')
  }

  // Unset any existing default
  await prisma.onboardingTemplate.updateMany({
    where: {
      organizationId: user.managerOSOrganizationId,
      isDefault: true,
    },
    data: {
      isDefault: false,
    },
  })

  // Set this template as default
  const updatedTemplate = await prisma.onboardingTemplate.update({
    where: { id },
    data: { isDefault: true },
  })

  revalidatePath('/organization/onboarding-templates')
  return updatedTemplate
}

/**
 * Toggle template active status
 */
export async function toggleOnboardingTemplateActive(id: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can update templates')
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify template belongs to user's organization
  const template = await prisma.onboardingTemplate.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!template) {
    throw new Error('Template not found or access denied')
  }

  // Toggle active status
  const updatedTemplate = await prisma.onboardingTemplate.update({
    where: { id },
    data: { isActive: !template.isActive },
  })

  revalidatePath('/organization/onboarding-templates')
  revalidatePath(`/organization/onboarding-templates/${id}`)
  return updatedTemplate
}

/**
 * Duplicate an existing template
 */
export async function duplicateOnboardingTemplate(
  id: string,
  newName?: string
) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can duplicate templates'
    )
  }

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the existing template with all nested data
  const existingTemplate = await prisma.onboardingTemplate.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      phases: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  if (!existingTemplate) {
    throw new Error('Template not found or access denied')
  }

  // Create a duplicate with a new name
  const duplicatedTemplate = await prisma.onboardingTemplate.create({
    data: {
      name: newName || `${existingTemplate.name} (Copy)`,
      description: existingTemplate.description,
      organizationId: user.managerOSOrganizationId,
      teamId: existingTemplate.teamId,
      jobRoleId: existingTemplate.jobRoleId,
      isDefault: false, // Never duplicate as default
      isActive: true,
      phases: {
        create: existingTemplate.phases.map(phase => ({
          name: phase.name,
          description: phase.description,
          sortOrder: phase.sortOrder,
          items: {
            create: phase.items.map(item => ({
              title: item.title,
              description: item.description,
              type: item.type,
              sortOrder: item.sortOrder,
              isRequired: item.isRequired,
              linkedTaskId: item.linkedTaskId,
              linkedMeetingId: item.linkedMeetingId,
              linkedInitiativeId: item.linkedInitiativeId,
              linkedUrl: item.linkedUrl,
              ownerType: item.ownerType,
            })),
          },
        })),
      },
    },
    include: {
      phases: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  revalidatePath('/organization/onboarding-templates')
  return duplicatedTemplate
}
