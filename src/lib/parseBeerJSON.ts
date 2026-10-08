import { t } from '../i18n'
import { formatMass } from './format'
import { tinsethIbu } from './ibu'
import { isObject, list, message, number, obj, text, type JsonObject } from './json'
import { ebcToSrm } from './srm'
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
 * BeerJSON wraps every figure as `{ unit, value }`. Each table maps the units the
 * spec allows onto the one unit `Recipe` stores, so nothing downstream ever has
 * to know which format a recipe came from.
 */
const MASS_KG: Record<string, number> = { mg: 1e-6, g: 0.001, kg: 1, oz: 0.0283495, lb: 0.453592 }
const VOLUME_L: Record<string, number> = {
  ml: 0.001,
  l: 1,
  tsp: 0.00492892,
  tbsp: 0.0147868,
  floz: 0.0295735,
  cup: 0.236588,
  pt: 0.473176,
  qt: 0.946353,
  gal: 3.78541,
  bbl: 117.348,
}
const TIME_MIN: Record<string, number> = {
  sec: 1 / 60,
  min: 1,
  hr: 60,
  day: 1440,
  week: 10080,
}

function quantity(v: unknown): { value: number; unit: string } | null {
  if (!isObject(v)) return null
  const value = number(v.value)
  return value === null ? null : { value, unit: text(v.unit).toLowerCase() }
}

function scaled(v: unknown, table: Record<string, number>): number | null {
  const q = quantity(v)
  if (!q) return null
  const factor = table[q.unit]
  return factor === undefined ? null : q.value * factor
}

const mass = (v: unknown) => scaled(v, MASS_KG)
const volume = (v: unknown) => scaled(v, VOLUME_L)
const minutes = (v: unknown) => scaled(v, TIME_MIN)

function celsius(v: unknown): number | null {
  const q = quantity(v)
  if (!q) return null
  if (q.unit === 'c') return q.value
  if (q.unit === 'f') return ((q.value - 32) * 5) / 9
  return null
}

/** Lovibond and SRM are the same scale for display; EBC is roughly double. */
function srm(v: unknown): number | null {
  const q = quantity(v)
  if (!q) return null
  if (q.unit === 'ebc') return ebcToSrm(q.value)
  if (q.unit === 'srm' || q.unit === 'lovi') return q.value
  return null
}

/** Gravities may be given in Plato or Brix; °Plato → SG via the usual approximation. */
function gravity(v: unknown): number | null {
  const q = quantity(v)
  if (!q) return null
  if (q.unit === 'sg') return q.value
  if (q.unit === 'plato' || q.unit === 'brix') return 1 + q.value / (258.6 - (q.value / 258.2) * 227.1)
  return null
}

const percent = (v: unknown) => quantity(v)?.value ?? null

/** BeerJSON values are snake_case ("all grain"); BeerXML's are Title Case. */
function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * `timing.use` mapped onto the BeerXML USE vocabulary that `hopSchedule` and
 * the misc grouping already understand. A hop added to the fermenter is a dry
 * hop; anything else added there is a primary addition.
 */
function additionUse(timing: JsonObject, kind: 'hop' | 'other'): string {
  switch (text(timing.use)) {
    case 'add_to_mash':
      return 'Mash'
    case 'add_to_boil':
      return 'Boil'
    case 'add_to_fermentation':
      return kind === 'hop' ? 'Dry Hop' : 'Primary'
    case 'add_to_package':
      return 'Bottling'
    default:
      return titleCase(text(timing.use))
  }
}

function parseFermentable(node: JsonObject): Fermentable {
  return {
    name: text(node.name),
    type: titleCase(text(node.type)),
    amount: mass(node.amount) ?? 0,
    yield: percent(obj(node.yield).fine_grind),
    color: srm(node.color),
  }
}

function parseHop(node: JsonObject): Hop {
  const timing = obj(node.timing)
  return {
    name: text(node.name),
    alpha: percent(node.alpha_acid),
    amount: mass(node.amount) ?? 0,
    use: additionUse(timing, 'hop'),
    time: minutes(timing.duration),
    form: titleCase(text(node.form)),
    temperature: null,
  }
}

function parseMisc(node: JsonObject): Misc {
  const timing = obj(node.timing)
  const q = quantity(node.amount)
  const kg = mass(node.amount)
  return {
    name: text(node.name),
    type: titleCase(text(node.type)),
    use: additionUse(timing, 'other'),
    amount: kg,
    // Volumes and counts ("1 each") have no kg figure; show them as written.
    displayAmount: kg !== null ? formatMass(kg) : q ? `${q.value} ${q.unit}` : '',
    time: minutes(timing.duration),
  }
}

function parseYeast(node: JsonObject): Yeast {
  const kg = mass(node.amount)
  return {
    name: text(node.name),
    type: titleCase(text(node.type)),
    form: titleCase(text(node.form)),
    amount: kg ?? volume(node.amount) ?? quantity(node.amount)?.value ?? null,
    amountIsWeight: kg !== null,
    attenuation: percent(node.attenuation),
    laboratory: text(node.producer),
    productId: text(node.product_id),
  }
}

function parseMashStep(node: JsonObject): MashStep {
  return {
    name: text(node.name),
    type: titleCase(text(node.type)),
    stepTemp: celsius(node.step_temperature),
    stepTime: minutes(node.step_time),
    rampTime: minutes(node.ramp_time),
    endTemp: celsius(node.end_temperature),
  }
}

function parseStyle(node: unknown): Style | null {
  if (!isObject(node)) return null
  const name = text(node.name)
  const category = `${text(node.category_number)}${text(node.style_letter)}` || text(node.category)
  const guide = text(node.style_guide)
  return name || category || guide ? { name, category, guide } : null
}

function parseFermentation(node: unknown): Fermentation | null {
  const steps = list(obj(node).fermentation_steps)
  if (steps.length === 0) return null
  const primary = steps[0]!
  const age = minutes(primary.step_time)
  return {
    stages: steps.length,
    primaryAge: age === null ? null : age / 1440,
    primaryTemp: celsius(primary.start_temperature),
  }
}

function parseRecipe(node: JsonObject): Recipe {
  const name = text(node.name)
  if (!name) throw new Error(t().errNoName)

  const og = gravity(node.original_gravity)
  const fg = gravity(node.final_gravity)
  const boil = obj(node.boil)
  const boilSize = volume(boil.pre_boil_size)
  const ingredients = obj(node.ingredients)
  const mash = obj(node.mash)
  const ibu = obj(node.ibu_estimate)
  const hops = list(ingredients.hop_additions).map(parseHop)
  const batchSize = volume(node.batch_size)

  return {
    name,
    type: titleCase(text(node.type)),
    brewer: text(node.author),
    date: text(node.created),
    batchSize,
    boilSize: boilSize !== null && boilSize > 0 ? boilSize : null,
    boilTime: minutes(boil.boil_time),
    efficiency: percent(obj(node.efficiency).brewhouse),
    og,
    fg,
    abv:
      percent(node.alcohol_by_volume) ??
      (og !== null && fg !== null ? (og - fg) * 131.25 : null),
    // The spec's ibu_estimate carries only the method, so the figure is derived.
    ibu: tinsethIbu(hops, og, batchSize),
    ibuMethod: text(ibu.method),
    color: srm(node.color_estimate),
    calories: null,
    notes: text(node.notes),
    style: parseStyle(node.style),
    fermentables: list(ingredients.fermentable_additions).map(parseFermentable),
    hops,
    yeasts: list(ingredients.culture_additions).map(parseYeast),
    miscs: list(ingredients.miscellaneous_additions).map(parseMisc),
    mashSteps: list(mash.mash_steps).map(parseMashStep),
    mashName: text(mash.name),
    fermentation: parseFermentation(node.fermentation),
  }
}

/** Takes the already-parsed `{ beerjson: … }` document; same contract as `parseBeerXML`. */
export function parseBeerJSON(doc: JsonObject): ParseResult {
  const nodes = list(obj(doc.beerjson).recipes)
  if (nodes.length === 0) {
    return { recipes: [], errors: [t().errNoBeerJson] }
  }

  const recipes: Recipe[] = []
  const errors: string[] = []
  nodes.forEach((node, i) => {
    try {
      recipes.push(parseRecipe(node))
    } catch (err) {
      errors.push(t().errRecipeFailed(i + 1, message(err)))
    }
  })
  return { recipes, errors }
}
