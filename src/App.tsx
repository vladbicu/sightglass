import { useState } from 'react'
import { CondensedTicket } from './components/CondensedTicket'
import { RecipeTicket } from './components/RecipeTicket'
import { UploadZone } from './components/UploadZone'
import { type Messages, t, useLocale } from './i18n'
import { readRecipeFile } from './lib/parseBeerXML'
import { parseRecipeFile } from './lib/parseRecipe'
import type { Recipe } from './lib/types'
import { useTheme } from './lib/useTheme'
import { useViewMode } from './lib/useViewMode'
import { useWakeLock } from './lib/useWakeLock'

const recipeTitle = (m: Messages) => m.titleRecipe

export default function App() {
  // One file at a time — no library, no tabs, nothing persisted across reloads.
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const { theme, toggleTheme } = useTheme()
  const { view, toggleView } = useViewMode()
  useLocale(recipeTitle)

  useWakeLock(recipes !== null)

  const handleFile = async (file: File) => {
    try {
      const { recipes: parsed, errors: parseErrors } = parseRecipeFile(await readRecipeFile(file))

      if (parsed.length === 0) {
        setRecipes(null)
        setErrors(parseErrors.length > 0 ? parseErrors : [t().errNoRecipe])
        return
      }

      // A batch export with one bad recipe still shows every good sibling.
      setRecipes(parsed)
      setErrors(parseErrors)
      setIndex(0)
    } catch (err) {
      setRecipes(null)
      setErrors([t().errUnreadable(err instanceof Error ? err.message : String(err))])
    }
  }

  const reset = () => {
    setRecipes(null)
    setErrors([])
    setIndex(0)
  }

  if (recipes === null) {
    return (
      <UploadZone onFile={handleFile} errors={errors} theme={theme} onToggleTheme={toggleTheme} />
    )
  }

  const recipe = recipes[index] ?? recipes[0]!
  const position =
    recipes.length > 1
      ? { index, total: recipes.length, onNext: () => setIndex((i) => (i + 1) % recipes.length) }
      : null

  // The condensed view owns the whole viewport, so the error banner would push
  // it off screen; it stays with the detailed view where there is room to grow.
  if (view === 'condensed') {
    return (
      <CondensedTicket
        recipe={recipe}
        onReset={reset}
        position={position}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={view}
        onToggleView={toggleView}
      />
    )
  }

  return (
    <>
      {errors.length > 0 && (
        <div role="alert" className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-8">
          <div className="border-danger-line bg-danger-veil rounded border px-6 py-4">
            <ul className="text-danger space-y-1 text-[1rem]">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <RecipeTicket
        recipe={recipe}
        onReset={reset}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={view}
        onToggleView={toggleView}
        position={position}
      />
    </>
  )
}
