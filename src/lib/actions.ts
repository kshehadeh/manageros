'use server'

import { prisma } from '@/lib/db'
import { initiativeSchema, type InitiativeFormData, personSchema, type PersonFormData, teamSchema, type TeamFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin, canAccessOrganization } from '@/lib/auth'

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function createInitiative(formData: InitiativeFormData) {
  const user = await getCurrentUser()
  
  // Validate the form data
  const validatedData = initiativeSchema.parse(formData)
  
  // Parse dates if provided
  const startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
  const targetDate = validatedData.targetDate ? new Date(validatedData.targetDate) : null
  
  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId
      }
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
        create: validatedData.objectives?.map((obj, index) => ({
          title: obj.title,
          keyResult: obj.keyResult,
          sortIndex: index,
        })) || [],
      },
      owners: {
        create: validatedData.owners?.map(owner => ({
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
    return await prisma.person.findMany({
      where: { 
        status: 'active',
        organizationId: user.organizationId
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return []
  }
}

export async function createPerson(formData: PersonFormData) {
  const user = await getCurrentUser()
  
  // Validate the form data
  const validatedData = personSchema.parse(formData)
  
  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt ? new Date(validatedData.startedAt) : null
  
  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId
      }
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
        organizationId: user.organizationId
      }
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }
  
  // Create the person
  const person = await prisma.person.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
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
  
  // Validate the form data
  const validatedData = personSchema.parse(formData)
  
  // Parse startedAt date if provided
  const startedAt = validatedData.startedAt ? new Date(validatedData.startedAt) : null
  
  // Verify person belongs to user's organization
  const existingPerson = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  })
  if (!existingPerson) {
    throw new Error('Person not found or access denied')
  }
  
  // Verify team belongs to user's organization if specified
  if (validatedData.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: validatedData.teamId,
        organizationId: user.organizationId
      }
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
        organizationId: user.organizationId
      }
    })
    if (!manager) {
      throw new Error('Manager not found or access denied')
    }
  }
  
  // Update the person
  const person = await prisma.person.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email,
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
    return await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        team: true,
        manager: true,
        reports: true,
      },
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return null
  }
}

export async function createTeam(formData: TeamFormData) {
  const user = await getCurrentUser()
  
  // Validate the form data
  const validatedData = teamSchema.parse(formData)
  
  // Create the team
  const team = await prisma.team.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      organizationId: user.organizationId,
    },
    include: {
      people: true,
      initiatives: true,
    },
  })

  // Revalidate the teams page
  revalidatePath('/teams')
  
  // Redirect to the teams page
  redirect('/teams')
}

export async function updateTeam(id: string, formData: TeamFormData) {
  const user = await getCurrentUser()
  
  // Validate the form data
  const validatedData = teamSchema.parse(formData)
  
  // Verify team belongs to user's organization
  const existingTeam = await prisma.team.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  })
  if (!existingTeam) {
    throw new Error('Team not found or access denied')
  }
  
  // Update the team
  const team = await prisma.team.update({
    where: { id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
    },
    include: {
      people: true,
      initiatives: true,
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
    return await prisma.team.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: {
        people: true,
        initiatives: true,
      },
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return null
  }
}
