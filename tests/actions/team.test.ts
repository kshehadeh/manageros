import { describe, it, expect, beforeEach, mock } from 'bun:test'

mock.module('next/cache', () => ({ revalidatePath: () => {} }))
mock.module('next/navigation', () => ({ redirect: () => {} }))
mock.module('@/lib/validations', () => ({
  personSchema: { parse: (v: unknown) => v },
  personUpdateSchema: { parse: (v: unknown) => v },
  teamSchema: { parse: (v: unknown) => v },
}))

let findManyCalls = 0
let lastFindManyArgs: unknown[] = []
let findManyReturnValue: unknown[] = []

const prismaMock = {
  team: {
    findMany: async (args: unknown) => {
      findManyCalls += 1
      lastFindManyArgs.push(args)
      return findManyReturnValue
    },
  },
}

mock.module('@/lib/db', () => ({ prisma: prismaMock }))

const authUtils = {
  getCurrentUser: async () => ({
    id: 'user-1',
    email: 'u1@example.com',
    role: 'ADMIN',
    organizationId: 'org-1',
    organizationName: 'Org One',
  }),
}

mock.module('@/lib/auth-utils', () => authUtils)

describe('getTeams', () => {
  beforeEach(() => {
    findManyCalls = 0
    lastFindManyArgs = []
    findManyReturnValue = []
  })

  it('returns teams for the current organization', async () => {
    // Arrange
    const originalGetCurrentUser = authUtils.getCurrentUser
    authUtils.getCurrentUser = async () => ({
      id: 'user-1',
      email: 'u1@example.com',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationName: 'Org One',
    })
    const data = [
      { id: 't1', name: 'Team A', organizationId: 'org-1' },
      { id: 't2', name: 'Team B', organizationId: 'org-1' },
    ]
    findManyReturnValue = data

    // Act
    const { getTeams } = await import('@/lib/actions/team')
    const result = await getTeams()

    // Assert
    expect(result).toEqual(data)
    expect(findManyCalls).toBe(1)
    expect(lastFindManyArgs[0]).toEqual({
      where: { organizationId: 'org-1' },
      orderBy: { name: 'asc' },
    })
    authUtils.getCurrentUser = originalGetCurrentUser
  })

  it('returns an empty array when user has no organization', async () => {
    const originalGetCurrentUser = authUtils.getCurrentUser
    authUtils.getCurrentUser = async () => ({
      id: 'user-2',
      email: 'u2@example.com',
      role: 'USER',
      organizationId: null,
      organizationName: null,
    })

    const { getTeams } = await import('@/lib/actions/team')
    const result = await getTeams()

    expect(result).toEqual([])
    authUtils.getCurrentUser = originalGetCurrentUser
  })

  it('returns an empty array when getCurrentUser throws', async () => {
    const originalGetCurrentUser = authUtils.getCurrentUser
    authUtils.getCurrentUser = async () => { throw new Error('Unauthorized') }

    const { getTeams } = await import('@/lib/actions/team')
    const result = await getTeams()

    expect(result).toEqual([])
    authUtils.getCurrentUser = originalGetCurrentUser
  })
})

