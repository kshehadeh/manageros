// Re-export all tools from individual files for backward compatibility
export { peopleTool } from './tools/people-tool'
export { initiativesTool } from './tools/initiatives-tool'
export { tasksTool } from './tools/tasks-tool'
export { meetingsTool } from './tools/meetings-tool'
export { teamsTool } from './tools/teams-tool'
export { currentUserTool } from './tools/current-user-tool'
export { githubTool } from './tools/github-tool'
export { jiraTool } from './tools/jira-tool'
export { dateTimeTool } from './tools/date-time-tool'
export { personLookupTool } from './tools/person-lookup-tool'
export { feedbackTool } from './tools/feedback-tool'

// Import tools for the aiTools object
import { peopleTool } from './tools/people-tool'
import { initiativesTool } from './tools/initiatives-tool'
import { tasksTool } from './tools/tasks-tool'
import { meetingsTool } from './tools/meetings-tool'
import { teamsTool } from './tools/teams-tool'
import { currentUserTool } from './tools/current-user-tool'
import { githubTool } from './tools/github-tool'
import { jiraTool } from './tools/jira-tool'
import { dateTimeTool } from './tools/date-time-tool'
import { personLookupTool } from './tools/person-lookup-tool'
import { feedbackTool } from './tools/feedback-tool'

// Export all tools as a single object for easy access
export const aiTools = {
  people: peopleTool,
  initiatives: initiativesTool,
  tasks: tasksTool,
  meetings: meetingsTool,
  teams: teamsTool,
  currentUser: currentUserTool,
  github: githubTool,
  jira: jiraTool,
  dateTime: dateTimeTool,
  personLookup: personLookupTool,
  feedback: feedbackTool,
}
