'use server'

export function renderMarkdownFromJson(json: unknown): string {
  if (json == null) return '# Report\n\n_No content_'
  if (typeof json !== 'object') return `# Report\n\n${String(json)}`

  const sections: string[] = []

  function renderObject(obj: Record<string, any>, depth = 2) {
    for (const [key, value] of Object.entries(obj)) {
      const heading = `${'#'.repeat(Math.min(6, depth))} ${key}`
      if (Array.isArray(value)) {
        sections.push(heading)
        if (value.length === 0) {
          sections.push('\n_Empty_\n')
        } else {
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              sections.push('\n- ' + summarizeObject(item))
            } else {
              sections.push('\n- ' + String(item))
            }
          }
          sections.push('\n')
        }
      } else if (typeof value === 'object' && value !== null) {
        sections.push(heading)
        renderObject(value as Record<string, any>, depth + 1)
      } else {
        sections.push(`${heading}\n\n${String(value)}\n`)
      }
    }
  }

  function summarizeObject(o: Record<string, any>) {
    const entries = Object.entries(o)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(', ')
    return entries
  }

  sections.push('# Report')
  renderObject(json as Record<string, any>, 2)
  return sections.join('\n')
}

