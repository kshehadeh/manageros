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
  teamLookup: 'teamLookup',
  jobRoleLookup: 'jobRoleLookup',
  feedback: 'feedback',
  createOneOnOneAction: 'createOneOnOneAction',
  createPersonAction: 'createPersonAction',
} as const

export type ToolId = keyof typeof toolIds
