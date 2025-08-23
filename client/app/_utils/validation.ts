export const MAX_TILE_CONTENT_LENGTH = 1000
export const MAX_COLUMN_TITLE_LENGTH = 100
export const MAX_AUTHOR_NAME_LENGTH = 50
export const MAX_THREAD_CONTENT_LENGTH = 500

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateTileContent(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Tile content is required' }
  }

  if (content.length > MAX_TILE_CONTENT_LENGTH) {
    return { 
      isValid: false, 
      error: `Tile content must be less than ${MAX_TILE_CONTENT_LENGTH} characters` 
    }
  }

  return { isValid: true }
}

export function validateColumnTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Column title is required' }
  }

  if (title.length > MAX_COLUMN_TITLE_LENGTH) {
    return { 
      isValid: false, 
      error: `Column title must be less than ${MAX_COLUMN_TITLE_LENGTH} characters` 
    }
  }

  return { isValid: true }
}

export function validateAuthorName(author: string): ValidationResult {
  if (author.length > MAX_AUTHOR_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Author name must be less than ${MAX_AUTHOR_NAME_LENGTH} characters` 
    }
  }

  return { isValid: true }
}

export function validateThreadContent(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Comment is required' }
  }

  if (content.length > MAX_THREAD_CONTENT_LENGTH) {
    return { 
      isValid: false, 
      error: `Comment must be less than ${MAX_THREAD_CONTENT_LENGTH} characters` 
    }
  }

  return { isValid: true }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}