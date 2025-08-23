'use client'

interface TypingIndicatorProps {
  typingUsers: Record<string, boolean>
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const activeUsers = Object.entries(typingUsers).filter(([_, isTyping]) => isTyping)
  
  if (activeUsers.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {activeUsers.length === 1
            ? 'Someone is typing...'
            : `${activeUsers.length} people are typing...`}
        </span>
      </div>
    </div>
  )
}