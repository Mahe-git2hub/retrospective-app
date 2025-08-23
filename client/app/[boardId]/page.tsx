'use client'

import { useParams } from 'next/navigation'
import Board from '@/components/board/Board'

export default function ParticipantBoardPage() {
  const params = useParams()
  const boardId = params.boardId as string

  if (!boardId) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Board Not Found</h1>
          <p className="text-gray-400 mb-6">The board ID is missing or invalid.</p>
          <a
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create New Board
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Board boardId={boardId} isAdmin={false} />
    </div>
  )
}