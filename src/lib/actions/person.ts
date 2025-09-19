'use server'

import { prisma } from '@/lib/db'
import {
  personSchema,
  type PersonFormData,
  personUpdateSchema,
  type PersonUpdateData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client'

export async function getPeople() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.person.findMany({
      where: {
        status: 'active',
        organizationId: user.organizationId,
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return []
  }
}

export async function getPeopleHierarchy() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }

    // Get all people with their manager and reports relationships
    const people = await prisma.person.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            reports: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            },
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Define the type for a person with all included relations
    type PersonWithRelations = (typeof people)[0]

    // Define the hierarchy item type
    type HierarchyItem = PersonWithRelations & {
      level: number
    }

    // Build hierarchical structure
    const hierarchy: HierarchyItem[] = []

    // Find top-level people (those without managers)
    const topLevelPeople = people.filter(person => !person.managerId)

    // Recursive function to build hierarchy
    function buildHierarchy(person: PersonWithRelations, level: number = 0) {
      hierarchy.push({
        ...person,
        level,
      })

      // Add reports recursively
      person.reports.forEach(report => {
        const fullReport = people.find(p => p.id === report.id)
        if (fullReport) {
          buildHierarchy(fullReport, level + 1)
        }
      })
    }

    // Build hierarchy starting from top-level people
    topLevelPeople.forEach(person => buildHierarchy(person))

    return hierarchy
  } catch (error) {
    console.error('Error fetching people hierarchy:', error)
    return []
  }
}

export async function createPerson(formData: PersonFormData) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can create people')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create people')
  }

  // Validate the form data
  const validatedData = personSchema.parse(formData)

  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt
    ? new Date(validatedData.startedAt)
    : null

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify manager belongs to user's organization if specified
  if (validatedData.managerId) {
    const manager = await prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }

  // Create the person
  await prisma.person.create({
    data: {
      name: validatedData.name,
      email: validatedData.email || null,
      role: validatedData.role,
      status: validatedData.status,
      teamId: validatedData.teamId || null,
      managerId: validatedData.managerId || null,
      startedAt,
      organizationId: user.organizationId,
    },
    include: {
      team: true,
      manager: true,
    },
  })

  // Revalidate the people page
  revalidatePath('/people')

  // Redirect to the people page
  redirect('/people')
}

export async function updatePerson(id: string, formData: PersonFormData) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can update people')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update people')
  }

  // Validate the form data
  const validatedData = personSchema.parse(formData)

  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt
    ? new Date(validatedData.startedAt)
    : null

  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify manager belongs to user's organization if specified
  if (validatedData.managerId) {
    const manager = await prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }

  // Update the person
  await prisma.person.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email || null,
      role: validatedData.role,
      status: validatedData.status,
      teamId: validatedData.teamId || null,
      managerId: validatedData.managerId || null,
      startedAt,
    },
    include: {
      team: true,
      manager: true,
    },
  })

  // Revalidate the people page
  revalidatePath('/people')

  // Redirect to the people page
  redirect('/people')
}

export async function updatePersonPartial(
  id: string,
  updateData: PersonUpdateData
) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can update people')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update people')
  }

  // Validate the update data
  const validatedData = personUpdateSchema.parse(updateData)

  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }

  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId,
      },
    })
    if (!team) {
      throw new Error('Team not found or access denied')
    }
  }

  // Verify manager belongs to user's organization if specified
  if (validatedData.managerId) {
    const manager = await prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }

  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt
    ? new Date(validatedData.startedAt)
    : undefined

  // Build update data object with only provided fields
  const updateFields: Partial<Prisma.PersonUpdateInput> = {}
  if (validatedData.name !== undefined) updateFields.name = validatedData.name
  if (validatedData.email !== undefined)
    updateFields.email = validatedData.email || null
  if (validatedData.role !== undefined) updateFields.role = validatedData.role
  if (validatedData.status !== undefined)
    updateFields.status = validatedData.status
  if (validatedData.teamId !== undefined) {
    updateFields.team = validatedData.teamId
      ? { connect: { id: validatedData.teamId } }
      : { disconnect: true }
  }
  if (validatedData.managerId !== undefined) {
    updateFields.manager = validatedData.managerId
      ? { connect: { id: validatedData.managerId } }
      : { disconnect: true }
  }
  if (startedAt !== undefined) updateFields.startedAt = startedAt

  // Update the person
  await prisma.person.update({
    where: { id },
    data: updateFields,
    include: {
      team: true,
      manager: true,
    },
  })

  // Revalidate the people page
  revalidatePath('/people')
}

export async function deletePerson(id: string) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can delete people')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete people')
  }

  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
    include: {
      reports: true,
    },
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }

  // Check if person has direct reports
  if (existingPerson.reports.length > 0) {
    throw new Error(
      'Cannot delete person with direct reports. Please reassign their reports first.'
    )
  }

  // Delete the person
  await prisma.person.delete({
    where: { id },
  })

  // Revalidate the people page
  revalidatePath('/people')

  // Redirect to the people page
  redirect('/people')
}

export async function getPerson(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }
    return await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        team: true,
        manager: true,
        reports: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return null
  }
}

export async function getDirectReports() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId || !user.personId) {
      return []
    }

    // Get the current user's person record
    const currentPerson = await prisma.person.findUnique({
      where: { id: user.personId },
      include: {
        reports: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                oneOnOnes: true,
                feedback: true,
                tasks: true,
                reports: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!currentPerson) {
      return []
    }

    return currentPerson.reports
  } catch (error) {
    console.error('Error fetching direct reports:', error)
    return []
  }
}

export async function getPeopleForOneOnOne() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get all people in the organization for one-on-one meetings
  const people = await prisma.person.findMany({
    where: {
      organizationId: user.organizationId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return people
}

export async function getPeopleForFeedbackFilters() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view people')
  }

  // Get all people in the organization for filter dropdowns
  const people = await prisma.person.findMany({
    where: {
      organizationId: user.organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })

  return people
}
