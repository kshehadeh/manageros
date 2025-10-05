/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
    return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
    return '📈'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
  if (mimeType.startsWith('text/')) return '📄'
  return '📎'
}

/**
 * Check if a MIME type represents an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeBytes?: number
    allowedMimeTypes?: string[]
  } = {}
): string | null {
  const {
    maxSizeBytes = 50 * 1024 * 1024, // 50MB default
    allowedMimeTypes = [
      'image/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  } = options

  // Check file size
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
  }

  // Check MIME type
  const isAllowed = allowedMimeTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })

  if (!isAllowed) {
    return `File type ${file.type} is not allowed`
  }

  return null
}
