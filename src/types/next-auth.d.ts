import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      organizationId: string | null
      organizationName: string | null
      organizationSlug: string | null
      personId: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    organizationId: string | null
    organizationName: string | null
    organizationSlug: string | null
    personId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    organizationId: string | null
    organizationName: string | null
    organizationSlug: string | null
    personId: string | null
  }
}
