'use client'

import { useState } from 'react'
import { Tile as TileType, Thread } from '@/hooks/useBoardSocket'
import { MAX_THREAD_CONTENT_LENGTH, MAX_AUTHOR_NAME_LENGTH } from '@/utils/validation'

interface TileProps {
  tile: TileType
  isAdmin: boolean
  onReveal: (tileId: string) => void
  onVote: (tileId: string) => void
  onAddThread: (tileId: string, content: string, author: string) => void
  currentUserId?: string
}

export default function Tile({ tile, isAdmin, onReveal, onVote, onAddThread, currentUserId }: TileProps) {
  const [showThreads, setShowThreads] = useState(false)
  const [newThreadContent, setNewThreadContent] = useState('')
  const [threadAuthor, setThreadAuthor] = useState('')
  const [isAddingThread, setIsAddingThread] = useState(false)

  const hasVoted = currentUserId && tile.voterIds.includes(currentUserId)
  const isHidden = tile.isHidden

  const handleAddThread = () => {
    if (newThreadContent.trim()) {
      onAddThread(tile.id, newThreadContent, threadAuthor)
      setNewThreadContent('')
      setThreadAuthor('')
      setIsAddingThread(false)
    }
  }

  if (isHidden) {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
          <div className="w-8 h-8 mx-auto mb-2 opacity-50">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          </div>
          Hidden Tile
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
      isHidden 
        ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-dashed' 
        : 'bg-white dark:bg-dark-card'
    }`}>
      {/* Tile Content */}
      <div className="p-4">
        {/* Hidden state indicator */}
        {isHidden && (
          <div className="flex items-center justify-center mb-3 text-gray-500 dark:text-gray-400 text-xs">
            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              <span>Hidden until revealed</span>
            </div>
          </div>
        )}

        <div 
          className={`text-sm mb-3 whitespace-pre-wrap leading-relaxed ${
            isHidden 
              ? 'text-gray-400 dark:text-gray-500 filter blur-sm select-none' 
              : 'text-gray-900 dark:text-gray-100'
          }`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {isHidden ? 'Content hidden until admin reveals all tiles' : tile.content}
        </div>

        {tile.author && !isHidden && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{tile.author}</span>
          </div>
        )}

        {/* Action Section */}
        <div className={`flex items-center justify-between ${isHidden ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            onClick={() => onVote(tile.id)}
            disabled={isHidden}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              hasVoted
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 transform scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
            }`}
          >
            <span className="text-sm">👍</span>
            <span className="font-semibold">{tile.voterIds.length}</span>
          </button>

          <div className="flex items-center space-x-2">
            {tile.threads.length > 0 && (
              <button
                onClick={() => setShowThreads(!showThreads)}
                disabled={isHidden}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center space-x-1 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span>💬</span>
                <span className="font-medium">{tile.threads.length}</span>
              </button>
            )}

            <button
              onClick={() => setIsAddingThread(!isAddingThread)}
              disabled={isHidden}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Add comment"
            >
              💬+
            </button>
          </div>
        </div>

        {/* Add Thread Form */}
        {isAddingThread && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
            <div className="space-y-2">
              <div>
                <input
                  type="text"
                  placeholder="Your name (optional) 😊"
                  value={threadAuthor}
                  onChange={(e) => setThreadAuthor(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {[...threadAuthor].length}/{MAX_AUTHOR_NAME_LENGTH}
                </div>
              </div>
              
              <div>
                <textarea
                  placeholder="Add a comment... Emojis welcome! 🎉"
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  rows={2}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {[...newThreadContent].length}/{MAX_THREAD_CONTENT_LENGTH}
                </div>
              </div>
              
              <div className="flex justify-end space-x-1">
                <button
                  onClick={() => setIsAddingThread(false)}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddThread}
                  disabled={!newThreadContent.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Threads */}
        {showThreads && tile.threads.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
            <div className="space-y-2">
              {tile.threads.map((thread: Thread) => (
                <div key={thread.id} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <div 
                    className="text-xs text-gray-900 dark:text-gray-100 mb-1 whitespace-pre-wrap"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    {thread.content}
                  </div>
                  {thread.author && (
                    <div 
                      className="text-xs text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      by {thread.author}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}