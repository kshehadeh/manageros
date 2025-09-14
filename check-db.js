import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('Checking database...')
    
    // Check users
    const users = await prisma.user.findMany()
    console.log('Users:', users.map(u => ({ email: u.email, name: u.name, role: u.role })))
    
    // Check organizations
    const orgs = await prisma.organization.findMany()
    console.log('Organizations:', orgs.map(o => ({ name: o.name, slug: o.slug })))
    
    // Check teams
    const teams = await prisma.team.findMany()
    console.log('Teams:', teams.map(t => ({ name: t.name, parentId: t.parentId })))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
