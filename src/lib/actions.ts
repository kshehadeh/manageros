'use server'

import { prisma } from '@/lib/db'
import { initiativeSchema, type InitiativeFormData, personSchema, type PersonFormData, teamSchema, type TeamFormData, oneOnOneSchema, type OneOnOneFormData } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getCurrentUser () {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function createOrganization (formData: { name: string; slug: string }) {
  const user = await getCurrentUser()
  
  // Check if user already has an organization
  if (user.organizationId) {
    throw new Error('User already belongs to an organization')
  }
  
  // Check if organization slug already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: formData.slug }
  })
  
  if (existingOrg) {
    throw new Error('Organization slug already exists')
  }
  
  // Create organization and update user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: formData.name,
        slug: formData.slug
      }
    })
    
    // Update user to be admin of the organization
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: 'ADMIN'
      }
    })
    
    return organization
  })
  
  revalidatePath('/')
  return result
}

export async function linkUserToPerson (userId: string, personId: string) {
  const currentUser = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to link users to persons')
  }
  
  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.organizationId
    }
  })
  
  if (!person) {
    throw new Error('Person not found or access denied')
  }
  
  // Check if person is already linked to a user
  const personWithUser = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.organizationId
    },
    include: { user: true }
  })
  
  if (personWithUser?.user) {
    throw new Error('Person is already linked to a user')
  }
  
  // Link the user to the person
  await prisma.user.update({
    where: { id: userId },
    data: { personId: personId }
  })
  
  revalidatePath('/people')
  revalidatePath('/people/[id]', 'page')
}

export async function unlinkUserFromPerson (userId: string) {
  const currentUser = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to manage user-person links')
  }
  
  // Unlink the user from the person
  await prisma.user.update({
    where: { id: userId },
    data: { personId: null }
  })
  
  revalidatePath('/people')
  revalidatePath('/people/[id]', 'page')
}

export async function getAvailableUsersForLinking () {
  const currentUser = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    return []
  }
  
  // Get users in the same organization who aren't linked to a person
  return await prisma.user.findMany({
    where: {
      organizationId: currentUser.organizationId,
      personId: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: 'asc' }
  })
}

export async function createInitiative (formData: InitiativeFormData) {
  const user = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create initiatives')
  }
  
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

export async function getTeams () {
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

export async function getPeople () {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
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

export async function getPeopleHierarchy () {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    
    // Get all people with their manager and reports relationships
    const people = await prisma.person.findMany({
      where: { 
        organizationId: user.organizationId
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
                status: true
              }
            }
          }
        },
        reports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' },
    })
    
    // Define the type for a person with all included relations
    type PersonWithRelations = typeof people[0]
    
    // Define the hierarchy item type
    type HierarchyItem = PersonWithRelations & {
      level: number
    }
    
    // Build hierarchical structure
    const hierarchy: HierarchyItem[] = []
    
    // Find top-level people (those without managers)
    const topLevelPeople = people.filter(person => !person.managerId)
    
    // Recursive function to build hierarchy
    function buildHierarchy (person: PersonWithRelations, level: number = 0) {
      hierarchy.push({
        ...person,
        level
      })
      
      // Add reports recursively
      person.reports.forEach((report) => {
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

export async function createPerson (formData: PersonFormData) {
  const user = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to create people')
  }
  
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
  await prisma.person.create({
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

export async function updatePerson (id: string, formData: PersonFormData) {
  const user = await getCurrentUser()
  
  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to update people')
  }
  
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
  await prisma.person.update({
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

export async function getPerson (id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }
    return await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.organizationId
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
            role: true
          }
        }
      },
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return null
  }
}

export async function createTeam (formData: TeamFormData) {
  const user = await getCurrentUser()
  
  // Debug logging
  console.log('Creating team for user:', {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
    organizationName: user.organizationName
  })
  
  // Additional validation
  if (!user.organizationId) {
    console.error('❌ User has no organizationId!', user)
    throw new Error('User is not associated with an organization')
  }
  
  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId }
  })
  
  if (!organization) {
    console.error('❌ Organization not found!', { organizationId: user.organizationId })
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
        organizationId: user.organizationId
      }
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
      parentId: validatedData.parentId && validatedData.parentId.trim() !== '' ? validatedData.parentId : null,
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

export async function updateTeam (id: string, formData: TeamFormData) {
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
      organizationId: user.organizationId
    }
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
        organizationId: user.organizationId
      }
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
      parentId: validatedData.parentId && validatedData.parentId.trim() !== '' ? validatedData.parentId : null,
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

export async function getTeam (id: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return null
    }
    return await prisma.team.findFirst({
      where: {
        id,
        organizationId: user.organizationId
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

export async function getTeamsForSelection (excludeId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      return []
    }
    return await prisma.team.findMany({
      where: {
        organizationId: user.organizationId,
        ...(excludeId && { id: { not: excludeId } })
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching teams for selection:', error)
    return []
  }
}

export async function createOneOnOne (formData: OneOnOneFormData) {
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
        organizationId: user.organizationId 
      }
    }),
    prisma.person.findFirst({
      where: { 
        id: validatedData.reportId,
        organizationId: user.organizationId 
      }
    })
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
    }
  })

  revalidatePath('/oneonones')
  revalidatePath(`/people/${report.id}`)
  revalidatePath(`/people/${manager.id}`)
  
  // Redirect to the one-on-ones page
  redirect('/oneonones')
}

export async function getOneOnOnes () {
  const user = await getCurrentUser()
  
  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the person record for the current user
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.id
      }
    }
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  return await prisma.oneOnOne.findMany({
    where: {
      OR: [
        { managerId: currentPerson.id },
        { reportId: currentPerson.id }
      ]
    },
    include: {
      manager: true,
      report: true,
    },
    orderBy: { scheduledAt: 'desc' }
  })
}

export async function getPeopleForOneOnOne () {
  const user = await getCurrentUser()
  
  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get all people in the organization for one-on-one meetings
  const people = await prisma.person.findMany({
    where: {
      organizationId: user.organizationId,
      status: 'active'
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
        }
      },
      reports: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return people
}

export async function getOneOnOneById (id: string) {
  const user = await getCurrentUser()
  
  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } }
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Get the one-on-one record, ensuring the current user is a participant
  const oneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [
        { managerId: currentPerson.id },
        { reportId: currentPerson.id }
      ]
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      report: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  })

  if (!oneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  return oneOnOne
}

export async function updateOneOnOne (id: string, formData: OneOnOneFormData) {
  const user = await getCurrentUser()
  
  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Validate form data
  const validatedData = oneOnOneSchema.parse(formData)
  
  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: { user: { id: user.id } }
  })

  if (!currentPerson) {
    throw new Error('No person record found for current user')
  }

  // Verify the one-on-one exists and user has access to it
  const existingOneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      id,
      OR: [
        { managerId: currentPerson.id },
        { reportId: currentPerson.id }
      ]
    }
  })

  if (!existingOneOnOne) {
    throw new Error('One-on-one not found or you do not have access to it')
  }

  // Verify both manager and report belong to the same organization
  const [manager, report] = await Promise.all([
    prisma.person.findFirst({
      where: { 
        id: validatedData.managerId,
        organizationId: user.organizationId
      }
    }),
    prisma.person.findFirst({
      where: { 
        id: validatedData.reportId,
        organizationId: user.organizationId
      }
    })
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
    }
  })

  // Revalidate the one-on-ones page
  revalidatePath('/oneonones')
  
  // Redirect to the one-on-ones page
  redirect('/oneonones')
}
