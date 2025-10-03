export interface NoteWithAttachments {
  id: string
  entityType: string
  entityId: string
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
