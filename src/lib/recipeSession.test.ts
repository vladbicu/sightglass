import { describe, expect, it } from 'vitest'
import { parseRecipeSession } from './recipeSession'

const recipe = (name: string) => ({ name })

describe('parseRecipeSession', () => {
  it('citește rețetele și poziția', () => {
    const raw = JSON.stringify({ recipes: [recipe('Unu'), recipe('Doi')], index: 1 })
    expect(parseRecipeSession(raw)).toEqual({ recipes: [recipe('Unu'), recipe('Doi')], index: 1 })
  })

  it('aduce înapoi o poziție în afara listei la prima rețetă', () => {
    const raw = JSON.stringify({ recipes: [recipe('Unu')], index: 5 })
    expect(parseRecipeSession(raw)?.index).toBe(0)
  })

  it.each([
    ['nimic', null],
    ['JSON stricat', '{"recipes": ['],
    ['o listă goală', JSON.stringify({ recipes: [], index: 0 })],
    ['o rețetă fără nume', JSON.stringify({ recipes: [{ og: 1.05 }], index: 0 })],
    ['altă formă', JSON.stringify([recipe('Unu')])],
  ])('tratează %s ca nicio rețetă deschisă', (_, raw) => {
    expect(parseRecipeSession(raw)).toBeNull()
  })
})
