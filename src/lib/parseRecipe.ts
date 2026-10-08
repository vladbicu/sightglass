import { isObject, message } from './json'
import { parseBeerJSON } from './parseBeerJSON'
import { parseBeerXML } from './parseBeerXML'
import { isBrewfatherRecipe, parseBrewfatherJSON } from './parseBrewfatherJSON'
import type { ParseResult } from './types'

/** Accepted by every file picker and the share target. */
export const RECIPE_FILE_ACCEPT = '.xml,.json,text/xml,application/xml,application/json'

/**
 * The one entry point for a recipe file: BeerXML, BeerJSON or Brewfather's own
 * JSON, told apart by content rather than extension (shared files often arrive
 * without one). Never throws — same contract as `parseBeerXML`.
 */
export function parseRecipeFile(text: string): ParseResult {
  const first = text.trimStart()[0]
  if (first !== '{' && first !== '[') return parseBeerXML(text)

  let doc: unknown
  try {
    doc = JSON.parse(text)
  } catch (err) {
    return { recipes: [], errors: [`Fișierul nu este JSON valid: ${message(err)}`] }
  }

  if (isObject(doc) && 'beerjson' in doc) return parseBeerJSON(doc)
  if (isBrewfatherRecipe(doc) || Array.isArray(doc)) return parseBrewfatherJSON(doc)

  return {
    recipes: [],
    errors: ['Fișierul JSON nu e o rețetă BeerJSON sau Brewfather.'],
  }
}
