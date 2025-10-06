export interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  birthday: Date | null
  avatar: string | null
  team: { id: string; name: string } | null
  jobRole: {
    id: string
    title: string
    level: { id: string; name: string }
    domain: { id: string; name: string }
  } | null
  manager: {
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
    birthday: Date | null
    reports: Array<{
      id: string
      name: string
      email: string | null
      role: string | null
      status: string
      birthday: Date | null
    }>
  } | null
  reports: Array<{
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
    birthday: Date | null
  }>
  level: number
  user?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}
