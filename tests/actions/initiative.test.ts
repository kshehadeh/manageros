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
  team: {
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

describe('initiative actions', () => {
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

  describe('createInitiative', () => {
    it('creates an initiative successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        title: 'Test Initiative',
        summary: 'A test initiative',
        outcome: 'Improved efficiency',
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        status: 'in_progress' as const,
        rag: 'green' as const,
        confidence: 8,
        teamId: 'team-1',
        objectives: [
          { title: 'Objective 1', keyResult: 'KR 1' },
          { title: 'Objective 2', keyResult: 'KR 2' },
        ],
        owners: [
          { personId: 'person-1', role: 'owner' as const },
          { personId: 'person-2', role: 'collaborator' as const },
        ],
      }

      const team = { id: 'team-1', name: 'Test Team' }
      const createdInitiative = {
        id: 'init-1',
        title: 'Test Initiative',
        summary: 'A test initiative',
        outcome: 'Improved efficiency',
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2024-06-01'),
        status: 'in_progress' as const,
        rag: 'green' as const,
        confidence: 8,
        teamId: 'team-1',
        organizationId: 'org-1',
        objectives: [
          {
            id: 'obj-1',
            title: 'Objective 1',
            keyResult: 'KR 1',
            sortIndex: 0,
          },
          {
            id: 'obj-2',
            title: 'Objective 2',
            keyResult: 'KR 2',
            sortIndex: 1,
          },
        ],
        owners: [
          {
            id: 'owner-1',
            personId: 'person-1',
            role: 'owner' as const,
            person: { id: 'person-1', name: 'John Doe' },
          },
          {
            id: 'owner-2',
            personId: 'person-2',
            role: 'collaborator' as const,
            person: { id: 'person-2', name: 'Jane Smith' },
          },
        ],
        team,
      }

      findFirstReturnValues = [team]
      createReturnValue = createdInitiative

      // Act
      const { createInitiative } = await import('@/lib/actions/initiative')
      await createInitiative(formData)

      // Assert
      // Note: createInitiative redirects, so we don't expect a return value
      expect(findFirstCalls).toBe(1)
      expect(createCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'team-1',
          organizationId: 'org-1',
        },
      })
      expect(createArgs[0]).toEqual({
        data: {
          title: 'Test Initiative',
          summary: 'A test initiative',
          outcome: 'Improved efficiency',
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-06-01'),
          status: 'in_progress',
          rag: 'green',
          confidence: 8,
          teamId: 'team-1',
          organizationId: 'org-1',
          objectives: {
            create: [
              { title: 'Objective 1', keyResult: 'KR 1', sortIndex: 0 },
              { title: 'Objective 2', keyResult: 'KR 2', sortIndex: 1 },
            ],
          },
          owners: {
            create: [
              { personId: 'person-1', role: 'owner' },
              { personId: 'person-2', role: 'contributor' },
            ],
          },
        },
        include: {
          objectives: true,
          owners: {
            include: {
              person: true,
            },
          },
          team: true,
        },
      })
    })

    it('creates an initiative without team successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        title: 'Test Initiative',
        summary: 'A test initiative',
        outcome: 'Improved efficiency',
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        status: 'in_progress' as const,
        rag: 'green' as const,
        confidence: 8,
        teamId: undefined,
        objectives: [],
        owners: [],
      }

      const createdInitiative = {
        id: 'init-1',
        title: 'Test Initiative',
        summary: 'A test initiative',
        outcome: 'Improved efficiency',
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2024-06-01'),
        status: 'in_progress' as const,
        rag: 'green' as const,
        confidence: 8,
        teamId: undefined,
        organizationId: 'org-1',
        objectives: [],
        owners: [],
        team: null,
      }

      createReturnValue = createdInitiative

      // Act
      const { createInitiative } = await import('@/lib/actions/initiative')
      await createInitiative(formData)

      // Assert
      // Note: createInitiative redirects, so we don't expect a return value
      expect(findFirstCalls).toBe(0) // No team validation
      expect(createCalls).toBe(1)
      expect(createArgs[0]).toEqual({
        data: {
          title: 'Test Initiative',
          summary: 'A test initiative',
          outcome: 'Improved efficiency',
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-06-01'),
          status: 'in_progress',
          rag: 'green',
          confidence: 8,
          teamId: undefined,
          organizationId: 'org-1',
          objectives: {
            create: [],
          },
          owners: {
            create: [],
          },
        },
        include: {
          objectives: true,
          owners: {
            include: {
              person: true,
            },
          },
          team: true,
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
        title: 'Test Initiative',
        summary: 'A test initiative',
        outcome: 'Improved efficiency',
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        status: 'in_progress' as const,
        rag: 'green' as const,
        confidence: 8,
        teamId: undefined,
        objectives: [],
        owners: [],
      }

      // Act & Assert
      const { createInitiative } = await import('@/lib/actions/initiative')
      await expect(createInitiative(formData)).rejects.toThrow(
        'User must belong to an organization to create initiatives'
      )
    })

    it('throws error when team not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        title: 'Test Initiative',
        summary: 'A test initiative',
        outcome: 'Improved efficiency',
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        status: 'in_progress' as const,
        rag: 'green' as const,
        confidence: 8,
        teamId: 'team-1',
        objectives: [],
        owners: [],
      }

      findFirstReturnValues = [null] // Team not found

      // Act & Assert
      const { createInitiative } = await import('@/lib/actions/initiative')
      await expect(createInitiative(formData)).rejects.toThrow(
        'Team not found or access denied'
      )
    })
  })

  describe('updateInitiative', () => {
    it('updates an initiative successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const initiativeId = 'init-1'
      const formData = {
        title: 'Updated Initiative',
        summary: 'An updated initiative',
        outcome: 'Better efficiency',
        startDate: '2024-02-01',
        targetDate: '2024-07-01',
        status: 'in_progress' as const,
        rag: 'amber' as const,
        confidence: 6,
        teamId: 'team-2',
        objectives: [
          { title: 'Updated Objective 1', keyResult: 'Updated KR 1' },
        ],
        owners: [{ personId: 'person-3', role: 'owner' as const }],
      }

      const existingInitiative = { id: 'init-1', organizationId: 'org-1' }
      const team = { id: 'team-2', name: 'Updated Team' }
      const updatedInitiative = {
        id: 'init-1',
        title: 'Updated Initiative',
        summary: 'An updated initiative',
        outcome: 'Better efficiency',
        startDate: new Date('2024-02-01'),
        targetDate: new Date('2024-07-01'),
        status: 'in_progress' as const,
        rag: 'amber' as const,
        confidence: 6,
        teamId: 'team-2',
        organizationId: 'org-1',
        objectives: [
          {
            id: 'obj-1',
            title: 'Updated Objective 1',
            keyResult: 'Updated KR 1',
            sortIndex: 0,
          },
        ],
        owners: [
          {
            id: 'owner-1',
            personId: 'person-3',
            role: 'owner' as const,
            person: { id: 'person-3', name: 'Bob Johnson' },
          },
        ],
        team,
      }

      findFirstReturnValues = [existingInitiative, team] // First call for existing initiative, second for team
      updateReturnValue = updatedInitiative

      // Act
      const { updateInitiative } = await import('@/lib/actions/initiative')
      await updateInitiative(initiativeId, formData)

      // Assert
      // Note: updateInitiative redirects, so we don't expect a return value
      expect(findFirstCalls).toBe(2)
      expect(updateCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'init-1',
          organizationId: 'org-1',
        },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'team-2',
          organizationId: 'org-1',
        },
      })
      expect(updateArgs[0]).toEqual({
        where: { id: 'init-1' },
        data: {
          title: 'Updated Initiative',
          summary: 'An updated initiative',
          outcome: 'Better efficiency',
          startDate: new Date('2024-02-01'),
          targetDate: new Date('2024-07-01'),
          status: 'in_progress',
          rag: 'amber',
          confidence: 6,
          teamId: 'team-2',
          objectives: {
            deleteMany: {},
            create: [
              {
                title: 'Updated Objective 1',
                keyResult: 'Updated KR 1',
                sortIndex: 0,
              },
            ],
          },
          owners: {
            deleteMany: {},
            create: [{ personId: 'person-3', role: 'owner' as const }],
          },
        },
        include: {
          objectives: true,
          owners: {
            include: {
              person: true,
            },
          },
          team: true,
        },
      })
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

      const initiativeId = 'init-1'
      const formData = {
        title: 'Updated Initiative',
        summary: 'An updated initiative',
        outcome: 'Better efficiency',
        startDate: '2024-02-01',
        targetDate: '2024-07-01',
        status: 'in_progress' as const,
        rag: 'amber' as const,
        confidence: 6,
        teamId: undefined,
        objectives: [],
        owners: [],
      }

      findFirstReturnValues = [null] // Initiative not found

      // Act & Assert
      const { updateInitiative } = await import('@/lib/actions/initiative')
      await expect(updateInitiative(initiativeId, formData)).rejects.toThrow(
        'Initiative not found or access denied'
      )
    })
  })

  describe('deleteInitiative', () => {
    it('deletes an initiative successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const initiativeId = 'init-1'
      const existingInitiative = { id: 'init-1', organizationId: 'org-1' }

      findFirstReturnValues = [existingInitiative]

      // Act
      const { deleteInitiative } = await import('@/lib/actions/initiative')
      await deleteInitiative(initiativeId)

      // Assert
      expect(findFirstCalls).toBe(1)
      expect(deleteCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'init-1',
          organizationId: 'org-1',
        },
      })
      expect(deleteArgs[0]).toEqual({
        where: { id: 'init-1' },
      })
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

      const initiativeId = 'init-1'
      findFirstReturnValues = [null] // Initiative not found

      // Act & Assert
      const { deleteInitiative } = await import('@/lib/actions/initiative')
      await expect(deleteInitiative(initiativeId)).rejects.toThrow(
        'Initiative not found or access denied'
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

      const initiativeId = 'init-1'

      // Act & Assert
      const { deleteInitiative } = await import('@/lib/actions/initiative')
      await expect(deleteInitiative(initiativeId)).rejects.toThrow(
        'User must belong to an organization to delete initiatives'
      )
    })
  })
})
