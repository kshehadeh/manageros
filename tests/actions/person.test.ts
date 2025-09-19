import { describe, it, expect, beforeEach, mock } from 'bun:test'

// Stub Next.js server-only modules that are imported by action files
mock.module('next/cache', () => ({ revalidatePath: () => {} }))
mock.module('next/navigation', () => ({ redirect: () => {} }))
mock.module('@/lib/validations', () => ({
  personSchema: { parse: (v: unknown) => v },
  personUpdateSchema: { parse: (v: unknown) => v },
  teamSchema: { parse: (v: unknown) => v },
}))

// Mutable stubs that we can spy on and reconfigure
let findManyCalls = 0
let lastFindManyArgs: unknown[] = []
let findManyReturnValue: unknown[] = []

const prismaMock = {
  person: {
    findMany: async (args: unknown) => {
      findManyCalls += 1
      lastFindManyArgs.push(args)
      return findManyReturnValue
    },
  },
}

// Mock prisma and auth utils modules used by actions
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

describe('getPeople', () => {
  beforeEach(() => {
    findManyCalls = 0
    lastFindManyArgs = []
    findManyReturnValue = []
  })

  it('returns people for the current organization', async () => {
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
      { id: 'p1', name: 'Alice', email: 'a@example.com', role: 'member', status: 'active', organizationId: 'org-1' },
      { id: 'p2', name: 'Bob', email: 'b@example.com', role: 'manager', status: 'active', organizationId: 'org-1' },
    ]
    findManyReturnValue = data

    // Act
    const { getPeople } = await import('@/lib/actions/person')
    const result = await getPeople()

    // Assert
    expect(result).toEqual(data)
    expect(findManyCalls).toBe(1)
    expect(lastFindManyArgs[0]).toEqual({
      where: { status: 'active', organizationId: 'org-1' },
      orderBy: { name: 'asc' },
    })
    authUtils.getCurrentUser = originalGetCurrentUser
  })

  it('returns an empty array when user has no organization', async () => {
    // Arrange
    const originalGetCurrentUser = authUtils.getCurrentUser
    authUtils.getCurrentUser = async () => ({
      id: 'user-2',
      email: 'u2@example.com',
      role: 'USER',
      organizationId: null,
      organizationName: null,
    })

    // Act
    const { getPeople } = await import('@/lib/actions/person')
    const result = await getPeople()

    // Assert
    expect(result).toEqual([])
    authUtils.getCurrentUser = originalGetCurrentUser
  })

  it('returns an empty array when getCurrentUser throws', async () => {
    // Arrange
    const originalGetCurrentUser = authUtils.getCurrentUser
    authUtils.getCurrentUser = async () => { throw new Error('Unauthorized') }

    // Act
    const { getPeople } = await import('@/lib/actions/person')
    const result = await getPeople()

    // Assert
    expect(result).toEqual([])
    authUtils.getCurrentUser = originalGetCurrentUser
  })
})

