import { Team, Person, Initiative } from '@prisma/client'

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
