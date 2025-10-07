import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { aiTools } from '@/lib/ai/tools'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const convertedMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: convertedMessages,
      tools: {
        people: {
          description: aiTools.people.description,
          inputSchema: aiTools.people.parameters,
          execute: aiTools.people.execute,
        },
        initiatives: {
          description: aiTools.initiatives.description,
          inputSchema: aiTools.initiatives.parameters,
          execute: aiTools.initiatives.execute,
        },
        tasks: {
          description: aiTools.tasks.description,
          inputSchema: aiTools.tasks.parameters,
          execute: aiTools.tasks.execute,
        },
        meetings: {
          description: aiTools.meetings.description,
          inputSchema: aiTools.meetings.parameters,
          execute: aiTools.meetings.execute,
        },
        teams: {
          description: aiTools.teams.description,
          inputSchema: aiTools.teams.parameters,
          execute: aiTools.teams.execute,
        },
      },
      stopWhen: stepCountIs(5),
      system: `You are an AI assistant for ManagerOS, a management platform for engineering managers. You help users understand and interact with their organizational data including people, initiatives, tasks, meetings, and teams.

Key guidelines:
- Always use the available tools to fetch current data from the database
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
