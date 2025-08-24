export const MAX_TILE_CONTENT_LENGTH = 1000
export const MAX_COLUMN_TITLE_LENGTH = 100
export const MAX_AUTHOR_NAME_LENGTH = 50
export const MAX_THREAD_CONTENT_LENGTH = 500

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Helper function to count UTF-8 characters (including emojis) properly
function getCharacterCount(str: string): number {
  return [...str].length
}

export function validateTileContent(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Tile content is required' }
  }

  const charCount = getCharacterCount(content)
  if (charCount > MAX_TILE_CONTENT_LENGTH) {
    return { 
      isValid: false, 
      error: `Tile content must be less than ${MAX_TILE_CONTENT_LENGTH} characters (currently ${charCount})` 
    }
  }

  return { isValid: true }
}

export function validateColumnTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Column title is required' }
  }

  const charCount = getCharacterCount(title)
  if (charCount > MAX_COLUMN_TITLE_LENGTH) {
    return { 
      isValid: false, 
      error: `Column title must be less than ${MAX_COLUMN_TITLE_LENGTH} characters (currently ${charCount})` 
    }
  }

  return { isValid: true }
}

export function validateAuthorName(author: string): ValidationResult {
  const charCount = getCharacterCount(author)
  if (charCount > MAX_AUTHOR_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Author name must be less than ${MAX_AUTHOR_NAME_LENGTH} characters (currently ${charCount})` 
    }
  }

  return { isValid: true }
}

export function validateThreadContent(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Comment is required' }
  }

  const charCount = getCharacterCount(content)
  if (charCount > MAX_THREAD_CONTENT_LENGTH) {
    return { 
      isValid: false, 
      error: `Comment must be less than ${MAX_THREAD_CONTENT_LENGTH} characters (currently ${charCount})` 
    }
  }

  return { isValid: true }
}

export function sanitizeInput(input: string): string {
  // Trim leading and trailing whitespace
  input = input.trim()
  
  // Preserve line breaks but normalize excessive whitespace
  const lines = input.split('\n')
  const sanitizedLines = lines.map(line => {
    // Trim each line and replace multiple spaces with single spaces
    return line.trim().replace(/[ \t]+/g, ' ')
  })
  
  // Join lines back and remove excessive newlines (more than 2 consecutive)
  return sanitizedLines.join('\n').replace(/\n{3,}/g, '\n\n')
}