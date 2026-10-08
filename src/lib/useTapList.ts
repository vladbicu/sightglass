import { useCallback, useEffect, useState } from 'react'
import { readRecipeFile } from './parseBeerXML'
import { parseRecipeFile } from './parseRecipe'
import {
  clampTapCount,
  moveTap,
  parseStoredTaps,
  parseTapCount,
  type Tap,
  TAP_COUNT_STORAGE_KEY,
  TAPLIST_STORAGE_KEY,
  tapsFromRecipes,
} from './tapList'

function readStored(): Tap[] {
  try {
    return parseStoredTaps(localStorage.getItem(TAPLIST_STORAGE_KEY))
  } catch {
    return []
  }
}

function readStoredCount(): number {
  try {
    return parseTapCount(localStorage.getItem(TAP_COUNT_STORAGE_KEY))
  } catch {
    return parseTapCount(null)
  }
}

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export interface UseTapList {
  taps: Tap[]
  /** Number of physical taps; the first `tapCount` beers on the board are live. */
  tapCount: number
  setTapCount: (value: number) => void
  /** Parse failures from the most recent `addFiles`; cleared on the next call. */
  errors: string[]
  addFiles: (files: File[]) => Promise<void>
  remove: (id: string) => void
  move: (from: number, to: number) => void
  clear: () => void
}

/**
 * The tap list, persisted across reloads under `cazan-taplist`. This is the one
 * place the app keeps brew data between sessions — the single-recipe viewer
 * keeps its recipe only for the life of the browser tab; a curated board only
 * works if it stays put.
 */
export function useTapList(): UseTapList {
  const [taps, setTaps] = useState<Tap[]>(readStored)
  const [tapCount, setTapCountState] = useState<number>(readStoredCount)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(TAPLIST_STORAGE_KEY, JSON.stringify(taps))
    } catch {
      // Private mode or a full quota — the board just won't survive the reload.
    }
  }, [taps])

  useEffect(() => {
    try {
      localStorage.setItem(TAP_COUNT_STORAGE_KEY, String(tapCount))
    } catch {
      // Preference just won't survive the reload; not worth surfacing.
    }
  }, [tapCount])

  const setTapCount = useCallback((value: number) => {
    setTapCountState(clampTapCount(value))
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const added: Tap[] = []
    const failures: string[] = []

    for (const file of files) {
      try {
        const { recipes, errors: parseErrors } = parseRecipeFile(await readRecipeFile(file))
        failures.push(...parseErrors.map((e) => `${file.name}: ${e}`))
        added.push(...tapsFromRecipes(recipes, recipes.map(newId), Date.now()))
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : err}`)
      }
    }

    setErrors(failures)
    if (added.length > 0) setTaps((current) => [...current, ...added])
  }, [])

  const remove = useCallback((id: string) => {
    setTaps((current) => current.filter((tap) => tap.id !== id))
  }, [])

  const move = useCallback((from: number, to: number) => {
    setTaps((current) => moveTap(current, from, to))
  }, [])

  const clear = useCallback(() => {
    setTaps([])
    setErrors([])
  }, [])

  return { taps, tapCount, setTapCount, errors, addFiles, remove, move, clear }
}
