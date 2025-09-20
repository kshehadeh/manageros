import { describe, it, expect, beforeEach, vi } from 'vitest'

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
vi.mock('@/lib/db', () => ({ prisma: prismaMock }))

const authUtils = {
  getCurrentUser: vi.fn(async () => ({
    id: 'user-1',
    email: 'u1@example.com',
    role: 'ADMIN',
    organizationId: 'org-1',
    organizationName: 'Org One',
  })),
}

vi.mock('@/lib/auth-utils', () => authUtils)

describe('getPeople', () => {
  beforeEach(() => {
    // Reset call counters and return values
    findManyCalls = 0
    lastFindManyArgs = []
    findManyReturnValue = []

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()
  })

  it('returns people for the current organization', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'u1@example.com',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationName: 'Org One',
    })
    const data = [
      {
        id: 'p1',
        name: 'Alice',
        email: 'a@example.com',
        role: 'member',
        status: 'active',
        organizationId: 'org-1',
      },
      {
        id: 'p2',
        name: 'Bob',
        email: 'b@example.com',
        role: 'manager',
        status: 'active',
        organizationId: 'org-1',
      },
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
  })

  it('returns an empty array when user has no organization', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
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
  })

  it('returns an empty array when getCurrentUser throws', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockRejectedValue(
      new Error('Unauthorized')
    )

    // Act
    const { getPeople } = await import('@/lib/actions/person')
    const result = await getPeople()

    // Assert
    expect(result).toEqual([])
  })
})
