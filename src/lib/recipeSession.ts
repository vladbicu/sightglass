import type { Recipe } from './types'

/**
 * The viewer's open recipe, kept in `sessionStorage`: it survives a reload and
 * a trip to the tap list or the hub and back, and disappears when the browser
 * tab closes. Still a brew-day viewer, not a recipe library — nothing outlives
 * the tab it was opened in.
 */
export const RECIPE_SESSION_KEY = 'cazan-recipe'

export interface RecipeSession {
  /** Every recipe in the file that was opened; a batch export holds several. */
  recipes: Recipe[]
  /** Which of them is on screen. */
  index: number
}

function isRecipe(value: unknown): value is Recipe {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).name === 'string'
  )
}

/**
 * Anything that isn't a well-shaped session — a schema change, a truncated
 * write, a hand edit — reads as no recipe open rather than throwing.
 */
export function parseRecipeSession(raw: string | null): RecipeSession | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { recipes, index } = parsed as Record<string, unknown>
    if (!Array.isArray(recipes) || recipes.length === 0 || !recipes.every(isRecipe)) return null
    const i = typeof index === 'number' && Number.isInteger(index) ? index : 0
    return { recipes, index: i >= 0 && i < recipes.length ? i : 0 }
  } catch {
    return null
  }
}

export function readRecipeSession(): RecipeSession | null {
  try {
    return parseRecipeSession(sessionStorage.getItem(RECIPE_SESSION_KEY))
  } catch {
    return null
  }
}

/** `null` clears it — "Load another recipe" really does close the recipe. */
export function writeRecipeSession(session: RecipeSession | null) {
  try {
    if (session) sessionStorage.setItem(RECIPE_SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(RECIPE_SESSION_KEY)
  } catch {
    // Private mode or a full quota — the recipe just won't survive navigation.
  }
}
