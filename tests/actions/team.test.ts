import { describe, it, expect, beforeEach, vi } from 'vitest'

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

describe('getTeams', () => {
  beforeEach(() => {
    // Reset call counters and return values
    findManyCalls = 0
    lastFindManyArgs = []
    findManyReturnValue = []

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()
  })

  it('returns teams for the current organization', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
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
  })

  it('returns an empty array when user has no organization', async () => {
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
      id: 'user-2',
      email: 'u2@example.com',
      role: 'USER',
      organizationId: null,
      organizationName: null,
    })

    const { getTeams } = await import('@/lib/actions/team')
    const result = await getTeams()

    expect(result).toEqual([])
  })

  it('returns an empty array when getCurrentUser throws', async () => {
    vi.mocked(authUtils.getCurrentUser).mockRejectedValue(
      new Error('Unauthorized')
    )

    const { getTeams } = await import('@/lib/actions/team')
    const result = await getTeams()

    expect(result).toEqual([])
  })
})
