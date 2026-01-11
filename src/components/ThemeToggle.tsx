'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sun, Moon } from 'lucide-react'

function getStoredTheme(): string | null {
  try {
    return localStorage.getItem('theme')
  } catch {
    return null
  }
}

function setStoredTheme(theme: string) {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // localStorage blocked - theme will work for session only
  }
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = useCallback(() => {
    const currentlyDark = document.documentElement.classList.contains('dark')
    const newIsDark = !currentlyDark

    document.documentElement.className = newIsDark ? 'dark' : ''
    setStoredTheme(newIsDark ? 'dark' : 'light')
    setIsDark(newIsDark)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 left-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-6 h-6 text-yellow-500" />
      ) : (
        <Moon className="w-6 h-6 text-gray-700" />
      )}
    </button>
  )
}
