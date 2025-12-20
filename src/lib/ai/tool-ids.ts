export const toolIds = {
  people: 'people',
  initiatives: 'initiatives',
  tasks: 'tasks',
  meetings: 'meetings',
  teams: 'teams',
  currentUser: 'currentUser',
  github: 'github',
  jira: 'jira',
  dateTime: 'dateTime',
  personLookup: 'personLookup',
  jobRoleLookup: 'jobRoleLookup',
  feedback: 'feedback',
  createOneOnOneAction: 'createOneOnOneAction',
} as const

export type ToolId = keyof typeof toolIds
