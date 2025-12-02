/**
 * Help page IDs that correspond to paths in the help documentation.
 * These IDs are used to construct URLs to help.mpath.dev
 */

export const HELP_IDS = {
  // Getting Started
  quickstart: 'getting-started/quickstart',
  concepts: 'getting-started/concepts',
  keyboardShortcuts: 'getting-started/keyboard-shortcuts',
  index: 'index',

  // Getting Started (subdirectory)
  gettingStartedAccountsOrganizationsSubscriptions:
    'getting-started/accounts-organizations-subscriptions',

  // People & Teams
  peopleTeamsPeople: 'people-teams/people',
  peopleTeamsTeams: 'people-teams/teams',
  peopleTeamsJobRoles: 'people-teams/job-roles',

  // Meetings & Communication
  meetingsCommunicationMeetings: 'meetings-communication/meetings',
  meetingsCommunicationOneOnOnes: 'meetings-communication/one-on-ones',

  // Tasks & Projects
  tasksProjectsTasks: 'tasks-projects/tasks',
  tasksProjectsInitiatives: 'tasks-projects/initiatives',

  // Feedback & Development
  feedbackDevelopmentFeedback: 'feedback-development/feedback',
  feedbackDevelopmentFeedback360Campaigns:
    'feedback-development/feedback-360-campaigns',

  // Integrations
  integrationsIntegrations: 'integrations/integrations',
  integrationsJiraIntegration: 'integrations/jira-integration',
  integrationsGithubIntegration: 'integrations/github-integration',
} as const

/**
 * Type for valid help IDs
 */
export type HelpId = (typeof HELP_IDS)[keyof typeof HELP_IDS]

/**
 * Helper function to get a help URL from a help ID
 */
export function getHelpUrl(helpId: HelpId): string {
  return `https://help.mpath.dev/${helpId}`
}

/**
 * Type guard to check if a string is a valid help ID
 */
export function isValidHelpId(id: string): id is HelpId {
  return Object.values(HELP_IDS).includes(id as HelpId)
}
