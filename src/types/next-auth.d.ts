import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      organizationId: string
      organizationName: string
      organizationSlug: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    organizationId: string
    organizationName: string
    organizationSlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    organizationId: string
    organizationName: string
    organizationSlug: string
  }
}
