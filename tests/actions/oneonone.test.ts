import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mutable stubs that we can spy on and reconfigure
let findFirstCalls = 0
let findFirstArgs: unknown[] = []
let findFirstReturnValues: unknown[] = []

let findManyCalls = 0
let findManyArgs: unknown[] = []
let findManyReturnValue: unknown[] = []

let createCalls = 0
let createArgs: unknown[] = []
let createReturnValue: unknown = null

let updateCalls = 0
let updateArgs: unknown[] = []
let updateReturnValue: unknown = null

const prismaMock = {
  person: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
  },
  oneOnOne: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
    findMany: async (args: unknown) => {
      findManyCalls += 1
      findManyArgs.push(args)
      return findManyReturnValue
    },
    create: async (args: unknown) => {
      createCalls += 1
      createArgs.push(args)
      return createReturnValue
    },
    update: async (args: unknown) => {
      updateCalls += 1
      updateArgs.push(args)
      return updateReturnValue
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

describe('oneonone actions', () => {
  beforeEach(() => {
    // Reset call counters and return values
    findFirstCalls = 0
    findFirstArgs = []
    findFirstReturnValues = []
    findManyCalls = 0
    findManyArgs = []
    findManyReturnValue = []
    createCalls = 0
    createArgs = []
    createReturnValue = null
    updateCalls = 0
    updateArgs = []
    updateReturnValue = null

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()
  })

  describe('createOneOnOne', () => {
    it('creates a one-on-one successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        managerId: 'person-1',
        reportId: 'person-2',
        scheduledAt: '2024-01-15T10:00:00Z',
        notes: 'Weekly check-in',
      }

      const manager = {
        id: 'person-1',
        name: 'John Doe',
        organizationId: 'org-1',
      }
      const report = {
        id: 'person-2',
        name: 'Jane Smith',
        organizationId: 'org-1',
      }
      const createdOneOnOne = {
        id: 'oneonone-1',
        managerId: 'person-1',
        reportId: 'person-2',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        notes: 'Weekly check-in',
        manager,
        report,
      }

      findFirstReturnValues = [manager, report] // First call for manager, second for report
      createReturnValue = createdOneOnOne

      // Act
      const { createOneOnOne } = await import('@/lib/actions/oneonone')
      await createOneOnOne(formData)

      // Assert
      expect(findFirstCalls).toBe(2)
      expect(createCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'person-1',
          organizationId: 'org-1',
        },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'person-2',
          organizationId: 'org-1',
        },
      })
      expect(createArgs[0]).toEqual({
        data: {
          managerId: 'person-1',
          reportId: 'person-2',
          scheduledAt: new Date('2024-01-15T10:00:00Z'),
          notes: 'Weekly check-in',
        },
        include: {
          manager: true,
          report: true,
        },
      })
    })

    it('throws error when user has no organization', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'USER',
        organizationId: null,
        organizationName: null,
      })

      const formData = {
        managerId: 'person-1',
        reportId: 'person-2',
        scheduledAt: '2024-01-15T10:00:00Z',
        notes: 'Weekly check-in',
      }

      // Act & Assert
      const { createOneOnOne } = await import('@/lib/actions/oneonone')
      await expect(createOneOnOne(formData)).rejects.toThrow(
        'User must belong to an organization'
      )
    })

    it('throws error when manager not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        managerId: 'person-1',
        reportId: 'person-2',
        scheduledAt: '2024-01-15T10:00:00Z',
        notes: 'Weekly check-in',
      }

      findFirstReturnValues = [null, null] // Manager not found, report not found

      // Act & Assert
      const { createOneOnOne } = await import('@/lib/actions/oneonone')
      await expect(createOneOnOne(formData)).rejects.toThrow(
        'Manager not found or not in your organization'
      )
    })

    it('throws error when report not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        managerId: 'person-1',
        reportId: 'person-2',
        scheduledAt: '2024-01-15T10:00:00Z',
        notes: 'Weekly check-in',
      }

      const manager = {
        id: 'person-1',
        name: 'John Doe',
        organizationId: 'org-1',
      }
      findFirstReturnValues = [manager, null] // Manager found, report not found

      // Act & Assert
      const { createOneOnOne } = await import('@/lib/actions/oneonone')
      await expect(createOneOnOne(formData)).rejects.toThrow(
        'Report not found or not in your organization'
      )
    })
  })

  describe('getOneOnOnes', () => {
    it('gets one-on-ones successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const oneOnOnes = [
        {
          id: 'oneonone-1',
          managerId: 'person-1',
          reportId: 'person-2',
          scheduledAt: new Date('2024-01-15T10:00:00Z'),
          notes: 'Weekly check-in',
          manager: { id: 'person-1', name: 'John Doe' },
          report: { id: 'person-2', name: 'Jane Smith' },
        },
      ]

      findFirstReturnValues = [currentPerson]
      findManyReturnValue = oneOnOnes

      // Act
      const { getOneOnOnes } = await import('@/lib/actions/oneonone')
      const result = await getOneOnOnes()

      // Assert
      expect(result).toEqual(oneOnOnes)
      expect(findFirstCalls).toBe(1)
      expect(findManyCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findManyArgs[0]).toEqual({
        where: {
          OR: [{ managerId: 'person-1' }, { reportId: 'person-1' }],
        },
        include: {
          manager: true,
          report: true,
        },
        orderBy: { scheduledAt: 'desc' },
      })
    })

    it('throws error when user has no organization', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'USER',
        organizationId: null,
        organizationName: null,
      })

      // Act & Assert
      const { getOneOnOnes } = await import('@/lib/actions/oneonone')
      await expect(getOneOnOnes()).rejects.toThrow(
        'User must belong to an organization'
      )
    })
  })

  describe('getOneOnOneById', () => {
    it('gets one-on-one by id successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const oneOnOneId = 'oneonone-1'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const oneOnOne = {
        id: 'oneonone-1',
        managerId: 'person-1',
        reportId: 'person-2',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        notes: 'Weekly check-in',
        manager: {
          id: 'person-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'manager',
        },
        report: {
          id: 'person-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'member',
        },
      }

      findFirstReturnValues = [currentPerson, oneOnOne] // First call for current person, second for one-on-one

      // Act
      const { getOneOnOneById } = await import('@/lib/actions/oneonone')
      const result = await getOneOnOneById(oneOnOneId)

      // Assert
      expect(result).toEqual(oneOnOne)
      expect(findFirstCalls).toBe(2)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'oneonone-1',
          OR: [{ managerId: 'person-1' }, { reportId: 'person-1' }],
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          report: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      })
    })

    it('throws error when one-on-one not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const oneOnOneId = 'oneonone-1'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for one-on-one - not found

      // Act & Assert
      const { getOneOnOneById } = await import('@/lib/actions/oneonone')
      await expect(getOneOnOneById(oneOnOneId)).rejects.toThrow(
        'One-on-one not found or you do not have access to it'
      )
    })

    it('throws error when no person record found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const oneOnOneId = 'oneonone-1'
      findFirstReturnValues = [null] // No person found

      // Act & Assert
      const { getOneOnOneById } = await import('@/lib/actions/oneonone')
      await expect(getOneOnOneById(oneOnOneId)).rejects.toThrow(
        'No person record found for current user'
      )
    })
  })

  describe('updateOneOnOne', () => {
    it('updates one-on-one successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const oneOnOneId = 'oneonone-1'
      const formData = {
        managerId: 'person-3',
        reportId: 'person-4',
        scheduledAt: '2024-01-22T10:00:00Z',
        notes: 'Updated check-in',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const existingOneOnOne = { id: 'oneonone-1', managerId: 'person-1' }
      const manager = {
        id: 'person-3',
        name: 'Bob Johnson',
        organizationId: 'org-1',
      }
      const report = {
        id: 'person-4',
        name: 'Alice Brown',
        organizationId: 'org-1',
      }

      findFirstReturnValues = [currentPerson, existingOneOnOne, manager, report] // Four calls
      updateReturnValue = { success: true }

      // Act
      const { updateOneOnOne } = await import('@/lib/actions/oneonone')
      await updateOneOnOne(oneOnOneId, formData)

      // Assert
      expect(findFirstCalls).toBe(4)
      expect(updateCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'oneonone-1',
          OR: [{ managerId: 'person-1' }, { reportId: 'person-1' }],
        },
      })
      expect(findFirstArgs[2]).toEqual({
        where: {
          id: 'person-3',
          organizationId: 'org-1',
        },
      })
      expect(findFirstArgs[3]).toEqual({
        where: {
          id: 'person-4',
          organizationId: 'org-1',
        },
      })
      expect(updateArgs[0]).toEqual({
        where: { id: 'oneonone-1' },
        data: {
          managerId: 'person-3',
          reportId: 'person-4',
          scheduledAt: new Date('2024-01-22T10:00:00Z'),
          notes: 'Updated check-in',
        },
      })
    })

    it('throws error when one-on-one not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const oneOnOneId = 'oneonone-1'
      const formData = {
        managerId: 'person-3',
        reportId: 'person-4',
        scheduledAt: '2024-01-22T10:00:00Z',
        notes: 'Updated check-in',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for existing one-on-one - not found

      // Act & Assert
      const { updateOneOnOne } = await import('@/lib/actions/oneonone')
      await expect(updateOneOnOne(oneOnOneId, formData)).rejects.toThrow(
        'One-on-one not found or you do not have access to it'
      )
    })

    it('throws error when manager not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const oneOnOneId = 'oneonone-1'
      const formData = {
        managerId: 'person-3',
        reportId: 'person-4',
        scheduledAt: '2024-01-22T10:00:00Z',
        notes: 'Updated check-in',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const existingOneOnOne = { id: 'oneonone-1', managerId: 'person-1' }
      findFirstReturnValues = [currentPerson, existingOneOnOne, null, null] // Manager not found, report not found

      // Act & Assert
      const { updateOneOnOne } = await import('@/lib/actions/oneonone')
      await expect(updateOneOnOne(oneOnOneId, formData)).rejects.toThrow(
        'Manager not found or not in your organization'
      )
    })
  })
})
