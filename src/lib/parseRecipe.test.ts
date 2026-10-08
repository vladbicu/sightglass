import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseRecipeFile } from './parseRecipe'
import type { Recipe } from './types'

function read(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../../fixtures/${name}`, import.meta.url)), 'utf8')
}

function parseOne(text: string): Recipe {
  const { recipes, errors } = parseRecipeFile(text)
  expect(errors).toEqual([])
  expect(recipes).toHaveLength(1)
  return recipes[0]!
}

const exports = {
  BeerXML: read('Brewfather_BeerXML_ElderflowerAle_20261008.xml'),
  BeerJSON: read('Brewfather_BeerJSON_ElderflowerAle_20261008.json'),
  'Brewfather JSON': read('Brewfather_RECIPE_ElderflowerAle_20261008.json'),
}

describe.each(Object.entries(exports))('Elderflower Ale exportat ca %s', (_, text) => {
  const recipe = parseOne(text)

  it('citește identitatea și cifrele principale', () => {
    expect(recipe.name).toBe('Elderflower Ale')
    expect(recipe.type).toBe('All Grain')
    expect(recipe.brewer).toBe('Bicu Vlad')
    expect(recipe.og).toBeCloseTo(1.045, 3)
    expect(recipe.fg).toBeCloseTo(1.012, 3)
    expect(recipe.abv).toBeCloseTo(4.33, 2)
    expect(recipe.color).toBeCloseTo(9.1, 5)
    expect(recipe.batchSize).toBe(23)
    expect(recipe.boilSize).toBe(28)
    expect(recipe.boilTime).toBe(60)
    expect(recipe.efficiency).toBe(72)
  })

  it('citește fermentabilele în kg, cu culoarea în SRM', () => {
    expect(recipe.fermentables.map((f) => [f.name, f.amount, f.color])).toEqual([
      ['Pale Malt', 4.3, 3.3],
      ['Caramunich III', 0.185, 71],
      ['Carafa I', 0.04, 320],
    ])
  })

  it('citește hameiul în kg, la fiert, cu timpii în minute', () => {
    expect(recipe.hops.map((h) => [h.name, h.use, h.time, h.alpha])).toEqual([
      ['Challenger', 'Boil', 60, 7.5],
      ['Fuggle', 'Boil', 10, 4.75],
      ['Challenger', 'Boil', 0, 7.5],
    ])
    expect(recipe.hops.map((h) => h.amount * 1000)).toEqual([
      expect.closeTo(56, 6),
      expect.closeTo(28, 6),
      expect.closeTo(17, 6),
    ])
  })

  it('citește adaosul, drojdia și plămădirea', () => {
    expect(recipe.miscs).toHaveLength(1)
    expect(recipe.miscs[0]).toMatchObject({
      name: 'Elderflower (umbels)',
      use: 'Boil',
      time: 15,
      displayAmount: '25 g',
    })
    expect(recipe.yeasts).toHaveLength(1)
    expect(recipe.yeasts[0]).toMatchObject({
      name: 'London English-Style ESB',
      laboratory: 'Lallemand (LalBrew)',
      attenuation: 72,
      amount: 1,
      amountIsWeight: false,
    })
    expect(recipe.mashSteps).toHaveLength(1)
    expect(recipe.mashSteps[0]).toMatchObject({ stepTemp: 65, stepTime: 60 })
    expect(recipe.mashName).toBe('High fermentability')
  })

  it('citește fermentarea', () => {
    expect(recipe.fermentation).toEqual({ stages: 2, primaryAge: 7, primaryTemp: 21 })
  })
})

describe('IBU', () => {
  it('ia IBU din export când există', () => {
    expect(parseOne(exports.BeerXML).ibu).toBe(53.8)
    expect(parseOne(exports['Brewfather JSON']).ibu).toBe(53.8)
  })

  it('estimează IBU după Tinseth pentru BeerJSON, care scrie doar metoda', () => {
    const recipe = parseOne(exports.BeerJSON)
    expect(recipe.ibuMethod).toBe('Tinseth')
    expect(recipe.ibu).toBeCloseTo(49.2, 0)
  })
})

describe('Brewfather JSON', () => {
  const recipe = (fields: object) =>
    parseOne(JSON.stringify({ _type: 'recipe', name: 'X', fermentables: [], hops: [], ...fields }))

  it('trece în minute timpii dați în zile (dry hop, secundar)', () => {
    const r = recipe({
      hops: [{ name: 'Citra', use: 'Dry Hop', time: 3, amount: 50, alpha: 12 }],
      miscs: [{ name: 'Coji', use: 'Secondary', time: 2, amount: 10, unit: 'g' }],
    })
    expect(r.hops[0]!.time).toBe(4320)
    expect(r.miscs[0]!.time).toBe(2880)
  })

  it('acceptă un array de rețete și un export de batch', () => {
    const { recipes } = parseRecipeFile(
      JSON.stringify([
        { _type: 'recipe', name: 'Unu', fermentables: [], hops: [] },
        { _type: 'batch', recipe: { name: 'Doi', fermentables: [], hops: [] } },
      ]),
    )
    expect(recipes.map((r) => r.name)).toEqual(['Unu', 'Doi'])
  })
})

describe('BeerJSON', () => {
  it('convertește unitățile imperiale și EBC', () => {
    const r = parseOne(
      JSON.stringify({
        beerjson: {
          version: 2.06,
          recipes: [
            {
              name: 'Imperial',
              batch_size: { unit: 'gal', value: 5 },
              color_estimate: { unit: 'EBC', value: 19.7 },
              ingredients: {
                hop_additions: [
                  {
                    name: 'Cascade',
                    amount: { unit: 'oz', value: 1 },
                    timing: { use: 'add_to_fermentation', duration: { unit: 'day', value: 4 } },
                  },
                ],
              },
              mash: { mash_steps: [{ step_temperature: { unit: 'F', value: 152 } }] },
            },
          ],
        },
      }),
    )
    expect(r.batchSize).toBeCloseTo(18.93, 2)
    expect(r.color).toBeCloseTo(10, 6)
    expect(r.hops[0]).toMatchObject({ use: 'Dry Hop', time: 5760 })
    expect(r.hops[0]!.amount).toBeCloseTo(0.02835, 5)
    expect(r.mashSteps[0]!.stepTemp).toBeCloseTo(66.67, 2)
  })
})

describe('detectare și erori', () => {
  it('trimite XML-ul la parserul BeerXML', () => {
    expect(parseOne('<RECIPE><NAME>Xml</NAME></RECIPE>').name).toBe('Xml')
  })

  it('respinge JSON invalid', () => {
    const { recipes, errors } = parseRecipeFile('{ nu e json')
    expect(recipes).toEqual([])
    expect(errors[0]).toMatch(/JSON valid/)
  })

  it('respinge JSON care nu e rețetă', () => {
    const { recipes, errors } = parseRecipeFile('{"foo": 1}')
    expect(recipes).toEqual([])
    expect(errors).toHaveLength(1)
  })
})
