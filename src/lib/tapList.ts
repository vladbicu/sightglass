import type { Recipe } from './types'

/**
 * One beer on the board. The whole parsed `Recipe` is kept rather than a slim
 * projection: the summary helpers (`readings`, `subtitle`) already need those
 * fields, and storing the lot leaves the door open to a click-through later
 * without a storage migration.
 */
export interface Tap {
  id: string
  recipe: Recipe
  /** Epoch ms; only used to keep insertion order stable, never shown. */
  addedAt: number
}

/** Unlike the viewer's recipe, which lasts only as long as the tab, this persists. */
export const TAPLIST_STORAGE_KEY = 'cazan-taplist'

/** How many physical taps the bar has. The first N beers on the board are live. */
export const TAP_COUNT_STORAGE_KEY = 'cazan-tap-count'
export const DEFAULT_TAP_COUNT = 3
export const MAX_TAP_COUNT = 12

/** Clamps a stored / typed tap count to a sane range, falling back to the default. */
export function clampTapCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TAP_COUNT
  return Math.min(MAX_TAP_COUNT, Math.max(1, Math.round(value)))
}

export function parseTapCount(raw: string | null): number {
  if (raw === null || raw.trim() === '') return DEFAULT_TAP_COUNT
  const n = Number(raw)
  return Number.isFinite(n) ? clampTapCount(n) : DEFAULT_TAP_COUNT
}

/**
 * Wraps each parsed recipe in a Tap. Duplicates are allowed — a board with the
 * same beer twice is the user's call, cleared with the per-row remove button.
 * `ids` supplies one id per recipe so this stays pure and testable.
 */
export function tapsFromRecipes(recipes: Recipe[], ids: string[], now: number): Tap[] {
  return recipes.map((recipe, i) => ({
    id: ids[i] ?? `${now}-${i}`,
    recipe,
    addedAt: now,
  }))
}

/** Immutable reorder: pull the item at `from` and drop it back in at `to`. */
export function moveTap(taps: Tap[], from: number, to: number): Tap[] {
  if (from === to || from < 0 || to < 0 || from >= taps.length || to >= taps.length) {
    return taps
  }
  const next = [...taps]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return next
}

function isTap(value: unknown): value is Tap {
  if (typeof value !== 'object' || value === null) return false
  const tap = value as Record<string, unknown>
  const recipe = tap.recipe as Record<string, unknown> | null
  return (
    typeof tap.id === 'string' &&
    typeof tap.addedAt === 'number' &&
    typeof recipe === 'object' &&
    recipe !== null &&
    typeof recipe.name === 'string'
  )
}

/**
 * Reads the persisted board. Anything that isn't a JSON array of well-shaped
 * taps — a schema change, a hand-edited value, a truncated write — comes back as
 * an empty board rather than throwing on load.
 */
export function parseStoredTaps(raw: string | null): Tap[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTap)
  } catch {
    return []
  }
}
