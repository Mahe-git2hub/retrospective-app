// Live Retro - Real-time ephemeral retrospective boards
// Copyright (c) 2024 Mahe-git2hub
// Licensed under MIT License - Attribution Required
// See LICENSE file for full terms

import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji'
  ]
})

export const metadata = {
  title: 'Live Retro',
  description: 'Real-time collaborative retrospective boards',
  charset: 'UTF-8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-dark-bg text-white`}>
        {children}
      </body>
    </html>
  )
}