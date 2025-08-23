'use client'

import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'

export interface Thread {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface Tile {
  id: string
  content: string
  author: string
  isHidden: boolean
  voterIds: string[]
  threads: Thread[]
  createdAt: string
}

export interface Column {
  id: string
  title: string
  order: number
  tiles: Tile[]
}

export interface Board {
  id: string
  adminKey: string
  columns: Record<string, Column>
  createdAt: string
  updatedAt: string
}

interface BoardState {
  board: Board | null
  isConnected: boolean
  typingUsers: Record<string, boolean>
  setBoard: (board: Board | null) => void
  setConnected: (connected: boolean) => void
  setTypingUsers: (users: Record<string, boolean>) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  isConnected: false,
  typingUsers: {},
  setBoard: (board) => set({ board }),
  setConnected: (isConnected) => set({ isConnected }),
  setTypingUsers: (typingUsers) => set({ typingUsers }),
}))

export interface UseBoardSocketReturn {
  isConnected: boolean
  board: Board | null
  typingUsers: Record<string, boolean>
  addTile: (columnId: string, content: string, author?: string) => void
  revealTile: (tileId: string) => void
  voteTile: (tileId: string) => void
  createColumn: (title: string) => void
  updateColumn: (columnId: string, title: string) => void
  deleteColumn: (columnId: string) => void
  addThread: (tileId: string, content: string, author?: string) => void
  startTyping: () => void
  stopTyping: () => void
}

export function useBoardSocket(boardId: string, adminKey?: string): UseBoardSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const { board, isConnected, typingUsers, setBoard, setConnected, setTypingUsers } = useBoardStore()

  const sendMessage = (type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }

  useEffect(() => {
    if (!boardId) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL?.replace('http', 'ws')}/ws?boardId=${boardId}${adminKey ? `&adminKey=${adminKey}` : ''}`
    
    const connect = () => {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        // Reconnect after 3 seconds
        setTimeout(connect, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch (message.type) {
            case 'server:board:state_update':
              setBoard(message.payload)
              break
            
            case 'server:user:is_typing':
              const { userId, typing } = message.payload
              setTypingUsers(prev => ({
                ...prev,
                [userId]: typing
              }))
              break

            case 'error':
              console.error('WebSocket error:', message.payload)
              // Show user-friendly error notification
              if (typeof window !== 'undefined' && message.payload?.message) {
                // You could use a toast library here instead
                alert(`Error: ${message.payload.message}`)
              }
              break
              
            default:
              console.warn('Unknown WebSocket message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [boardId, adminKey, setBoard, setConnected, setTypingUsers])

  const addTile = (columnId: string, content: string, author = '') => {
    sendMessage('client:tile:create', { columnId, content, author })
  }

  const revealTile = (tileId: string) => {
    sendMessage('client:tile:reveal', { tileId })
  }

  const voteTile = (tileId: string) => {
    sendMessage('client:tile:vote', { tileId })
  }

  const createColumn = (title: string) => {
    sendMessage('client:column:create', { title })
  }

  const updateColumn = (columnId: string, title: string) => {
    sendMessage('client:column:update', { columnId, title })
  }

  const deleteColumn = (columnId: string) => {
    sendMessage('client:column:delete', { columnId })
  }

  const addThread = (tileId: string, content: string, author = '') => {
    sendMessage('client:thread:create', { tileId, content, author })
  }

  const startTyping = () => {
    sendMessage('client:user:typing_start', {})
  }

  const stopTyping = () => {
    sendMessage('client:user:typing_stop', {})
  }

  return {
    isConnected,
    board,
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
  }
}