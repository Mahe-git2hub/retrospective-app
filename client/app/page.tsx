'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createBoard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create board')
      }

      const data = await response.json()
      
      // Store admin key in localStorage for this session
      localStorage.setItem(`adminKey_${data.boardId}`, data.adminKey)
      
      // Navigate to admin view
      router.push(`/admin/${data.adminKey}?boardId=${data.boardId}`)
    } catch (error) {
      console.error('Error creating board:', error)
      alert('Failed to create board. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Live Retro</h1>
          <p className="text-gray-300 text-lg max-w-md">
            Create ephemeral, collaborative retrospective boards that auto-delete after 30 minutes of inactivity.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={createBoard}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Board...' : 'Create New Board'}
          </button>
          
          <div className="text-sm text-gray-400">
            <p>As the creator, you'll get admin privileges to:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Reveal hidden tiles</li>
              <li>• Manage columns</li>
              <li>• Share participant links</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-xs text-gray-500">
          <p>Boards automatically delete after 30 minutes of inactivity</p>
        </div>
      </div>
    </main>
  )
}