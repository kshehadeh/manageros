#!/usr/bin/env bun
/* eslint-disable camelcase */

import {
  PrismaClient,
  Prisma,
  EmployeeType,
  Person,
  OnboardingItemType,
  OnboardingStatus,
  OnboardingItemStatus,
} from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import {
  createClerkOrganization,
  deleteClerkOrganization,
  addUserToClerkOrganization,
  getClerkOrganizationBySlug,
} from '../src/lib/clerk'
import { getClerkHelper } from '../tests/setup/clerk-helpers'

// Create Prisma Client with adapter for Prisma 7
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper functions for generating relative dates
const getRelativeDate = (daysOffset: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date
}

const getRandomFutureDate = (minDays: number, maxDays: number): Date => {
  const daysOffset = minDays + Math.random() * (maxDays - minDays)
  return getRelativeDate(daysOffset)
}

const getRandomPastDate = (minDays: number, maxDays: number): Date => {
  const daysOffset = -(minDays + Math.random() * (maxDays - minDays))
  return getRelativeDate(daysOffset)
}

// Helper to generate realistic sample data
const sampleData = {
  firstNames: [
    'Alice',
    'Bob',
    'Carol',
    'David',
    'Emma',
    'Frank',
    'Grace',
    'Henry',
    'Iris',
    'Jack',
  ],
  lastNames: [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
  ],

  teams: [
    { name: 'Engineering', description: 'Core engineering team' },
    { name: 'Product', description: 'Product and design team' },
    { name: 'Marketing', description: 'Marketing and growth' },
  ],

  childTeams: [
    {
      parentName: 'Engineering',
      name: 'Frontend Team',
      description: 'Web and UI development',
    },
    {
      parentName: 'Engineering',
      name: 'Backend Team',
      description: 'API and infrastructure',
    },
    {
      parentName: 'Engineering',
      name: 'DevOps Team',
      description: 'Deployment and infrastructure',
    },
    { parentName: 'Product', name: 'Design', description: 'UX/UI design' },
    {
      parentName: 'Product',
      name: 'Analytics',
      description: 'Data and insights',
    },
    {
      parentName: 'Marketing',
      name: 'Social Media',
      description: 'Social media and community',
    },
    {
      parentName: 'Marketing',
      name: 'Content',
      description: 'Content creation and strategy',
    },
  ],

  jobRoles: [
    { title: 'Senior Engineer', domain: 'Engineering', level: 'Senior' },
    { title: 'Junior Engineer', domain: 'Engineering', level: 'Junior' },
    { title: 'Engineering Manager', domain: 'Engineering', level: 'Senior' },
    { title: 'Product Manager', domain: 'Product', level: 'Mid' },
    { title: 'Designer', domain: 'Product', level: 'Mid' },
    { title: 'Marketing Manager', domain: 'Marketing', level: 'Mid' },
  ],

  initiatives: [
    {
      title: 'Platform Modernization',
      summary: 'Upgrade core infrastructure to latest frameworks',
      outcome: 'Improved performance and maintainability',
      objectives: [
        'Migrate to Node 20 LTS',
        'Implement microservices architecture',
        'Set up containerization',
      ],
    },
    {
      title: 'Mobile App Launch',
      summary: 'Launch native mobile applications',
      outcome: 'Reach new users on mobile platforms',
      objectives: [
        'Build iOS app',
        'Build Android app',
        'Set up CI/CD pipeline',
      ],
    },
    {
      title: 'Analytics Dashboard',
      summary: 'Create comprehensive analytics platform',
      outcome: 'Data-driven decision making',
      objectives: [
        'Design dashboard UI',
        'Build data pipeline',
        'Implement real-time updates',
      ],
    },
    {
      title: 'Customer Portal',
      summary: 'Self-service customer management system',
      outcome: 'Reduced support load',
      objectives: [
        'Design portal interface',
        'Build backend APIs',
        'Implement authentication',
      ],
    },
  ],

  taskTitles: [
    'Design database schema',
    'Set up testing framework',
    'Implement API endpoints',
    'Create UI mockups',
    'Code review and refactor',
    'Write documentation',
    'Set up CI/CD',
    'Optimize performance',
    'Fix critical bugs',
    'Update dependencies',
  ],

  feedbackKinds: ['praise', 'concern', 'note'],
  feedbackExamples: {
    praise: [
      'Great work on the performance optimization. The page load time improved significantly.',
      'Excellent presentation skills. You communicated the complex idea very clearly.',
      'Outstanding leadership during the migration project. Your guidance kept the team on track.',
    ],
    concern: [
      'Consider improving communication with team members about project updates.',
      'Would be good to complete tasks before deadline to allow review time.',
      'Try to be more proactive in identifying blockers before they impact the timeline.',
    ],
    note: [
      'Good progress on the API design. Next step should be implementation planning.',
      'Dashboard usability looks good. Consider adding export functionality.',
      'Strong technical knowledge. Might benefit from more cross-team collaboration.',
    ],
  },
}

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding for Acme organization...\n')

  const clerkHelper = getClerkHelper()
  const DEMO_ORG_SLUG = 'acme-corp'
  const DEMO_ORG_NAME = 'Acme Corp'
  const DEMO_PASSWORD = 'password123'

  try {
    // Step 0: Clean up existing Clerk data
    console.log('🧹 Cleaning up existing Clerk data...')

    // Delete existing Clerk users
    const demoUserEmails = ['admin@acme.com', 'demo@acme.com', 'owner@acme.com']
    for (const email of demoUserEmails) {
      try {
        await clerkHelper.deleteUserByEmail(email)
        console.log(`  ✓ Deleted Clerk user: ${email}`)
      } catch {
        // User might not exist, that's fine
        console.log(`  ℹ Clerk user not found: ${email}`)
      }
    }

    // Find and delete existing Clerk organization
    const existingClerkOrg = await getClerkOrganizationBySlug(DEMO_ORG_SLUG)
    if (existingClerkOrg) {
      try {
        await deleteClerkOrganization(existingClerkOrg.id)
        console.log(`  ✓ Deleted Clerk organization: ${existingClerkOrg.name}`)
      } catch (error) {
        console.warn(`  ⚠ Failed to delete Clerk organization: ${error}`)
      }
    }

    // Clean up database organization if it exists
    const existingDbOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { clerkOrganizationId: existingClerkOrg?.id || '' },
          { clerkOrganizationId: { contains: 'acme' } },
        ],
      },
    })

    if (existingDbOrg) {
      // Get user IDs that will be deleted (by email) - needed for task deletion
      // This is the primary source since we're deleting users by email
      const usersToDelete = await prisma.user.findMany({
        where: {
          email: { in: demoUserEmails },
        },
        select: { id: true },
      })
      const userIdsToDelete = usersToDelete.map(u => u.id)

      // Also get user IDs from organization memberships as backup
      const orgMembers = await prisma.organizationMember.findMany({
        where: { organizationId: existingDbOrg.id },
        select: { userId: true },
      })
      const orgUserIds = orgMembers.map(m => m.userId)

      // Combine both lists and remove duplicates
      const allUserIds = [...new Set([...userIdsToDelete, ...orgUserIds])]

      console.log(
        `  ℹ Found ${allUserIds.length} user(s) to clean up tasks for`
      )

      // Delete in dependency order
      await prisma.feedback.deleteMany({
        where: { about: { organizationId: existingDbOrg.id } },
      })
      await prisma.oneOnOne.deleteMany({
        where: { manager: { organizationId: existingDbOrg.id } },
      })
      // Delete all tasks - both those linked to initiatives and those created by users in the org
      // This must happen before deleting users due to foreign key constraints
      const taskDeleteConditions: Prisma.TaskWhereInput[] = [
        { initiative: { organizationId: existingDbOrg.id } },
        { objective: { initiative: { organizationId: existingDbOrg.id } } },
      ]

      // Always try to delete tasks created by users we're deleting
      // Even if allUserIds is empty, the OR will still work with just initiative conditions
      if (allUserIds.length > 0) {
        taskDeleteConditions.push({ createdById: { in: allUserIds } })
      }

      // Delete all matching tasks
      const deletedTasks = await prisma.task.deleteMany({
        where: {
          OR: taskDeleteConditions,
        },
      })
      if (deletedTasks.count > 0) {
        console.log(`  ✓ Deleted ${deletedTasks.count} task(s)`)
      }
      await prisma.checkIn.deleteMany({
        where: { initiative: { organizationId: existingDbOrg.id } },
      })
      await prisma.objective.deleteMany({
        where: { initiative: { organizationId: existingDbOrg.id } },
      })
      await prisma.initiativeOwner.deleteMany({
        where: { initiative: { organizationId: existingDbOrg.id } },
      })
      await prisma.initiative.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      // Delete onboarding data in dependency order
      await prisma.onboardingItemProgress.deleteMany({
        where: { instance: { organizationId: existingDbOrg.id } },
      })
      await prisma.onboardingInstance.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.onboardingItem.deleteMany({
        where: { phase: { template: { organizationId: existingDbOrg.id } } },
      })
      await prisma.onboardingPhase.deleteMany({
        where: { template: { organizationId: existingDbOrg.id } },
      })
      await prisma.onboardingTemplate.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.person.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.team.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.jobRole.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.jobLevel.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.jobDomain.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      // Delete OAuth client metadata (references User without cascade)
      await prisma.oAuthClientMetadata.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      // Delete organization memberships before deleting users
      await prisma.organizationMember.deleteMany({
        where: { organizationId: existingDbOrg.id },
      })
      await prisma.user.deleteMany({
        where: {
          email: { in: demoUserEmails },
        },
      })
      await prisma.organization.delete({
        where: { id: existingDbOrg.id },
      })
      console.log(`  ✓ Cleaned up existing database data\n`)
    } else {
      console.log(`  ℹ No existing database organization found\n`)
    }

    // Step 1: Create Clerk organization
    console.log('📦 Creating Clerk organization...')
    const clerkOrg = await createClerkOrganization(DEMO_ORG_NAME, DEMO_ORG_SLUG)
    console.log(
      `✓ Created Clerk organization: ${clerkOrg.name} (${clerkOrg.id})\n`
    )

    // Step 2: Create Clerk users
    console.log('👥 Creating Clerk users...')
    const ownerClerkUser = await clerkHelper.createTestUser(
      'owner@acme.com',
      'Owner User',
      DEMO_PASSWORD
    )
    const adminClerkUser = await clerkHelper.createTestUser(
      'admin@acme.com',
      'Admin User',
      DEMO_PASSWORD
    )
    const demoClerkUser = await clerkHelper.createTestUser(
      'demo@acme.com',
      'Demo User',
      DEMO_PASSWORD
    )
    console.log(`✓ Created 3 Clerk users\n`)

    // Step 3: Add users to Clerk organization with appropriate roles
    console.log('🔗 Adding users to Clerk organization...')
    await addUserToClerkOrganization(
      clerkOrg.id,
      ownerClerkUser.id,
      'org:admin'
    )
    await addUserToClerkOrganization(
      clerkOrg.id,
      adminClerkUser.id,
      'org:admin'
    )
    await addUserToClerkOrganization(
      clerkOrg.id,
      demoClerkUser.id,
      'org:member'
    )
    console.log(`✓ Added users to Clerk organization\n`)

    // Step 4: Create database organization
    console.log('📦 Creating database organization...')
    const organization = await prisma.organization.create({
      data: {
        clerkOrganizationId: clerkOrg.id,
        billingUserId: null, // Will be set after creating owner user
        description: 'Demo organization with comprehensive sample data',
      },
    })
    console.log(`✓ Created database organization: ${organization.id}\n`)

    // Step 5: Create database users linked to Clerk users
    console.log('👥 Creating database users...')
    // Use upsert to handle existing users
    const ownerUser = await prisma.user.upsert({
      where: { email: 'owner@acme.com' },
      update: {
        name: 'Owner User',
        clerkUserId: ownerClerkUser.id,
      },
      create: {
        email: 'owner@acme.com',
        name: 'Owner User',
        clerkUserId: ownerClerkUser.id,
      },
    })

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@acme.com' },
      update: {
        name: 'Admin User',
        clerkUserId: adminClerkUser.id,
      },
      create: {
        email: 'admin@acme.com',
        name: 'Admin User',
        clerkUserId: adminClerkUser.id,
      },
    })

    const regularUser = await prisma.user.upsert({
      where: { email: 'demo@acme.com' },
      update: {
        name: 'Demo User',
        clerkUserId: demoClerkUser.id,
      },
      create: {
        email: 'demo@acme.com',
        name: 'Demo User',
        clerkUserId: demoClerkUser.id,
      },
    })

    // Set owner as billing user
    await prisma.organization.update({
      where: { id: organization.id },
      data: { billingUserId: ownerUser.id },
    })

    // Create OrganizationMember records for all users
    console.log('👥 Creating organization member records...')
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: ownerUser.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: 'OWNER', // Owner is the billing user
      },
      create: {
        userId: ownerUser.id,
        organizationId: organization.id,
        role: 'OWNER', // Owner is the billing user
      },
    })
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: adminUser.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: 'ADMIN', // Admin user has org:admin role in Clerk
      },
      create: {
        userId: adminUser.id,
        organizationId: organization.id,
        role: 'ADMIN', // Admin user has org:admin role in Clerk
      },
    })
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: regularUser.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: 'USER', // Regular user has org:member role in Clerk
      },
      create: {
        userId: regularUser.id,
        organizationId: organization.id,
        role: 'USER', // Regular user has org:member role in Clerk
      },
    })
    console.log(`✓ Created 3 organization member records\n`)

    console.log(`✓ Created 3 database users\n`)

    // Step 3: Create job levels
    console.log('📊 Creating job levels and domains...')
    const levels = await Promise.all([
      prisma.jobLevel.upsert({
        where: {
          name_organizationId: {
            name: 'Junior',
            organizationId: organization.id,
          },
        },
        update: {},
        create: { name: 'Junior', organizationId: organization.id, order: 1 },
      }),
      prisma.jobLevel.upsert({
        where: {
          name_organizationId: { name: 'Mid', organizationId: organization.id },
        },
        update: {},
        create: { name: 'Mid', organizationId: organization.id, order: 2 },
      }),
      prisma.jobLevel.upsert({
        where: {
          name_organizationId: {
            name: 'Senior',
            organizationId: organization.id,
          },
        },
        update: {},
        create: { name: 'Senior', organizationId: organization.id, order: 3 },
      }),
      prisma.jobLevel.upsert({
        where: {
          name_organizationId: {
            name: 'Lead',
            organizationId: organization.id,
          },
        },
        update: {},
        create: { name: 'Lead', organizationId: organization.id, order: 4 },
      }),
    ])

    const domains = await Promise.all([
      prisma.jobDomain.upsert({
        where: {
          name_organizationId: {
            name: 'Engineering',
            organizationId: organization.id,
          },
        },
        update: {},
        create: { name: 'Engineering', organizationId: organization.id },
      }),
      prisma.jobDomain.upsert({
        where: {
          name_organizationId: {
            name: 'Product',
            organizationId: organization.id,
          },
        },
        update: {},
        create: { name: 'Product', organizationId: organization.id },
      }),
      prisma.jobDomain.upsert({
        where: {
          name_organizationId: {
            name: 'Marketing',
            organizationId: organization.id,
          },
        },
        update: {},
        create: { name: 'Marketing', organizationId: organization.id },
      }),
    ])
    console.log(
      `✓ Created ${levels.length} job levels and ${domains.length} domains\n`
    )

    // Step 4: Create job roles
    console.log('💼 Creating job roles...')
    const jobRoles = await Promise.all([
      prisma.jobRole.create({
        data: {
          title: 'Senior Software Engineer',
          description: 'Lead technical projects and mentor junior engineers',
          organizationId: organization.id,
          levelId: levels[2].id,
          domainId: domains[0].id,
        },
      }),
      prisma.jobRole.create({
        data: {
          title: 'Junior Software Engineer',
          description:
            'Contribute to development and learn from senior team members',
          organizationId: organization.id,
          levelId: levels[0].id,
          domainId: domains[0].id,
        },
      }),
      prisma.jobRole.create({
        data: {
          title: 'Engineering Manager',
          description: 'Manage engineering team and drive technical strategy',
          organizationId: organization.id,
          levelId: levels[3].id,
          domainId: domains[0].id,
        },
      }),
      prisma.jobRole.create({
        data: {
          title: 'Product Manager',
          description: 'Define product vision and roadmap',
          organizationId: organization.id,
          levelId: levels[1].id,
          domainId: domains[1].id,
        },
      }),
      prisma.jobRole.create({
        data: {
          title: 'Product Designer',
          description: 'Design user experiences and interfaces',
          organizationId: organization.id,
          levelId: levels[1].id,
          domainId: domains[1].id,
        },
      }),
    ])
    console.log(`✓ Created ${jobRoles.length} job roles\n`)

    // Step 5: Create teams
    console.log('🏢 Creating teams...')
    const teams = await Promise.all(
      sampleData.teams.map(teamData =>
        prisma.team.create({
          data: {
            name: teamData.name,
            description: teamData.description,
            organizationId: organization.id,
          },
        })
      )
    )
    console.log(`✓ Created ${teams.length} teams\n`)

    // Step 6: Create child teams
    console.log('🏢 Creating child teams...')
    const childTeams = await Promise.all(
      sampleData.childTeams.map(childTeamData => {
        const parentTeam = teams.find(t => t.name === childTeamData.parentName)
        if (!parentTeam) {
          console.warn(
            `Parent team "${childTeamData.parentName}" not found for child team "${childTeamData.name}". Skipping.`
          )
          return null
        }
        return prisma.team.create({
          data: {
            name: childTeamData.name,
            description: childTeamData.description,
            organizationId: organization.id,
            parentId: parentTeam.id,
          },
        })
      })
    )
    console.log(`✓ Created ${childTeams.length} child teams\n`)

    // Step 7: Create people
    console.log('👤 Creating people...')
    const people: Person[] = []

    // Create team leads
    const engineeringLead = await prisma.person.create({
      data: {
        name: 'Sarah Chen',
        email: 'sarah@acme.com',
        role: 'Engineering Manager',
        teamId: teams[0].id,
        organizationId: organization.id,
        employeeType: EmployeeType.FULL_TIME,
        jobRoleId: jobRoles[2].id,
        status: 'active',
      },
    })
    people.push(engineeringLead)

    const productLead = await prisma.person.create({
      data: {
        name: 'Michael Torres',
        email: 'michael@acme.com',
        role: 'Product Manager',
        teamId: teams[1].id,
        organizationId: organization.id,
        employeeType: EmployeeType.FULL_TIME,
        jobRoleId: jobRoles[3].id,
        status: 'active',
      },
    })
    people.push(productLead)

    const marketingLead = await prisma.person.create({
      data: {
        name: 'Lisa Wang',
        email: 'lisa@acme.com',
        role: 'Marketing Manager',
        teamId: teams[2].id,
        organizationId: organization.id,
        employeeType: EmployeeType.FULL_TIME,
        status: 'active',
      },
    })
    people.push(marketingLead)

    // Create individual contributors
    const engineers = await Promise.all([
      prisma.person.create({
        data: {
          name: 'James Rodriguez',
          email: 'james@acme.com',
          role: 'Senior Engineer',
          teamId: teams[0].id,
          managerId: engineeringLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          jobRoleId: jobRoles[0].id,
          status: 'active',
        },
      }),
      prisma.person.create({
        data: {
          name: 'Emma Davis',
          email: 'emma@acme.com',
          role: 'Senior Engineer',
          teamId: teams[0].id,
          managerId: engineeringLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          jobRoleId: jobRoles[0].id,
          status: 'active',
        },
      }),
      prisma.person.create({
        data: {
          name: 'Alex Kim',
          email: 'alex@acme.com',
          role: 'Junior Engineer',
          teamId: teams[0].id,
          managerId: engineeringLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          jobRoleId: jobRoles[1].id,
          status: 'active',
        },
      }),
    ])
    people.push(...engineers)

    const productTeamMembers = await Promise.all([
      prisma.person.create({
        data: {
          name: 'Oliver Smith',
          email: 'oliver@acme.com',
          role: 'Product Designer',
          teamId: teams[1].id,
          managerId: productLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          jobRoleId: jobRoles[4].id,
          status: 'active',
        },
      }),
      prisma.person.create({
        data: {
          name: 'Sophia Brown',
          email: 'sophia@acme.com',
          role: 'Product Analyst',
          teamId: teams[1].id,
          managerId: productLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          status: 'active',
        },
      }),
    ])
    people.push(...productTeamMembers)

    const marketingTeamMembers = await Promise.all([
      prisma.person.create({
        data: {
          name: 'David Lee',
          email: 'david@acme.com',
          role: 'Marketing Specialist',
          teamId: teams[2].id,
          managerId: marketingLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          status: 'active',
        },
      }),
      prisma.person.create({
        data: {
          name: 'Rachel Martinez',
          email: 'rachel@acme.com',
          role: 'Content Writer',
          teamId: teams[2].id,
          managerId: marketingLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          status: 'active',
        },
      }),
    ])
    people.push(...marketingTeamMembers)

    console.log(`✓ Created ${people.length} people\n`)

    // Link regular user to a person in the organization
    const regularUserPerson = people[Math.floor(Math.random() * people.length)]
    await prisma.user.update({
      where: { id: regularUser.id },
      data: { personId: regularUserPerson.id },
    })

    // Link admin user to a manager
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { personId: engineeringLead.id },
    })

    // Step 8: Create initiatives
    console.log('🎯 Creating initiatives...')
    const initiatives = await Promise.all(
      sampleData.initiatives.map((initData, index) => {
        // Start dates: some initiatives started recently (past 2-4 weeks), others are planned for future
        const startDate =
          index === 0
            ? getRandomPastDate(14, 28) // First initiative started 2-4 weeks ago
            : index === 1
              ? getRandomFutureDate(7, 21) // Second initiative starts in 1-3 weeks
              : getRandomPastDate(7, 21) // Other initiatives started 1-3 weeks ago

        // Target dates: 2-4 months from start date
        const targetDate = new Date(startDate)
        targetDate.setDate(targetDate.getDate() + 60 + Math.random() * 60) // 2-4 months later

        return prisma.initiative.create({
          data: {
            title: initData.title,
            summary: initData.summary,
            outcome: initData.outcome,
            teamId: teams[index % teams.length].id,
            organizationId: organization.id,
            status:
              index === 0
                ? 'in_progress'
                : index === 1
                  ? 'planned'
                  : 'in_progress',
            rag: index === 0 ? 'amber' : 'green',
            confidence: 75 + Math.random() * 20,
            startDate,
            targetDate,
            owners: {
              create: [
                {
                  personId: [engineeringLead, productLead, marketingLead][
                    index % 3
                  ].id,
                  role: 'owner',
                },
              ],
            },
            objectives: {
              create: initData.objectives.map((title, idx) => ({
                title,
                keyResult: `Achieve ${idx + 1}/${initData.objectives.length} milestone`,
                sortIndex: idx,
              })),
            },
          },
        })
      })
    )
    console.log(`✓ Created ${initiatives.length} initiatives with objectives\n`)

    // Step 9: Create tasks
    console.log('📝 Creating tasks...')
    let taskCount = 0
    for (const initiative of initiatives) {
      const objectives = await prisma.objective.findMany({
        where: { initiativeId: initiative.id },
      })

      for (const objective of objectives) {
        const tasksPerObjective = 3 + Math.floor(Math.random() * 3)
        for (let i = 0; i < tasksPerObjective; i++) {
          await prisma.task.create({
            data: {
              title:
                sampleData.taskTitles[
                  Math.floor(Math.random() * sampleData.taskTitles.length)
                ],
              description: `Task for objective: ${objective.title}`,
              objectiveId: objective.id,
              initiativeId: initiative.id,
              assigneeId: people[Math.floor(Math.random() * people.length)].id,
              createdById: adminUser.id,
              status: ['todo', 'doing', 'done'][Math.floor(Math.random() * 3)],
              priority: Math.floor(Math.random() * 3) + 1,
              estimate: [5, 8, 13, 21][Math.floor(Math.random() * 4)],
              dueDate: getRandomFutureDate(7, 90), // Due dates 1 week to 3 months from now
            },
          })
          taskCount++
        }
      }
    }
    console.log(`✓ Created ${taskCount} tasks\n`)

    // Step 10: Create check-ins
    console.log('📊 Creating check-ins...')
    let checkInCount = 0
    for (const initiative of initiatives) {
      for (let week = 0; week < 4; week++) {
        // Create check-ins for the past 4 weeks
        const weekDate = getRelativeDate(-week * 7)

        await prisma.checkIn.create({
          data: {
            initiativeId: initiative.id,
            weekOf: weekDate,
            rag: ['green', 'amber', 'red'][Math.floor(Math.random() * 3)],
            confidence: 70 + Math.random() * 25,
            summary: `Progress update for week of ${weekDate.toLocaleDateString()}. Making steady progress on deliverables.`,
            blockers: 'No major blockers at this time.',
            nextSteps: 'Continue with implementation and testing phases.',
            createdById: people[Math.floor(Math.random() * people.length)].id,
          },
        })
        checkInCount++
      }
    }
    console.log(`✓ Created ${checkInCount} check-ins\n`)

    // Step 11: Create one-on-ones
    console.log('🤝 Creating one-on-ones...')
    const oneOnOnes = []
    const managers = [engineeringLead, productLead, marketingLead]
    const reports = people.filter(p => managers.every(m => m.id !== p.id))

    for (const manager of managers) {
      const managerReports = reports.filter(r => r.managerId === manager.id)
      for (const report of managerReports) {
        const oneOnOne = await prisma.oneOnOne.create({
          data: {
            managerId: manager.id,
            reportId: report.id,
            notes:
              'Regular check-in to discuss progress, goals, and any concerns.',
            scheduledAt: getRandomFutureDate(1, 14), // Scheduled 1-14 days from now
          },
        })
        oneOnOnes.push(oneOnOne)
      }
    }
    console.log(`✓ Created ${oneOnOnes.length} one-on-ones\n`)

    // Step 12: Create feedback
    console.log('💬 Creating feedback...')
    let feedbackCount = 0
    for (let i = 0; i < 15; i++) {
      const kind =
        sampleData.feedbackKinds[
          Math.floor(Math.random() * sampleData.feedbackKinds.length)
        ]
      const feedbackExamples =
        sampleData.feedbackExamples[
          kind as keyof typeof sampleData.feedbackExamples
        ]

      await prisma.feedback.create({
        data: {
          aboutId: people[Math.floor(Math.random() * people.length)].id,
          fromId: people[Math.floor(Math.random() * people.length)].id,
          kind,
          isPrivate: Math.random() > 0.5,
          body: feedbackExamples[
            Math.floor(Math.random() * feedbackExamples.length)
          ],
        },
      })
      feedbackCount++
    }
    console.log(`✓ Created ${feedbackCount} feedback items\n`)

    // Step 13: Create feedback template
    console.log('📋 Creating feedback template...')
    const existingTemplate = await prisma.feedbackTemplate.findFirst({
      where: { isDefault: true },
    })

    if (!existingTemplate) {
      await prisma.feedbackTemplate.create({
        data: {
          name: 'Performance Review Template',
          description:
            'Standard performance review questions for employee feedback',
          isDefault: true,
          questions: {
            create: [
              {
                question: 'What did the employee do well this period?',
                type: 'text',
                required: true,
                sortOrder: 0,
              },
              {
                question: 'What are some areas for improvement?',
                type: 'text',
                required: true,
                sortOrder: 1,
              },
              {
                question: 'How would you rate their overall performance? (1-5)',
                type: 'rating',
                required: true,
                sortOrder: 2,
              },
              {
                question: 'What skills should they focus on developing?',
                type: 'text',
                required: false,
                sortOrder: 3,
              },
            ],
          },
        },
      })
      console.log(`✓ Created default feedback template\n`)
    } else {
      console.log(`✓ Default feedback template already exists\n`)
    }

    // Step 15: Create onboarding template
    console.log('🎓 Creating onboarding template...')
    const onboardingTemplate = await prisma.onboardingTemplate.create({
      data: {
        name: 'Standard Employee Onboarding',
        description:
          'Comprehensive onboarding process for new employees covering company culture, tools, and team integration',
        organizationId: organization.id,
        isDefault: true,
        isActive: true,
        phases: {
          create: [
            {
              name: 'Day 1',
              description: 'First day essentials',
              sortOrder: 0,
              items: {
                create: [
                  {
                    title: 'Complete HR paperwork',
                    description:
                      'Fill out all required HR forms and documentation',
                    type: OnboardingItemType.TASK,
                    sortOrder: 0,
                    isRequired: true,
                  },
                  {
                    title: 'Set up workstation',
                    description: 'Configure your computer and workspace',
                    type: OnboardingItemType.TASK,
                    sortOrder: 1,
                    isRequired: true,
                  },
                  {
                    title: 'Read employee handbook',
                    description: 'Review company policies and procedures',
                    type: OnboardingItemType.READING,
                    sortOrder: 2,
                    isRequired: true,
                    linkedUrl: 'https://example.com/employee-handbook',
                  },
                  {
                    title: 'Welcome meeting with manager',
                    description: 'Initial meeting with your direct manager',
                    type: OnboardingItemType.MEETING,
                    sortOrder: 3,
                    isRequired: true,
                  },
                ],
              },
            },
            {
              name: 'Week 1',
              description: 'First week activities',
              sortOrder: 1,
              items: {
                create: [
                  {
                    title: 'Access all required systems',
                    description:
                      'Get access to email, Slack, project management tools, etc.',
                    type: OnboardingItemType.TASK,
                    sortOrder: 0,
                    isRequired: true,
                  },
                  {
                    title: 'Meet the team',
                    description: 'Introduction meetings with team members',
                    type: OnboardingItemType.MEETING,
                    sortOrder: 1,
                    isRequired: true,
                  },
                  {
                    title: 'Review team documentation',
                    description:
                      'Read through team-specific documentation and processes',
                    type: OnboardingItemType.READING,
                    sortOrder: 2,
                    isRequired: true,
                    linkedUrl: 'https://example.com/team-docs',
                  },
                  {
                    title: 'Manager checkpoint: Week 1',
                    description: 'Manager confirms first week progress',
                    type: OnboardingItemType.CHECKPOINT,
                    sortOrder: 3,
                    isRequired: true,
                    ownerType: 'manager',
                  },
                ],
              },
            },
            {
              name: 'First 30 Days',
              description: 'First month milestones',
              sortOrder: 2,
              items: {
                create: [
                  {
                    title: 'Complete first project assignment',
                    description: 'Work on your first assigned project',
                    type: OnboardingItemType.TASK,
                    sortOrder: 0,
                    isRequired: true,
                  },
                  {
                    title: 'Attend company all-hands',
                    description: 'Participate in company-wide meeting',
                    type: OnboardingItemType.MEETING,
                    sortOrder: 1,
                    isRequired: false,
                  },
                  {
                    title: 'Understand team expectations',
                    description: 'Review team goals and expectations',
                    type: OnboardingItemType.EXPECTATION,
                    sortOrder: 2,
                    isRequired: true,
                  },
                  {
                    title: 'Manager checkpoint: 30 days',
                    description: 'Manager confirms 30-day progress',
                    type: OnboardingItemType.CHECKPOINT,
                    sortOrder: 3,
                    isRequired: true,
                    ownerType: 'manager',
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        phases: {
          include: {
            items: true,
          },
        },
      },
    })
    console.log(
      `✓ Created onboarding template with ${onboardingTemplate.phases.length} phases\n`
    )

    // Step 16: Create onboarding instances with different statuses
    console.log('🎓 Creating onboarding instances...')

    // Get all items from the template
    const allTemplateItems = onboardingTemplate.phases.flatMap(
      phase => phase.items
    )

    // Create 3 new people for onboarding examples
    const onboardingPeople = await Promise.all([
      // Person 1: Just started onboarding (NOT_STARTED)
      prisma.person.create({
        data: {
          name: 'Taylor Johnson',
          email: 'taylor@acme.com',
          role: 'Junior Engineer',
          teamId: teams[0].id,
          managerId: engineeringLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          jobRoleId: jobRoles[1].id,
          status: 'active',
          startedAt: getRelativeDate(-2), // Started 2 days ago
        },
      }),
      // Person 2: In progress onboarding (IN_PROGRESS)
      prisma.person.create({
        data: {
          name: 'Jordan Martinez',
          email: 'jordan@acme.com',
          role: 'Product Designer',
          teamId: teams[1].id,
          managerId: productLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          jobRoleId: jobRoles[4].id,
          status: 'active',
          startedAt: getRelativeDate(-10), // Started 10 days ago
        },
      }),
      // Person 3: Completed onboarding (COMPLETED)
      prisma.person.create({
        data: {
          name: 'Casey Williams',
          email: 'casey@acme.com',
          role: 'Marketing Specialist',
          teamId: teams[2].id,
          managerId: marketingLead.id,
          organizationId: organization.id,
          employeeType: EmployeeType.FULL_TIME,
          status: 'active',
          startedAt: getRelativeDate(-45), // Started 45 days ago
        },
      }),
    ])

    // Instance 1: NOT_STARTED - Just created, no progress
    await prisma.onboardingInstance.create({
      data: {
        templateId: onboardingTemplate.id,
        personId: onboardingPeople[0].id,
        organizationId: organization.id,
        status: OnboardingStatus.NOT_STARTED,
        managerId: onboardingPeople[0].managerId,
        itemProgress: {
          create: allTemplateItems.map(item => ({
            itemId: item.id,
            status: OnboardingItemStatus.PENDING,
          })),
        },
      },
    })

    // Instance 2: IN_PROGRESS - Started, some items completed
    await prisma.onboardingInstance.create({
      data: {
        templateId: onboardingTemplate.id,
        personId: onboardingPeople[1].id,
        organizationId: organization.id,
        status: OnboardingStatus.IN_PROGRESS,
        startedAt: getRelativeDate(-10),
        managerId: onboardingPeople[1].managerId,
        itemProgress: {
          create: allTemplateItems.map((item, index) => {
            // Complete first 6 items (Day 1 and some Week 1 items)
            const isCompleted = index < 6
            const isInProgress = index === 6
            return {
              itemId: item.id,
              status: isCompleted
                ? OnboardingItemStatus.COMPLETED
                : isInProgress
                  ? OnboardingItemStatus.IN_PROGRESS
                  : OnboardingItemStatus.PENDING,
              completedAt: isCompleted ? getRelativeDate(-10 + index) : null,
              completedById: isCompleted ? onboardingPeople[1].id : null,
            }
          }),
        },
      },
    })

    // Instance 3: COMPLETED - All items completed
    await prisma.onboardingInstance.create({
      data: {
        templateId: onboardingTemplate.id,
        personId: onboardingPeople[2].id,
        organizationId: organization.id,
        status: OnboardingStatus.COMPLETED,
        startedAt: getRelativeDate(-45),
        completedAt: getRelativeDate(-15), // Completed 15 days ago
        managerId: onboardingPeople[2].managerId,
        itemProgress: {
          create: allTemplateItems.map((item, index) => ({
            itemId: item.id,
            status: OnboardingItemStatus.COMPLETED,
            completedAt: getRelativeDate(-45 + index * 2), // Stagger completion dates
            completedById:
              item.type === OnboardingItemType.CHECKPOINT
                ? onboardingPeople[2].managerId // Manager completes checkpoints
                : onboardingPeople[2].id, // Person completes other items
          })),
        },
      },
    })

    people.push(...onboardingPeople)
    console.log(
      `✓ Created 3 onboarding instances (NOT_STARTED, IN_PROGRESS, COMPLETED)\n`
    )

    // Summary
    console.log('✨ Demo data seeding completed successfully!\n')
    console.log('📊 Summary of created data:')
    console.log(`   - Clerk Organization: ${clerkOrg.name} (${clerkOrg.slug})`)
    console.log(`   - Database Organization: ${organization.id}`)
    console.log(`   - Users: 3 (all linked to Clerk)`)
    console.log(`   - Teams: ${teams.length}`)
    console.log(`   - People: ${people.length}`)
    console.log(`   - Job Roles: ${jobRoles.length}`)
    console.log(`   - Initiatives: ${initiatives.length}`)
    console.log(`   - Tasks: ${taskCount}`)
    console.log(`   - Check-ins: ${checkInCount}`)
    console.log(`   - One-on-ones: ${oneOnOnes.length}`)
    console.log(`   - Feedback: ${feedbackCount}`)
    console.log(`   - Onboarding Templates: 1`)
    console.log(`   - Onboarding Instances: 3`)
    console.log(`\nLogin credentials (all passwords: ${DEMO_PASSWORD}):`)
    console.log(`   Owner: owner@acme.com (org:admin, billing user)`)
    console.log(`   Admin: admin@acme.com (org:admin)`)
    console.log(`   User: demo@acme.com (org:member)`)
  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.main) {
  seedDemoData()
}

export { seedDemoData }
