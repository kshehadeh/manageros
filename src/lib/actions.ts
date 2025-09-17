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
  feedbackSchema,
  type FeedbackFormData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

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

  // Validate each row
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]
    const rowNum = i + 2 // +2 because CSV is 1-indexed and we skip header
    const rowErrors: string[] = []

    try {
      // Check if name already exists
      if (personNameMap.has(row.name.toLowerCase())) {
        rowErrors.push(`Name "${row.name}" already exists`)
      }

      // Check if email already exists (only if email is provided)
      if (row.email && personEmailMap.has(row.email.toLowerCase())) {
        rowErrors.push(`Email ${row.email} already exists`)
      }

      // Validate team if provided
      if (row.team && !teamMap.has(row.team.toLowerCase())) {
        rowErrors.push(`Team "${row.team}" not found`)
      }

      // Validate manager if provided (by name)
      if (row.manager && !personNameMap.has(row.manager.toLowerCase())) {
        rowErrors.push(`Manager "${row.manager}" not found`)
      }

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
      await prisma.person.create({
        data: {
          name: row.name,
          email: row.email ? row.email.toLowerCase() : null,
          role: row.role || null,
          teamId: row.team ? teamMap.get(row.team.toLowerCase()) || null : null,
          managerId: row.manager
            ? personNameMap.get(row.manager.toLowerCase()) || null
            : null,
          organizationId: user.organizationId,
          status: 'active',
        },
      })
      importedCount++
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
  const whereClause: Record<string, any> = {
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
