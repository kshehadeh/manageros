import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User } from 'next-auth'

// Mutable stubs that we can spy on and reconfigure
let findFirstCalls = 0
let findFirstArgs: unknown[] = []
let findFirstReturnValues: unknown[] = []

let _findManyCalls = 0
let _findManyArgs: unknown[] = []
let _findManyReturnValue: unknown[] = []

let findUniqueCalls = 0
let findUniqueArgs: unknown[] = []
let findUniqueReturnValues: unknown[] = []

let createCalls = 0
let createArgs: unknown[] = []
let createReturnValue: unknown = null

let _updateCalls = 0
let _updateArgs: unknown[] = []
let _updateReturnValue: unknown = null

let _deleteCalls = 0
let _deleteArgs: unknown[] = []

const prismaMock = {
  person: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
    findUnique: async (args: unknown) => {
      findUniqueCalls += 1
      findUniqueArgs.push(args)
      return findUniqueReturnValues[findUniqueCalls - 1] || null
    },
  },
  feedbackCampaign: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
    findMany: async (args: unknown) => {
      _findManyCalls += 1
      _findManyArgs.push(args)
      return _findManyReturnValue
    },
    findUnique: async (args: unknown) => {
      findUniqueCalls += 1
      findUniqueArgs.push(args)
      return findUniqueReturnValues[findUniqueCalls - 1] || null
    },
    create: async (args: unknown) => {
      createCalls += 1
      createArgs.push(args)
      return createReturnValue
    },
    update: async (args: unknown) => {
      _updateCalls += 1
      _updateArgs.push(args)
      return _updateReturnValue
    },
    delete: async (args: unknown) => {
      _deleteCalls += 1
      _deleteArgs.push(args)
    },
  },
  feedbackResponse: {
    findUnique: async (args: unknown) => {
      findUniqueCalls += 1
      findUniqueArgs.push(args)
      return findUniqueReturnValues[findUniqueCalls - 1] || null
    },
    create: async (args: unknown) => {
      createCalls += 1
      createArgs.push(args)
      return createReturnValue
    },
  },
}

// Mock prisma and auth utils modules used by actions
vi.mock('@/lib/db', () => ({ prisma: prismaMock }))

const authUtils = {
  getCurrentUser: vi.fn(
    async (): Promise<User> => ({
      id: 'user-1',
      email: 'u1@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationName: 'Org One',
      organizationSlug: 'org-one',
      personId: 'person-1',
    })
  ),
}

vi.mock('@/lib/auth-utils', () => authUtils)

describe('createFeedbackCampaign', () => {
  beforeEach(() => {
    // Reset all counters and arrays
    findFirstCalls = 0
    findFirstArgs = []
    findFirstReturnValues = []
    _findManyCalls = 0
    _findManyArgs = []
    _findManyReturnValue = []
    findUniqueCalls = 0
    findUniqueArgs = []
    findUniqueReturnValues = []
    createCalls = 0
    createArgs = []
    createReturnValue = null
    _updateCalls = 0
    _updateArgs = []
    _updateReturnValue = null
    _deleteCalls = 0
    _deleteArgs = []

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()
  })

  it('should create a feedback campaign successfully', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'u1@example.com',
      name: 'Manager Name',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationName: 'Org One',
      organizationSlug: 'org-one',
      personId: 'person-1',
    })

    const mockCurrentPerson = {
      id: 'person-1',
      name: 'Manager Name',
    }
    const mockTargetPerson = {
      id: 'person-2',
      name: 'Target Person',
      organizationId: 'org-1',
    }
    const mockCampaign = {
      id: 'campaign-1',
      userId: 'user-1',
      targetPersonId: 'person-2',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      inviteEmails: ['test@example.com'],
      status: 'draft',
      targetPerson: {
        id: 'person-2',
        name: 'Target Person',
        email: 'target@example.com',
      },
      user: {
        id: 'user-1',
        name: 'Manager Name',
        email: 'manager@example.com',
      },
    }

    findFirstReturnValues = [mockCurrentPerson, mockTargetPerson]
    createReturnValue = mockCampaign

    const formData = {
      targetPersonId: 'person-2',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      inviteEmails: ['test@example.com'],
    }

    // Act
    const { createFeedbackCampaign } = await import(
      '@/lib/actions/feedback-campaign'
    )
    const result = await createFeedbackCampaign(formData)

    // Assert
    expect(result).toEqual(mockCampaign)
    expect(createCalls).toBe(1)
    expect(createArgs[0]).toEqual({
      data: {
        userId: 'user-1',
        targetPersonId: 'person-2',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        inviteEmails: ['test@example.com'],
        status: 'draft',
      },
      include: {
        targetPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  })

  it('should throw error if user has no organization', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'u1@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: null,
      organizationName: null,
      organizationSlug: null,
      personId: null,
    })

    const formData = {
      targetPersonId: 'person-2',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      inviteEmails: ['test@example.com'],
    }

    // Act & Assert
    const { createFeedbackCampaign } = await import(
      '@/lib/actions/feedback-campaign'
    )
    await expect(createFeedbackCampaign(formData)).rejects.toThrow(
      'User must belong to an organization to create feedback campaigns'
    )
  })

  it('should throw error if current user has no person record', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'u1@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationName: 'Org One',
      organizationSlug: 'org-one',
      personId: 'person-1',
    })

    findFirstReturnValues = [null] // No person record found

    const formData = {
      targetPersonId: 'person-2',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      inviteEmails: ['test@example.com'],
    }

    // Act & Assert
    const { createFeedbackCampaign } = await import(
      '@/lib/actions/feedback-campaign'
    )
    await expect(createFeedbackCampaign(formData)).rejects.toThrow(
      'No person record found for current user'
    )
  })

  it('should throw error if target person not found', async () => {
    // Arrange
    vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'u1@example.com',
      name: 'Test User',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationName: 'Org One',
      organizationSlug: 'org-one',
      personId: 'person-1',
    })

    const mockCurrentPerson = {
      id: 'person-1',
      name: 'Manager Name',
    }

    findFirstReturnValues = [mockCurrentPerson, null] // Target person not found

    const formData = {
      targetPersonId: 'person-2',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      inviteEmails: ['test@example.com'],
    }

    // Act & Assert
    const { createFeedbackCampaign } = await import(
      '@/lib/actions/feedback-campaign'
    )
    await expect(createFeedbackCampaign(formData)).rejects.toThrow(
      'Target person not found or access denied'
    )
  })
})
