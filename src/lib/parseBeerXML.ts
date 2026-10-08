import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { t } from '../i18n'
import { formatMass } from './format'
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

type XmlNode = Record<string, unknown>

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  // Keep every value a string; we convert numbers ourselves so that an empty
  // tag stays distinguishable from a real 0.
  parseTagValue: false,
  trimValues: true,
  // Brewfather escapes every space and bracket as a numeric reference
  // (`Elderflower&#32;Ale`), which is only decoded with htmlEntities on.
  htmlEntities: true,
})

function isNode(v: unknown): v is XmlNode {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Tag names are matched case-insensitively, so the lowercase key map for each
 * node is built once and reused across every lookup on that node.
 */
const keyCache = new WeakMap<XmlNode, Map<string, unknown>>()

function keysOf(node: unknown): Map<string, unknown> {
  if (!isNode(node)) return new Map()
  let map = keyCache.get(node)
  if (!map) {
    map = new Map()
    for (const [key, value] of Object.entries(node)) map.set(key.toLowerCase(), value)
    keyCache.set(node, map)
  }
  return map
}

/**
 * Tries each name in order and returns the first that exists. Absorbs both the
 * shorthand tag names some exporters emit (`n` for `NAME`) and the estimate
 * variants Grainfather uses (`EST_OG` where the spec says `OG`), without
 * needing a separate branch per field.
 */
function getTag(node: unknown, ...names: string[]): unknown {
  const map = keysOf(node)
  for (const name of names) {
    const value = map.get(name.toLowerCase())
    if (value !== undefined) return value
  }
  return undefined
}

/** Self-closing tags like `<NOTES/>` parse to "" — never a crash. */
function str(node: unknown, ...names: string[]): string {
  const value = getTag(node, ...names)
  if (value === undefined || value === null) return ''
  if (isNode(value) || Array.isArray(value)) return ''
  return String(value).trim()
}

function num(node: unknown, ...names: string[]): number | null {
  const raw = str(node, ...names)
  if (raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

/** A leading number and the unit glued after it: "9.1 SRM", "1.045 SG", "4.33 %". */
const MEASURE_RE = /^(-?\d+(?:\.\d+)?|-?\.\d+)\s*([a-z°%]*)$/i

/**
 * Like `num`, but tolerates the unit Brewfather appends to recipe-level figures
 * (`<EST_COLOR>9.1 SRM</EST_COLOR>`), which `Number()` would turn into NaN.
 */
function measure(node: unknown, ...names: string[]): { value: number; unit: string } | null {
  const match = MEASURE_RE.exec(str(node, ...names))
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? { value, unit: match[2]!.toLowerCase() } : null
}

function measureNum(node: unknown, ...names: string[]): number | null {
  return measure(node, ...names)?.value ?? null
}

/** Recipe colour in SRM: a bare figure or °L reads as SRM, an explicit EBC is converted. */
function colorSrm(node: unknown, ...names: string[]): number | null {
  const m = measure(node, ...names)
  if (!m) return null
  return m.unit === 'ebc' ? ebcToSrm(m.value) : m.value
}

/** fast-xml-parser yields a bare object for a lone child and an array for many. */
function toArray(value: unknown): XmlNode[] {
  if (Array.isArray(value)) return value.filter(isNode)
  return isNode(value) ? [value] : []
}

function collection(parent: unknown, plural: string, singular: string): XmlNode[] {
  return toArray(getTag(getTag(parent, plural), singular))
}

function parseFermentable(node: XmlNode): Fermentable {
  return {
    name: str(node, 'NAME', 'n'),
    type: str(node, 'TYPE'),
    amount: num(node, 'AMOUNT') ?? 0,
    yield: num(node, 'YIELD'),
    color: num(node, 'COLOR'),
  }
}

function parseHop(node: XmlNode): Hop {
  return {
    name: str(node, 'NAME', 'n'),
    alpha: num(node, 'ALPHA'),
    amount: num(node, 'AMOUNT') ?? 0,
    use: str(node, 'USE'),
    time: num(node, 'TIME'),
    form: str(node, 'FORM'),
    temperature: num(node, 'TEMPERATURE', 'HOP_TEMP'),
  }
}

function parseYeast(node: XmlNode): Yeast {
  return {
    name: str(node, 'NAME', 'n'),
    type: str(node, 'TYPE'),
    form: str(node, 'FORM'),
    amount: num(node, 'AMOUNT'),
    amountIsWeight: str(node, 'AMOUNT_IS_WEIGHT').toLowerCase() === 'true',
    attenuation: num(node, 'ATTENUATION'),
    laboratory: str(node, 'LABORATORY'),
    productId: str(node, 'PRODUCT_ID'),
  }
}

function parseMisc(node: XmlNode): Misc {
  const amount = num(node, 'AMOUNT')
  return {
    name: str(node, 'NAME', 'n'),
    type: str(node, 'TYPE'),
    use: str(node, 'USE'),
    amount,
    // The source app already formatted this sensibly ("25 g"); only fall back
    // to our own formatting when it is missing.
    displayAmount: str(node, 'DISPLAY_AMOUNT') || formatMass(amount),
    time: num(node, 'TIME'),
  }
}

function parseMashStep(node: XmlNode): MashStep {
  return {
    name: str(node, 'NAME', 'n'),
    type: str(node, 'TYPE'),
    stepTemp: num(node, 'STEP_TEMP'),
    stepTime: num(node, 'STEP_TIME'),
    rampTime: num(node, 'RAMP_TIME'),
    endTemp: num(node, 'END_TEMP'),
  }
}

function parseStyle(node: unknown): Style | null {
  if (!isNode(node)) return null

  const name = str(node, 'NAME', 'n')
  // Grainfather omits CATEGORY entirely and ships the parts instead, so the
  // BJCP code has to be reassembled from CATEGORY_NUMBER + STYLE_LETTER.
  const category =
    str(node, 'CATEGORY') || `${str(node, 'CATEGORY_NUMBER')}${str(node, 'STYLE_LETTER')}`
  const guide = str(node, 'STYLE_GUIDE')

  if (!name && !category && !guide) return null
  return { name, category, guide }
}

function parseFermentation(node: XmlNode): Fermentation | null {
  const stages = num(node, 'FERMENTATION_STAGES')
  const primaryAge = num(node, 'PRIMARY_AGE')
  const primaryTemp = num(node, 'PRIMARY_TEMP')
  if (stages === null && primaryAge === null && primaryTemp === null) return null
  return { stages, primaryAge, primaryTemp }
}

function parseRecipe(node: XmlNode): Recipe {
  const name = str(node, 'NAME', 'n')
  if (!name) throw new Error(t().errNoName)

  const og = measureNum(node, 'OG', 'EST_OG')
  const fg = measureNum(node, 'FG', 'EST_FG')
  // A recipe with no ABV of its own can still be derived from the gravities.
  const abv =
    measureNum(node, 'ABV', 'EST_ABV') ?? (og !== null && fg !== null ? (og - fg) * 131.25 : null)

  const boilSize = num(node, 'BOIL_SIZE')
  const mash = getTag(node, 'MASH')

  return {
    name,
    type: str(node, 'TYPE'),
    brewer: str(node, 'BREWER'),
    date: str(node, 'DATE'),
    batchSize: num(node, 'BATCH_SIZE'),
    // Grainfather writes 0 when the boil volume was never set; treating it as
    // absent keeps "0 L" off the screen.
    boilSize: boilSize !== null && boilSize > 0 ? boilSize : null,
    boilTime: num(node, 'BOIL_TIME'),
    efficiency: num(node, 'EFFICIENCY'),
    og,
    fg,
    abv,
    ibu: measureNum(node, 'IBU', 'EST_IBU'),
    ibuMethod: str(node, 'IBU_METHOD'),
    color: colorSrm(node, 'COLOR', 'EST_COLOR'),
    calories: num(node, 'CALORIES', 'EST_CALORIES'),
    notes: str(node, 'NOTES'),
    style: parseStyle(getTag(node, 'STYLE')),
    fermentables: collection(node, 'FERMENTABLES', 'FERMENTABLE').map(parseFermentable),
    hops: collection(node, 'HOPS', 'HOP').map(parseHop),
    yeasts: collection(node, 'YEASTS', 'YEAST').map(parseYeast),
    miscs: collection(node, 'MISCS', 'MISC').map(parseMisc),
    mashSteps: collection(mash, 'MASH_STEPS', 'MASH_STEP').map(parseMashStep),
    mashName: str(mash, 'NAME', 'n'),
    fermentation: parseFermentation(node),
  }
}

/** Handles both `<RECIPES><RECIPE>` and a bare top-level `<RECIPE>`. */
function findRecipeNodes(doc: unknown): XmlNode[] {
  const wrapped = toArray(getTag(getTag(doc, 'RECIPES'), 'RECIPE'))
  if (wrapped.length > 0) return wrapped
  return toArray(getTag(doc, 'RECIPE'))
}

/**
 * Never throws. A file that is not XML at all, or holds no recipes, comes back
 * with an empty `recipes` and a reason in `errors`; a batch export with one bad
 * recipe returns every good sibling alongside an error for the bad one.
 */
export function parseBeerXML(text: string): ParseResult {
  const errors: string[] = []

  if (text.trim() === '') {
    return { recipes: [], errors: [t().errFileEmpty] }
  }

  const validation = XMLValidator.validate(text)
  if (validation !== true) {
    return { recipes: [], errors: [t().errInvalidXml(validation.err.msg)] }
  }

  let doc: unknown
  try {
    doc = xmlParser.parse(text)
  } catch (err) {
    return { recipes: [], errors: [t().errUnreadable(message(err))] }
  }

  const nodes = findRecipeNodes(doc)
  if (nodes.length === 0) {
    return { recipes: [], errors: [t().errNoBeerXml] }
  }

  const recipes: Recipe[] = []
  nodes.forEach((node, i) => {
    try {
      recipes.push(parseRecipe(node))
    } catch (err) {
      errors.push(t().errRecipeFailed(i + 1, message(err)))
    }
  })

  return { recipes, errors }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Matches `encoding="ISO-8859-1"` in an XML prolog. */
const ENCODING_RE = /encoding\s*=\s*["']([\w-]+)["']/i

/**
 * Decodes using the encoding the prolog declares rather than assuming UTF-8.
 * Grainfather writes `ISO-8859-1`, in which any accented character would come
 * back mangled through `file.text()`.
 */
export function decodeRecipeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)

  // The prolog is ASCII, so any single-byte decoding reads it correctly.
  const prolog = new TextDecoder('windows-1252').decode(bytes.slice(0, 200))
  const declared = ENCODING_RE.exec(prolog)?.[1]

  if (declared && declared.toLowerCase() !== 'utf-8') {
    try {
      return new TextDecoder(declared).decode(bytes)
    } catch {
      // Unknown label — TextDecoder throws; fall through to UTF-8.
    }
  }

  return new TextDecoder('utf-8').decode(bytes)
}

export async function readRecipeFile(file: File): Promise<string> {
  return decodeRecipeBuffer(await file.arrayBuffer())
}
