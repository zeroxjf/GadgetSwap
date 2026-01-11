'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'
type ThemePreference = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Calculate sunrise/sunset for Eastern Time (approximate for New York area)
// Using a simplified calculation - accurate enough for theme switching
function getSunTimes(): { sunrise: Date; sunset: Date } {
  const now = new Date()

  // Convert to Eastern Time
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const year = eastern.getFullYear()
  const month = eastern.getMonth()
  const day = eastern.getDate()

  // Day of year (1-365)
  const start = new Date(year, 0, 0)
  const diff = eastern.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  // New York coordinates (approximate center of Eastern timezone usage)
  const latitude = 40.7128

  // Simplified sunrise/sunset calculation
  // Based on the equation of time and solar declination
  const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180))
  const hourAngle = Math.acos(
    -Math.tan(latitude * (Math.PI / 180)) * Math.tan(declination * (Math.PI / 180))
  ) * (180 / Math.PI)

  // Convert to hours
  const sunriseHour = 12 - (hourAngle / 15)
  const sunsetHour = 12 + (hourAngle / 15)

  // Create Date objects for sunrise and sunset in Eastern time
  const sunrise = new Date(year, month, day, Math.floor(sunriseHour), (sunriseHour % 1) * 60)
  const sunset = new Date(year, month, day, Math.floor(sunsetHour), (sunsetHour % 1) * 60)

  return { sunrise, sunset }
}

function shouldBeDark(): boolean {
  const now = new Date()
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const { sunrise, sunset } = getSunTimes()

  // Get hours and minutes as decimal for comparison
  const currentTime = eastern.getHours() + eastern.getMinutes() / 60
  const sunriseTime = sunrise.getHours() + sunrise.getMinutes() / 60
  const sunsetTime = sunset.getHours() + sunset.getMinutes() / 60

  // Dark if before sunrise or after sunset
  return currentTime < sunriseTime || currentTime >= sunsetTime
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('light')
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Calculate theme based on preference
  const calculateTheme = useCallback((): Theme => {
    if (preference === 'light') return 'light'
    if (preference === 'dark') return 'dark'
    // Auto mode - use sunrise/sunset
    return shouldBeDark() ? 'dark' : 'light'
  }, [preference])

  // Set preference and persist to localStorage
  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    localStorage.setItem('theme-preference', pref)
  }, [])

  // Initialize from localStorage/DB on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme-preference') as ThemePreference | null
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      setPreferenceState(stored)
    }
    setMounted(true)
  }, [])

  // Update theme when preference changes or on interval for auto mode
  useEffect(() => {
    if (!mounted) return

    const updateTheme = () => {
      const newTheme = calculateTheme()
      setTheme(newTheme)

      // Apply to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    updateTheme()

    // For auto mode, check every minute for sunrise/sunset changes
    if (preference === 'auto') {
      const interval = setInterval(updateTheme, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [preference, calculateTheme, mounted])

  // Prevent hydration mismatch by not rendering children until mounted
  // But we still render the provider to avoid context errors
  const value = {
    theme,
    preference,
    setPreference,
    isDark: theme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
