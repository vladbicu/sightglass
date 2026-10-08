import { formatMass } from './format'
import { list, message, number, obj, text, type JsonObject } from './json'
import type {
  Fermentable,
  Fermentation,
  Hop,
  MashStep,
  Misc,
  ParseResult,
  Recipe,
  Style,
  Yeast,
} from './types'

/**
 * Brewfather's own recipe export. Figures are bare numbers in metric units
 * regardless of the user's display preferences (`defaults.color: "ebc"` only
 * changes what Brewfather shows; `color` is still SRM). Hop and misc amounts
 * are in grams, everything else in kg / L / min / °C.
 */

/**
 * Additions that happen in the fermenter or at packaging carry their TIME in
 * days in Brewfather; boil, mash and whirlpool ones are in minutes.
 */
const DAY_USES = new Set(['dry hop', 'primary', 'secondary', 'bottling'])

function timeMinutes(use: string, time: unknown): number | null {
  const t = number(time)
  if (t === null) return null
  return DAY_USES.has(use.toLowerCase()) ? t * 1440 : t
}

const MASS_KG: Record<string, number> = { mg: 1e-6, g: 0.001, kg: 1, oz: 0.0283495, lb: 0.453592 }

function parseFermentable(node: JsonObject): Fermentable {
  return {
    name: text(node.name),
    type: text(node.type),
    amount: number(node.amount) ?? 0,
    yield: number(node.potentialPercentage),
    color: number(node.color),
  }
}

function parseHop(node: JsonObject): Hop {
  const use = text(node.use)
  const grams = number(node.amount)
  return {
    name: text(node.name),
    alpha: number(node.alpha),
    amount: grams === null ? 0 : grams / 1000,
    use,
    time: timeMinutes(use, node.time),
    form: text(node.type),
    temperature: number(node.temp),
  }
}

function parseMisc(node: JsonObject): Misc {
  const use = text(node.use)
  const amount = number(node.amount)
  const unit = text(node.unit)
  const factor = MASS_KG[unit.toLowerCase()]
  const kg = amount !== null && factor !== undefined ? amount * factor : null
  return {
    name: text(node.name),
    type: text(node.type),
    use,
    amount: kg,
    displayAmount: amount === null ? '' : kg !== null ? formatMass(kg) : `${amount} ${unit}`.trim(),
    time: timeMinutes(use, node.time),
  }
}

function parseYeast(node: JsonObject): Yeast {
  return {
    name: text(node.name),
    type: text(node.type),
    form: text(node.form),
    amount: number(node.amount),
    amountIsWeight: text(node.unit).toLowerCase() === 'g',
    attenuation: number(node.attenuation),
    laboratory: text(node.laboratory),
    productId: text(node.productId),
  }
}

function parseMashStep(node: JsonObject): MashStep {
  return {
    name: text(node.name),
    type: text(node.type),
    stepTemp: number(node.stepTemp),
    stepTime: number(node.stepTime),
    rampTime: number(node.rampTime),
    endTemp: null,
  }
}

function parseStyle(node: unknown): Style | null {
  const style = obj(node)
  const name = text(style.name)
  const category =
    `${text(style.categoryNumber)}${text(style.styleLetter)}` || text(style.category)
  const guide = text(style.styleGuide)
  return name || category || guide ? { name, category, guide } : null
}

function parseFermentation(node: unknown): Fermentation | null {
  const steps = list(obj(node).steps)
  if (steps.length === 0) return null
  const primary = steps[0]!
  return {
    stages: steps.length,
    primaryAge: number(primary.stepTime),
    primaryTemp: number(primary.stepTemp),
  }
}

function parseRecipe(node: JsonObject): Recipe {
  const name = text(node.name)
  if (!name) throw new Error('rețeta nu are nume')

  const og = number(node.og)
  const fg = number(node.fg)
  const boilSize = number(node.boilSize)
  const mash = obj(node.mash)

  return {
    name,
    type: text(node.type),
    brewer: text(node.author),
    date: '',
    batchSize: number(node.batchSize),
    boilSize: boilSize !== null && boilSize > 0 ? boilSize : null,
    boilTime: number(node.boilTime),
    efficiency: number(node.efficiency),
    og,
    fg,
    abv: number(node.abv) ?? (og !== null && fg !== null ? (og - fg) * 131.25 : null),
    ibu: number(node.ibu),
    ibuMethod: titleCase(text(node.ibuFormula)),
    color: number(node.color),
    calories: null,
    notes: text(node.notes),
    style: parseStyle(node.style),
    fermentables: list(node.fermentables).map(parseFermentable),
    hops: list(node.hops).map(parseHop),
    yeasts: list(node.yeasts).map(parseYeast),
    miscs: list(node.miscs).map(parseMisc),
    mashSteps: list(mash.steps).map(parseMashStep),
    mashName: text(mash.name),
    fermentation: parseFermentation(node.fermentation),
  }
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** A batch export wraps the recipe it was brewed from. */
function unwrap(node: JsonObject): JsonObject {
  return text(node._type) === 'batch' ? obj(node.recipe) : node
}

/**
 * Recognises a Brewfather recipe (or batch) object. Kept loose on purpose: the
 * export has no version marker beyond `_type`, and older exports lack even that.
 */
export function isBrewfatherRecipe(v: unknown): boolean {
  const node = obj(v)
  if (text(node._type) === 'recipe' || text(node._type) === 'batch') return true
  return Array.isArray(node.fermentables) && Array.isArray(node.hops) && 'boilTime' in node
}

/** Takes one recipe object or an array of them; same contract as `parseBeerXML`. */
export function parseBrewfatherJSON(doc: unknown): ParseResult {
  const nodes = (Array.isArray(doc) ? list(doc) : list([doc])).filter(isBrewfatherRecipe)
  if (nodes.length === 0) {
    return { recipes: [], errors: ['Fișierul nu conține nicio rețetă Brewfather.'] }
  }

  const recipes: Recipe[] = []
  const errors: string[] = []
  nodes.forEach((node, i) => {
    try {
      recipes.push(parseRecipe(unwrap(node)))
    } catch (err) {
      errors.push(`Rețeta #${i + 1} nu a putut fi citită: ${message(err)}`)
    }
  })
  return { recipes, errors }
}
