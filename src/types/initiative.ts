import { Initiative } from '@prisma/client'

/**
 * Type for initiative with all the relations needed by components
 */
export type InitiativeWithRelations = Initiative & {
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  team: {
    id: string
    name: string
  } | null
  owners: Array<{
    personId: string
    role: string
    person: {
      id: string
      name: string
    }
  }>
  _count: {
    checkIns: number
    tasks: number
  }
  tasks: Array<{
    status: string
  }>
}
