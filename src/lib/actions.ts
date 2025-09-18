'use server'

import { prisma } from '@/lib/db'
import {
  initiativeSchema,
  type InitiativeFormData,
  personSchema,
  type PersonFormData,
  teamSchema,
  type TeamFormData,
  oneOnOneSchema,
  type OneOnOneFormData,
  csvPersonSchema,
  type CSVPersonData,
  csvTeamSchema,
  type CSVTeamData,
  feedbackSchema,
  type FeedbackFormData,
  taskSchema,
  type TaskFormData,
  checkInSchema,
  type CheckInFormData,
} from '@/lib/validations'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth-utils'
import { encrypt } from './encryption'
import { JiraApiService } from './jira-api'

export async function createOrganization(formData: {
  name: string
  slug: string
}) {
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.organizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Check if organization slug already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: formData.slug },
  })

  if (existingOrg) {
    throw new Error('Organization slug already exists')
  }

  // Create organization and update user in a transaction
  const result = await prisma.$transaction(async tx => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: formData.name,
        slug: formData.slug,
      },
    })

    // Update user to be admin of the organization
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: 'ADMIN',
      },
    })

    return organization
  })

  revalidatePath('/')
  return result
}

export async function linkUserToPerson(userId: string, personId: string) {
  const currentUser = await getCurrentUser()

  // Check if user is admin
  if (!isAdmin(currentUser)) {
    throw new Error('Only organization admins can link users to persons')
  }

  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error(
      'User must belong to an organization to link users to persons'
    )
  }

  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if person is already linked to a user
  const personWithUser = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.organizationId,
    },
    include: { user: true },
  })

  if (personWithUser?.user) {
    throw new Error('Person is already linked to a user')
  }

  // Link the user to the person
  await prisma.user.update({
    where: { id: userId },
    data: { personId: personId },
  })

  revalidatePath('/people')
  revalidatePath('/people/[id]', 'page')
}

export async function unlinkUserFromPerson(userId: string) {
  const currentUser = await getCurrentUser()

  // Check if user is admin
  if (!isAdmin(currentUser)) {
    throw new Error('Only organization admins can unlink users from persons')
  }

  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error(
      'User must belong to an organization to manage user-person links'
    )
  }

  // Unlink the user from the person
  await prisma.user.update({
    where: { id: userId },
    data: { personId: null },
  })

  revalidatePath('/people')
  revalidatePath('/people/[id]', 'page')
}

export async function getAvailableUsersForLinking() {
  const currentUser = await getCurrentUser()

  // Check if user is admin
  if (!isAdmin(currentUser)) {
    throw new Error(
      'Only organization admins can view available users for linking'
    )
  }

  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    return []
  }

  // Get users in the same organization who aren't linked to a person
  return await prisma.user.findMany({
    where: {
      organizationId: currentUser.organizationId,
      personId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function createInitiative(formData: InitiativeFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create initiatives')
  }

  // Validate the form data
  const validatedData = initiativeSchema.parse(formData)

  // Parse dates if provided
  const startDate = validatedData.startDate
    ? new Date(validatedData.startDate)
    : null
  const targetDate = validatedData.targetDate
    ? new Date(validatedData.targetDate)
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

  // Create the initiative with objectives and owners
  const initiative = await prisma.initiative.create({
    data: {
      title: validatedData.title,
      summary: validatedData.summary,
      outcome: validatedData.outcome,
      startDate,
      targetDate,
      status: validatedData.status,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      teamId: validatedData.teamId,
      organizationId: user.organizationId,
      objectives: {
        create:
          validatedData.objectives?.map((obj, index) => ({
            title: obj.title,
            keyResult: obj.keyResult,
            sortIndex: index,
          })) || [],
      },
      owners: {
        create:
          validatedData.owners?.map(owner => ({
            personId: owner.personId,
            role: owner.role,
          })) || [],
      },
    },
    include: {
      objectives: true,
      owners: {
        include: {
          person: true,
        },
      },
      team: true,
    },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')

  // Redirect to the new initiative
  redirect(`/initiatives/${initiative.id}`)
}

export async function updateInitiative(
  id: string,
  formData: InitiativeFormData
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update initiatives')
  }

  // Validate the form data
  const validatedData = initiativeSchema.parse(formData)

  // Parse dates if provided
  const startDate = validatedData.startDate
    ? new Date(validatedData.startDate)
    : null
  const targetDate = validatedData.targetDate
    ? new Date(validatedData.targetDate)
    : null

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
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

  // Update the initiative with objectives and owners
  const initiative = await prisma.initiative.update({
    where: { id },
    data: {
      title: validatedData.title,
      summary: validatedData.summary,
      outcome: validatedData.outcome,
      startDate,
      targetDate,
      status: validatedData.status,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      teamId: validatedData.teamId,
      // Update objectives by deleting existing and creating new ones
      objectives: {
        deleteMany: {},
        create:
          validatedData.objectives?.map((obj, index) => ({
            title: obj.title,
            keyResult: obj.keyResult,
            sortIndex: index,
          })) || [],
      },
      // Update owners by deleting existing and creating new ones
      owners: {
        deleteMany: {},
        create:
          validatedData.owners?.map(owner => ({
            personId: owner.personId,
            role: owner.role,
          })) || [],
      },
    },
    include: {
      objectives: true,
      owners: {
        include: {
          person: true,
        },
      },
      team: true,
    },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')
  revalidatePath(`/initiatives/${id}`)

  // Redirect to the updated initiative
  redirect(`/initiatives/${initiative.id}`)
}

export async function deleteInitiative(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete initiatives')
  }

  // Verify initiative belongs to user's organization
  const existingInitiative = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingInitiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Delete the initiative (this will cascade delete objectives, owners, check-ins, etc.)
  await prisma.initiative.delete({
    where: { id },
  })

  // Revalidate the initiatives page
  revalidatePath('/initiatives')

  // Redirect to the initiatives list
  redirect('/initiatives')
}

export async function getTeams() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

/**
 * Recursively fetches team hierarchy with all related data
 * This is more efficient than deeply nested includes and handles unlimited depth
 */
 
export async function getTeamHierarchy(
  organizationId: string,
  parentId: string | null = null
): Promise<any[]> {
  const teams = await prisma.team.findMany({
    where: {
      organizationId,
      parentId,
    },
    include: {
      people: true,
      initiatives: true,
      parent: true,
    },
    orderBy: { name: 'asc' },
  })

  // Recursively fetch children for each team
  const teamsWithChildren = await Promise.all(
    teams.map(async team => {
      const children = await getTeamHierarchy(organizationId, team.id)
      return {
        ...team,
        children,
      }
    })
  )

  return teamsWithChildren
}

/**
 * Gets the complete team hierarchy for an organization
 * Returns only top-level teams with their full nested structure
 * Uses caching for better performance
 */
export async function getCompleteTeamHierarchy() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }

    return await getTeamHierarchy(user.organizationId, null)
  } catch (error) {
    console.error('Error fetching team hierarchy:', error)
    return []
  }
}

/**
 * Alternative approach: Fetch all teams at once and build hierarchy in memory
 * This can be more efficient for large hierarchies with many teams
 */
export async function getTeamHierarchyOptimized() {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }

    // Fetch all teams for the organization in a single query
    const allTeams = await prisma.team.findMany({
      where: { organizationId: user.organizationId },
      include: {
        people: true,
        initiatives: true,
        parent: true,
      },
      orderBy: { name: 'asc' },
    })

    // Build hierarchy in memory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamMap = new Map<string, any>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootTeams: any[] = []

    // First pass: create team objects and map them
    allTeams.forEach(team => {
      teamMap.set(team.id, {
        ...team,
        children: [],
      })
    })

    // Second pass: build parent-child relationships
    allTeams.forEach(team => {
      const teamWithChildren = teamMap.get(team.id)!
      if (team.parentId) {
        const parent = teamMap.get(team.parentId)
        if (parent) {
          parent.children.push(teamWithChildren)
        }
      } else {
        rootTeams.push(teamWithChildren)
      }
    })

    return rootTeams
  } catch (error) {
    console.error('Error fetching optimized team hierarchy:', error)
    return []
  }
}

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
  if (!isAdmin(user)) {
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
  if (!isAdmin(user)) {
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

export async function createTeam(formData: TeamFormData) {
  const user = await getCurrentUser()

  // Debug logging
  console.log('Creating team for user:', {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
    organizationName: user.organizationName,
  })

  // Additional validation
  if (!user.organizationId) {
    console.error('❌ User has no organizationId!', user)
    throw new Error('User is not associated with an organization')
  }

  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  })

  if (!organization) {
    console.error('❌ Organization not found!', {
      organizationId: user.organizationId,
    })
    throw new Error('Organization not found')
  }

  console.log('✅ Organization found:', organization.name)

  // Validate the form data
  const validatedData = teamSchema.parse(formData)

  console.log('Validated form data:', validatedData)

  // Validate parent team if provided
  if (validatedData.parentId) {
    const parentTeam = await prisma.team.findFirst({
      where: {
        id: validatedData.parentId,
        organizationId: user.organizationId,
      },
    })

    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }

  // Create the team
  await prisma.team.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      organizationId: user.organizationId,
      parentId:
        validatedData.parentId && validatedData.parentId.trim() !== ''
          ? validatedData.parentId
          : null,
    },
    include: {
      people: true,
      initiatives: true,
      parent: true,
      children: true,
    },
  })

  // Revalidate the teams page
  revalidatePath('/teams')

  // Redirect to the teams page
  redirect('/teams')
}

export async function updateTeam(id: string, formData: TeamFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update teams')
  }

  // Validate the form data
  const validatedData = teamSchema.parse(formData)

  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })
  if (!existingTeam) {
    throw new Error('Team not found or access denied')
  }

  // Validate parent team if provided
  if (validatedData.parentId) {
    // Prevent self-reference
    if (validatedData.parentId === id) {
      throw new Error('Team cannot be its own parent')
    }

    const parentTeam = await prisma.team.findFirst({
      where: {
        id: validatedData.parentId,
        organizationId: user.organizationId,
      },
    })

    if (!parentTeam) {
      throw new Error('Parent team not found or access denied')
    }
  }

  // Update the team
  await prisma.team.update({
    where: { id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
      parentId:
        validatedData.parentId && validatedData.parentId.trim() !== ''
          ? validatedData.parentId
          : null,
    },
    include: {
      people: true,
      initiatives: true,
      parent: true,
      children: true,
    },
  })

  // Revalidate the teams page
  revalidatePath('/teams')

  // Redirect to the teams page
  redirect('/teams')
}

export async function deleteTeam(id: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete teams')
  }

  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
    include: {
      people: true,
      initiatives: true,
      children: true,
    },
  })

  if (!existingTeam) {
    throw new Error('Team not found or access denied')
  }

  // Check if team has people or initiatives
  if (existingTeam.people.length > 0) {
    throw new Error(
      `Cannot delete team "${existingTeam.name}" because it has ${existingTeam.people.length} member(s). Please reassign or remove team members first.`
    )
  }

  if (existingTeam.initiatives.length > 0) {
    throw new Error(
      `Cannot delete team "${existingTeam.name}" because it has ${existingTeam.initiatives.length} initiative(s). Please reassign or delete initiatives first.`
    )
  }

  // Check if team has child teams
  if (existingTeam.children.length > 0) {
    throw new Error(
      `Cannot delete team "${existingTeam.name}" because it has ${existingTeam.children.length} child team(s). Please delete or reassign child teams first.`
    )
  }

  // Delete the team
  await prisma.team.delete({
    where: { id },
  })

  // Revalidate the teams page
  revalidatePath('/teams')
}

export async function getTeam(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }
    return await prisma.team.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        people: true,
        initiatives: true,
        parent: true,
        children: true,
      },
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return null
  }
}

export async function getTeamsForSelection(excludeId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: {
        organizationId: user.organizationId,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching teams for selection:', error)
    return []
  }
}

export async function createOneOnOne(formData: OneOnOneFormData) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)

  // Verify both manager and report belong to the same organization
  const [manager, report] = await Promise.all([
    prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    }),
    prisma.person.findFirst({
      where: {
        id: validatedData.reportId,
        organizationId: user.organizationId,
      },
    }),
  ])

  if (!manager) {
    throw new Error('Manager not found or not in your organization')
  }

  if (!report) {
    throw new Error('Report not found or not in your organization')
  }

  // Create the one-on-one record
  await prisma.oneOnOne.create({
    data: {
      managerId: validatedData.managerId,
      reportId: validatedData.reportId,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes,
    },
    include: {
      manager: true,
      report: true,
    },
  })

  revalidatePath('/oneonones')
  revalidatePath(`/people/${report.id}`)
  revalidatePath(`/people/${manager.id}`)

  // Redirect to the one-on-ones page
  redirect('/oneonones')
}

export async function getOneOnOnes() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the person record for the current user
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  return await prisma.oneOnOne.findMany({
    where: {
      OR: [
        { managerId: currentPerson?.id || '' },
        { reportId: currentPerson?.id || '' },
      ],
    },
    include: {
      manager: true,
      report: true,
    },
    orderBy: { scheduledAt: 'desc' },
  })
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

export async function getOneOnOneById(id: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Get the one-on-one record, ensuring the current user is a participant
  const oneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [{ managerId: currentPerson.id }, { reportId: currentPerson.id }],
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      report: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  if (!oneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  return oneOnOne
}

export async function updateOneOnOne(id: string, formData: OneOnOneFormData) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the one-on-one exists and user has access to it
  const existingOneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [{ managerId: currentPerson.id }, { reportId: currentPerson.id }],
    },
  })

  if (!existingOneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  // Verify both manager and report belong to the same organization
  const [manager, report] = await Promise.all([
    prisma.person.findFirst({
      where: {
        id: validatedData.managerId,
        organizationId: user.organizationId,
      },
    }),
    prisma.person.findFirst({
      where: {
        id: validatedData.reportId,
        organizationId: user.organizationId,
      },
    }),
  ])

  if (!manager) {
    throw new Error('Manager not found or not in your organization')
  }

  if (!report) {
    throw new Error('Report not found or not in your organization')
  }

  // Update the one-on-one record
  await prisma.oneOnOne.update({
    where: { id },
    data: {
      managerId: validatedData.managerId,
      reportId: validatedData.reportId,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes,
    },
  })

  // Revalidate the one-on-ones page
  revalidatePath('/oneonones')

  // Redirect to the one-on-ones page
  redirect('/oneonones')
}

// Organization Invitation Management Actions

export async function createOrganizationInvitation(email: string) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can send invitations')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to send invitations')
  }

  // Check if email is already a user in the organization
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId: user.organizationId,
    },
  })

  if (existingUser) {
    throw new Error('User is already a member of this organization')
  }

  // Check if there's already a pending invitation for this email
  const existingInvitation = await prisma.organizationInvitation.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId: user.organizationId,
      status: 'pending',
    },
  })

  if (existingInvitation) {
    throw new Error('An invitation has already been sent to this email address')
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invitation = await prisma.organizationInvitation.create({
    data: {
      email: email.toLowerCase(),
      organizationId: user.organizationId,
      invitedById: user.id,
      expiresAt,
    },
    include: {
      organization: true,
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  revalidatePath('/organization/invitations')
  return invitation
}

export async function getOrganizationInvitations() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can view invitations')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return []
  }

  const invitations = await prisma.organizationInvitation.findMany({
    where: {
      organizationId: user.organizationId,
    },
    include: {
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Date objects to strings for client-side consumption
  return invitations.map(invitation => ({
    ...invitation,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString(),
  }))
}

export async function revokeOrganizationInvitation(invitationId: string) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can revoke invitations')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to manage invitations')
  }

  // Verify invitation belongs to user's organization
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: user.organizationId,
    },
  })

  if (!invitation) {
    throw new Error('Invitation not found or access denied')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Only pending invitations can be revoked')
  }

  // Update invitation status to revoked
  await prisma.organizationInvitation.update({
    where: { id: invitationId },
    data: { status: 'revoked' },
  })

  revalidatePath('/organization/invitations')
}

export async function acceptOrganizationInvitation(email: string) {
  // Find pending invitation for this email
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      organization: true,
    },
  })

  if (!invitation) {
    return null // No valid invitation found
  }

  // Update invitation status to accepted
  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  })

  return invitation.organization
}

export async function checkPendingInvitation(email: string) {
  // Check if there's a pending invitation for this email
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  return invitation
}

export async function getPendingInvitationsForUser() {
  const user = await getCurrentUser()

  // Only return invitations if user doesn't have an organization
  if (user.organizationId) {
    return []
  }

  const invitations = await prisma.organizationInvitation.findMany({
    where: {
      email: user.email,
      status: 'pending',
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Date objects to strings for client-side consumption
  return invitations.map(invitation => ({
    ...invitation,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
  }))
}

export async function acceptInvitationForUser(invitationId: string) {
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.organizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Find the invitation
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      email: user.email,
      status: 'pending',
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      organization: true,
    },
  })

  if (!invitation) {
    throw new Error('Invitation not found or expired')
  }

  // Update user and invitation in a transaction
  const result = await prisma.$transaction(async tx => {
    // Update user to join the organization
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: invitation.organizationId,
      },
      include: {
        organization: true,
      },
    })

    // Mark invitation as accepted
    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    return updatedUser
  })

  revalidatePath('/')
  return result
}

// CSV Import Actions

function parseCSV(csvText: string): {
  data: CSVPersonData[]
  errors: Array<{
    rowNumber: number
    data: {
      name: string
      email: string
      role: string
      team: string
      manager: string
    }
    errors: string[]
  }>
} {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }

  // Simple CSV parser that handles quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current.trim())

    return result
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const data: CSVPersonData[] = []
  const errors: Array<{
    rowNumber: number
    data: {
      name: string
      email: string
      role: string
      team: string
      manager: string
    }
    errors: string[]
  }> = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const rowNum = i + 1

    if (values.length !== headers.length) {
      errors.push({
        rowNumber: rowNum,
        data: { name: '', email: '', role: '', team: '', manager: '' },
        errors: [
          `Row has ${values.length} columns but expected ${headers.length}`,
        ],
      })
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // Validate the row data with better error reporting
    try {
      const validatedRow = csvPersonSchema.parse(row)
      data.push(validatedRow)
    } catch (error) {
      const rowErrors: string[] = []

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as {
          issues: Array<{ path: string[]; message: string }>
        }
        const fieldErrors = zodError.issues.map(issue => {
          const field = issue.path.join('.')
          return `${field}: ${issue.message}`
        })
        rowErrors.push(...fieldErrors)
      } else if (error instanceof Error) {
        rowErrors.push(error.message)
      } else {
        rowErrors.push('Unknown validation error')
      }

      errors.push({
        rowNumber: rowNum,
        data: {
          name: row.name || '',
          email: row.email || '',
          role: row.role || '',
          team: row.team || '',
          manager: row.manager || '',
        },
        errors: rowErrors,
      })
    }
  }

  return { data, errors }
}

export async function importPersonsFromCSV(formData: FormData) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdmin(user)) {
    throw new Error('Only organization admins can import people')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to import people')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    throw new Error('File must be a CSV file')
  }

  // Read and parse CSV
  const csvText = await file.text()
  let parseResult: {
    data: CSVPersonData[]
    errors: Array<{
      rowNumber: number
      data: {
        name: string
        email: string
        role: string
        team: string
        manager: string
      }
      errors: string[]
    }>
  }

  try {
    parseResult = parseCSV(csvText)
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Unknown CSV parsing error'
    )
  }

  const csvData = parseResult.data
  const parsingErrors = parseResult.errors

  if (csvData.length === 0 && parsingErrors.length === 0) {
    throw new Error('No data rows found in CSV file')
  }

  // Get existing teams and people for validation
  const [existingTeams, existingPeople] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, email: true },
    }),
  ])

  // Create lookup maps
  const teamMap = new Map(existingTeams.map(t => [t.name.toLowerCase(), t.id]))
  const personEmailMap = new Map(
    existingPeople.filter(p => p.email).map(p => [p.email!.toLowerCase(), p.id])
  )
  const personNameMap = new Map(
    existingPeople.map(p => [p.name.toLowerCase(), p.id])
  )

  const errors: string[] = []
  const successfulImports: CSVPersonData[] = []
  const errorRows: Array<{
    rowNumber: number
    data: {
      name: string
      email: string
      role: string
      team: string
      manager: string
    }
    errors: string[]
  }> = []

  // Add parsing errors to errorRows
  parsingErrors.forEach(parseError => {
    errorRows.push(parseError)
    errors.push(`Row ${parseError.rowNumber}: ${parseError.errors.join(', ')}`)
  })

  // First pass: Identify managers that need to be created
  const managersToCreate = new Set<string>()
  const managerRows = new Map<string, CSVPersonData>() // Track which rows contain manager data

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]

    // Check if this person is referenced as a manager by someone else
    const isReferencedAsManager = csvData.some(
      otherRow =>
        otherRow.manager &&
        otherRow.manager.toLowerCase() === row.name.toLowerCase()
    )

    if (isReferencedAsManager && !personNameMap.has(row.name.toLowerCase())) {
      managersToCreate.add(row.name.toLowerCase())
    }

    // Track this row as containing manager data
    managerRows.set(row.name.toLowerCase(), row)
  }

  // Create placeholder managers that don't exist yet
  const createdManagers = new Map<string, string>() // name -> personId
  for (const managerName of managersToCreate) {
    const managerRow = managerRows.get(managerName)
    if (managerRow) {
      try {
        const createdManager = await prisma.person.create({
          data: {
            name: managerRow.name,
            email: managerRow.email ? managerRow.email.toLowerCase() : null,
            role: managerRow.role || null,
            teamId: managerRow.team
              ? teamMap.get(managerRow.team.toLowerCase()) || null
              : null,
            organizationId: user.organizationId,
            status: 'active',
          },
        })
        createdManagers.set(managerName, createdManager.id)
        // Update the lookup maps
        personNameMap.set(managerName, createdManager.id)
        if (createdManager.email) {
          personEmailMap.set(
            createdManager.email.toLowerCase(),
            createdManager.id
          )
        }
      } catch (error) {
        errors.push(
          `Failed to create manager "${managerRow.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  }

  // Validate each row
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]
    const rowNum = i + 2 // +2 because CSV is 1-indexed and we skip header
    const rowErrors: string[] = []

    try {
      // Check if name already exists (but allow updates for managers we just created)
      if (
        personNameMap.has(row.name.toLowerCase()) &&
        !createdManagers.has(row.name.toLowerCase())
      ) {
        rowErrors.push(`Name "${row.name}" already exists`)
      }

      // Check if email already exists (only if email is provided)
      if (row.email && personEmailMap.has(row.email.toLowerCase())) {
        // Allow if this is the same person we just created as a manager
        const existingPersonId = personEmailMap.get(row.email.toLowerCase())
        const isSamePerson =
          createdManagers.has(row.name.toLowerCase()) &&
          personNameMap.get(row.name.toLowerCase()) === existingPersonId
        if (!isSamePerson) {
          rowErrors.push(`Email ${row.email} already exists`)
        }
      }

      // Validate team if provided
      if (row.team && !teamMap.has(row.team.toLowerCase())) {
        rowErrors.push(`Team "${row.team}" not found`)
      }

      // Manager validation is now handled by auto-creation above
      // No need to validate manager existence here

      if (rowErrors.length > 0) {
        errorRows.push({
          rowNumber: rowNum,
          data: {
            name: row.name,
            email: row.email || '',
            role: row.role || '',
            team: row.team || '',
            manager: row.manager || '',
          },
          errors: rowErrors,
        })
        errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`)
        continue
      }

      successfulImports.push(row)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      rowErrors.push(errorMessage)
      errorRows.push({
        rowNumber: rowNum,
        data: {
          name: row.name,
          email: row.email || '',
          role: row.role || '',
          team: row.team || '',
          manager: row.manager || '',
        },
        errors: rowErrors,
      })
      errors.push(`Row ${rowNum}: ${errorMessage}`)
    }
  }

  // Import successful rows
  let importedCount = 0
  const importErrors: string[] = []

  for (const row of successfulImports) {
    try {
      // Check if this person was already created as a manager
      const isExistingManager = createdManagers.has(row.name.toLowerCase())

      if (isExistingManager) {
        // Update the existing manager with additional information
        const managerId = createdManagers.get(row.name.toLowerCase())!
        await prisma.person.update({
          where: { id: managerId },
          data: {
            email: row.email ? row.email.toLowerCase() : undefined,
            role: row.role || undefined,
            teamId: row.team
              ? teamMap.get(row.team.toLowerCase()) || null
              : undefined,
            managerId: row.manager
              ? personNameMap.get(row.manager.toLowerCase()) || null
              : undefined,
          },
        })
        importedCount++
      } else {
        // Create new person
        await prisma.person.create({
          data: {
            name: row.name,
            email: row.email ? row.email.toLowerCase() : null,
            role: row.role || null,
            teamId: row.team
              ? teamMap.get(row.team.toLowerCase()) || null
              : null,
            managerId: row.manager
              ? personNameMap.get(row.manager.toLowerCase()) || null
              : null,
            organizationId: user.organizationId,
            status: 'active',
          },
        })
        importedCount++
      }
    } catch (error) {
      importErrors.push(
        `Failed to import ${row.name}${row.email ? ` (${row.email})` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Combine validation and import errors
  const allErrors = [...errors, ...importErrors]

  // Revalidate the people page
  revalidatePath('/people')

  return {
    success: importedCount > 0,
    message:
      importedCount > 0
        ? `Successfully imported ${importedCount} people${allErrors.length > 0 ? ` with ${allErrors.length} errors` : ''}`
        : 'No people were imported',
    imported: importedCount,
    errors: allErrors,
    errorRows: errorRows,
  }
}

// Team CSV Import Actions

function parseTeamCSV(csvText: string): {
  data: CSVTeamData[]
  errors: Array<{
    rowNumber: number
    data: {
      name: string
      description: string
      parent: string
    }
    errors: string[]
  }>
} {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }

  // Simple CSV parser that handles quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current.trim())

    return result
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const data: CSVTeamData[] = []
  const errors: Array<{
    rowNumber: number
    data: {
      name: string
      description: string
      parent: string
    }
    errors: string[]
  }> = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const rowNum = i + 1 // +1 because CSV is 1-indexed

    if (values.length !== headers.length) {
      errors.push({
        rowNumber: rowNum,
        data: {
          name: values[0] || '',
          description: values[1] || '',
          parent: values[2] || '',
        },
        errors: [
          `Row has ${values.length} columns but expected ${headers.length}`,
        ],
      })
      continue
    }

    const rowData: Record<string, string> = {}
    headers.forEach((header, index) => {
      rowData[header] = values[index] || ''
    })

    try {
      const validatedRow = csvTeamSchema.parse(rowData)
      data.push(validatedRow)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({
          rowNumber: rowNum,
          data: {
            name: rowData.name || '',
            description: rowData.description || '',
            parent: rowData.parent || '',
          },
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        })
      } else {
        errors.push({
          rowNumber: rowNum,
          data: {
            name: rowData.name || '',
            description: rowData.description || '',
            parent: rowData.parent || '',
          },
          errors: ['Unknown validation error'],
        })
      }
    }
  }

  return { data, errors }
}

// Fuzzy string matching function to detect similar team names
function findSimilarTeamNames(
  teamName: string,
  existingTeams: Array<{ name: string }>,
  threshold: number = 0.8
): string[] {
  const similar: string[] = []

  for (const team of existingTeams) {
    const similarity = calculateSimilarity(
      teamName.toLowerCase(),
      team.name.toLowerCase()
    )
    if (similarity >= threshold && similarity < 1.0) {
      similar.push(team.name)
    }
  }

  return similar
}

// Simple Levenshtein distance-based similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return maxLength === 0
    ? 1
    : (maxLength - matrix[str2.length][str1.length]) / maxLength
}

export async function importTeamsFromCSV(formData: FormData) {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdmin(user)) {
    throw new Error('Only organization admins can import teams')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to import teams')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    throw new Error('File must be a CSV file')
  }

  // Read and parse CSV
  const csvText = await file.text()
  let parseResult: {
    data: CSVTeamData[]
    errors: Array<{
      rowNumber: number
      data: {
        name: string
        description: string
        parent: string
      }
      errors: string[]
    }>
  }

  try {
    parseResult = parseTeamCSV(csvText)
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Unknown CSV parsing error'
    )
  }

  const csvData = parseResult.data
  const parsingErrors = parseResult.errors

  if (csvData.length === 0 && parsingErrors.length === 0) {
    throw new Error('No data rows found in CSV file')
  }

  // Get existing teams for validation
  const existingTeams = await prisma.team.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
  })

  // Create lookup maps
  const teamMap = new Map(existingTeams.map(t => [t.name.toLowerCase(), t.id]))

  const errors: string[] = []
  const successfulImports: CSVTeamData[] = []
  const errorRows: Array<{
    rowNumber: number
    data: {
      name: string
      description: string
      parent: string
    }
    errors: string[]
  }> = []

  // Add parsing errors to errorRows
  parsingErrors.forEach(parseError => {
    errorRows.push(parseError)
  })

  // Validate each row
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]
    const rowNum = i + 2 // +2 because CSV is 1-indexed and we skip header
    const rowErrors: string[] = []

    try {
      // Check for similar team names (but allow exact matches for updates)
      if (!teamMap.has(row.name.toLowerCase())) {
        const similarTeams = findSimilarTeamNames(row.name, existingTeams)
        if (similarTeams.length > 0) {
          rowErrors.push(
            `Team "${row.name}" is similar to existing teams: ${similarTeams.join(', ')}`
          )
        }
      }

      // Check parent team - we'll create it if it doesn't exist and isn't similar to existing teams
      if (row.parent && !teamMap.has(row.parent.toLowerCase())) {
        const similarParentTeams = findSimilarTeamNames(
          row.parent,
          existingTeams
        )
        if (similarParentTeams.length > 0) {
          rowErrors.push(
            `Parent team "${row.parent}" is similar to existing teams: ${similarParentTeams.join(', ')}`
          )
        }
        // If no similar teams found, we'll create the parent team during import
      }

      if (rowErrors.length > 0) {
        errorRows.push({
          rowNumber: rowNum,
          data: {
            name: row.name,
            description: row.description || '',
            parent: row.parent || '',
          },
          errors: rowErrors,
        })
        continue
      }

      successfulImports.push(row)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      rowErrors.push(errorMessage)
      errorRows.push({
        rowNumber: rowNum,
        data: {
          name: row.name,
          description: row.description || '',
          parent: row.parent || '',
        },
        errors: rowErrors,
      })
      errors.push(`Row ${rowNum}: ${errorMessage}`)
    }
  }

  // Import successful rows
  let importedCount = 0
  let updatedCount = 0
  const importErrors: string[] = []
  const createdParentTeams = new Map<string, string>() // Track created parent teams

  for (const row of successfulImports) {
    try {
      let parentId: string | null = null

      // Handle parent team
      if (row.parent) {
        // First check if we already created this parent team in this import
        if (createdParentTeams.has(row.parent.toLowerCase())) {
          parentId = createdParentTeams.get(row.parent.toLowerCase())!
        }
        // Then check if it exists in the database
        else if (teamMap.has(row.parent.toLowerCase())) {
          parentId = teamMap.get(row.parent.toLowerCase())!
        }
        // If it doesn't exist, create the parent team first
        else {
          const parentTeam = await prisma.team.create({
            data: {
              name: row.parent,
              description: null,
              parentId: null, // Parent teams are created as top-level initially
              organizationId: user.organizationId,
            },
          })
          parentId = parentTeam.id
          createdParentTeams.set(row.parent.toLowerCase(), parentId)
          // Update the teamMap for subsequent imports
          teamMap.set(row.parent.toLowerCase(), parentId)
        }
      }

      // Check if team already exists (for updates)
      const existingTeamId = teamMap.get(row.name.toLowerCase())
      if (existingTeamId) {
        // Update existing team
        await prisma.team.update({
          where: { id: existingTeamId },
          data: {
            description: row.description || null,
            parentId: parentId,
          },
        })
        updatedCount++
      } else {
        // Create new team
        const newTeam = await prisma.team.create({
          data: {
            name: row.name,
            description: row.description || null,
            parentId: parentId,
            organizationId: user.organizationId,
          },
        })
        importedCount++
        // Update the teamMap for subsequent imports
        teamMap.set(row.name.toLowerCase(), newTeam.id)
      }
    } catch (error) {
      importErrors.push(
        `Failed to import team "${row.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Combine validation and import errors
  const allErrors = [...errors, ...importErrors]

  // Revalidate the teams page
  revalidatePath('/teams')

  const parentTeamsCreated = createdParentTeams.size
  const totalProcessed = importedCount + updatedCount
  const message =
    totalProcessed > 0
      ? `Successfully processed ${totalProcessed} teams (${importedCount} imported, ${updatedCount} updated)${parentTeamsCreated > 0 ? ` (including ${parentTeamsCreated} parent teams created automatically)` : ''}${allErrors.length > 0 ? ` with ${allErrors.length} errors` : ''}`
      : 'No teams were processed'

  return {
    success: totalProcessed > 0,
    message,
    imported: totalProcessed,
    errors: allErrors,
    errorRows: errorRows,
  }
}

// Feedback Management Actions

export async function createFeedback(formData: FeedbackFormData) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create feedback')
  }

  // Validate the form data
  const validatedData = feedbackSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the person being given feedback belongs to the same organization
  const aboutPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.aboutId,
      organizationId: user.organizationId,
    },
  })

  if (!aboutPerson) {
    throw new Error('Person not found or access denied')
  }

  // Create the feedback
  const feedback = await prisma.feedback.create({
    data: {
      aboutId: validatedData.aboutId,
      fromId: currentPerson.id,
      kind: validatedData.kind,
      isPrivate: validatedData.isPrivate,
      body: validatedData.body,
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  revalidatePath(`/people/${validatedData.aboutId}`)
  return feedback
}

export async function updateFeedback(id: string, formData: FeedbackFormData) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update feedback')
  }

  // Validate the form data
  const validatedData = feedbackSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the feedback exists and the current user is the author
  const existingFeedback = await prisma.feedback.findFirst({
    where: {
      id,
      fromId: currentPerson.id,
    },
  })

  if (!existingFeedback) {
    throw new Error(
      'Feedback not found or you do not have permission to edit it'
    )
  }

  // Verify the person being given feedback belongs to the same organization
  const aboutPerson = await prisma.person.findFirst({
    where: {
      id: validatedData.aboutId,
      organizationId: user.organizationId,
    },
  })

  if (!aboutPerson) {
    throw new Error('Person not found or access denied')
  }

  // Update the feedback
  const feedback = await prisma.feedback.update({
    where: { id },
    data: {
      aboutId: validatedData.aboutId,
      kind: validatedData.kind,
      isPrivate: validatedData.isPrivate,
      body: validatedData.body,
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  revalidatePath(`/people/${validatedData.aboutId}`)
  return feedback
}

export async function deleteFeedback(id: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete feedback')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the feedback exists and the current user is the author
  const existingFeedback = await prisma.feedback.findFirst({
    where: {
      id,
      fromId: currentPerson.id,
    },
  })

  if (!existingFeedback) {
    throw new Error(
      'Feedback not found or you do not have permission to delete it'
    )
  }

  // Delete the feedback
  await prisma.feedback.delete({
    where: { id },
  })

  revalidatePath(`/people/${existingFeedback.aboutId}`)
}

export async function getFeedbackForPerson(personId: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view feedback')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get feedback for the person
  // Only show feedback that is either:
  // 1. Not private (public feedback)
  // 2. Private feedback written by the current user
  const feedback = await prisma.feedback.findMany({
    where: {
      aboutId: personId,
      OR: [{ isPrivate: false }, { fromId: currentPerson.id }],
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return feedback
}

export async function getFeedbackById(id: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view feedback')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Get the feedback, ensuring the current user has access to it
  const feedback = await prisma.feedback.findFirst({
    where: {
      id,
      OR: [{ isPrivate: false }, { fromId: currentPerson.id }],
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!feedback) {
    throw new Error('Feedback not found or you do not have access to it')
  }

  return feedback
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

export async function getAllFeedback(filters?: {
  fromPersonId?: string
  aboutPersonId?: string
  kind?: string
  isPrivate?: boolean
  startDate?: string
  endDate?: string
}) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view feedback')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Build the where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {
    OR: [
      { isPrivate: false }, // Public feedback
      { fromId: currentPerson.id }, // Private feedback written by current user
    ],
    // Ensure feedback is about people in the same organization
    about: {
      organizationId: user.organizationId,
    },
  }

  // Apply filters
  if (filters?.fromPersonId) {
    whereClause.fromId = filters.fromPersonId
  }

  if (filters?.aboutPersonId) {
    whereClause.aboutId = filters.aboutPersonId
  }

  if (filters?.kind) {
    whereClause.kind = filters.kind
  }

  if (filters?.isPrivate !== undefined) {
    whereClause.isPrivate = filters.isPrivate
  }

  if (filters?.startDate || filters?.endDate) {
    whereClause.createdAt = {}
    if (filters.startDate) {
      whereClause.createdAt.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      whereClause.createdAt.lte = new Date(filters.endDate)
    }
  }

  // Get all feedback with filters
  const feedback = await prisma.feedback.findMany({
    where: whereClause,
    include: {
      about: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Date objects to strings for client-side consumption
  return feedback.map(feedback => ({
    ...feedback,
    createdAt: feedback.createdAt.toISOString(),
  }))
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

// Task Actions
export async function createTask(formData: TaskFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create tasks')
  }

  // Validate the form data
  const validatedData = taskSchema.parse(formData)

  // Parse due date if provided
  const dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null

  // Verify assignee belongs to user's organization if specified
  if (validatedData.assigneeId) {
    const assignee = await prisma.person.findFirst({
      where: {
        id: validatedData.assigneeId,
        organizationId: user.organizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Verify initiative belongs to user's organization if specified
  if (validatedData.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: {
        id: validatedData.initiativeId,
        organizationId: user.organizationId,
      },
    })
    if (!initiative) {
      throw new Error('Initiative not found or access denied')
    }
  }

  // Verify objective belongs to user's organization if specified
  if (validatedData.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: validatedData.objectiveId,
        initiative: {
          organizationId: user.organizationId,
        },
      },
    })
    if (!objective) {
      throw new Error('Objective not found or access denied')
    }
  }

  // Create the task
  const task = await prisma.task.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      assigneeId: validatedData.assigneeId,
      status: validatedData.status,
      priority: validatedData.priority,
      estimate: validatedData.estimate,
      dueDate,
      initiativeId: validatedData.initiativeId,
      objectiveId: validatedData.objectiveId,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
    },
  })

  // Revalidate the tasks page
  revalidatePath('/tasks')

  // Redirect to the new task
  redirect(`/tasks/${task.id}`)
}

export async function updateTask(taskId: string, formData: TaskFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update tasks')
  }

  // Validate the form data
  const validatedData = taskSchema.parse(formData)

  // Parse due date if provided
  const dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null

  // Verify task belongs to user's organization
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    },
  })

  if (!existingTask) {
    throw new Error('Task not found or access denied')
  }

  // Verify assignee belongs to user's organization if specified
  if (validatedData.assigneeId) {
    const assignee = await prisma.person.findFirst({
      where: {
        id: validatedData.assigneeId,
        organizationId: user.organizationId,
      },
    })
    if (!assignee) {
      throw new Error('Assignee not found or access denied')
    }
  }

  // Verify initiative belongs to user's organization if specified
  if (validatedData.initiativeId) {
    const initiative = await prisma.initiative.findFirst({
      where: {
        id: validatedData.initiativeId,
        organizationId: user.organizationId,
      },
    })
    if (!initiative) {
      throw new Error('Initiative not found or access denied')
    }
  }

  // Verify objective belongs to user's organization if specified
  if (validatedData.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: validatedData.objectiveId,
        initiative: {
          organizationId: user.organizationId,
        },
      },
    })
    if (!objective) {
      throw new Error('Objective not found or access denied')
    }
  }

  // Update the task
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: validatedData.title,
      description: validatedData.description,
      assigneeId: validatedData.assigneeId,
      status: validatedData.status,
      priority: validatedData.priority,
      estimate: validatedData.estimate,
      dueDate,
      initiativeId: validatedData.initiativeId,
      objectiveId: validatedData.objectiveId,
      completedAt: validatedData.status === 'done' ? new Date() : null,
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
    },
  })

  // Revalidate the tasks page and task detail page
  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)

  // Redirect to the updated task
  redirect(`/tasks/${task.id}`)
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete tasks')
  }

  // Verify task belongs to user's organization
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    },
  })

  if (!task) {
    throw new Error('Task not found or access denied')
  }

  // Delete the task
  await prisma.task.delete({
    where: { id: taskId },
  })

  // Revalidate the tasks page
  revalidatePath('/tasks')
}

export async function getTasks() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return tasks
}

export async function getTask(taskId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view tasks')
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { assignee: { organizationId: user.organizationId } },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    },
    include: {
      assignee: true,
      initiative: true,
      objective: true,
    },
  })

  return task
}

// Check-in Actions
export async function createCheckIn(formData: CheckInFormData) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create check-ins')
  }

  // Validate the form data
  const validatedData = checkInSchema.parse(formData)

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id,
      },
    },
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify initiative belongs to user's organization
  const initiative = await prisma.initiative.findFirst({
    where: {
      id: validatedData.initiativeId,
      organizationId: user.organizationId,
    },
  })

  if (!initiative) {
    throw new Error('Initiative not found or access denied')
  }

  // Parse the weekOf date
  const weekOf = new Date(validatedData.weekOf)

  // Create the check-in
  const checkIn = await prisma.checkIn.create({
    data: {
      initiativeId: validatedData.initiativeId,
      weekOf,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      summary: validatedData.summary,
      blockers: validatedData.blockers,
      nextSteps: validatedData.nextSteps,
      createdById: currentPerson.id,
    },
    include: {
      initiative: true,
      createdBy: true,
    },
  })

  // Revalidate the initiative detail page
  revalidatePath(`/initiatives/${validatedData.initiativeId}`)

  return checkIn
}

export async function updateCheckIn(
  checkInId: string,
  formData: CheckInFormData
) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update check-ins')
  }

  // Validate the form data
  const validatedData = checkInSchema.parse(formData)

  // Verify check-in belongs to user's organization
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        organizationId: user.organizationId,
      },
    },
  })

  if (!existingCheckIn) {
    throw new Error('Check-in not found or access denied')
  }

  // Parse the weekOf date
  const weekOf = new Date(validatedData.weekOf)

  // Update the check-in
  const checkIn = await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      weekOf,
      rag: validatedData.rag,
      confidence: validatedData.confidence,
      summary: validatedData.summary,
      blockers: validatedData.blockers,
      nextSteps: validatedData.nextSteps,
    },
    include: {
      initiative: true,
      createdBy: true,
    },
  })

  // Revalidate the initiative detail page
  revalidatePath(`/initiatives/${validatedData.initiativeId}`)

  return checkIn
}

export async function deleteCheckIn(checkInId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to delete check-ins')
  }

  // Verify check-in belongs to user's organization
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        organizationId: user.organizationId,
      },
    },
    include: {
      initiative: true,
    },
  })

  if (!existingCheckIn) {
    throw new Error('Check-in not found or access denied')
  }

  // Delete the check-in
  await prisma.checkIn.delete({
    where: { id: checkInId },
  })

  // Revalidate the initiative detail page
  revalidatePath(`/initiatives/${existingCheckIn.initiativeId}`)

  return { success: true }
}

export async function getCheckIn(checkInId: string) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view check-ins')
  }

  // Get the check-in with initiative details
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      id: checkInId,
      initiative: {
        organizationId: user.organizationId,
      },
    },
    include: {
      initiative: true,
      createdBy: true,
    },
  })

  if (!checkIn) {
    throw new Error('Check-in not found or access denied')
  }

  return checkIn
}

// ===== JIRA INTEGRATION ACTIONS =====

export async function saveJiraCredentials(formData: {
  jiraUsername: string
  jiraApiKey: string
  jiraBaseUrl: string
}) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to configure Jira')
  }

  // Validate Jira URL format
  try {
    new URL(formData.jiraBaseUrl)
  } catch {
    throw new Error('Invalid Jira base URL format')
  }

  // Test the connection before saving
  const jiraService = new JiraApiService({
    username: formData.jiraUsername,
    apiKey: formData.jiraApiKey,
    baseUrl: formData.jiraBaseUrl,
  })

  const isConnected = await jiraService.testConnection()
  if (!isConnected) {
    throw new Error(
      'Failed to connect to Jira. Please check your credentials and URL.'
    )
  }

  // Encrypt the API key
  const encryptedApiKey = encrypt(formData.jiraApiKey)

  // Upsert the credentials
  await prisma.userJiraCredentials.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      jiraUsername: formData.jiraUsername,
      encryptedApiKey,
      jiraBaseUrl: formData.jiraBaseUrl,
    },
    update: {
      jiraUsername: formData.jiraUsername,
      encryptedApiKey,
      jiraBaseUrl: formData.jiraBaseUrl,
    },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function getJiraCredentials() {
  const user = await getCurrentUser()

  const credentials = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    return null
  }

  return {
    jiraUsername: credentials.jiraUsername,
    jiraBaseUrl: credentials.jiraBaseUrl,
    // Don't return the encrypted API key for security
  }
}

export async function deleteJiraCredentials() {
  const user = await getCurrentUser()

  await prisma.userJiraCredentials.delete({
    where: { userId: user.id },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function linkPersonToJiraAccount(
  personId: string,
  jiraEmail: string
) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get user's Jira credentials
  const credentials = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('Jira credentials not configured')
  }

  // Search for Jira user by email
  const jiraService = JiraApiService.fromEncryptedCredentials(
    credentials.jiraUsername,
    credentials.encryptedApiKey,
    credentials.jiraBaseUrl
  )

  const jiraUsers = await jiraService.searchUsersByEmail(jiraEmail)

  if (jiraUsers.length === 0) {
    throw new Error(`No active Jira user found with email: ${jiraEmail}`)
  }

  if (jiraUsers.length > 1) {
    throw new Error(`Multiple Jira users found with email: ${jiraEmail}`)
  }

  const jiraUser = jiraUsers[0]

  // Create or update the link
  await prisma.personJiraAccount.upsert({
    where: { personId },
    create: {
      personId,
      jiraAccountId: jiraUser.accountId,
      jiraEmail: jiraUser.emailAddress,
      jiraDisplayName: jiraUser.displayName,
    },
    update: {
      jiraAccountId: jiraUser.accountId,
      jiraEmail: jiraUser.emailAddress,
      jiraDisplayName: jiraUser.displayName,
    },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unlinkPersonFromJiraAccount(personId: string) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  await prisma.personJiraAccount.delete({
    where: { personId },
  })

  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function fetchJiraAssignedTickets(
  personId: string,
  daysBack: number = 30
) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Verify person belongs to user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: user.organizationId,
    },
    include: {
      jiraAccount: true,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  if (!person.jiraAccount) {
    throw new Error('Person is not linked to a Jira account')
  }

  // Get user's Jira credentials
  const credentials = await prisma.userJiraCredentials.findUnique({
    where: { userId: user.id },
  })

  if (!credentials) {
    throw new Error('Jira credentials not configured')
  }

  // Calculate date range
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - daysBack)

  const fromDateStr = fromDate.toISOString().split('T')[0]
  const toDateStr = toDate.toISOString().split('T')[0]

  // Fetch assigned tickets from Jira
  const jiraService = JiraApiService.fromEncryptedCredentials(
    credentials.jiraUsername,
    credentials.encryptedApiKey,
    credentials.jiraBaseUrl
  )

  const assignedTickets = await jiraService.getUserAssignedTickets(
    person.jiraAccount.jiraAccountId,
    fromDateStr,
    toDateStr
  )

  // Transform tickets for UI consumption
  const ticketData = assignedTickets.map(ticket => ({
    id: ticket.issue.id,
    jiraIssueKey: ticket.issue.key,
    issueTitle: ticket.issue.fields.summary,
    issueType: ticket.issue.fields.issuetype.name,
    status: ticket.issue.fields.status.name,
    priority: ticket.issue.fields.priority?.name,
    projectKey: ticket.issue.fields.project.key,
    projectName: ticket.issue.fields.project.name,
    lastUpdated: ticket.lastUpdated,
    created: ticket.created,
  }))

  return { success: true, tickets: ticketData }
}
