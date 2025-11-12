#!/usr/bin/env bun
/* eslint-disable camelcase */

import { PrismaClient, EmployeeType, Person } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

  meetingTitles: [
    'Weekly sync',
    'Monthly all-hands',
    'Quarterly business review',
    'One-on-one check-in',
    'Project kickoff',
    'Sprint planning',
    'Design review',
    'Technical deep dive',
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

  try {
    // Step 0: Clear existing demo data for Acme
    console.log('🧹 Cleaning up existing demo data...')
    const acmeOrg = await prisma.organization.findUnique({
      where: { slug: 'acme-corp' },
    })

    if (acmeOrg) {
      // Delete in dependency order
      await prisma.meetingInstanceParticipant.deleteMany({
        where: { meetingInstance: { organizationId: acmeOrg.id } },
      })
      await prisma.meetingInstance.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.meetingParticipant.deleteMany({
        where: { meeting: { organizationId: acmeOrg.id } },
      })
      await prisma.meeting.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.feedback.deleteMany({
        where: { about: { organizationId: acmeOrg.id } },
      })
      await prisma.oneOnOne.deleteMany({
        where: { manager: { organizationId: acmeOrg.id } },
      })
      await prisma.task.deleteMany({
        where: { createdBy: { organizationId: acmeOrg.id } },
      })
      await prisma.checkIn.deleteMany({
        where: { initiative: { organizationId: acmeOrg.id } },
      })
      await prisma.objective.deleteMany({
        where: { initiative: { organizationId: acmeOrg.id } },
      })
      await prisma.initiativeOwner.deleteMany({
        where: { initiative: { organizationId: acmeOrg.id } },
      })
      await prisma.initiative.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.person.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.team.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.jobRole.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.jobLevel.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.jobDomain.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      await prisma.organizationMember.deleteMany({
        where: { organizationId: acmeOrg.id },
      })
      console.log(`✓ Cleaned up existing data\n`)
    }

    // Step 1: Ensure Acme organization exists
    console.log('📦 Setting up organization...')
    const organization = await prisma.organization.upsert({
      where: { slug: 'acme-corp' },
      update: {},
      create: {
        name: 'Acme Corp',
        slug: 'acme-corp',
        description: 'Demo organization with comprehensive sample data',
      },
    })
    console.log(`✓ Organization: ${organization.name}\n`)

    // Step 2: Create users for the organization
    console.log('👥 Creating users...')
    const passwordHash = await bcrypt.hash('trw_yjr8jme.vek4AEG', 12)

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@acme.com' },
      update: {},
      create: {
        email: 'admin@acme.com',
        name: 'Admin User',
        passwordHash,
        role: 'ADMIN', // Keep for backward compatibility
        organizationId: organization.id, // Keep for backward compatibility
      },
    })

    const regularUser = await prisma.user.upsert({
      where: { email: 'demo@acme.com' },
      update: {},
      create: {
        email: 'demo@acme.com',
        name: 'Demo User',
        passwordHash,
        role: 'USER', // Keep for backward compatibility
        organizationId: organization.id, // Keep for backward compatibility
      },
    })

    // Create OrganizationMember records for the users

    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: adminUser.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: 'ADMIN',
      },
      create: {
        userId: adminUser.id,
        organizationId: organization.id,
        role: 'ADMIN',
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
        role: 'USER',
      },
      create: {
        userId: regularUser.id,
        organizationId: organization.id,
        role: 'USER',
      },
    })

    console.log(`✓ Created ${2} users with organization memberships\n`)

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

    // Step 13: Create meetings
    console.log('📅 Creating meetings...')
    let meetingCount = 0
    for (let i = 0; i < 8; i++) {
      // Schedule meetings in the next 30 days
      const meetingDate = getRandomFutureDate(1, 30)
      meetingDate.setHours(Math.floor(Math.random() * 8) + 9, 0, 0, 0)

      // Shuffle and select unique participants
      const shuffledPeople = [...people].sort(() => Math.random() - 0.5)
      const participantCount = Math.min(
        2 + Math.floor(Math.random() * 4),
        people.length
      )
      const participants = shuffledPeople
        .slice(0, participantCount)
        .map(person => ({
          personId: person.id,
          status: 'invited',
        }))

      await prisma.meeting.create({
        data: {
          title:
            sampleData.meetingTitles[
              Math.floor(Math.random() * sampleData.meetingTitles.length)
            ],
          description: 'Team meeting to discuss progress and plan next steps',
          scheduledAt: meetingDate,
          duration: [30, 60, 90][Math.floor(Math.random() * 3)],
          location: 'Virtual - Zoom',
          isRecurring: Math.random() > 0.6,
          recurrenceType: Math.random() > 0.6 ? 'weekly' : undefined,
          isPrivate: false,
          organizationId: organization.id,
          teamId: teams[Math.floor(Math.random() * teams.length)].id,
          createdById: adminUser.id,
          participants: {
            create: participants,
          },
        },
      })
      meetingCount++
    }
    console.log(`✓ Created ${meetingCount} meetings\n`)

    // Step 14: Create feedback template
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

    // Summary
    console.log('✨ Demo data seeding completed successfully!\n')
    console.log('📊 Summary of created data:')
    console.log(`   - Organization: 1 (${organization.name})`)
    console.log(`   - Users: 2`)
    console.log(`   - Teams: ${teams.length}`)
    console.log(`   - People: ${people.length}`)
    console.log(`   - Job Roles: ${jobRoles.length}`)
    console.log(`   - Initiatives: ${initiatives.length}`)
    console.log(`   - Tasks: ${taskCount}`)
    console.log(`   - Check-ins: ${checkInCount}`)
    console.log(`   - One-on-ones: ${oneOnOnes.length}`)
    console.log(`   - Feedback: ${feedbackCount}`)
    console.log(`   - Meetings: ${meetingCount}`)
    console.log(`\nLogin credentials:`)
    console.log(`   Admin: admin@acme.com / password123`)
    console.log(`   User: demo@acme.com / password123`)
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
