'use client'

import { useState } from 'react'
import ThemeSwitcher from './ThemeSwitcher'

interface AdminControlsProps {
  onCreateColumn: () => void
  onExportBoard: () => void
  onShareLink: () => void
  boardId: string
}

export default function AdminControls({ onCreateColumn, onExportBoard, onShareLink, boardId }: AdminControlsProps) {
  const [showInfo, setShowInfo] = useState(false)

  const handleRevealAllTiles = () => {
    if (window.confirm('Are you sure you want to reveal all hidden tiles? This action cannot be undone.')) {
      // This would need to be implemented in the WebSocket hook
      console.log('Revealing all tiles')
    }
  }

  return (
    <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Board info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full font-medium">
                Admin View
              </span>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Board information"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {showInfo && (
              <div className="absolute top-16 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Board Information</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div><strong>Board ID:</strong> {boardId}</div>
                  <div><strong>Auto-delete:</strong> 30 minutes after last activity</div>
                  <div><strong>Admin privileges:</strong></div>
                  <ul className="ml-4 space-y-1 text-xs">
                    <li>• Reveal hidden tiles</li>
                    <li>• Create, edit, and delete columns</li>
                    <li>• Share participant links</li>
                    <li>• Export board as image</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Right side - Admin controls */}
          <div className="flex items-center space-x-3">
            <ThemeSwitcher />
            
            <button
              onClick={onExportBoard}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Export board as PNG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>

            <button
              onClick={onShareLink}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Copy participant link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Share</span>
            </button>

            <button
              onClick={onCreateColumn}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Add new column"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Column</span>
            </button>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

            <button
              onClick={handleRevealAllTiles}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Reveal all hidden tiles"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Reveal All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close info panel */}
      {showInfo && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}