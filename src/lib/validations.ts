import { z } from 'zod'

export const initiativeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  summary: z.string().optional(),
  outcome: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'paused', 'done', 'canceled']).default('planned'),
  rag: z.enum(['green', 'amber', 'red']).default('green'),
  confidence: z.number().min(0).max(100).default(80),
  teamId: z.string().optional(),
  objectives: z.array(z.object({
    title: z.string().min(1, 'Objective title is required'),
    keyResult: z.string().optional(),
  })).optional().default([]),
  owners: z.array(z.object({
    personId: z.string().min(1, 'Person ID is required'),
    role: z.enum(['owner', 'sponsor', 'collaborator']).default('owner'),
  })).optional().default([]),
})

export type InitiativeFormData = z.infer<typeof initiativeSchema>

export const objectiveSchema = z.object({
  title: z.string().min(1, 'Objective title is required'),
  keyResult: z.string().optional(),
})

export type ObjectiveFormData = z.infer<typeof objectiveSchema>

export const personSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Valid email is required'),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
  teamId: z.string().optional(),
  managerId: z.string().optional(),
  startedAt: z.string().optional(),
})

export type PersonFormData = z.infer<typeof personSchema>

export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name must be less than 100 characters'),
  description: z.string().optional(),
  parentId: z.string().optional().transform(val => val === '' ? undefined : val),
})

export type TeamFormData = z.infer<typeof teamSchema>

export const oneOnOneSchema = z.object({
  managerId: z.string().min(1, 'Manager is required'),
  reportId: z.string().min(1, 'Report is required'),
  scheduledAt: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
})

export type OneOnOneFormData = z.infer<typeof oneOnOneSchema>
