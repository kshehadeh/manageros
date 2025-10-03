export interface JobLevel {
  id: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface JobDomain {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface JobRole {
  id: string
  title: string
  description: string | null
  level: { id: string; name: string }
  domain: { id: string; name: string }
  people: Array<{ id: string; name: string }>
}
