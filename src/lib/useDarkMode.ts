'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'atm10-dark-mode'

export function useDarkMode() {
  // Lazy initializer: reads localStorage on the client, returns false on the server.
  // AppShell applies the `dark` class to <html> before first paint so there's no flash.
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  return { dark, toggle }
}
