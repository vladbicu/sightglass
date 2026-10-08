import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { CondensedTicket } from './components/CondensedTicket'
import { RecipeTicket } from './components/RecipeTicket'
import { TapBoard } from './components/TapBoard'
import { setLocale } from './i18n'
import { parseBeerXML } from './lib/parseBeerXML'
import type { Tap } from './lib/tapList'
import type { Hop, Recipe } from './lib/types'

// These assertions were written against the Romanian UI; other languages are
// covered at the end of the file.
setLocale('ro')

const fixture = parseBeerXML(
  readFileSync(
    fileURLToPath(new URL('../fixtures/Grainfather_Rose_IPA.xml', import.meta.url)),
    'latin1',
  ),
).recipes[0]!

const hop = (name: string, amount: number, use: string, time: number, temperature: number | null = null): Hop => ({
  name,
  alpha: 12,
  amount,
  use,
  time,
  form: 'Pellet',
  temperature,
})

// A NEIPA-shaped bill: boil charges, a whirlpool, and TWO dry hop charges on
// different days — the case that used to collapse into one block.
const hopHeavy: Recipe = {
  ...fixture,
  name: 'NEIPA test',
  hops: [
    hop('Magnum', 0.02, 'Boil', 60),
    hop('Citra', 0.03, 'Boil', 10),
    hop('Nelson', 0.05, 'Hop Stand', 20, 85),
    hop('Galaxy', 0.06, 'Dry Hop', 4320),
    hop('Mosaic', 0.04, 'Dry Hop', 10080),
  ],
}

const props = {
  onReset: () => {},
  position: null,
  theme: 'dark' as const,
  onToggleTheme: () => {},
  view: 'condensed' as const,
  onToggleView: () => {},
}

const render = (recipe: Recipe, condensed: boolean) =>
  renderToStaticMarkup(
    createElement(condensed ? CondensedTicket : RecipeTicket, { ...props, recipe }),
  )

const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

it('condensed keeps every piece of recipe data', () => {
  const text = strip(render(fixture, true))

  for (const f of fixture.fermentables) expect(text).toContain(f.name)
  for (const h of fixture.hops) expect(text).toContain(h.name)
  for (const y of fixture.yeasts) expect(text).toContain(y.name)
  for (const m of fixture.miscs) expect(text).toContain(m.name)
  // Readings, mash, and the metadata line all survive.
  expect(text).toContain('1.036')
  expect(text).toContain('65 °C')
  expect(text).toContain('Tinseth')
  expect(text).toContain('Specialty IPA · 21B · BJCP')
})

it('condensed cannot scroll', () => {
  const html = render(fixture, true)
  expect(html).toContain('overflow-hidden')
  expect(html).not.toContain('overflow-auto')
  expect(html).not.toContain('overflow-x-auto')
  expect(html).not.toContain('overflow-y-auto')
})

const taps: Tap[] = [
  { id: 'a', recipe: { ...fixture, name: 'Rose IPA' }, addedAt: 0 },
  { id: 'b', recipe: { ...hopHeavy, name: 'NEIPA test' }, addedAt: 0 },
]

const renderBoard = (tapCount = 3) =>
  renderToStaticMarkup(
    createElement(TapBoard, {
      taps,
      tapCount,
      onTapCountChange: () => {},
      errors: [],
      onAdd: () => {},
      onRemove: () => {},
      onMove: () => {},
      onClear: () => {},
      theme: 'dark' as const,
      onToggleTheme: () => {},
    }),
  )

it('the tap board shows every beer and its headline stats', () => {
  const html = renderBoard()
  const text = strip(html)
  for (const t of taps) expect(text).toContain(t.recipe.name)
  // The fixture's headline figures land on the board.
  expect(text).toContain('4.1') // ABV
  expect(text).toContain('1.036→1.005') // OG → FG
  expect(text).toContain('ABV')
  expect(text).toContain('IBU')
})

it('the tap board educates: hops, yeast, and the exact SRM/EBC colour', () => {
  const text = strip(renderBoard())
  // Hop varieties, de-duplicated (fixture lists Cascade three times).
  expect(text).toContain('Hamei')
  expect(text).toContain('Cascade · El Dorado · Motueka')
  // Yeast strain.
  expect(text).toContain('Drojdie')
  expect(text).toContain('Lallemand (LalBrew) Wit Belgian')
  // Exact colour on both scales.
  expect(text).toContain('SRM 4.2 · EBC 8')
})

it('the tap board cannot scroll', () => {
  const html = renderBoard()
  expect(html).toContain('overflow-hidden')
  expect(html).not.toContain('overflow-auto')
  expect(html).not.toContain('overflow-y-auto')
})

it('splits the board into live taps and a ready queue', () => {
  const text = strip(renderBoard(1)) // 2 beers, 1 tap
  expect(text).toContain('La robinet')
  expect(text).toContain('Gata de pus la robinet')
  expect(text).not.toContain('Liber')
})

it('shows a free slot for every tap without a beer', () => {
  const text = strip(renderBoard(4)) // 2 beers, 4 taps
  expect(text).toContain('Liber')
  expect(text).not.toContain('Gata de pus la robinet')
})

it('two dry hop charges stay separate blocks in both views', () => {
  for (const condensed of [true, false]) {
    const text = strip(render(hopHeavy, condensed))
    expect(text).toContain('Galaxy')
    expect(text).toContain('Mosaic')
    // 3 days and 7 days must both be named, not just the first charge's timing.
    expect(text).toContain('3 zile')
    expect(text).toContain('7 zile')
    expect(text).toContain('85 °C')
  }
})

describe('other languages', () => {
  afterEach(() => setLocale('ro'))

  it.each([
    ['en', ['On tap', 'Up next', 'Hops', 'Yeast', '2 beers']],
    ['de', ['Am Hahn', 'Als Nächstes', 'Hopfen', 'Hefe', '2 Biere']],
    ['fr', ['À la pression', 'Prochainement', 'Houblons', 'Levure', '2 bières']],
  ] as const)('the tap board speaks %s', (locale, phrases) => {
    setLocale(locale)
    const text = strip(renderBoard(1))
    for (const phrase of phrases) expect(text).toContain(phrase)
    expect(text).not.toContain('La robinet')
  })

  it.each([
    ['en', ['3 days', '7 days', 'Dry Hop', 'Fermentables']],
    ['de', ['3 Tage', '7 Tage', 'Hopfenstopfen', 'Schüttung']],
    ['fr', ['3 jours', '7 jours', 'Houblonnage à cru', 'Fermentescibles']],
  ] as const)('the recipe ticket speaks %s, file values included', (locale, phrases) => {
    setLocale(locale)
    for (const condensed of [true, false]) {
      const text = strip(render(hopHeavy, condensed))
      for (const phrase of phrases) expect(text).toContain(phrase)
    }
  })
})
