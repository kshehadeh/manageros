'use client'

import { ReadonlyNotesField } from '@/components/readonly-notes-field'

// Example usage component to demonstrate the ReadonlyNotesField
export function ReadonlyNotesFieldDemo() {
  const sampleMarkdown = `# Sample Notes

This is a **bold** statement and this is *italic* text.

## Features

- Automatic link detection: https://example.com
- Plain URLs: www.github.com and github.com
- Email addresses: test@example.com
- Markdown formatting support
- Multiple heading levels
- Code blocks and inline code

### Code Example

\`\`\`typescript
const example = "This is a code block"
\`\`\`

Inline \`code\` is also supported.

> This is a blockquote with important information.

Regular markdown links work too: [Visit Example](https://example.com)

## Lists

1. First item with link: https://google.com
2. Second item
3. Third item

- Bullet point with URL: https://stackoverflow.com
- Another bullet
- Final bullet`

  const emptyContent = ''
  const simpleContent =
    'This is just plain text with various links: https://github.com, www.example.com, and test@email.com'

  return (
    <div className='space-y-8 p-6'>
      <div>
        <h2 className='text-xl font-semibold mb-4'>
          Readonly Notes Field Examples
        </h2>

        <div className='space-y-6'>
          <div>
            <h3 className='text-lg font-medium mb-2'>Default Variant</h3>
            <div className='border rounded-lg p-4 bg-card'>
              <ReadonlyNotesField content={sampleMarkdown} />
            </div>
          </div>

          <div>
            <h3 className='text-lg font-medium mb-2'>Compact Variant</h3>
            <div className='border rounded-lg p-4 bg-card'>
              <ReadonlyNotesField content={sampleMarkdown} variant='compact' />
            </div>
          </div>

          <div>
            <h3 className='text-lg font-medium mb-2'>Simple Content</h3>
            <div className='border rounded-lg p-4 bg-card'>
              <ReadonlyNotesField content={simpleContent} />
            </div>
          </div>

          <div>
            <h3 className='text-lg font-medium mb-2'>Empty State</h3>
            <div className='border rounded-lg p-4 bg-card'>
              <ReadonlyNotesField
                content={emptyContent}
                emptyStateText='No notes have been added yet'
              />
            </div>
          </div>

          <div>
            <h3 className='text-lg font-medium mb-2'>Hidden Empty State</h3>
            <div className='border rounded-lg p-4 bg-card'>
              <ReadonlyNotesField
                content={emptyContent}
                showEmptyState={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
