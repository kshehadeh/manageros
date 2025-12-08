import { Team, Person, Initiative } from '@/generated/prisma'
import type { Prisma } from '@/generated/prisma'

/**
 * Recursive type for hierarchical team structure
 * This represents a team with its children, where children can also have children
 * to infinite depth
 */
export type TeamWithHierarchy = Team & {
  people: Person[]
  initiatives: Initiative[]
  parent: Team | null
  children: TeamWithHierarchy[]
}

/**
 * Type for team selection dropdowns (no hierarchy needed)
 */
export type TeamForSelection = Pick<Team, 'id' | 'name' | 'parentId'>

/**
 * Type for team with basic relations (no hierarchy)
 */
export type TeamWithRelations = Team & {
  people: Person[]
  initiatives: Initiative[]
  parent: Team | null
  children: Team[]
}

export type TeamWithCounts = Team & {
  parent: Pick<Team, 'id' | 'name'> | null
  _count: {
    people: number
    initiatives: number
    children: number
  }
}

/**
 * Type for team with all detail relations as returned by getTeamById
 * when all include options are set to true
 */
export type TeamWithDetailRelations = Prisma.TeamGetPayload<{
  include: {
    parent: {
      select: {
        id: true
        name: true
        avatar: true
      }
    }
    children: {
      include: {
        people: {
          select: {
            id: true
            name: true
          }
        }
        initiatives: {
          select: {
            id: true
            title: true
          }
        }
      }
    }
    people: {
      include: {
        manager: {
          include: {
            reports: true
          }
        }
        team: true
        jobRole: {
          include: {
            level: true
            domain: true
          }
        }
        reports: true
      }
    }
    initiatives: {
      include: {
        team: {
          select: {
            id: true
            name: true
          }
        }
      }
    }
  }
}>
