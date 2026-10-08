import { BRAND_NAME } from '../../brand'
import type { Messages } from './en'

const n = (v: number) => String(Number(v.toFixed(1)))

/**
 * Romanian puts "de" before the plural noun when the last two digits are 0 or
 * 20-99: 3 zile, 19 zile, but 20 de zile, 101 de zile.
 */
function count(v: number, one: string, many: string): string {
  if (v === 1) return `1 ${one}`
  const rem = Math.floor(v) % 100
  return rem === 0 || rem >= 20 ? `${n(v)} de ${many}` : `${n(v)} ${many}`
}

export const ro: Messages = {
  appRecipe: 'Rețetă',
  appTaps: 'Robinete',
  titleHub: BRAND_NAME,
  titleRecipe: `${BRAND_NAME} · Rețetă`,
  titleTaps: `${BRAND_NAME} · Robinete`,
  language: 'Limbă',

  themeToLight: 'Comută pe tema deschisă',
  themeToDark: 'Comută pe tema închisă',
  viewToCondensed: 'Comută pe vederea condensată',
  viewToFull: 'Comută pe vederea detaliată',

  apps: 'Aplicații',
  hubTagline: 'Două ecrane pentru berarii de casă: rețeta în ziua de brew, robinetele la bar.',
  recipeBlurb: 'O rețetă cu litere mari pentru ziua de brew, citită de la câțiva metri.',
  tapsBlurb:
    'Lista de robinete pe televizorul de la bar: culoare, ABV, IBU, hamei și drojdie pentru fiecare bere, păstrată între vizite.',
  dropOrPick: 'Trage un fișier de rețetă sau apasă ca să alegi',
  dropOrPickMany: 'Trage fișiere de rețetă sau apasă ca să alegi',
  chooseFile: 'Alege un fișier',
  chooseFiles: 'Alege fișiere',
  openApp: (name) => `Deschide ${name} →`,
  recipeOpen: (name) => `Deschisă acum: ${name}`,
  onBoard: (beers) => `${beers} pe listă`,

  emptyKettle: 'Cazanul e gol',
  dropRecipe: 'Trage un fișier de rețetă aici',
  privacy: 'Totul rămâne în browser — nimic nu se trimite nicăieri.',
  uploadFailed: 'Fișierul nu a putut fi încărcat',
  loadAnother: 'Încarcă altă rețetă',
  recipeOf: (i, total) => `Rețeta ${i} / ${total}`,
  next: 'Următoarea →',

  statVolume: 'Volum',
  statBoilSize: 'Fierbere',
  statBoilTime: 'Timp fierbere',
  statEfficiency: 'Eficiență',
  statCalories: 'Calorii',
  ibuBy: (method) => `IBU după ${method}`,
  fermentationLine: (s) => `Fermentare: ${s}`,
  stages: (c) => count(c, 'etapă', 'etape'),
  days: (d) => count(d, 'zi', 'zile'),

  fermentables: 'Cereale',
  total: (s) => `${s} total`,
  colFermentable: 'Cereală',
  colType: 'Tip',
  colColor: 'Culoare',
  colAmount: 'Cantitate',
  hops: 'Hamei',
  boil: 'Fierbere',
  afterBoil: 'După fierbere',
  mash: 'Plămădire',
  yeast: (c) => (c === 1 ? 'Drojdie' : 'Drojdii'),
  amount: 'Cantitate',
  attenuation: 'Atenuare',
  attenuationShort: (pct) => `${pct}% aten.`,
  additions: 'Adaosuri',
  otherAdditions: 'Alte adaosuri',
  details: 'Detalii',
  notes: 'Note',

  tapsEmpty: 'Niciun robinet încă',
  dropTaps: 'Trage aici fișiere de rețetă — câte vrei',
  tapsSaved: 'Robinetele rămân salvate în acest browser.',
  someFilesFailed: 'Unele fișiere nu au putut fi citite',
  add: '+ Adaugă',
  clear: 'Golește',
  clearConfirm: 'Golești toată lista?',
  beers: (c) => count(c, 'bere', 'beri'),
  tapCount: 'Robinete',
  oneTapLess: 'Un robinet mai puțin',
  oneTapMore: 'Încă un robinet',
  onTap: 'La robinet',
  upNext: 'Gata de pus la robinet',
  freeTap: 'Liber',
  removeBeer: (name) => `Scoate ${name} din listă`,

  errFileEmpty: 'Fișierul este gol.',
  errNoRecipe: 'Fișierul nu conține nicio rețetă.',
  errUnreadable: (msg) => `Fișierul nu a putut fi citit: ${msg}`,
  errInvalidXml: (msg) => `Fișierul nu este XML valid: ${msg}`,
  errNoBeerXml: 'Fișierul nu conține nicio rețetă BeerXML (<RECIPE>).',
  errInvalidJson: (msg) => `Fișierul nu este JSON valid: ${msg}`,
  errNoBeerJson: 'Fișierul BeerJSON nu conține nicio rețetă.',
  errNoBrewfather: 'Fișierul nu conține nicio rețetă Brewfather.',
  errUnknownJson: 'Fișierul JSON nu e o rețetă BeerJSON sau Brewfather.',
  errRecipeFailed: (i, msg) => `Rețeta #${i} nu a putut fi citită: ${msg}`,
  errNoName: 'rețeta nu are nume',

  terms: {
    // USE
    boil: 'Fierbere',
    'dry hop': 'Dry hop',
    mash: 'Plămădire',
    'first wort': 'First wort',
    aroma: 'Aromă',
    'hop stand': 'Hop stand',
    whirlpool: 'Whirlpool',
    primary: 'Fermentare primară',
    secondary: 'Fermentare secundară',
    bottling: 'Îmbuteliere',
    sparge: 'Spălare',
    // Fermentable TYPE
    grain: 'Malț',
    sugar: 'Zahăr',
    extract: 'Extract',
    'dry extract': 'Extract uscat',
    adjunct: 'Adjunct',
    // Hop / yeast FORM
    pellet: 'Peleți',
    leaf: 'Conuri',
    dry: 'Uscată',
    liquid: 'Lichidă',
    // Misc TYPE
    spice: 'Condiment',
    flavor: 'Aromă',
    fining: 'Limpezire',
    herb: 'Plantă',
    'water agent': 'Tratare apă',
    other: 'Altele',
    // Mash step TYPE
    infusion: 'Infuzie',
    temperature: 'Palier',
    decoction: 'Decocție',
  },
}
