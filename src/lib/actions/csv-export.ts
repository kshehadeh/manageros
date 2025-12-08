'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { getCurrentUser } from '@/lib/auth-utils'

// Helper function to parse comma-separated values
function parseValues(param: string): string[] {
  return param
    ? param
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
    : []
}

// Helper function to create status filter for SQL
function createStatusSqlCondition(statusValues: string[]) {
  if (statusValues.length === 0 || statusValues.includes('all')) {
    return Prisma.empty
  }
  if (statusValues.length === 1) {
    return Prisma.sql`p.status = ${statusValues[0]}`
  }
  return Prisma.sql`p.status IN (${Prisma.join(statusValues)})`
}

// Helper function to escape CSV field
function escapeCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return ''
  }
  const str = String(field).trim()
  // If field is empty after trim, return empty string
  if (str === '') {
    return ''
  }
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Helper function to format date for CSV
function formatDateForCsv(date: Date | null | undefined): string {
  if (!date) {
    return ''
  }
  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

export interface ExportPeopleFilters {
  search?: string
  teamId?: string
  managerId?: string
  jobRoleId?: string
  status?: string
  sort?: string
}

/**
 * Export people as CSV with optional filters
 */
export async function exportPeopleToCSV(
  filters: ExportPeopleFilters = {}
): Promise<string> {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to export people')
  }

  const {
    search = '',
    teamId = '',
    managerId = '',
    jobRoleId = '',
    status: statusParam = '',
    sort = '',
  } = filters

  const statusValues = parseValues(statusParam)

  // Build where conditions for SQL query (same logic as API route)
  const whereConditions: Prisma.Sql[] = [
    Prisma.sql`p."organizationId" = ${user.managerOSOrganizationId}`,
  ]

  // Apply search filter
  if (search) {
    whereConditions.push(
      Prisma.sql`(
        p.name ILIKE ${`%${search}%`} OR 
        p.email ILIKE ${`%${search}%`} OR 
        p.role ILIKE ${`%${search}%`}
      )`
    )
  }

  // Apply team filter
  if (teamId && teamId !== 'all') {
    if (teamId === 'no-team') {
      whereConditions.push(Prisma.sql`p."teamId" IS NULL`)
    } else {
      whereConditions.push(Prisma.sql`p."teamId" = ${teamId}`)
    }
  }

  // Apply manager filter
  if (managerId && managerId !== 'all') {
    if (managerId === 'no-manager') {
      whereConditions.push(Prisma.sql`p."managerId" IS NULL`)
    } else {
      whereConditions.push(Prisma.sql`p."managerId" = ${managerId}`)
    }
  }

  // Apply job role filter
  if (jobRoleId && jobRoleId !== 'all') {
    if (jobRoleId === 'no-role') {
      whereConditions.push(Prisma.sql`p."jobRoleId" IS NULL`)
    } else {
      whereConditions.push(Prisma.sql`p."jobRoleId" = ${jobRoleId}`)
    }
  }

  // Apply status filter
  if (statusValues.length > 0 && !statusValues.includes('all')) {
    const statusCondition = createStatusSqlCondition(statusValues)
    if (statusCondition !== Prisma.empty) {
      whereConditions.push(statusCondition)
    }
  }

  // Build WHERE clause
  const whereClause =
    whereConditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
      : Prisma.empty

  // Build ORDER BY clause (reuse logic from API route)
  let orderByClause: Prisma.Sql
  if (!sort) {
    orderByClause = Prisma.sql`ORDER BY p.name ASC`
  } else {
    const sortFields = sort
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(field => {
        const [name, direction = 'asc'] = field.split(':')
        return { name: name.trim(), direction: direction.trim().toLowerCase() }
      })

    const orderByClauses = sortFields
      .map(({ name, direction }) => {
        const dir = direction === 'desc' ? 'DESC' : 'ASC'

        switch (name.toLowerCase()) {
          case 'name':
            return Prisma.sql`p.name ${Prisma.raw(dir)}`
          case 'email':
            return direction === 'desc'
              ? Prisma.sql`p.email DESC NULLS LAST`
              : Prisma.sql`p.email ASC NULLS LAST`
          case 'role':
            return direction === 'desc'
              ? Prisma.sql`p.role DESC NULLS LAST`
              : Prisma.sql`p.role ASC NULLS LAST`
          case 'team':
            return direction === 'desc'
              ? Prisma.sql`t.name DESC NULLS LAST`
              : Prisma.sql`t.name ASC NULLS LAST`
          case 'manager':
            return direction === 'desc'
              ? Prisma.sql`m.name DESC NULLS LAST`
              : Prisma.sql`m.name ASC NULLS LAST`
          case 'status':
            return Prisma.sql`
            CASE p.status
              WHEN 'active' THEN 1
              WHEN 'inactive' THEN 2
              WHEN 'on_leave' THEN 3
              WHEN 'terminated' THEN 4
              ELSE 5
            END ${Prisma.raw(dir)}
          `
          case 'createdat':
          case 'created_at':
            return Prisma.sql`p."createdAt" ${Prisma.raw(dir)}`
          default:
            return null
        }
      })
      .filter((clause): clause is Prisma.Sql => clause !== null)

    if (orderByClauses.length === 0) {
      orderByClause = Prisma.sql`ORDER BY p.name ASC`
    } else {
      orderByClause = Prisma.sql`ORDER BY ${Prisma.join(orderByClauses, ', ')}`
    }
  }

  // Get all people matching filters (no pagination)
  const peopleRaw = await prisma.$queryRaw<
    Array<{
      name: string
      email: string | null
      role: string | null
      teamName: string | null
      managerName: string | null
      birthday: Date | null
    }>
  >`
    SELECT 
      p.name,
      p.email,
      p.role,
      t.name as "teamName",
      m.name as "managerName",
      p.birthday
    FROM "Person" p
    LEFT JOIN "Team" t ON p."teamId" = t.id
    LEFT JOIN "Person" m ON p."managerId" = m.id
    ${whereClause}
    ${orderByClause}
  `

  // Filter out only people without names (name is required, other fields can be empty)
  const validPeople = peopleRaw.filter(
    person =>
      person.name &&
      typeof person.name === 'string' &&
      person.name.trim().length > 0
  )

  if (validPeople.length === 0) {
    // Return just headers if no valid people
    return 'name,email,role,team,manager,birthday'
  }

  // Convert to CSV format - matching import format: name,email,role,team,manager,birthday
  const headers = ['name', 'email', 'role', 'team', 'manager', 'birthday']

  const rows = validPeople.map(person => {
    // Always return exactly 6 fields, even if some are empty
    const row = [
      escapeCsvField(person.name || ''),
      escapeCsvField(person.email),
      escapeCsvField(person.role),
      escapeCsvField(person.teamName),
      escapeCsvField(person.managerName),
      formatDateForCsv(person.birthday),
    ]
    // Ensure exactly 6 columns
    if (row.length !== 6) {
      // Pad or truncate to exactly 6
      while (row.length < 6) {
        row.push('')
      }
      return row.slice(0, 6)
    }
    return row
  })

  // Combine headers and rows, filter out any empty rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')).filter(line => line.trim().length > 0), // Remove any completely empty lines
  ]

  // Join with newlines - no trailing newline
  return csvLines.join('\n')
}
