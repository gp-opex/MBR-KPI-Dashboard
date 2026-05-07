'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ThemeKey } from './theme'

const STORAGE_KEY = 'mbr-kpi-theme'

type ThemeContextValue = { mode: ThemeKey; toggle: () => void }

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeKey>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') setMode(saved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode, mounted])

  const toggle = () => setMode(m => m === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
