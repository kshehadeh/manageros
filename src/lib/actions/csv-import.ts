'use server'

import { prisma } from '@/lib/db'
import {
  csvPersonSchema,
  type CSVPersonData,
  csvTeamSchema,
  type CSVTeamData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { z } from 'zod'

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

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can import people')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
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
      where: { organizationId: user.managerOSOrganizationId },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: { organizationId: user.managerOSOrganizationId },
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
            organizationId: user.managerOSOrganizationId,
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
            organizationId: user.managerOSOrganizationId,
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
          errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
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
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can import teams')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
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
    where: { organizationId: user.managerOSOrganizationId },
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
              organizationId: user.managerOSOrganizationId,
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
            organizationId: user.managerOSOrganizationId,
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
