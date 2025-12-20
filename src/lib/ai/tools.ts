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
export { jobRoleLookupTool } from './tools/job-role-lookup-tool'
export { feedbackTool } from './tools/feedback-tool'
export { createOneOnOneActionTool } from './tools/create-oneonone-action-tool'

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
import { jobRoleLookupTool } from './tools/job-role-lookup-tool'
import { feedbackTool } from './tools/feedback-tool'
import { createOneOnOneActionTool } from './tools/create-oneonone-action-tool'
import { toolIds } from './tool-ids'

// Export all tools as a single object for easy access
export const aiTools = {
  [toolIds.people]: peopleTool,
  [toolIds.initiatives]: initiativesTool,
  [toolIds.tasks]: tasksTool,
  [toolIds.meetings]: meetingsTool,
  [toolIds.teams]: teamsTool,
  [toolIds.currentUser]: currentUserTool,
  [toolIds.github]: githubTool,
  [toolIds.jira]: jiraTool,
  [toolIds.dateTime]: dateTimeTool,
  [toolIds.personLookup]: personLookupTool,
  [toolIds.jobRoleLookup]: jobRoleLookupTool,
  [toolIds.feedback]: feedbackTool,
  [toolIds.createOneOnOneAction]: createOneOnOneActionTool,
}
