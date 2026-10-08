import { BRAND_NAME } from '../../brand'

/** Drops trailing zeros so 1.50 reads "1.5"; duplicated from format.ts to keep messages leaf-level. */
const n = (v: number) => String(Number(v.toFixed(1)))

/**
 * The source language. Its shape is the `Messages` type every other locale must
 * match exactly, so a missing or extra key is a compile error. Counted phrases
 * are functions, which lets each language own its plural rules (Romanian's
 * "20 de zile", French's singular below 2) without a plural engine.
 */
export const en = {
  appRecipe: 'Recipe',
  appTaps: 'Taps',
  titleRecipe: BRAND_NAME,
  titleTaps: `${BRAND_NAME} · Taps`,
  language: 'Language',

  // Toggles — named for what they switch *to*.
  themeToLight: 'Switch to light theme',
  themeToDark: 'Switch to dark theme',
  viewToCondensed: 'Switch to condensed view',
  viewToFull: 'Switch to detailed view',

  // Recipe viewer
  emptyKettle: 'The kettle is empty',
  dropRecipe: 'Drop a recipe file here',
  privacy: 'Everything stays in your browser — nothing is sent anywhere.',
  seeTaps: 'See the taps →',
  uploadFailed: 'The file could not be loaded',
  loadAnother: 'Load another recipe',
  recipeOf: (i: number, total: number) => `Recipe ${i} / ${total}`,
  next: 'Next →',

  // Readings
  statVolume: 'Volume',
  statBoilSize: 'Boil',
  statBoilTime: 'Boil time',
  statEfficiency: 'Efficiency',
  statCalories: 'Calories',
  ibuBy: (method: string) => `IBU via ${method}`,
  fermentationLine: (s: string) => `Fermentation: ${s}`,
  stages: (count: number) => (count === 1 ? '1 stage' : `${count} stages`),
  days: (d: number) => (d === 1 ? '1 day' : `${n(d)} days`),

  // Sections
  fermentables: 'Fermentables',
  total: (s: string) => `${s} total`,
  colFermentable: 'Fermentable',
  colType: 'Type',
  colColor: 'Color',
  colAmount: 'Amount',
  hops: 'Hops',
  boil: 'Boil',
  afterBoil: 'After the boil',
  mash: 'Mash',
  yeast: (count: number): string => (count === 1 ? 'Yeast' : 'Yeasts'),
  amount: 'Amount',
  attenuation: 'Attenuation',
  attenuationShort: (pct: string) => `${pct}% att.`,
  additions: 'Additions',
  otherAdditions: 'Other',
  details: 'Details',
  notes: 'Notes',

  // Tap list
  tapsEmpty: 'Nothing on tap yet',
  dropTaps: 'Drop recipe files here — as many as you like',
  tapsSaved: 'Your tap list stays saved in this browser.',
  openRecipe: 'Open a recipe →',
  someFilesFailed: 'Some files could not be read',
  add: '+ Add',
  clear: 'Clear',
  clearConfirm: 'Clear the whole list?',
  loadRecipe: '← Load a recipe',
  beers: (count: number) => (count === 1 ? '1 beer' : `${count} beers`),
  tapCount: 'Taps',
  oneTapLess: 'One tap fewer',
  oneTapMore: 'One more tap',
  onTap: 'On tap',
  upNext: 'Up next',
  freeTap: 'Empty',
  removeBeer: (name: string) => `Remove ${name} from the list`,

  // Parsing
  errFileEmpty: 'The file is empty.',
  errNoRecipe: 'The file contains no recipe.',
  errUnreadable: (msg: string) => `The file could not be read: ${msg}`,
  errInvalidXml: (msg: string) => `The file is not valid XML: ${msg}`,
  errNoBeerXml: 'The file contains no BeerXML recipe (<RECIPE>).',
  errInvalidJson: (msg: string) => `The file is not valid JSON: ${msg}`,
  errNoBeerJson: 'The BeerJSON file contains no recipe.',
  errNoBrewfather: 'The file contains no Brewfather recipe.',
  errUnknownJson: 'The JSON file is not a BeerJSON or Brewfather recipe.',
  errRecipeFailed: (i: number, msg: string) => `Recipe #${i} could not be read: ${msg}`,
  errNoName: 'the recipe has no name',

  /**
   * Values written by the exporting app, keyed lowercase. Exporters write them
   * in English, so English needs no entries — they show as written.
   */
  terms: {} as Record<string, string>,
}

export type Messages = typeof en
