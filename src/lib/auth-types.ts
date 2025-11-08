// User type matching the previous NextAuth session user structure
export type User = {
  id: string
  email: string
  name: string
  role: string
  organizationId: string | null
  organizationName: string | null
  organizationSlug: string | null
  personId: string | null
}
