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
