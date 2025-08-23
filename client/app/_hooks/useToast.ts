'use client'

import { useState, useCallback } from 'react'
import { ToastMessage } from '@/components/ui/Toast'

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    addToast({ type: 'success', message, duration })
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast({ type: 'error', message, duration })
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast({ type: 'warning', message, duration })
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast({ type: 'info', message, duration })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}