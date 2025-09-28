export interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  birthday: Date | null
  team: { id: string; name: string } | null
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
}
