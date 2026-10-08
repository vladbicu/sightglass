import { t, term } from '../i18n'
import { formatDuration, formatGravity, formatNumber } from './format'
import type { Recipe } from './types'

export interface Reading {
  label: string
  value: string
  unit?: string
  accent?: boolean
}

/**
 * The headline figures, in display order. Shared by both views so the detailed
 * ticket and the condensed one can never drift apart on the numbers.
 *
 * Anything that formats to an empty string is dropped rather than rendered as a
 * blank or a zero — which is how BOIL_SIZE=0 disappears instead of showing "0 L".
 */
export function readings(recipe: Recipe): Reading[] {
  const list: Reading[] = []
  const push = (label: string, value: string, unit?: string, accent?: boolean) => {
    if (value !== '') list.push({ label, value, unit, accent })
  }

  const m = t()
  push('OG', formatGravity(recipe.og))
  push('FG', formatGravity(recipe.fg))
  push('ABV', formatNumber(recipe.abv), '%', true)
  push('IBU', formatNumber(recipe.ibu, 0), undefined, true)
  push('SRM', formatNumber(recipe.color))
  push(m.statVolume, formatNumber(recipe.batchSize), 'L')
  push(m.statBoilSize, formatNumber(recipe.boilSize), 'L')
  push(m.statBoilTime, formatDuration(recipe.boilTime))
  push(m.statEfficiency, formatNumber(recipe.efficiency, 0), '%')
  push(m.statCalories, formatNumber(recipe.calories, 0), 'kcal')

  return list
}

export function subtitle(recipe: Recipe): string {
  const styleParts = recipe.style
    ? [recipe.style.name, recipe.style.category, recipe.style.guide].filter(Boolean)
    : []
  return [...styleParts, term(recipe.type)].filter(Boolean).join(' · ')
}

/** Unique hop varieties in first-seen order — the "what will I taste" line. */
export function hopNames(recipe: Recipe): string[] {
  const seen = new Set<string>()
  for (const hop of recipe.hops) {
    const name = hop.name.trim()
    if (name) seen.add(name)
  }
  return [...seen]
}

/**
 * Yeast strains for display, prefixed with the lab when the name doesn't already
 * carry it ("London ESB" -> "Wyeast London ESB", but "Lallemand …" is left be).
 */
export function yeastNames(recipe: Recipe): string[] {
  return recipe.yeasts
    .map((yeast) => {
      const name = yeast.name.trim()
      const lab = yeast.laboratory.trim()
      return lab && !name.toLowerCase().includes(lab.toLowerCase()) ? `${lab} ${name}` : name
    })
    .filter(Boolean)
}

export function fermentationLabel(recipe: Recipe): string {
  const f = recipe.fermentation
  if (!f) return ''
  const parts: string[] = []
  if (f.primaryAge !== null) parts.push(formatDuration(f.primaryAge * 1440))
  if (f.primaryTemp !== null) parts.push(`${formatNumber(f.primaryTemp)} °C`)
  if (f.stages !== null) parts.push(t().stages(f.stages))
  return parts.join(' · ')
}
