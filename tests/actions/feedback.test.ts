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
  feedback: {
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

describe('feedback actions', () => {
  beforeEach(async () => {
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
    deleteCalls = 0
    deleteArgs = []

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()

    // Reset the mock to use the return values array
    prismaMock.person.findFirst = async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    }
    prismaMock.feedback.findFirst = async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    }
  })

  describe('createFeedback', () => {
    it('creates feedback successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        aboutId: 'person-2',
        kind: 'praise' as const,
        isPrivate: false,
        body: 'Great work on the project!',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const aboutPerson = { id: 'person-2', name: 'Jane Smith' }
      const createdFeedback = {
        id: 'feedback-1',
        aboutId: 'person-2',
        fromId: 'person-1',
        kind: 'praise' as const,
        isPrivate: false,
        body: 'Great work on the project!',
        about: { id: 'person-2', name: 'Jane Smith' },
        from: { id: 'person-1', name: 'John Doe' },
      }

      // Mock the database calls
      findFirstReturnValues = [currentPerson, aboutPerson] // First call for current person, second for about person
      createReturnValue = createdFeedback

      // Act
      const { createFeedback } = await import('@/lib/actions/feedback')
      const result = await createFeedback(formData)

      // Assert
      expect(result).toEqual(createdFeedback)
      expect(findFirstCalls).toBe(2)
      expect(createCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'person-2',
          organizationId: 'org-1',
        },
      })
      expect(createArgs[0]).toEqual({
        data: {
          aboutId: 'person-2',
          fromId: 'person-1',
          kind: 'praise',
          isPrivate: false,
          body: 'Great work on the project!',
        },
        include: {
          about: {
            select: {
              id: true,
              name: true,
            },
          },
          from: {
            select: {
              id: true,
              name: true,
            },
          },
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
        aboutId: 'person-2',
        kind: 'praise' as const,
        isPrivate: false,
        body: 'Great work on the project!',
      }

      // Act & Assert
      const { createFeedback } = await import('@/lib/actions/feedback')
      await expect(createFeedback(formData)).rejects.toThrow(
        'User must belong to an organization to create feedback'
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
        aboutId: 'person-2',
        kind: 'praise' as const,
        isPrivate: false,
        body: 'Great work on the project!',
      }

      findFirstReturnValues = [null] // No person found

      // Act & Assert
      const { createFeedback } = await import('@/lib/actions/feedback')
      await expect(createFeedback(formData)).rejects.toThrow(
        'No person record found for current user'
      )
    })

    it('throws error when about person not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        aboutId: 'person-2',
        kind: 'praise' as const,
        isPrivate: false,
        body: 'Great work on the project!',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for about person - not found

      // Act & Assert
      const { createFeedback } = await import('@/lib/actions/feedback')
      await expect(createFeedback(formData)).rejects.toThrow(
        'Person not found or access denied'
      )
    })
  })

  describe('updateFeedback', () => {
    it('updates feedback successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const feedbackId = 'feedback-1'
      const formData = {
        aboutId: 'person-2',
        kind: 'concern' as const,
        isPrivate: true,
        body: 'Updated feedback',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const existingFeedback = { id: 'feedback-1', fromId: 'person-1' }
      const aboutPerson = { id: 'person-2', name: 'Jane Smith' }
      const updatedFeedback = {
        id: 'feedback-1',
        aboutId: 'person-2',
        fromId: 'person-1',
        kind: 'concern' as const,
        isPrivate: true,
        body: 'Updated feedback',
        about: { id: 'person-2', name: 'Jane Smith' },
        from: { id: 'person-1', name: 'John Doe' },
      }

      findFirstReturnValues = [currentPerson, existingFeedback, aboutPerson] // Three calls
      updateReturnValue = updatedFeedback

      // Act
      const { updateFeedback } = await import('@/lib/actions/feedback')
      const result = await updateFeedback(feedbackId, formData)

      // Assert
      expect(result).toEqual(updatedFeedback)
      expect(findFirstCalls).toBe(3)
      expect(updateCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'feedback-1',
          fromId: 'person-1',
        },
      })
      expect(findFirstArgs[2]).toEqual({
        where: {
          id: 'person-2',
          organizationId: 'org-1',
        },
      })
      expect(updateArgs[0]).toEqual({
        where: { id: 'feedback-1' },
        data: {
          aboutId: 'person-2',
          kind: 'concern' as const,
          isPrivate: true,
          body: 'Updated feedback',
        },
        include: {
          about: {
            select: {
              id: true,
              name: true,
            },
          },
          from: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    })

    it('throws error when feedback not found or user is not author', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const feedbackId = 'feedback-1'
      const formData = {
        aboutId: 'person-2',
        kind: 'concern' as const,
        isPrivate: true,
        body: 'Updated feedback',
      }

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for existing feedback - not found

      // Act & Assert
      const { updateFeedback } = await import('@/lib/actions/feedback')
      await expect(updateFeedback(feedbackId, formData)).rejects.toThrow(
        'Feedback not found or you do not have permission to edit it'
      )
    })
  })

  describe('deleteFeedback', () => {
    it('deletes feedback successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const feedbackId = 'feedback-1'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const existingFeedback = {
        id: 'feedback-1',
        fromId: 'person-1',
        aboutId: 'person-2',
      }

      findFirstReturnValues = [currentPerson, existingFeedback] // First call for current person, second for existing feedback

      // Act
      const { deleteFeedback } = await import('@/lib/actions/feedback')
      await deleteFeedback(feedbackId)

      // Assert
      expect(findFirstCalls).toBe(2)
      expect(deleteCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'feedback-1',
          fromId: 'person-1',
        },
      })
      expect(deleteArgs[0]).toEqual({
        where: { id: 'feedback-1' },
      })
    })

    it('throws error when feedback not found or user is not author', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const feedbackId = 'feedback-1'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for existing feedback - not found

      // Act & Assert
      const { deleteFeedback } = await import('@/lib/actions/feedback')
      await expect(deleteFeedback(feedbackId)).rejects.toThrow(
        'Feedback not found or you do not have permission to delete it'
      )
    })
  })

  describe('getFeedbackForPerson', () => {
    it('gets feedback for person successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const personId = 'person-2'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const person = { id: 'person-2', name: 'Jane Smith' }
      const feedback = [
        {
          id: 'feedback-1',
          aboutId: 'person-2',
          fromId: 'person-1',
          kind: 'praise',
          isPrivate: false,
          body: 'Great work!',
          about: { id: 'person-2', name: 'Jane Smith' },
          from: { id: 'person-1', name: 'John Doe' },
        },
      ]

      findFirstReturnValues = [currentPerson, person] // First call for current person, second for person
      findManyReturnValue = feedback

      // Act
      const { getFeedbackForPerson } = await import('@/lib/actions/feedback')
      const result = await getFeedbackForPerson(personId)

      // Assert
      expect(result).toEqual(feedback)
      expect(findFirstCalls).toBe(2)
      expect(findManyCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'person-2',
          organizationId: 'org-1',
        },
      })
      expect(findManyArgs[0]).toEqual({
        where: {
          aboutId: 'person-2',
          OR: [{ isPrivate: false }, { fromId: 'person-1' }],
        },
        include: {
          about: {
            select: {
              id: true,
              name: true,
            },
          },
          from: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('throws error when person not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const personId = 'person-2'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for person - not found

      // Act & Assert
      const { getFeedbackForPerson } = await import('@/lib/actions/feedback')
      await expect(getFeedbackForPerson(personId)).rejects.toThrow(
        'Person not found or access denied'
      )
    })
  })

  describe('getFeedbackById', () => {
    it('gets feedback by id successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const feedbackId = 'feedback-1'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const feedback = {
        id: 'feedback-1',
        aboutId: 'person-2',
        fromId: 'person-1',
        kind: 'praise',
        isPrivate: false,
        body: 'Great work!',
        about: { id: 'person-2', name: 'Jane Smith' },
        from: { id: 'person-1', name: 'John Doe' },
      }

      findFirstReturnValues = [currentPerson, feedback] // First call for current person, second for feedback

      // Act
      const { getFeedbackById } = await import('@/lib/actions/feedback')
      const result = await getFeedbackById(feedbackId)

      // Assert
      expect(result).toEqual(feedback)
      expect(findFirstCalls).toBe(2)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'feedback-1',
          OR: [{ isPrivate: false }, { fromId: 'person-1' }],
        },
        include: {
          about: {
            select: {
              id: true,
              name: true,
            },
          },
          from: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    })

    it('throws error when feedback not found or no access', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const feedbackId = 'feedback-1'
      const currentPerson = { id: 'person-1', name: 'John Doe' }
      findFirstReturnValues = [currentPerson, null] // First call for current person, second for feedback - not found

      // Act & Assert
      const { getFeedbackById } = await import('@/lib/actions/feedback')
      await expect(getFeedbackById(feedbackId)).rejects.toThrow(
        'Feedback not found or you do not have access to it'
      )
    })
  })

  describe('getAllFeedback', () => {
    it('gets all feedback with filters successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const currentPerson = { id: 'person-1', name: 'John Doe' }
      const feedback = [
        {
          id: 'feedback-1',
          aboutId: 'person-2',
          fromId: 'person-1',
          kind: 'praise',
          isPrivate: false,
          body: 'Great work!',
          createdAt: new Date('2024-01-01'),
          about: {
            id: 'person-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'member',
          },
          from: {
            id: 'person-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'manager',
          },
        },
      ]

      const filters = {
        fromPersonId: 'person-1',
        kind: 'praise',
        isPrivate: false,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }

      findFirstReturnValues = [currentPerson]
      findManyReturnValue = feedback

      // Act
      const { getAllFeedback } = await import('@/lib/actions/feedback')
      const result = await getAllFeedback(filters)

      // Assert
      expect(result).toEqual([
        {
          ...feedback[0],
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ])
      expect(findFirstCalls).toBe(1)
      expect(findManyCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: { user: { id: 'user-1' } },
      })
      expect(findManyArgs[0]).toEqual({
        where: {
          OR: [{ isPrivate: false }, { fromId: 'person-1' }],
          about: {
            organizationId: 'org-1',
          },
          fromId: 'person-1',
          kind: 'praise',
          isPrivate: false,
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        include: {
          about: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          from: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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

      // Act & Assert
      const { getAllFeedback } = await import('@/lib/actions/feedback')
      await expect(getAllFeedback()).rejects.toThrow(
        'User must belong to an organization to view feedback'
      )
    })
  })
})
