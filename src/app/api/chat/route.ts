import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { peopleTool } from '@/lib/ai/tools/people-tool'
import { initiativesTool } from '@/lib/ai/tools/initiatives-tool'
import { tasksTool } from '@/lib/ai/tools/tasks-tool'
import { meetingsTool } from '@/lib/ai/tools/meetings-tool'
import { teamsTool } from '@/lib/ai/tools/teams-tool'
import { currentUserTool } from '@/lib/ai/tools/current-user-tool'
import { githubTool } from '@/lib/ai/tools/github-tool'
import { jiraTool } from '@/lib/ai/tools/jira-tool'
import { dateTimeTool } from '@/lib/ai/tools/date-time-tool'
import { personLookupTool } from '@/lib/ai/tools/person-lookup-tool'
import { jobRoleLookupTool } from '@/lib/ai/tools/job-role-lookup-tool'
import { feedbackTool } from '@/lib/ai/tools/feedback-tool'
import { createOneOnOneActionTool } from '@/lib/ai/tools/create-oneonone-action-tool'
import { teamLookupTool } from '@/lib/ai/tools/team-lookup-tool'
import { createPersonActionTool } from '@/lib/ai/tools/create-person-action-tool'
import { toolIds } from '../../../lib/ai/tool-ids'
import { getCurrentUser } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    // Verify authentication at the route level for defense in depth
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized - must belong to an organization',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages } = await req.json()

    const convertedMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openai('gpt-4o'),
      messages: convertedMessages,

      tools: {
        [toolIds.people]: {
          description: peopleTool.description,
          inputSchema: peopleTool.parameters,
          execute: peopleTool.execute,
        },
        [toolIds.initiatives]: {
          description: initiativesTool.description,
          inputSchema: initiativesTool.parameters,
          execute: initiativesTool.execute,
        },
        [toolIds.tasks]: {
          description: tasksTool.description,
          inputSchema: tasksTool.parameters,
          execute: tasksTool.execute,
        },
        [toolIds.meetings]: {
          description: meetingsTool.description,
          inputSchema: meetingsTool.parameters,
          execute: meetingsTool.execute,
        },
        [toolIds.teams]: {
          description: teamsTool.description,
          inputSchema: teamsTool.parameters,
          execute: teamsTool.execute,
        },
        [toolIds.currentUser]: {
          description: currentUserTool.description,
          inputSchema: currentUserTool.parameters,
          execute: currentUserTool.execute,
        },
        [toolIds.github]: {
          description: githubTool.description,
          inputSchema: githubTool.parameters,
          execute: githubTool.execute,
        },
        [toolIds.jira]: {
          description: jiraTool.description,
          inputSchema: jiraTool.parameters,
          execute: jiraTool.execute,
        },
        [toolIds.dateTime]: {
          description: dateTimeTool.description,
          inputSchema: dateTimeTool.parameters,
          execute: dateTimeTool.execute,
        },
        [toolIds.personLookup]: {
          description: personLookupTool.description,
          inputSchema: personLookupTool.parameters,
          execute: personLookupTool.execute,
        },
        [toolIds.teamLookup]: {
          description: teamLookupTool.description,
          inputSchema: teamLookupTool.parameters,
          execute: teamLookupTool.execute,
        },
        [toolIds.jobRoleLookup]: {
          description: jobRoleLookupTool.description,
          inputSchema: jobRoleLookupTool.parameters,
          execute: jobRoleLookupTool.execute,
        },
        [toolIds.feedback]: {
          description: feedbackTool.description,
          inputSchema: feedbackTool.parameters,
          execute: feedbackTool.execute,
        },
        [toolIds.createOneOnOneAction]: {
          description: createOneOnOneActionTool.description,
          inputSchema: createOneOnOneActionTool.parameters,
          execute: createOneOnOneActionTool.execute,
        },
        [toolIds.createPersonAction]: {
          description: createPersonActionTool.description,
          inputSchema: createPersonActionTool.parameters,
          execute: createPersonActionTool.execute,
        },
      },
      stopWhen: stepCountIs(10),
      system: `You are an AI assistant for mpath, a management platform for engineering managers. You help users understand and interact with their organizational data including people, initiatives, tasks, meetings, and teams.

Key guidelines:
- If a time-based prompt is provided, always use the dateTime tool to get the current date and helpful date ranges
- Always use the available tools to fetch current data from the database
- When asked about relative time periods (like "last week", "this month", "yesterday"), FIRST call the dateTime tool to get the current date and helpful date ranges
- When asked about a specific person by name (e.g., "John", "Sarah Smith"), use the personLookup tool to find their person ID. If multiple matches are found, ask the user to clarify which person they mean.
- When asked about a specific team by name (e.g., "Engineering", "Product Team"), use the teamLookup tool to find the team ID. If multiple matches are found, ask the user to clarify which team they mean.
- When asked about a specific job role by title (e.g., "Software Engineer", "Engineering Manager"), use the jobRoleLookup tool to find the job role ID. If multiple matches are found, ask the user to clarify which job role they mean.
- When asked about the CURRENT USER'S OWN GitHub activity (e.g., "my PRs", "my pull requests"), call the github tool WITHOUT providing a personId - it will automatically use the current user's linked account.
- When asked about ANOTHER PERSON'S GitHub activity (e.g., "John's pull requests", "GitHub contributions for Sarah"), FIRST use personLookup to get their person ID, then use the github tool with that personId parameter.
- When asked about the CURRENT USER'S OWN Jira activity (e.g., "my tickets", "my Jira issues"), call the jira tool WITHOUT providing a personId - it will automatically use the current user's linked account.
- When asked about ANOTHER PERSON'S Jira activity, FIRST use personLookup to get their person ID, then use the jira tool with that personId parameter.
- Do NOT include author:, involves:, or other username qualifiers in GitHub/Jira queries - the tools will automatically add the correct username.
- When a user wants to CREATE or SCHEDULE a 1:1 meeting (e.g., "create a 1:1 with Alex", "schedule a meeting with John tomorrow at 2pm"), use the createOneOnOneAction tool. Extract the other participant's name and any date/time information from the user's prompt. The tool will handle identifying the current user and the other participant, parse date/time if provided, and return a navigation URL to the pre-filled form.
- Extract date/time information from the user's prompt when creating 1:1s (e.g., "tomorrow at 2pm", "next Monday", "December 25th at 3pm") and pass it as the scheduledAt parameter - it can be natural language as the tool will parse it.
- When a user wants to CREATE or ADD a new person (e.g., "create a person named John Smith", "add Sarah to the Engineering team"), use the createPersonAction tool. Extract the person's name and team name from the user's prompt. The tool will look up the team if provided and return a navigation URL to the pre-filled person creation form.
- CRITICAL: When action tools (createOneOnOneAction, createPersonAction) return URLs, they will be relative paths (e.g., "/oneonones/new?...", "/people/new?..."). NEVER convert these to absolute URLs or add any hostname/domain. Always use the URLs exactly as returned by the tools - they are already in the correct format for navigation.
- After using tools, ALWAYS provide a clear, helpful response to the user based on the tool results
- Provide clear, concise responses with relevant details
- When listing entities, include key information like status, dates, and relationships but prefer to use conversational language instead of bulleted list unless the user specifically asks for a list.
- Be helpful in interpreting data and suggesting next steps
- If a user asks about someone's manager or reports, use the people tool with includeManager/includeReports flags
- When discussing initiatives, mention their RAG status, confidence level, and key metrics
- For tasks, highlight priority, status, and assignments
- For meetings, include participant information and recent instances
`,
    })

    console.log('🔧 StreamText result created, returning response')
    try {
      return result.toUIMessageStreamResponse()
    } catch (error) {
      console.error('Error in toUIMessageStreamResponse:', error)
      // Fallback to text stream if UI message stream fails
      return result.toTextStreamResponse()
    }
  } catch (error) {
    console.error('Error in chat API:', error)

    // Provide more specific error messages based on error type
    let errorMessage = 'An error occurred while processing your request'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact support.'
        statusCode = 503
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        statusCode = 429
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
        statusCode = 408
      } else if (error.message.includes('network')) {
        errorMessage =
          'Network error. Please check your connection and try again.'
        statusCode = 503
      } else {
        errorMessage = error.message
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
