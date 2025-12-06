export interface NoteWithAttachments {
  id: string
  title?: string | null // Title for standalone notes
  entityType: string | null // Optional for standalone notes
  entityId: string | null // Optional for standalone notes
  content: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  attachments: {
    id: string
    fileName: string
    originalName: string
    fileSize: number
    mimeType: string
    r2Url: string
    createdAt: string
    uploadedBy: {
      id: string
      name: string
    }
  }[]
}
