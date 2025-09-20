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
  initiative: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
  },
  objective: {
    findFirst: async (args: unknown) => {
      findFirstCalls += 1
      findFirstArgs.push(args)
      return findFirstReturnValues[findFirstCalls - 1] || null
    },
  },
  task: {
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

describe('task actions', () => {
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
    deleteCalls = 0
    deleteArgs = []

    // Reset auth utils mock
    vi.mocked(authUtils.getCurrentUser).mockClear()
  })

  describe('createTask', () => {
    it('creates a task successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        title: 'Test Task',
        description: 'A test task',
        assigneeId: 'person-1',
        status: 'todo',
        priority: 3,
        estimate: 5,
        dueDate: '2024-02-01',
        initiativeId: 'init-1',
        objectiveId: 'obj-1',
      }

      const assignee = {
        id: 'person-1',
        name: 'John Doe',
        organizationId: 'org-1',
      }
      const initiative = {
        id: 'init-1',
        title: 'Test Initiative',
        organizationId: 'org-1',
      }
      const objective = {
        id: 'obj-1',
        title: 'Test Objective',
        initiative: { organizationId: 'org-1' },
      }
      const createdTask = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        assigneeId: 'person-1',
        status: 'todo',
        priority: 3,
        estimate: 5,
        dueDate: new Date('2024-02-01'),
        initiativeId: 'init-1',
        objectiveId: 'obj-1',
        assignee,
        initiative,
        objective,
      }

      findFirstReturnValues = [assignee, initiative, objective] // Three calls for validation
      createReturnValue = createdTask

      // Act
      const { createTask } = await import('@/lib/actions/task')
      await createTask(formData)

      // Assert
      expect(findFirstCalls).toBe(3)
      expect(createCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'person-1',
          organizationId: 'org-1',
        },
      })
      expect(findFirstArgs[1]).toEqual({
        where: {
          id: 'init-1',
          organizationId: 'org-1',
        },
      })
      expect(findFirstArgs[2]).toEqual({
        where: {
          id: 'obj-1',
          initiative: {
            organizationId: 'org-1',
          },
        },
      })
      expect(createArgs[0]).toEqual({
        data: {
          title: 'Test Task',
          description: 'A test task',
          assigneeId: 'person-1',
          status: 'todo',
          priority: 3,
          estimate: 5,
          dueDate: new Date('2024-02-01'),
          initiativeId: 'init-1',
          objectiveId: 'obj-1',
        },
        include: {
          assignee: true,
          initiative: true,
          objective: true,
        },
      })
    })

    it('creates a task without optional fields successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        title: 'Simple Task',
        description: 'A simple task',
        assigneeId: null,
        status: 'todo',
        priority: 2,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
      }

      const createdTask = {
        id: 'task-1',
        title: 'Simple Task',
        description: 'A simple task',
        assigneeId: null,
        status: 'todo',
        priority: 2,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
        assignee: null,
        initiative: null,
        objective: null,
      }

      createReturnValue = createdTask

      // Act
      const { createTask } = await import('@/lib/actions/task')
      await createTask(formData)

      // Assert
      expect(findFirstCalls).toBe(0) // No validation calls needed
      expect(createCalls).toBe(1)
      expect(createArgs[0]).toEqual({
        data: {
          title: 'Simple Task',
          description: 'A simple task',
          assigneeId: null,
          status: 'todo',
          priority: 2,
          estimate: null,
          dueDate: null,
          initiativeId: null,
          objectiveId: null,
        },
        include: {
          assignee: true,
          initiative: true,
          objective: true,
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
        title: 'Test Task',
        description: 'A test task',
        assigneeId: null,
        status: 'todo',
        priority: 3,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
      }

      // Act & Assert
      const { createTask } = await import('@/lib/actions/task')
      await expect(createTask(formData)).rejects.toThrow(
        'User must belong to an organization to create tasks'
      )
    })

    it('throws error when assignee not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const formData = {
        title: 'Test Task',
        description: 'A test task',
        assigneeId: 'person-1',
        status: 'todo',
        priority: 3,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
      }

      findFirstReturnValues = [null] // Assignee not found

      // Act & Assert
      const { createTask } = await import('@/lib/actions/task')
      await expect(createTask(formData)).rejects.toThrow(
        'Assignee not found or access denied'
      )
    })
  })

  describe('updateTask', () => {
    it('updates a task successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      const formData = {
        title: 'Updated Task',
        description: 'An updated task',
        assigneeId: 'person-2',
        status: 'doing',
        priority: 4,
        estimate: 8,
        dueDate: '2024-02-15',
        initiativeId: 'init-2',
        objectiveId: 'obj-2',
      }

      const existingTask = {
        id: 'task-1',
        assignee: { organizationId: 'org-1' },
      }
      const assignee = {
        id: 'person-2',
        name: 'Jane Smith',
        organizationId: 'org-1',
      }
      const initiative = {
        id: 'init-2',
        title: 'Updated Initiative',
        organizationId: 'org-1',
      }
      const objective = {
        id: 'obj-2',
        title: 'Updated Objective',
        initiative: { organizationId: 'org-1' },
      }
      const updatedTask = {
        id: 'task-1',
        title: 'Updated Task',
        description: 'An updated task',
        assigneeId: 'person-2',
        status: 'doing',
        priority: 4,
        estimate: 8,
        dueDate: new Date('2024-02-15'),
        initiativeId: 'init-2',
        objectiveId: 'obj-2',
        assignee,
        initiative,
        objective,
      }

      findFirstReturnValues = [existingTask, assignee, initiative, objective] // Four calls
      updateReturnValue = updatedTask

      // Act
      const { updateTask } = await import('@/lib/actions/task')
      await updateTask(taskId, formData)

      // Assert
      expect(findFirstCalls).toBe(4)
      expect(updateCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'task-1',
          OR: [
            { assignee: { organizationId: 'org-1' } },
            { initiative: { organizationId: 'org-1' } },
            { objective: { initiative: { organizationId: 'org-1' } } },
          ],
        },
      })
      expect(updateArgs[0]).toEqual({
        where: { id: 'task-1' },
        data: {
          title: 'Updated Task',
          description: 'An updated task',
          assigneeId: 'person-2',
          status: 'doing',
          priority: 4,
          estimate: 8,
          dueDate: new Date('2024-02-15'),
          initiativeId: 'init-2',
          objectiveId: 'obj-2',
          completedAt: null, // Status is not 'done'
        },
        include: {
          assignee: true,
          initiative: true,
          objective: true,
        },
      })
    })

    it('sets completedAt when status is done', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      const formData = {
        title: 'Completed Task',
        description: 'A completed task',
        assigneeId: null,
        status: 'done',
        priority: 1,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
      }

      const existingTask = {
        id: 'task-1',
        assignee: { organizationId: 'org-1' },
      }
      const updatedTask = {
        id: 'task-1',
        title: 'Completed Task',
        description: 'A completed task',
        assigneeId: null,
        status: 'done',
        priority: 1,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
        completedAt: new Date(),
        assignee: null,
        initiative: null,
        objective: null,
      }

      findFirstReturnValues = [existingTask]
      updateReturnValue = updatedTask

      // Act
      const { updateTask } = await import('@/lib/actions/task')
      await updateTask(taskId, formData)

      // Assert
      expect(updateArgs[0].data.completedAt).toBeInstanceOf(Date)
    })

    it('throws error when task not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      const formData = {
        title: 'Updated Task',
        description: 'An updated task',
        assigneeId: null,
        status: 'todo',
        priority: 3,
        estimate: null,
        dueDate: null,
        initiativeId: null,
        objectiveId: null,
      }

      findFirstReturnValues = [null] // Task not found

      // Act & Assert
      const { updateTask } = await import('@/lib/actions/task')
      await expect(updateTask(taskId, formData)).rejects.toThrow(
        'Task not found or access denied'
      )
    })
  })

  describe('deleteTask', () => {
    it('deletes a task successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      const task = { id: 'task-1', assignee: { organizationId: 'org-1' } }

      findFirstReturnValues = [task]

      // Act
      const { deleteTask } = await import('@/lib/actions/task')
      await deleteTask(taskId)

      // Assert
      expect(findFirstCalls).toBe(1)
      expect(deleteCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'task-1',
          OR: [
            { assignee: { organizationId: 'org-1' } },
            { initiative: { organizationId: 'org-1' } },
            { objective: { initiative: { organizationId: 'org-1' } } },
          ],
        },
      })
      expect(deleteArgs[0]).toEqual({
        where: { id: 'task-1' },
      })
    })

    it('throws error when task not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      findFirstReturnValues = [null] // Task not found

      // Act & Assert
      const { deleteTask } = await import('@/lib/actions/task')
      await expect(deleteTask(taskId)).rejects.toThrow(
        'Task not found or access denied'
      )
    })
  })

  describe('getTasks', () => {
    it('gets tasks successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'First task',
          assigneeId: 'person-1',
          status: 'todo',
          priority: 3,
          estimate: 5,
          dueDate: new Date('2024-02-01'),
          initiativeId: 'init-1',
          objectiveId: 'obj-1',
          assignee: { id: 'person-1', name: 'John Doe' },
          initiative: { id: 'init-1', title: 'Test Initiative' },
          objective: { id: 'obj-1', title: 'Test Objective' },
        },
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Second task',
          assigneeId: 'person-2',
          status: 'doing',
          priority: 2,
          estimate: 8,
          dueDate: new Date('2024-02-15'),
          initiativeId: 'init-2',
          objectiveId: 'obj-2',
          assignee: { id: 'person-2', name: 'Jane Smith' },
          initiative: { id: 'init-2', title: 'Another Initiative' },
          objective: { id: 'obj-2', title: 'Another Objective' },
        },
      ]

      findManyReturnValue = tasks

      // Act
      const { getTasks } = await import('@/lib/actions/task')
      const result = await getTasks()

      // Assert
      expect(result).toEqual(tasks)
      expect(findManyCalls).toBe(1)
      expect(findManyArgs[0]).toEqual({
        where: {
          OR: [
            { assignee: { organizationId: 'org-1' } },
            { initiative: { organizationId: 'org-1' } },
            { objective: { initiative: { organizationId: 'org-1' } } },
          ],
        },
        include: {
          assignee: true,
          initiative: true,
          objective: true,
        },
        orderBy: { updatedAt: 'desc' },
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
      const { getTasks } = await import('@/lib/actions/task')
      await expect(getTasks()).rejects.toThrow(
        'User must belong to an organization to view tasks'
      )
    })
  })

  describe('getTask', () => {
    it('gets a task successfully', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      const task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        assigneeId: 'person-1',
        status: 'todo',
        priority: 3,
        estimate: 5,
        dueDate: new Date('2024-02-01'),
        initiativeId: 'init-1',
        objectiveId: 'obj-1',
        assignee: { id: 'person-1', name: 'John Doe' },
        initiative: { id: 'init-1', title: 'Test Initiative' },
        objective: { id: 'obj-1', title: 'Test Objective' },
      }

      findFirstReturnValues = [task]

      // Act
      const { getTask } = await import('@/lib/actions/task')
      const result = await getTask(taskId)

      // Assert
      expect(result).toEqual(task)
      expect(findFirstCalls).toBe(1)
      expect(findFirstArgs[0]).toEqual({
        where: {
          id: 'task-1',
          OR: [
            { assignee: { organizationId: 'org-1' } },
            { initiative: { organizationId: 'org-1' } },
            { objective: { initiative: { organizationId: 'org-1' } } },
          ],
        },
        include: {
          assignee: true,
          initiative: true,
          objective: true,
        },
      })
    })

    it('returns null when task not found', async () => {
      // Arrange
      vi.mocked(authUtils.getCurrentUser).mockResolvedValue({
        id: 'user-1',
        email: 'u1@example.com',
        role: 'ADMIN',
        organizationId: 'org-1',
        organizationName: 'Org One',
      })

      const taskId = 'task-1'
      findFirstReturnValues = [null] // Task not found

      // Act
      const { getTask } = await import('@/lib/actions/task')
      const result = await getTask(taskId)

      // Assert
      expect(result).toBeNull()
    })
  })
})
