import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mutable stubs that we can spy on and reconfigure
let findFirstCalls = 0
let findFirstArgs: unknown[] = []
let findFirstReturnValues: unknown[] = []

let createCalls = 0
let createArgs: unknown[] = []
let createReturnValue: unknown = null

let updateCalls = 0
let updateArgs: unknown[] = []
let updateReturnValue: unknown = null

let deleteCalls = 0
let deleteArgs: unknown[] = []

const prismaMock = {
  person: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
  },
  initiative: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
  },
  checkIn: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
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
    delete: async (args: unknown) => {
      deleteCalls += 1
      deleteArgs.push(args)
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

describe('checkin actions', () => {
  beforeEach(() => {
    // Reset call counters and return values
    findFirstCalls = 0
    findFirstArgs = []
    findFirstReturnValues = []
    createCalls = 0
    createArgs = []
    createReturnValue = null
    updateCalls = 0
    updateArgs = []
    updateReturnValue = null
    deleteCalls = 0
    deleteArgs = []

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()
  })

  describe('createCheckIn', () => {
    it('creates a check-in successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        initiativeId: 'init-1',
        weekOf: '2024-01-01',
        rag: 'green' as const,
        confidence: 8,
        summary: 'Good progress',
        blockers: 'None',
        nextSteps: 'Continue work',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const initiative = { id: 'init-1', title: 'Test Initiative' }
      const createdCheckIn = {
        id: 'checkin-1',
        initiativeId: 'init-1',
        weekOf: new Date('2024-01-01'),
        rag: 'green' as const,
        confidence: 8,
        summary: 'Good progress',
        blockers: 'None',
        nextSteps: 'Continue work',
        createdById: 'person-1',
        initiative,
        createdBy: currentPerson,
      }

      // Mock the database calls
      findFirstReturnValues = [currentPerson, initiative] // First call for person, second for initiative
      createReturnValue = createdCheckIn

      // Act
      const { createCheckIn } = await import('@/lib/actions/checkin')
      const result = await createCheckIn(formData)

      // Assert
      expect(result).toEqual(createdCheckIn)
      expect(findFirstCalls).toBe(2)
      expect(createCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'init-1',
          organizationId: 'org-1',
        },
      })
      expect(createArgs[0]).toEqual({
        data: {
          initiativeId: 'init-1',
          weekOf: new Date('2024-01-01'),
          rag: 'green',
          confidence: 8,
          summary: 'Good progress',
          blockers: 'None',
          nextSteps: 'Continue work',
          createdById: 'person-1',
        },
        include: {
          initiative: true,
          createdBy: true,
        },
      })
    })

    it('throws error when user has no organization', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'USER',
        organizationId: '',
        organizationName: '',
      })

      const formData = {
        initiativeId: 'init-1',
        weekOf: '2024-01-01',
        rag: 'green' as const,
        confidence: 8,
        summary: 'Good progress',
        blockers: 'None',
        nextSteps: 'Continue work',
      }

      // Act & Assert
      const { createCheckIn } = await import('@/lib/actions/checkin')
      await expect(createCheckIn(formData)).rejects.toThrow(
        'User must belong to an organization to create check-ins'
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

      const formData = {
        initiativeId: 'init-1',
        weekOf: '2024-01-01',
        rag: 'green' as const,
        confidence: 8,
        summary: 'Good progress',
        blockers: 'None',
        nextSteps: 'Continue work',
      }

      findFirstReturnValues = [null] // No person found

      // Act & Assert
      const { createCheckIn } = await import('@/lib/actions/checkin')
      await expect(createCheckIn(formData)).rejects.toThrow(
        'No person record found for current user'
      )
    })

    it('throws error when initiative not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        initiativeId: 'init-1',
        weekOf: '2024-01-01',
        rag: 'green' as const,
        confidence: 8,
        summary: 'Good progress',
        blockers: 'None',
        nextSteps: 'Continue work',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for person, second call for initiative - not found

      // Act & Assert
      const { createCheckIn } = await import('@/lib/actions/checkin')
      await expect(createCheckIn(formData)).rejects.toThrow(
        'Initiative not found or access denied'
      )
    })
  })

  describe('updateCheckIn', () => {
    it('updates a check-in successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const checkInId = 'checkin-1'
      const formData = {
        initiativeId: 'init-1',
        weekOf: '2024-01-08',
        rag: 'amber' as const,
        confidence: 6,
        summary: 'Some issues',
        blockers: 'Technical debt',
        nextSteps: 'Fix issues',
      }

      const existingCheckIn = { id: 'checkin-1', initiativeId: 'init-1' }
      const updatedCheckIn = {
        id: 'checkin-1',
        initiativeId: 'init-1',
        weekOf: new Date('2024-01-08'),
        rag: 'amber' as const,
        confidence: 6,
        summary: 'Some issues',
        blockers: 'Technical debt',
        nextSteps: 'Fix issues',
        initiative: { id: 'init-1', title: 'Test Initiative' },
        createdBy: { id: 'person-1', name: 'John Doe' },
      }

      findFirstReturnValues = [existingCheckIn]
      updateReturnValue = updatedCheckIn

      // Act
      const { updateCheckIn } = await import('@/lib/actions/checkin')
      const result = await updateCheckIn(checkInId, formData)

      // Assert
      expect(result).toEqual(updatedCheckIn)
      expect(findFirstCalls).toBe(1)
      expect(updateCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'checkin-1',
          initiative: {
            organizationId: 'org-1',
          },
        },
      })
      expect(updateArgs[0]).toEqual({
        where: { id: 'checkin-1' },
        data: {
          weekOf: new Date('2024-01-08'),
          rag: 'amber' as const,
          confidence: 6,
          summary: 'Some issues',
          blockers: 'Technical debt',
          nextSteps: 'Fix issues',
        },
        include: {
          initiative: true,
          createdBy: true,
        },
      })
    })

    it('throws error when check-in not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const checkInId = 'checkin-1'
      const formData = {
        initiativeId: 'init-1',
        weekOf: '2024-01-08',
        rag: 'amber' as const,
        confidence: 6,
        summary: 'Some issues',
        blockers: 'Technical debt',
        nextSteps: 'Fix issues',
      }

      findFirstReturnValues = [null] // Check-in not found

      // Act & Assert
      const { updateCheckIn } = await import('@/lib/actions/checkin')
      await expect(updateCheckIn(checkInId, formData)).rejects.toThrow(
        'Check-in not found or access denied'
      )
    })
  })

  describe('deleteCheckIn', () => {
    it('deletes a check-in successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const checkInId = 'checkin-1'
      const existingCheckIn = {
        id: 'checkin-1',
        initiativeId: 'init-1',
        initiative: { id: 'init-1', title: 'Test Initiative' },
      }

      findFirstReturnValues = [existingCheckIn]

      // Act
      const { deleteCheckIn } = await import('@/lib/actions/checkin')
      const result = await deleteCheckIn(checkInId)

      // Assert
      expect(result).toEqual({ success: true })
      expect(findFirstCalls).toBe(1)
      expect(deleteCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'checkin-1',
          initiative: {
            organizationId: 'org-1',
          },
        },
        include: {
          initiative: true,
        },
      })
      expect(deleteArgs[0]).toEqual({
        where: { id: 'checkin-1' },
      })
    })

    it('throws error when check-in not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const checkInId = 'checkin-1'
      findFirstReturnValues = [null] // Check-in not found

      // Act & Assert
      const { deleteCheckIn } = await import('@/lib/actions/checkin')
      await expect(deleteCheckIn(checkInId)).rejects.toThrow(
        'Check-in not found or access denied'
      )
    })
  })

  describe('getCheckIn', () => {
    it('gets a check-in successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const checkInId = 'checkin-1'
      const checkIn = {
        id: 'checkin-1',
        initiativeId: 'init-1',
        weekOf: new Date('2024-01-01'),
        rag: 'green',
        confidence: 8,
        summary: 'Good progress',
        blockers: 'None',
        nextSteps: 'Continue work',
        initiative: { id: 'init-1', title: 'Test Initiative' },
        createdBy: { id: 'person-1', name: 'John Doe' },
      }

      findFirstReturnValues = [checkIn]

      // Act
      const { getCheckIn } = await import('@/lib/actions/checkin')
      const result = await getCheckIn(checkInId)

      // Assert
      expect(result).toEqual(checkIn)
      expect(findFirstCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'checkin-1',
          initiative: {
            organizationId: 'org-1',
          },
        },
        include: {
          initiative: true,
          createdBy: true,
        },
      })
    })

    it('throws error when check-in not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const checkInId = 'checkin-1'
      findFirstReturnValues = [null] // Check-in not found

      // Act & Assert
      const { getCheckIn } = await import('@/lib/actions/checkin')
      await expect(getCheckIn(checkInId)).rejects.toThrow(
        'Check-in not found or access denied'
      )
    })

    it('throws error when user has no organization', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'USER',
        organizationId: '',
        organizationName: '',
      })

      const checkInId = 'checkin-1'

      // Act & Assert
      const { getCheckIn } = await import('@/lib/actions/checkin')
      await expect(getCheckIn(checkInId)).rejects.toThrow(
        'User must belong to an organization to view check-ins'
      )
    })
  })
})
