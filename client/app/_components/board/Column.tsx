'use client'

import { useState, useRef } from 'react'
import { Column as ColumnType, Tile as TileType } from '@/hooks/useBoardSocket'
import { validateTileContent, validateAuthorName, validateColumnTitle, sanitizeInput, MAX_TILE_CONTENT_LENGTH, MAX_AUTHOR_NAME_LENGTH } from '@/utils/validation'
import Tile from './Tile'

interface ColumnProps {
  column: ColumnType
  isAdmin: boolean
  onAddTile: (columnId: string, content: string, author: string) => void
  onRevealTile: (tileId: string) => void
  onVoteTile: (tileId: string) => void
  onAddThread: (tileId: string, content: string, author: string) => void
  onUpdateColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onStartTyping: () => void
  onStopTyping: () => void
  currentUserId?: string
}

export default function Column({
  column,
  isAdmin,
  onAddTile,
  onRevealTile,
  onVoteTile,
  onAddThread,
  onUpdateColumn,
  onDeleteColumn,
  onStartTyping,
  onStopTyping,
  currentUserId
}: ColumnProps) {
  const [isAddingTile, setIsAddingTile] = useState(false)
  const [newTileContent, setNewTileContent] = useState('')
  const [tileAuthor, setTileAuthor] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAddTile = () => {
    const contentValidation = validateTileContent(newTileContent)
    if (!contentValidation.isValid) {
      alert(contentValidation.error)
      return
    }

    const authorValidation = validateAuthorName(tileAuthor)
    if (!authorValidation.isValid) {
      alert(authorValidation.error)
      return
    }

    const sanitizedContent = sanitizeInput(newTileContent)
    const sanitizedAuthor = sanitizeInput(tileAuthor)

    onAddTile(column.id, sanitizedContent, sanitizedAuthor)
    setNewTileContent('')
    setTileAuthor('')
    setIsAddingTile(false)
    onStopTyping()
  }

  const handleUpdateTitle = () => {
    const titleValidation = validateColumnTitle(editTitle)
    if (!titleValidation.isValid) {
      alert(titleValidation.error)
      return
    }

    const sanitizedTitle = sanitizeInput(editTitle)
    if (sanitizedTitle && sanitizedTitle !== column.title) {
      onUpdateColumn(column.id, sanitizedTitle)
    }
    setIsEditingTitle(false)
  }

  const handleTileContentChange = (content: string) => {
    setNewTileContent(content)
    if (content.trim()) {
      onStartTyping()
    } else {
      onStopTyping()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddTile()
    }
  }

  // Sort tiles by creation date (newest first)
  const sortedTiles = [...column.tiles].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-5 min-h-[600px] flex flex-col shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle()}
            className="font-semibold text-lg bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100 flex-1 mr-2"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            placeholder="Column title... emojis welcome! 📝"
            autoFocus
          />
        ) : (
          <h3
            className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => isAdmin && setIsEditingTitle(true)}
            title={isAdmin ? 'Click to edit title' : ''}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {column.title}
          </h3>
        )}

        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
            {column.tiles.length} cards
          </span>
          
          {isAdmin && (
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete column"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Add Tile Button */}
      <div className="mb-4">
        {!isAddingTile ? (
          <button
            onClick={() => setIsAddingTile(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center justify-center space-x-2 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">Add a card</span>
          </button>
        ) : (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 shadow-lg">
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Your name (optional) - supports emojis! 😊"
                  value={tileAuthor}
                  onChange={(e) => setTileAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {[...tileAuthor].length}/{MAX_AUTHOR_NAME_LENGTH} characters
                </div>
              </div>
              
              <div>
                <textarea
                  ref={textareaRef}
                  placeholder="What would you like to add? Emojis and Unicode characters welcome! 🎉"
                  value={newTileContent}
                  onChange={(e) => handleTileContentChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={onStartTyping}
                  onBlur={onStopTyping}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  rows={3}
                  autoFocus
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {[...newTileContent].length}/{MAX_TILE_CONTENT_LENGTH} characters
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Ctrl + Enter to add • UTF-8 & Emojis supported
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsAddingTile(false)
                      setNewTileContent('')
                      setTileAuthor('')
                      onStopTyping()
                    }}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTile}
                    disabled={!newTileContent.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
                  >
                    Add Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tiles */}
      <div className="space-y-4 flex-1">
        {sortedTiles.map((tile: TileType) => (
          <Tile
            key={tile.id}
            tile={tile}
            isAdmin={isAdmin}
            onReveal={onRevealTile}
            onVote={onVoteTile}
            onAddThread={onAddThread}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  )
}