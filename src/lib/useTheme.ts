import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

/** Kept in sync with the pre-paint script in every page's HTML. */
export const THEME_STORAGE_KEY = 'cazan-theme'

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    // Private mode or blocked storage — dark is the default anyway.
    return 'dark'
  }
}

/**
 * Theme choice, persisted across reloads.
 *
 * Dark is the default and the operating system's preference is deliberately
 * ignored: the app's home is a TV across a room, where a full-screen warm white
 * at brew-day brightness is a lamp pointed at you. Light is a deliberate choice
 * for a second monitor or a sunlit garage, so it only ever comes from this
 * switch.
 *
 * This stores a UI preference, not brew data; the open recipe lives only in
 * the tab's sessionStorage.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Preference just won't survive the reload; not worth surfacing.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
