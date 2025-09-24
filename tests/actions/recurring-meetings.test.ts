import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db'
import type {
  Organization,
  User,
  Team,
  Initiative,
  Person,
  Meeting,
  MeetingInstance,
} from '@prisma/client'
import { createMeeting, updateMeeting, getMeeting } from '@/lib/actions/meeting'
import {
  createMeetingInstance,
  updateMeetingInstance,
  deleteMeetingInstance,
  getMeetingInstance,
  getMeetingInstances,
  addMeetingInstanceParticipant,
  updateMeetingInstanceParticipantStatus,
  removeMeetingInstanceParticipant,
} from '@/lib/actions/meeting-instance'
import {
  type MeetingFormData,
  type MeetingInstanceFormData,
} from '@/lib/validations'

describe('Recurring Meetings and Instances', () => {
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
        description: 'Test organization for recurring meetings',
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
        description: 'Test team for recurring meetings',
        organizationId: testOrganization.id,
      },
    })

    // Create test initiative
    testInitiative = await prisma.initiative.create({
      data: {
        title: 'Test Initiative',
        summary: 'Test initiative for recurring meetings',
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
    await prisma.meetingInstanceParticipant.deleteMany()
    await prisma.meetingInstance.deleteMany()
    await prisma.meetingParticipant.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.person.deleteMany()
    await prisma.initiative.deleteMany()
    await prisma.team.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()
  })

  describe('Recurring Meetings', () => {
    it('should create a recurring meeting with all required fields', async () => {
      const meetingData: MeetingFormData = {
        title: 'Weekly Standup',
        description: 'Weekly team standup meeting',
        scheduledAt: '2024-12-01T10:00',
        duration: 30,
        location: 'Conference Room A',
        notes: 'Weekly sync meeting',
        isRecurring: true,
        recurrenceType: 'weekly',
        teamId: testTeam.id,
        initiativeId: testInitiative.id,
        ownerId: testPerson.id,
        participants: [{ personId: testPerson.id, status: 'invited' }],
      }

      const meeting = await createMeeting(meetingData)

      expect(meeting).toBeDefined()
      expect(meeting.title).toBe('Weekly Standup')
      expect(meeting.isRecurring).toBe(true)
      expect(meeting.recurrenceType).toBe('weekly')
      expect(meeting.teamId).toBe(testTeam.id)
      expect(meeting.initiativeId).toBe(testInitiative.id)
      expect(meeting.ownerId).toBe(testPerson.id)
      expect(meeting.participants).toHaveLength(1)
    })

    it('should create a non-recurring meeting', async () => {
      const meetingData: MeetingFormData = {
        title: 'One-time Meeting',
        description: 'Single occurrence meeting',
        scheduledAt: '2024-12-01T14:00',
        duration: 60,
        isRecurring: false,
        participants: [],
      }

      const meeting = await createMeeting(meetingData)

      expect(meeting).toBeDefined()
      expect(meeting.title).toBe('One-time Meeting')
      expect(meeting.isRecurring).toBe(false)
      expect(meeting.recurrenceType).toBeNull()
    })

    it('should validate recurring meeting requirements', async () => {
      // Test that recurring meeting without recurrence type fails
      const invalidMeetingData: MeetingFormData = {
        title: 'Invalid Recurring Meeting',
        scheduledAt: '2024-12-01T10:00',
        isRecurring: true,
        participants: [],
        // Missing recurrenceType
      }

      await expect(createMeeting(invalidMeetingData)).rejects.toThrow()
    })

    it('should update recurring meeting fields', async () => {
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Original Meeting',
          scheduledAt: new Date('2024-12-01T10:00'),
          isRecurring: false,
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      const updatedMeeting = await updateMeeting(meeting.id, {
        title: 'Updated Recurring Meeting',
        isRecurring: true,
        recurrenceType: 'monthly',
      })

      expect(updatedMeeting.title).toBe('Updated Recurring Meeting')
      expect(updatedMeeting.isRecurring).toBe(true)
      expect(updatedMeeting.recurrenceType).toBe('monthly')
    })
  })

  describe('Meeting Instances', () => {
    let recurringMeeting: Meeting

    beforeEach(async () => {
      // Create a recurring meeting for instance tests
      recurringMeeting = await prisma.meeting.create({
        data: {
          title: 'Weekly Standup',
          scheduledAt: new Date('2024-12-01T10:00'),
          isRecurring: true,
          recurrenceType: 'weekly',
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })
    })

    it('should create a meeting instance', async () => {
      const instanceData: MeetingInstanceFormData = {
        meetingId: recurringMeeting.id,
        scheduledAt: '2024-12-08T10:00',
        notes: 'First weekly standup',
        participants: [{ personId: testPerson.id, status: 'invited' }],
      }

      const instance = await createMeetingInstance(instanceData)

      expect(instance).toBeDefined()
      expect(instance.meetingId).toBe(recurringMeeting.id)
      expect(instance.notes).toBe('First weekly standup')
      expect(instance.participants).toHaveLength(1)
      expect(instance.participants[0].personId).toBe(testPerson.id)
    })

    it('should create a meeting instance with minimal data', async () => {
      const instanceData: MeetingInstanceFormData = {
        meetingId: recurringMeeting.id,
        scheduledAt: '2024-12-08T10:00',
        participants: [],
      }

      const instance = await createMeetingInstance(instanceData)

      expect(instance).toBeDefined()
      expect(instance.meetingId).toBe(recurringMeeting.id)
      expect(instance.notes).toBeNull()
      expect(instance.participants).toHaveLength(0)
    })

    it('should update a meeting instance', async () => {
      const instance = await prisma.meetingInstance.create({
        data: {
          meetingId: recurringMeeting.id,
          scheduledAt: new Date('2024-12-08T10:00'),
          organizationId: testOrganization.id,
        },
      })

      const updatedInstance = await updateMeetingInstance(instance.id, {
        notes: 'Updated notes',
        scheduledAt: '2024-12-08T11:00',
      })

      expect(updatedInstance.notes).toBe('Updated notes')
      expect(new Date(updatedInstance.scheduledAt).getHours()).toBe(11)
    })

    it('should delete a meeting instance', async () => {
      const instance = await prisma.meetingInstance.create({
        data: {
          meetingId: recurringMeeting.id,
          scheduledAt: new Date('2024-12-08T10:00'),
          organizationId: testOrganization.id,
        },
      })

      await deleteMeetingInstance(instance.id)

      const deletedInstance = await prisma.meetingInstance.findUnique({
        where: { id: instance.id },
      })

      expect(deletedInstance).toBeNull()
    })

    it('should get meeting instances for a meeting', async () => {
      // Create multiple instances
      await prisma.meetingInstance.create({
        data: {
          meetingId: recurringMeeting.id,
          scheduledAt: new Date('2024-12-08T10:00'),
          organizationId: testOrganization.id,
        },
      })

      await prisma.meetingInstance.create({
        data: {
          meetingId: recurringMeeting.id,
          scheduledAt: new Date('2024-12-15T10:00'),
          organizationId: testOrganization.id,
        },
      })

      const instances = await getMeetingInstances(recurringMeeting.id)

      expect(instances).toHaveLength(2)
      expect(instances[0].meetingId).toBe(recurringMeeting.id)
      expect(instances[1].meetingId).toBe(recurringMeeting.id)
    })

    it('should throw error if meeting instance not found', async () => {
      await expect(getMeetingInstance('non-existent-id')).rejects.toThrow(
        'Meeting instance not found or access denied'
      )
    })
  })

  describe('Meeting Instance Participants', () => {
    let recurringMeeting: Meeting
    let meetingInstance: MeetingInstance

    beforeEach(async () => {
      // Create a recurring meeting and instance
      recurringMeeting = await prisma.meeting.create({
        data: {
          title: 'Weekly Standup',
          scheduledAt: new Date('2024-12-01T10:00'),
          isRecurring: true,
          recurrenceType: 'weekly',
          organizationId: testOrganization.id,
          createdById: testUser.id,
        },
      })

      meetingInstance = await prisma.meetingInstance.create({
        data: {
          meetingId: recurringMeeting.id,
          scheduledAt: new Date('2024-12-08T10:00'),
          organizationId: testOrganization.id,
        },
      })
    })

    it('should add a participant to a meeting instance', async () => {
      const participant = await addMeetingInstanceParticipant(
        meetingInstance.id,
        testPerson.id,
        'accepted'
      )

      expect(participant).toBeDefined()
      expect(participant.meetingInstanceId).toBe(meetingInstance.id)
      expect(participant.personId).toBe(testPerson.id)
      expect(participant.status).toBe('accepted')
    })

    it('should update participant status', async () => {
      // Add participant first
      await addMeetingInstanceParticipant(
        meetingInstance.id,
        testPerson.id,
        'invited'
      )

      // Update status
      const updatedParticipant = await updateMeetingInstanceParticipantStatus(
        meetingInstance.id,
        testPerson.id,
        'attended'
      )

      expect(updatedParticipant.status).toBe('attended')
    })

    it('should remove a participant from a meeting instance', async () => {
      // Add participant first
      await addMeetingInstanceParticipant(
        meetingInstance.id,
        testPerson.id,
        'invited'
      )

      // Remove participant
      await removeMeetingInstanceParticipant(meetingInstance.id, testPerson.id)

      // Verify participant is removed
      const participant = await prisma.meetingInstanceParticipant.findUnique({
        where: {
          // eslint-disable-next-line camelcase
          meetingInstanceId_personId: {
            meetingInstanceId: meetingInstance.id,
            personId: testPerson.id,
          },
        },
      })

      expect(participant).toBeNull()
    })

    it('should throw error if participant already exists', async () => {
      // Add participant first time
      await addMeetingInstanceParticipant(
        meetingInstance.id,
        testPerson.id,
        'invited'
      )

      // Try to add same participant again
      await expect(
        addMeetingInstanceParticipant(
          meetingInstance.id,
          testPerson.id,
          'accepted'
        )
      ).rejects.toThrow(
        'Person is already a participant in this meeting instance'
      )
    })
  })

  describe('Integration Tests', () => {
    it('should create recurring meeting with instances', async () => {
      const meetingData: MeetingFormData = {
        title: 'Daily Standup',
        scheduledAt: '2024-12-01T09:00',
        isRecurring: true,
        recurrenceType: 'daily',
        participants: [{ personId: testPerson.id, status: 'invited' }],
      }

      const meeting = await createMeeting(meetingData)

      // Create some instances
      const instance1 = await createMeetingInstance({
        meetingId: meeting.id,
        scheduledAt: '2024-12-02T09:00',
        notes: 'Day 1 standup',
        participants: [],
      })

      const instance2 = await createMeetingInstance({
        meetingId: meeting.id,
        scheduledAt: '2024-12-03T09:00',
        notes: 'Day 2 standup',
        participants: [],
      })

      // Get the meeting with instances
      const meetingWithInstances = await getMeeting(meeting.id)

      expect(meetingWithInstances.instances).toHaveLength(2)
      expect(meetingWithInstances.instances[0].id).toBe(instance1.id)
      expect(meetingWithInstances.instances[1].id).toBe(instance2.id)
    })

    it('should handle participant status across instances', async () => {
      const meetingData: MeetingFormData = {
        title: 'Weekly Review',
        scheduledAt: '2024-12-01T14:00',
        isRecurring: true,
        recurrenceType: 'weekly',
        participants: [{ personId: testPerson.id, status: 'invited' }],
      }

      const meeting = await createMeeting(meetingData)

      // Create instance
      const instance = await createMeetingInstance({
        meetingId: meeting.id,
        scheduledAt: '2024-12-08T14:00',
        participants: [{ personId: testPerson.id, status: 'attended' }],
      })

      // Update participant status
      await updateMeetingInstanceParticipantStatus(
        instance.id,
        testPerson.id,
        'absent'
      )

      const updatedInstance = await getMeetingInstance(instance.id)
      const participant = updatedInstance.participants.find(
        p => p.personId === testPerson.id
      )

      expect(participant?.status).toBe('absent')
    })
  })
})
