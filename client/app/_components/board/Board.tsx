'use client'

import { useRef } from 'react'
import { Board as BoardType, Column as ColumnType, useBoardSocket } from '@/hooks/useBoardSocket'
import Column from './Column'
import TypingIndicator from './TypingIndicator'
import html2canvas from 'html2canvas'

interface BoardProps {
  boardId: string
  adminKey?: string
  isAdmin?: boolean
}

export default function Board({ boardId, adminKey, isAdmin = false }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const {
    board,
    isConnected,
    typingUsers,
    addTile,
    revealTile,
    voteTile,
    createColumn,
    updateColumn,
    deleteColumn,
    addThread,
    startTyping,
    stopTyping,
  } = useBoardSocket(boardId, adminKey)

  const exportToImage = async () => {
    if (!boardRef.current) return

    try {
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `retro-board-${boardId}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Failed to export board:', error)
      alert('Failed to export board. Please try again.')
    }
  }

  const handleCreateColumn = () => {
    const title = prompt('Enter column title:')
    if (title?.trim()) {
      createColumn(title.trim())
    }
  }

  const copyParticipantLink = () => {
    const participantUrl = `${window.location.origin}/${boardId}`
    navigator.clipboard.writeText(participantUrl).then(() => {
      alert('Participant link copied to clipboard!')
    }).catch(() => {
      alert(`Participant link: ${participantUrl}`)
    })
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">
            {isConnected ? 'Loading board...' : 'Connecting to board...'}
          </p>
        </div>
      </div>
    )
  }

  // Sort columns by order
  const sortedColumns = Object.values(board.columns).sort((a: ColumnType, b: ColumnType) => a.order - b.order)

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Live Retro
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {isAdmin && (
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full font-medium">
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportToImage}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={copyParticipantLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Share Link</span>
                </button>

                <button
                  onClick={handleCreateColumn}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Column</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Board */}
      <div ref={boardRef} className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedColumns.map((column: ColumnType) => (
              <Column
                key={column.id}
                column={column}
                isAdmin={isAdmin}
                onAddTile={addTile}
                onRevealTile={revealTile}
                onVoteTile={voteTile}
                onAddThread={addThread}
                onUpdateColumn={updateColumn}
                onDeleteColumn={deleteColumn}
                onStartTyping={startTyping}
                onStopTyping={stopTyping}
                currentUserId={boardId} // Simple user ID based on board access
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedColumns.length === 0 && isAdmin && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No columns yet</h3>
              <p className="text-gray-500 mb-6">Create your first column to get started</p>
              <button
                onClick={handleCreateColumn}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create Column
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Auto-delete warning */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
        Board auto-deletes after 30min of inactivity
      </div>
    </div>
  )
}