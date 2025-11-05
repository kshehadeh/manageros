// Type declarations for tiptap-markdown extension
// This augments Tiptap's Editor type to include the markdown storage

import '@tiptap/core'

declare module '@tiptap/core' {
  interface Storage {
    markdown?: {
      getMarkdown: () => string
    }
  }
}
