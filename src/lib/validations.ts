import { z } from 'zod'
import { ALL_TASK_STATUSES } from '@/lib/task-status'
import {
  ALL_TASK_PRIORITIES,
  DEFAULT_TASK_PRIORITY,
  TaskPriority,
} from '@/lib/task-priority'

export const initiativeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  summary: z.string().optional(),
  outcome: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  status: z
    .enum(['planned', 'in_progress', 'paused', 'done', 'canceled'])
    .default('planned'),
  rag: z.enum(['green', 'amber', 'red']).default('green'),
  confidence: z.number().min(0).max(100).default(80),
  teamId: z.string().optional(),
  objectives: z
    .array(
      z.object({
        title: z.string().min(1, 'Objective title is required'),
        keyResult: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  owners: z
    .array(
      z.object({
        personId: z.string().min(1, 'Person ID is required'),
        role: z.enum(['owner', 'sponsor', 'collaborator']).default('owner'),
      })
    )
    .optional()
    .default([]),
})

export type InitiativeFormData = z.infer<typeof initiativeSchema>

export const objectiveSchema = z.object({
  title: z.string().min(1, 'Objective title is required'),
  keyResult: z.string().optional(),
})

export type ObjectiveFormData = z.infer<typeof objectiveSchema>

export const personSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Valid email is required')
    .optional()
    .or(z.literal('')),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
  birthday: z.string().optional(),
  avatar: z.string().url('Valid URL is required').optional().or(z.literal('')),
  employeeType: z
    .enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONSULTANT'])
    .optional(),
  teamId: z.string().optional(),
  managerId: z.string().optional(),
  jobRoleId: z.string().optional(),
  startedAt: z.string().optional(),
})

export type PersonFormData = z.infer<typeof personSchema>

export const personUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  email: z
    .string()
    .email('Valid email is required')
    .optional()
    .or(z.literal('')),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).optional(),
  birthday: z.string().optional(),
  avatar: z.string().url('Valid URL is required').optional().or(z.literal('')),
  employeeType: z
    .enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONSULTANT'])
    .optional(),
  teamId: z.string().optional(),
  managerId: z.string().optional(),
  jobRoleId: z.string().optional(),
  startedAt: z.string().optional(),
})

export type PersonUpdateData = z.infer<typeof personUpdateSchema>

export const teamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be less than 100 characters'),
  description: z.string().optional(),
  avatar: z.string().url('Valid URL is required').optional().or(z.literal('')),
  parentId: z
    .string()
    .optional()
    .transform(val => (val === '' ? undefined : val)),
})

export type TeamFormData = z.infer<typeof teamSchema>

export const oneOnOneSchema = z
  .object({
    participant1Id: z.string().min(1, 'Participant 1 is required'),
    participant2Id: z.string().min(1, 'Participant 2 is required'),
    scheduledAt: z.string().min(1, 'Date is required'),
    notes: z.string().optional(),
  })
  .refine(data => data.participant1Id !== data.participant2Id, {
    message: 'Both participants must be different people',
    path: ['participant2Id'],
  })

export type OneOnOneFormData = z.infer<typeof oneOnOneSchema>

export const csvPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email('Valid email is required')
    .optional()
    .or(z.literal('')),
  role: z.string().optional(),
  team: z.string().optional(),
  manager: z.string().optional(), // Manager name instead of email
  birthday: z.string().optional(),
})

export type CSVPersonData = z.infer<typeof csvPersonSchema>

export const feedbackSchema = z.object({
  aboutId: z.string().min(1, 'Person is required'),
  kind: z.enum(['praise', 'concern', 'note']).default('note'),
  isPrivate: z.boolean().default(true),
  body: z.string().min(1, 'Feedback content is required'),
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(1500, 'Title must be less than 1500 characters'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(ALL_TASK_STATUSES as [string, ...string[]]).default('todo'),
  priority: z.coerce
    .number()
    .refine(val => ALL_TASK_PRIORITIES.includes(val as TaskPriority), {
      message: 'Priority must be between 1 and 5',
    })
    .default(DEFAULT_TASK_PRIORITY),
  dueDate: z.string().optional(),
  initiativeId: z.string().optional(),
  objectiveId: z.string().optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

export const checkInSchema = z.object({
  initiativeId: z.string().min(1, 'Initiative is required'),
  weekOf: z.string().min(1, 'Week of date is required'),
  rag: z.enum(['green', 'amber', 'red']).default('green'),
  confidence: z.number().min(0).max(100).default(80),
  summary: z.string().min(1, 'Summary is required'),
  blockers: z.string().optional(),
  nextSteps: z.string().optional(),
})

export type CheckInFormData = z.infer<typeof checkInSchema>

export const csvTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  parent: z.string().optional(), // Parent team name instead of ID
})

export type CSVTeamData = z.infer<typeof csvTeamSchema>

export const feedbackCampaignSchema = z
  .object({
    name: z.string().optional(),
    targetPersonId: z.string().min(1, 'Target person is required'),
    templateId: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    inviteEmails: z
      .array(z.string().email('Invalid email address'))
      .min(1, 'At least one email is required'),
  })
  .refine(
    data => {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return endDate > startDate
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type FeedbackCampaignFormData = z.infer<typeof feedbackCampaignSchema>

export const feedbackResponseSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  responderEmail: z.string().email('Invalid email address'),
  responses: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ), // Prisma Json type compatible
})

export type FeedbackResponseFormData = z.infer<typeof feedbackResponseSchema>

export const feedbackResponseByInviteLinkSchema = z.object({
  inviteLink: z.string().min(1, 'Invite link is required'),
  responderEmail: z.string().email('Invalid email address'),
  responses: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ), // Prisma Json type compatible
})

export type FeedbackResponseByInviteLinkFormData = z.infer<
  typeof feedbackResponseByInviteLinkSchema
>

export const feedbackTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1, 'Question text is required'),
        type: z.enum(['text', 'rating', 'multiple_choice']).default('text'),
        required: z.boolean().default(true),
        options: z.array(z.string()).optional(),
        sortOrder: z.number().default(0),
      })
    )
    .min(1, 'At least one question is required'),
})

export type FeedbackTemplateFormData = z.infer<typeof feedbackTemplateSchema>

export const meetingSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Meeting title is required')
      .max(200, 'Title must be less than 200 characters'),
    description: z.string().optional(),
    scheduledAt: z.string().min(1, 'Scheduled date and time is required'),
    duration: z.number().min(1).max(480).optional(), // Duration in minutes, max 8 hours
    location: z.string().optional(),
    notes: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurrenceType: z
      .enum(['daily', 'weekly', 'monthly', 'bi_monthly', 'semi_annually'])
      .optional(),
    isPrivate: z.boolean().default(true), // Default to private for user privacy
    teamId: z.string().optional(),
    initiativeId: z.string().optional(),
    ownerId: z.string().optional(),
    participants: z
      .array(
        z.object({
          personId: z.string().min(1, 'Person ID is required'),
          status: z
            .enum([
              'invited',
              'accepted',
              'declined',
              'tentative',
              'attended',
              'absent',
            ])
            .default('invited'),
        })
      )
      .optional()
      .default([]),
  })
  .refine(
    data => {
      // If isRecurring is true, recurrenceType must be provided
      if (data.isRecurring && !data.recurrenceType) {
        return false
      }
      // If isRecurring is false, recurrenceType should not be provided
      if (!data.isRecurring && data.recurrenceType) {
        return false
      }
      return true
    },
    {
      message: 'Recurrence type is required when meeting is recurring',
      path: ['recurrenceType'],
    }
  )

export type MeetingFormData = z.infer<typeof meetingSchema>

export const meetingUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Meeting title is required')
      .max(200, 'Title must be less than 200 characters')
      .optional(),
    description: z.string().optional(),
    scheduledAt: z
      .string()
      .min(1, 'Scheduled date and time is required')
      .optional(),
    duration: z.number().min(1).max(480).optional(), // Duration in minutes, max 8 hours
    location: z.string().optional(),
    notes: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceType: z
      .enum(['daily', 'weekly', 'monthly', 'bi_monthly', 'semi_annually'])
      .optional(),
    isPrivate: z.boolean().optional(),
    teamId: z.string().optional(),
    initiativeId: z.string().optional(),
    ownerId: z.string().optional(),
    participants: z
      .array(
        z.object({
          personId: z.string().min(1, 'Person ID is required'),
          status: z
            .enum([
              'invited',
              'accepted',
              'declined',
              'tentative',
              'attended',
              'absent',
            ])
            .default('invited'),
        })
      )
      .optional(),
  })
  .refine(
    data => {
      // If isRecurring is true, recurrenceType must be provided
      if (data.isRecurring && !data.recurrenceType) {
        return false
      }
      // If isRecurring is false, recurrenceType should not be provided
      if (data.isRecurring === false && data.recurrenceType) {
        return false
      }
      return true
    },
    {
      message: 'Recurrence type is required when meeting is recurring',
      path: ['recurrenceType'],
    }
  )

export type MeetingUpdateData = z.infer<typeof meetingUpdateSchema>

export const meetingParticipantSchema = z.object({
  personId: z.string().min(1, 'Person ID is required'),
  status: z
    .enum([
      'invited',
      'accepted',
      'declined',
      'tentative',
      'attended',
      'absent',
    ])
    .default('invited'),
})

export type MeetingParticipantFormData = z.infer<
  typeof meetingParticipantSchema
>

export const meetingInstanceSchema = z.object({
  meetingId: z.string().min(1, 'Meeting ID is required'),
  scheduledAt: z.string().min(1, 'Scheduled date and time is required'),
  notes: z.string().optional(),
  participants: z
    .array(
      z.object({
        personId: z.string().min(1, 'Person ID is required'),
        status: z
          .enum([
            'invited',
            'accepted',
            'declined',
            'tentative',
            'attended',
            'absent',
          ])
          .default('invited'),
      })
    )
    .optional()
    .default([]),
})

export type MeetingInstanceFormData = z.infer<typeof meetingInstanceSchema>

export const meetingInstanceUpdateSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, 'Scheduled date and time is required')
    .optional(),
  notes: z.string().optional(),
  participants: z
    .array(
      z.object({
        personId: z.string().min(1, 'Person ID is required'),
        status: z
          .enum([
            'invited',
            'accepted',
            'declined',
            'tentative',
            'attended',
            'absent',
          ])
          .default('invited'),
      })
    )
    .optional(),
})

export type MeetingInstanceUpdateData = z.infer<
  typeof meetingInstanceUpdateSchema
>

export const meetingInstanceParticipantSchema = z.object({
  personId: z.string().min(1, 'Person ID is required'),
  status: z
    .enum([
      'invited',
      'accepted',
      'declined',
      'tentative',
      'attended',
      'absent',
    ])
    .default('invited'),
})

export type MeetingInstanceParticipantFormData = z.infer<
  typeof meetingInstanceParticipantSchema
>

// ============================================================================
// ONBOARDING SCHEMAS
// ============================================================================

export const ONBOARDING_ITEM_TYPES = [
  'TASK',
  'READING',
  'MEETING',
  'CHECKPOINT',
  'EXPECTATION',
] as const

export const ONBOARDING_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const

export const ONBOARDING_ITEM_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
  'BLOCKED',
] as const

export const ONBOARDING_OWNER_TYPES = [
  'onboardee',
  'manager',
  'mentor',
] as const

// Schema for individual onboarding items within a phase
export const onboardingItemSchema = z.object({
  id: z.string().optional(), // Optional for new items
  title: z
    .string()
    .min(1, 'Item title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  type: z.enum(ONBOARDING_ITEM_TYPES).default('TASK'),
  sortOrder: z.number().default(0),
  isRequired: z.boolean().default(true),
  linkedTaskId: z.string().optional(),
  linkedMeetingId: z.string().optional(),
  linkedInitiativeId: z.string().optional(),
  linkedUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ownerType: z.enum(ONBOARDING_OWNER_TYPES).optional(),
})

export type OnboardingItemFormData = z.infer<typeof onboardingItemSchema>

// Schema for onboarding phases within a template
export const onboardingPhaseSchema = z.object({
  id: z.string().optional(), // Optional for new phases
  name: z
    .string()
    .min(1, 'Phase name is required')
    .max(100, 'Phase name must be less than 100 characters'),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
  items: z.array(onboardingItemSchema).default([]),
})

export type OnboardingPhaseFormData = z.infer<typeof onboardingPhaseSchema>

// Schema for creating/updating onboarding templates
export const onboardingTemplateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Template name is required')
      .max(200, 'Template name must be less than 200 characters'),
    description: z.string().optional(),
    teamId: z.string().optional(),
    jobRoleId: z.string().optional(),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    phases: z
      .array(onboardingPhaseSchema)
      .min(1, 'At least one phase is required'),
  })
  .refine(
    data => {
      // Ensure at least one item exists across all phases
      const totalItems = data.phases.reduce(
        (sum, phase) => sum + phase.items.length,
        0
      )
      return totalItems > 0
    },
    {
      message: 'Template must have at least one item across all phases',
      path: ['phases'],
    }
  )

export type OnboardingTemplateFormData = z.infer<
  typeof onboardingTemplateSchema
>

// Schema for assigning onboarding to a person (creating an instance)
export const onboardingAssignmentSchema = z.object({
  templateId: z.string().min(1, 'Template is required'),
  personId: z.string().min(1, 'Person is required'),
  managerId: z.string().optional(),
  mentorId: z.string().optional(),
})

export type OnboardingAssignmentFormData = z.infer<
  typeof onboardingAssignmentSchema
>

// Schema for updating onboarding instance status
export const onboardingInstanceUpdateSchema = z.object({
  status: z.enum(ONBOARDING_STATUSES).optional(),
  managerId: z.string().optional().nullable(),
  mentorId: z.string().optional().nullable(),
})

export type OnboardingInstanceUpdateData = z.infer<
  typeof onboardingInstanceUpdateSchema
>

// Schema for updating item progress
export const onboardingItemProgressUpdateSchema = z.object({
  status: z.enum(ONBOARDING_ITEM_STATUSES),
  notes: z.string().optional(),
})

export type OnboardingItemProgressUpdateData = z.infer<
  typeof onboardingItemProgressUpdateSchema
>
