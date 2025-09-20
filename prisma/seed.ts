import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo organizations
  const org1 = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'Demo organization 1',
    },
  })

  const org2 = await prisma.organization.upsert({
    where: { slug: 'techstart-inc' },
    update: {},
    create: {
      name: 'TechStart Inc',
      slug: 'techstart-inc',
      description: 'Demo organization 2',
    },
  })

  // Create users for each organization
  const passwordHash = await bcrypt.hash('password123', 12)

  const user1 = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      organizationId: org1.id,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user@acme.com' },
    update: {},
    create: {
      email: 'user@acme.com',
      name: 'Regular User',
      passwordHash,
      role: 'USER',
      organizationId: org1.id,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'admin@techstart.com' },
    update: {},
    create: {
      email: 'admin@techstart.com',
      name: 'TechStart Admin',
      passwordHash,
      role: 'ADMIN',
      organizationId: org2.id,
    },
  })

  // Create teams for each organization
  const team1 = await prisma.team.upsert({
    where: { id: 'seed-team-1' },
    update: {},
    create: {
      id: 'seed-team-1',
      name: 'Platform Team',
      description: 'Demo team for Acme Corp',
      organizationId: org1.id,
    },
  })

  const team2 = await prisma.team.upsert({
    where: { id: 'seed-team-2' },
    update: {},
    create: {
      id: 'seed-team-2',
      name: 'Product Team',
      description: 'Demo team for TechStart Inc',
      organizationId: org2.id,
    },
  })

  // Create people for each organization
  const manager1 = await prisma.person.upsert({
    where: { id: 'seed-manager-1' },
    update: {},
    create: {
      id: 'seed-manager-1',
      email: 'manager@acme.com',
      name: 'Demo Manager',
      role: 'EM',
      teamId: team1.id,
      organizationId: org1.id,
    },
  })

  const alice = await prisma.person.upsert({
    where: { id: 'seed-alice-1' },
    update: {},
    create: {
      id: 'seed-alice-1',
      email: 'alice@acme.com',
      name: 'Alice Dev',
      role: 'Senior FE',
      teamId: team1.id,
      managerId: manager1.id,
      organizationId: org1.id,
    },
  })

  const bob = await prisma.person.upsert({
    where: { id: 'seed-bob-1' },
    update: {},
    create: {
      id: 'seed-bob-1',
      email: 'bob@acme.com',
      name: 'Bob Dev',
      role: 'BE',
      teamId: team1.id,
      managerId: manager1.id,
      organizationId: org1.id,
    },
  })

  const manager2 = await prisma.person.upsert({
    where: { id: 'seed-manager-2' },
    update: {},
    create: {
      id: 'seed-manager-2',
      email: 'manager@techstart.com',
      name: 'TechStart Manager',
      role: 'EM',
      teamId: team2.id,
      organizationId: org2.id,
    },
  })

  // Create initiatives for each organization
  const init1 = await prisma.initiative.create({
    data: {
      teamId: team1.id,
      organizationId: org1.id,
      title: 'Improve Web Performance',
      summary: 'Lift LCP and TTFB across product pages',
      status: 'in_progress',
      rag: 'amber',
      confidence: 72,
      owners: { create: [{ personId: manager1.id, role: 'owner' }] },
      objectives: {
        create: [
          {
            title: 'Reduce LCP p75 by 20%',
            tasks: {
              create: [
                {
                  title: 'Lazy-load below-the-fold images',
                  assigneeId: alice.id,
                  status: 'doing',
                  priority: 1,
                },
                {
                  title: 'Cache HTML at CDN for PDP',
                  assigneeId: bob.id,
                  status: 'todo',
                  priority: 2,
                },
              ],
            },
          },
        ],
      },
    },
  })

  const init2 = await prisma.initiative.create({
    data: {
      teamId: team2.id,
      organizationId: org2.id,
      title: 'Mobile App Launch',
      summary: 'Launch new mobile application',
      status: 'planned',
      rag: 'green',
      confidence: 85,
      owners: { create: [{ personId: manager2.id, role: 'owner' }] },
    },
  })

  // Create check-ins
  await prisma.checkIn.create({
    data: {
      initiativeId: init1.id,
      weekOf: new Date(),
      rag: 'amber',
      confidence: 72,
      summary:
        'Image work in progress; CDN cache rules drafted. Risk: vendor script variance.',
      createdById: manager1.id,
    },
  })

  // Create 1:1s
  await prisma.oneOnOne.create({
    data: {
      managerId: manager1.id,
      reportId: alice.id,
      notes: 'Discussed perf metrics and ownership.',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  })

  // Create default feedback template
  const existingTemplate = await prisma.feedbackTemplate.findFirst({
    where: { isDefault: true },
  })

  if (!existingTemplate) {
    const template = await prisma.feedbackTemplate.create({
      data: {
        name: 'Performance Review Template',
        description:
          'Standard performance review questions for employee feedback',
        isDefault: true,
        questions: {
          create: [
            {
              question: 'What did the employee do well?',
              type: 'text',
              required: true,
              sortOrder: 0,
            },
            {
              question: 'What are some areas of improvement?',
              type: 'text',
              required: true,
              sortOrder: 1,
            },
            {
              question: 'Rate performance from 1-5',
              type: 'rating',
              required: true,
              sortOrder: 2,
            },
          ],
        },
      },
    })
    console.log('Created default feedback template:', template.name)
  } else {
    console.log('Default feedback template already exists')
  }

  console.log('Seed completed with multi-tenant data')
  console.log('Organizations created:', org1.name, org2.name)
  console.log('Users created:', user1.email, user2.email, user3.email)
}

main().finally(() => prisma.$disconnect())
