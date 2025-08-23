'use client'

import { useState } from 'react'
import { Tile as TileType, Thread } from '@/hooks/useBoardSocket'

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
  const isHidden = tile.isHidden && !isAdmin

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
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Admin Reveal Button */}
      {isAdmin && tile.isHidden && (
        <div className="p-2 border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={() => onReveal(tile.id)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded font-medium transition-colors"
          >
            👁 Reveal Tile
          </button>
        </div>
      )}

      {/* Tile Content */}
      <div className="p-4">
        <div className="text-sm text-gray-900 dark:text-gray-100 mb-3 whitespace-pre-wrap">
          {tile.content}
        </div>

        {tile.author && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            by {tile.author}
          </div>
        )}

        {/* Vote Section */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onVote(tile.id)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              hasVoted
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span>👍</span>
            <span>{tile.voterIds.length}</span>
          </button>

          <div className="flex items-center space-x-2">
            {tile.threads.length > 0 && (
              <button
                onClick={() => setShowThreads(!showThreads)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center space-x-1"
              >
                <span>💬</span>
                <span>{tile.threads.length}</span>
              </button>
            )}

            <button
              onClick={() => setIsAddingThread(!isAddingThread)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
              <input
                type="text"
                placeholder="Your name (optional)"
                value={threadAuthor}
                onChange={(e) => setThreadAuthor(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <textarea
                placeholder="Add a comment..."
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                rows={2}
              />
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
                  <div className="text-xs text-gray-900 dark:text-gray-100 mb-1">
                    {thread.content}
                  </div>
                  {thread.author && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
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