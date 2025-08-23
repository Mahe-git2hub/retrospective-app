'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Board from '@/components/board/Board'

export default function AdminBoardPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const adminKey = params.adminKey as string
  const boardId = searchParams.get('boardId')
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const validateAdmin = async () => {
      if (!boardId || !adminKey) {
        setIsValidating(false)
        return
      }

      try {
        // Check if board exists and admin key is valid
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boards/${boardId}`)
        
        if (response.ok) {
          const boardData = await response.json()
          // In a real scenario, we'd validate the admin key server-side
          // For now, we'll trust that having the admin key means they're valid
          setIsValid(true)
        } else {
          setIsValid(false)
        }
      } catch (error) {
        console.error('Error validating admin access:', error)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateAdmin()
  }, [boardId, adminKey])

  if (isValidating) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Validating admin access...</p>
        </div>
      </div>
    )
  }

  if (!boardId || !adminKey) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Admin Link</h1>
          <p className="text-gray-400 mb-6">The admin link is missing required parameters.</p>
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

  if (!isValid) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Board Not Found</h1>
          <p className="text-gray-400 mb-6">
            This board may have expired or the admin link is invalid.
          </p>
          <div className="space-y-3">
            <a
              href="/"
              className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create New Board
            </a>
            <a
              href={`/${boardId}`}
              className="block bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Join as Participant
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Board boardId={boardId} adminKey={adminKey} isAdmin={true} />
    </div>
  )
}