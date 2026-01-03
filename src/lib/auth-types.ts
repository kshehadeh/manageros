import { z } from 'zod'

// User type matching the previous NextAuth session user structure
export const UserBriefSchema = z.object({
  email: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  managerOSUserId: z.string(),
  managerOSOrganizationId: z.string().optional().nullable(),
  managerOSPersonId: z.string().optional().nullable(),
  clerkUserId: z.string().optional().nullable(),
  clerkOrganizationId: z.string().optional().nullable(),
})
export type UserBrief = z.infer<typeof UserBriefSchema>

export type OrganizationBrief = {
  id?: string | null
  clerkOrganizationId?: string | null
  name?: string | null
  slug?: string | null
}
