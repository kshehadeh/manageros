import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/lib/db'
import type {
  Organization,
  User,
  Team,
  Initiative,
  Person,
} from '@prisma/client'
import {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetings,
  getMeeting,
  addMeetingParticipant,
  updateMeetingParticipantStatus,
  removeMeetingParticipant,
} from '@/lib/actions/meeting'
import { type MeetingFormData } from '@/lib/validations'

describe('Meeting Actions', () => {
  let testUser: User
  let testOrganization: Organization
  let testTeam: Team
  let testInitiative: Initiative
  let testPerson: Person

  beforeEach(async () => {
    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for meetings',
      },
    })

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        organizationId: testOrganization.id,
      },
    })

    // Create test team
    testTeam = await prisma.team.create({
      data: {
        name: 'Test Team',
        description: 'Test team for meetings',
        organizationId: testOrganization.id,
      },
    })

    // Create test initiative
    testInitiative = await prisma.initiative.create({
      data: {
        title: 'Test Initiative',
        summary: 'Test initiative for meetings',
        organizationId: testOrganization.id,
      },
    })

    // Create test person
    testPerson = await prisma.person.create({
      data: {
        name: 'Test Person',
        email: 'testperson@example.com',
        organizationId: testOrganization.id,
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.meetingParticipant.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.person.deleteMany()
    await prisma.initiative.deleteMany()
    await prisma.team.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()
  })

  describe('createMeeting', () => {
    it('should create a meeting with all required fields', async () => {
      const meetingData: MeetingFormData = {
        title: 'Test Meeting',
        description: 'Test meeting description',
        scheduledAt: '2024-12-01T10:00',
        duration: 60,
        location: 'Conference Room A',
        notes: 'Test notes',
        isRecurring: false,
        teamId: testTeam.id,
        initiativeId: testInitiative.id,
        ownerId: testPerson.id,
        participants: [{ personId: testPerson.id, status: 'invited' }],
      }

      const meeting = await createMeeting(meetingData)

      expect(meeting).toBeDefined()
      expect(meeting.title).toBe('Test Meeting')
      expect(meeting.description).toBe('Test meeting description')
      expect(meeting.duration).toBe(60)
      expect(meeting.location).toBe('Conference Room A')
      expect(meeting.notes).toBe('Test notes')
      expect(meeting.teamId).toBe(testTeam.id)
      expect(meeting.initiativeId).toBe(testInitiative.id)
      expect(meeting.ownerId).toBe(testPerson.id)
      expect(meeting.createdById).toBe(testUser.id)
      expect(meeting.participants).toHaveLength(1)
      expect(meeting.participants[0].personId).toBe(testPerson.id)
      expect(meeting.participants[0].status).toBe('invited')
    })

    it('should create a meeting with minimal required fields', async () => {
      const meetingData: MeetingFormData = {
        title: 'Minimal Meeting',
        scheduledAt: '2024-12-01T10:00',
        isRecurring: false,
        participants: [],
      }

      const meeting = await createMeeting(meetingData)

      expect(meeting).toBeDefined()
      expect(meeting.title).toBe('Minimal Meeting')
      expect(meeting.description).toBeNull()
      expect(meeting.duration).toBeNull()
      expect(meeting.location).toBeNull()
      expect(meeting.notes).toBeNull()
      expect(meeting.teamId).toBeNull()
      expect(meeting.initiativeId).toBeNull()
      expect(meeting.ownerId).toBeNull()
      expect(meeting.participants).toHaveLength(0)
    })

    it('should throw error if user has no organization', async () => {
      // Create user without organization
      const userWithoutOrg = await prisma.user.create({
        data: {
          email: 'noorg@example.com',
          name: 'No Org User',
          passwordHash: 'hashed-password',
        },
      })

      // Mock getCurrentUser to return user without organization
      const { getCurrentUser } = await import('@/lib/auth-utils')
      const originalGetCurrentUser = getCurrentUser
      const mockUser = {
        id: userWithoutOrg.id,
        email: userWithoutOrg.email,
        name: userWithoutOrg.name,
        role: userWithoutOrg.role,
        organizationId: userWithoutOrg.organizationId,
        organizationName: null,
        organizationSlug: null,
        personId: userWithoutOrg.personId,
      }
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

      const meetingData: MeetingFormData = {
        title: 'Test Meeting',
        scheduledAt: '2024-12-01T10:00',
        isRecurring: false,
        participants: [],
      }

      await expect(createMeeting(meetingData)).rejects.toThrow(
        'User must belong to an organization to create meetings'
      )

      // Restore original function
      vi.mocked(getCurrentUser).mockImplementation(originalGetCurrentUser)

      // Clean up
      await prisma.user.delete({ where: { id: userWithoutOrg.id } })
    })
  })

  describe('getMeetings', () => {
    it('should return all meetings for the organization', async () => {
      // Create test meetings
      await prisma.meeting.create({
        data: {
          title: 'Meeting 1',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      await prisma.meeting.create({
        data: {
          title: 'Meeting 2',
          scheduledAt: new Date('2024-12-02T14:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      const meetings = await getMeetings()

      expect(meetings).toHaveLength(2)
      expect(meetings.map(m => m.title)).toContain('Meeting 1')
      expect(meetings.map(m => m.title)).toContain('Meeting 2')
    })

    it('should return empty array if no meetings exist', async () => {
      const meetings = await getMeetings()
      expect(meetings).toHaveLength(0)
    })
  })

  describe('getMeeting', () => {
    it('should return a specific meeting by ID', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Test Meeting',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      const retrievedMeeting = await getMeeting(meeting.id)

      expect(retrievedMeeting).toBeDefined()
      expect(retrievedMeeting.id).toBe(meeting.id)
      expect(retrievedMeeting.title).toBe('Test Meeting')
    })

    it('should throw error if meeting not found', async () => {
      await expect(getMeeting('non-existent-id')).rejects.toThrow(
        'Meeting not found or access denied'
      )
    })
  })

  describe('updateMeeting', () => {
    it('should update meeting fields', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Original Title',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      const updatedMeeting = await updateMeeting(meeting.id, {
        title: 'Updated Title',
        description: 'Updated description',
        duration: 90,
      })

      expect(updatedMeeting.title).toBe('Updated Title')
      expect(updatedMeeting.description).toBe('Updated description')
      expect(updatedMeeting.duration).toBe(90)
    })

    it('should throw error if meeting not found', async () => {
      await expect(
        updateMeeting('non-existent-id', { title: 'New Title' })
      ).rejects.toThrow('Meeting not found or access denied')
    })
  })

  describe('deleteMeeting', () => {
    it('should delete a meeting', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Meeting to Delete',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      await deleteMeeting(meeting.id)

      const deletedMeeting = await prisma.meeting.findUnique({
        where: { id: meeting.id },
      })

      expect(deletedMeeting).toBeNull()
    })

    it('should throw error if meeting not found', async () => {
      await expect(deleteMeeting('non-existent-id')).rejects.toThrow(
        'Meeting not found or access denied'
      )
    })
  })

  describe('addMeetingParticipant', () => {
    it('should add a participant to a meeting', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Test Meeting',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      const participant = await addMeetingParticipant(
        meeting.id,
        testPerson.id,
        'accepted'
      )

      expect(participant).toBeDefined()
      expect(participant.meetingId).toBe(meeting.id)
      expect(participant.personId).toBe(testPerson.id)
      expect(participant.status).toBe('accepted')
    })

    it('should throw error if participant already exists', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Test Meeting',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      // Add participant first time
      await addMeetingParticipant(meeting.id, testPerson.id, 'invited')

      // Try to add same participant again
      await expect(
        addMeetingParticipant(meeting.id, testPerson.id, 'accepted')
      ).rejects.toThrow('Person is already a participant in this meeting')
    })
  })

  describe('updateMeetingParticipantStatus', () => {
    it('should update participant status', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Test Meeting',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      // Add participant
      await addMeetingParticipant(meeting.id, testPerson.id, 'invited')

      // Update status
      const updatedParticipant = await updateMeetingParticipantStatus(
        meeting.id,
        testPerson.id,
        'accepted'
      )

      expect(updatedParticipant.status).toBe('accepted')
    })
  })

  describe('removeMeetingParticipant', () => {
    it('should remove a participant from a meeting', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Test Meeting',
          scheduledAt: new Date('2024-12-01T10:00'),
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      // Add participant
      await addMeetingParticipant(meeting.id, testPerson.id, 'invited')

      // Remove participant
      await removeMeetingParticipant(meeting.id, testPerson.id)

      // Verify participant is removed
      const participant = await prisma.meetingParticipant.findUnique({
        where: {
          // eslint-disable-next-line camelcase
          meetingId_personId: {
            meetingId: meeting.id,
            personId: testPerson.id,
          },
        },
      })

      expect(participant).toBeNull()
    })
  })
})
