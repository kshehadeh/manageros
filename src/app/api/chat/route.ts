import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { peopleTool } from '@/lib/ai/tools/people-tool'
import { initiativesTool } from '@/lib/ai/tools/initiatives-tool'
import { tasksTool } from '@/lib/ai/tools/tasks-tool'
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
      system: `You are an AI assistant for mpath, a management platform for engineering managers. You help users understand and interact with their organizational data including people, initiatives, tasks, and teams.

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
- When asked about the CURRENT USER'S OWN initiatives (e.g., "my initiatives", "initiatives I'm involved in", "what initiatives am I working on"), FIRST use the currentUser tool to get the current user's person ID, then use the initiatives tool with that personId parameter to filter initiatives where the person is an owner.
- When asked about ANOTHER PERSON'S initiatives (e.g., "John's initiatives", "initiatives Sarah is working on"), FIRST use personLookup to get their person ID, then use the initiatives tool with that personId parameter.
- When asked about "what should I do today", "what should I focus on this week", "what are my priorities", or similar work prioritization queries, provide intelligent, prioritized suggestions by:
  * FIRST use the dateTime tool to get the current date and week boundaries
  * Use the currentUser tool to get the current user's person ID and check if they have direct reports
  * Fetch tasks assigned to the user using the tasks tool with assigneeId matching the current user's person ID, filtering by status (exclude 'done', 'dropped')
  * Fetch initiatives the user is involved in using the initiatives tool with personId matching the current user's person ID
  * For each initiative, analyze:
    - Check-in frequency: If checkInsCount is 0 or very low, suggest adding a check-in as a priority
    - Current state: Use latestCheckIn (rag, confidence, summary, blockers, nextSteps, createdAt/weekOf) to describe the most up-to-date state; if latestCheckIn is null or old, suggest adding an updated check-in
    - Update recency: Consider initiatives that may be stale (no recent updates, old target dates) and suggest reviewing them
  * If the user has direct reports (from currentUser tool response):
    - Use the people tool with managerIs parameter set to the current user's person ID to get the list of direct reports
    - For each direct report, consider:
      * If they haven't had a 1:1 recently (more than 1-2 weeks ago), suggest scheduling a 1:1 as a priority
      * If they are in onboarding (status 'IN_PROGRESS' or 'NOT_STARTED'), suggest checking in on their onboarding progress
  * Analyze and prioritize all suggestions based on:
    - Tasks with due dates in the next 1-7 days (earlier due dates = higher priority)
    - Tasks related to initiatives with upcoming target dates
    - Task priority levels (1 = highest priority)
    - Initiative priority and status (active initiatives take precedence)
    - Initiatives with no check-ins or very few check-ins (suggest adding a check-in)
    - Initiatives that haven't been updated recently (may need attention to avoid going stale)
    - Direct reports who need 1:1s (overdue 1:1s = high priority)
    - Direct reports in active onboarding (supporting onboarding = high priority)
  * Provide suggestions in order of priority with clear reasoning, organized into:
    - Task-focused suggestions (due dates, initiative relationships)
    - Initiative maintenance suggestions (check-ins needed, stale initiatives)
    - People management suggestions (1:1s, onboarding support)
- When a user wants to CREATE or SCHEDULE a 1:1 meeting (e.g., "create a 1:1 with Alex", "schedule a meeting with John tomorrow at 2pm"), use the createOneOnOneAction tool. Extract the other participant's name and any date/time information from the user's prompt. The tool will handle identifying the current user and the other participant, parse date/time if provided, and return a navigation URL to the pre-filled form.
- Extract date/time information from the user's prompt when creating 1:1s (e.g., "tomorrow at 2pm", "next Monday", "December 25th at 3pm") and pass it as the scheduledAt parameter - it can be natural language as the tool will parse it.
- When a user wants to CREATE or ADD a new person (e.g., "create a person named John Smith", "add Sarah to the Engineering team", "create a person named Alex who reports to John", "create a person who reports to me"), use the createPersonAction tool. Extract the person's name, team name, and manager name (the person they report to) from the user's prompt. If the user says "reports to me", "reports to myself", "reports to I", uses their own name as the manager, or refers to themselves in any way, pass that reference (e.g., "me", "myself", or their name) as the managerName parameter - the tool will automatically detect self-references and use the current user as the manager. The tool will look up the team and manager if provided and return a navigation URL to the pre-filled person creation form.
- CRITICAL RULES FOR ACTION TOOLS (createOneOnOneAction, createPersonAction):
  * The tool output contains a URL in the "url" field - this is the ONLY authoritative source for navigation URLs
  * The URL returned by the tool is ALWAYS a relative path (e.g., "/oneonones/new?...", "/people/new?...") - it is already in the correct format
  * DO NOT generate any markdown links (e.g., [text](url)) in your text response when using action tools
  * DO NOT include URLs in your text response when using action tools - the tool output URL is sufficient
  * DO NOT convert the tool's URL to an absolute URL or add any hostname/domain
  * DO NOT modify, reconstruct, or recreate the URL - use it exactly as returned by the tool
  * Simply acknowledge the action in your text response (e.g., "I'll open the form for you") without including any links
  * The system will automatically navigate using the URL from the tool output - you don't need to provide links
- Provide clear, concise responses with relevant details
- When listing entities, include key information like status, dates, and relationships but prefer to use conversational language instead of bulleted list unless the user specifically asks for a list.
- Be helpful in interpreting data and suggesting next steps
- If a user asks about someone's manager or reports, use the people tool with includeManager/includeReports flags
- When discussing initiatives, mention their RAG status, confidence level, and key metrics, and use the latestCheckIn details to describe their current state when available
- For tasks, highlight priority, status, and assignments
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
