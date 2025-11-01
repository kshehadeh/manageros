import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// Generate query variations for fuzzy matching (handles abbreviations)
function generateQueryVariations(query: string): string[] {
  const variations = new Set<string>()
  const trimmed = query.trim()
  const normalized = trimmed.toLowerCase()

  // Always include the original query
  variations.add(trimmed)
  variations.add(normalized)

  // Common abbreviation mappings (full form -> all variations)
  const abbreviationMap: Record<string, string[]> = {
    senior: ['sr.', 'sr', 'senior'],
    junior: ['jr.', 'jr', 'junior'],
    principal: ['prin.', 'prin', 'principal'],
    associate: ['assoc.', 'assoc', 'associate'],
    director: ['dir.', 'dir', 'director'],
    manager: ['mgr.', 'mgr', 'manager'],
    engineer: ['eng.', 'eng', 'engineer'],
    engineering: ['eng.', 'eng', 'engineering'],
    professional: ['prof.', 'prof', 'professional'],
    specialist: ['spec.', 'spec', 'specialist'],
    executive: ['exec.', 'exec', 'executive'],
    'vice president': ['vp', 'v.p.', 'vice president', 'vice pres'],
    president: ['pres.', 'pres', 'president'],
    'chief executive officer': ['ceo', 'c.e.o.'],
    'chief technology officer': ['cto', 'c.t.o.'],
    'chief operating officer': ['coo', 'c.o.o.'],
    'chief financial officer': ['cfo', 'c.f.o.'],
  }

  // Create reverse lookup (abbreviation -> full form)
  const reverseMap: Record<string, string> = {}
  for (const [full, abbrevs] of Object.entries(abbreviationMap)) {
    for (const abbrev of abbrevs) {
      if (!reverseMap[abbrev.toLowerCase()]) {
        reverseMap[abbrev.toLowerCase()] = full
      }
    }
  }

  // Generate variations by replacing words
  const words = normalized.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const wordWithoutPunct = word.replace(/[.,]/g, '')

    // If word matches an abbreviation, add variation with full form
    if (reverseMap[wordWithoutPunct]) {
      const fullForm = reverseMap[wordWithoutPunct]
      const newWords = [...words]
      newWords[i] = fullForm
      variations.add(newWords.join(' '))
    }

    // If word matches a full form, add variations with abbreviations
    if (abbreviationMap[wordWithoutPunct]) {
      for (const abbrev of abbreviationMap[wordWithoutPunct]) {
        const newWords = [...words]
        newWords[i] = abbrev
        variations.add(newWords.join(' '))
      }
    }
  }

  // Also try removing punctuation
  variations.add(normalized.replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim())
  variations.add(normalized.replace(/[.,]/g, ''))

  return Array.from(variations).filter(v => v.length > 0)
}

export const jobRoleLookupTool = {
  description:
    'Look up a job role by title or query. Use this when you need to find the job role ID for a specific role. Returns job role details including ID, which can be used with other tools. Handles common abbreviations (e.g., "Sr." matches "Senior").',
  parameters: z.object({
    query: z
      .array(z.string())
      .describe(
        'Variants of the job role title to look up (e.g., "Software Engineer", "Engineering Manager", "Sr. Engineer" will match "Senior Engineer")'
      ),
  }),
  execute: async ({ query }: { query: string[] }) => {
    console.log('🔧 jobRoleLookupTool called with parameters:', { query })
    try {
      const user = await getCurrentUser()
      if (!user.organizationId) {
        throw new Error('User must belong to an organization')
      }

      // Generate query variations for fuzzy matching for all query variants
      const allVariations = new Set<string>()
      for (const queryVariant of query) {
        const variations = generateQueryVariations(queryVariant)
        variations.forEach(v => allVariations.add(v))
      }

      // Search for job roles by title using OR conditions for all variations
      const whereClause: Prisma.JobRoleWhereInput = {
        organizationId: user.organizationId,
        OR: Array.from(allVariations).map(variation => ({
          title: { contains: variation, mode: 'insensitive' },
        })),
      }

      const jobRoles = await prisma.jobRole.findMany({
        where: whereClause,
        include: {
          level: true,
          domain: true,
          people: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { level: { order: 'asc' } },
          { domain: { name: 'asc' } },
          { title: 'asc' },
        ],
      })

      const queryDisplay = query.join('", "')

      if (jobRoles.length === 0) {
        return {
          found: false,
          message: `No job role found with title containing "${queryDisplay}"`,
          matches: [],
        }
      }

      const matches = jobRoles.map(jobRole => ({
        id: jobRole.id,
        title: jobRole.title,
        description: jobRole.description || null,
        level: jobRole.level.name,
        levelOrder: jobRole.level.order,
        domain: jobRole.domain.name,
        peopleCount: jobRole.people.length,
        people: jobRole.people.map(p => ({ id: p.id, name: p.name })),
      }))

      if (jobRoles.length === 1) {
        return {
          found: true,
          message: `Found 1 job role matching "${queryDisplay}"`,
          matches,
        }
      }

      return {
        found: true,
        message: `Found ${jobRoles.length} job roles matching "${queryDisplay}". Please ask the user to clarify which job role they mean.`,
        matches,
        disambiguationNeeded: true,
      }
    } catch (error) {
      console.error('Error in job role lookup tool:', error)
      throw error
    }
  },
}
