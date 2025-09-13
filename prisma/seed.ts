import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // team
  const team = await prisma.team.upsert({
    where: { id: 'seed-team' },
    update: {},
    create: { id: 'seed-team', name: 'Platform', description: 'Demo team' }
  })

  // people
  const manager = await prisma.person.create({
    data: { email: 'manager@example.com', name: 'Demo Manager', role: 'EM', teamId: team.id }
  })
  const alice = await prisma.person.create({
    data: { email: 'alice@example.com', name: 'Alice Dev', role: 'Senior FE', teamId: team.id, managerId: manager.id }
  })
  const bob = await prisma.person.create({
    data: { email: 'bob@example.com', name: 'Bob Dev', role: 'BE', teamId: team.id, managerId: manager.id }
  })

  // initiative + objective + tasks
  const init = await prisma.initiative.create({
    data: {
      teamId: team.id,
      title: 'Improve Web Performance',
      summary: 'Lift LCP and TTFB across product pages',
      status: 'in_progress',
      rag: 'amber',
      confidence: 72,
      owners: { create: [{ personId: manager.id, role: 'owner' }] },
      objectives: {
        create: [
          {
            title: 'Reduce LCP p75 by 20%',
            tasks: {
              create: [
                { title: 'Lazy-load below-the-fold images', assigneeId: alice.id, status: 'doing', priority: 1 },
                { title: 'Cache HTML at CDN for PDP', assigneeId: bob.id, status: 'todo', priority: 2 }
              ]
            }
          }
        ]
      }
    }
  })

  await prisma.checkIn.create({
    data: {
      initiativeId: init.id,
      weekOf: new Date(),
      rag: 'amber',
      confidence: 72,
      summary: 'Image work in progress; CDN cache rules drafted. Risk: vendor script variance.',
      createdById: manager.id
    }
  })

  // 1:1s
  await prisma.oneOnOne.create({
    data: {
      managerId: manager.id,
      reportId: alice.id,
      cadence: 'weekly',
      agenda: '- Wins\n- Blockers\n- Growth',
      notes: 'Discussed perf metrics and ownership.',
      scheduledAt: new Date(Date.now() + 2*24*60*60*1000)
    }
  })

  console.log('Seed completed')
}

main().finally(() => prisma.$disconnect())
