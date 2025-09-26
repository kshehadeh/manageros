import 'server-only'

type ModelProvider = 'openai' | 'anthropic' | 'none'

interface GenerateOptions {
  system?: string
  prompt: string
  temperature?: number
  maxTokens?: number
}

async function callOpenAI(
  prompt: string,
  system?: string,
  temperature = 0.2,
  maxTokens = 500
) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt },
    ],
    temperature,
    // eslint-disable-next-line camelcase
    max_tokens: maxTokens,
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `OpenAI error: ${res.status} ${res.statusText} ${err.error?.message ?? ''}`
    )
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  return json.choices[0]?.message?.content?.trim() ?? ''
}

export async function generateText(options: GenerateOptions): Promise<string> {
  const provider: ModelProvider =
    (process.env.AI_PROVIDER as ModelProvider) || 'openai'

  if (provider === 'openai') {
    return callOpenAI(
      options.prompt,
      options.system,
      options.temperature,
      options.maxTokens
    )
  }

  // Placeholder for other providers
  throw new Error('No AI provider configured')
}
