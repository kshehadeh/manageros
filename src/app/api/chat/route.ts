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

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const convertedMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: convertedMessages,
      tools: {
        people: {
          description: peopleTool.description,
          inputSchema: peopleTool.parameters,
          execute: peopleTool.execute,
        },
        initiatives: {
          description: initiativesTool.description,
          inputSchema: initiativesTool.parameters,
          execute: initiativesTool.execute,
        },
        tasks: {
          description: tasksTool.description,
          inputSchema: tasksTool.parameters,
          execute: tasksTool.execute,
        },
        meetings: {
          description: meetingsTool.description,
          inputSchema: meetingsTool.parameters,
          execute: meetingsTool.execute,
        },
        teams: {
          description: teamsTool.description,
          inputSchema: teamsTool.parameters,
          execute: teamsTool.execute,
        },
        currentUser: {
          description: currentUserTool.description,
          inputSchema: currentUserTool.parameters,
          execute: currentUserTool.execute,
        },
        github: {
          description: githubTool.description,
          inputSchema: githubTool.parameters,
          execute: githubTool.execute,
        },
        jira: {
          description: jiraTool.description,
          inputSchema: jiraTool.parameters,
          execute: jiraTool.execute,
        },
        dateTime: {
          description: dateTimeTool.description,
          inputSchema: dateTimeTool.parameters,
          execute: dateTimeTool.execute,
        },
        personLookup: {
          description: personLookupTool.description,
          inputSchema: personLookupTool.parameters,
          execute: personLookupTool.execute,
        },
      },
      stopWhen: stepCountIs(10),
      system: `You are an AI assistant for ManagerOS, a management platform for engineering managers. You help users understand and interact with their organizational data including people, initiatives, tasks, meetings, and teams.

Key guidelines:
- Always use the available tools to fetch current data from the database
- When asked about relative time periods (like "last week", "this month", "yesterday"), FIRST call the dateTime tool to get the current date and helpful date ranges
- When asked about a specific person by name (e.g., "John", "Sarah Smith"), use the personLookup tool to find their person ID. If multiple matches are found, ask the user to clarify which person they mean.
- When asked about the CURRENT USER'S OWN GitHub activity (e.g., "my PRs", "my pull requests"), call the github tool WITHOUT providing a personId - it will automatically use the current user's linked account.
- When asked about ANOTHER PERSON'S GitHub activity (e.g., "John's pull requests", "GitHub contributions for Sarah"), FIRST use personLookup to get their person ID, then use the github tool with that personId parameter.
- When asked about the CURRENT USER'S OWN Jira activity (e.g., "my tickets", "my Jira issues"), call the jira tool WITHOUT providing a personId - it will automatically use the current user's linked account.
- When asked about ANOTHER PERSON'S Jira activity, FIRST use personLookup to get their person ID, then use the jira tool with that personId parameter.
- Do NOT include author:, involves:, or other username qualifiers in GitHub/Jira queries - the tools will automatically add the correct username.
- After using tools, ALWAYS provide a clear, helpful response to the user based on the tool results
- Provide clear, concise responses with relevant details
- When listing entities, include key information like status, dates, and relationships
- Be helpful in interpreting data and suggesting next steps
- If a user asks about someone's manager or reports, use the people tool with includeManager/includeReports flags
- When discussing initiatives, mention their RAG status, confidence level, and key metrics
- For tasks, highlight priority, status, and assignments
- For meetings, include participant information and recent instances
`,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
