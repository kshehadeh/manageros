import { Prisma, Person } from '@prisma/client'

// Re-export Person type for convenience
export type { Person }

export type PersonWithRelations = Prisma.PersonGetPayload<{
  include: {
    manager: true
    reports: true
    team: true
    jobRole: true
  }
}> & {
  level?: number
}

export type PersonBrief = Pick<
  Person,
  'id' | 'name' | 'email' | 'role' | 'avatar'
>
