import { vi } from 'vitest'

// Stub Next.js server-only modules that are imported by action files
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/validations', () => ({
  checkInSchema: { parse: vi.fn((v: unknown) => v) },
  initiativeSchema: { parse: vi.fn((v: unknown) => v) },
  personSchema: { parse: vi.fn((v: unknown) => v) },
  personUpdateSchema: { parse: vi.fn((v: unknown) => v) },
  teamSchema: { parse: vi.fn((v: unknown) => v) },
  feedbackSchema: { parse: vi.fn((v: unknown) => v) },
  feedbackCampaignSchema: { parse: vi.fn((v: unknown) => v) },
  feedbackResponseSchema: { parse: vi.fn((v: unknown) => v) },
  feedbackTemplateSchema: { parse: vi.fn((v: unknown) => v) },
  oneOnOneSchema: { parse: vi.fn((v: unknown) => v) },
  taskSchema: { parse: vi.fn((v: unknown) => v) },
}))
