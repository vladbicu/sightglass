import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { decodeRecipeBuffer, parseBeerXML } from './parseBeerXML'
import type { Recipe } from './types'

const fixture = readFileSync(
  fileURLToPath(new URL('../../fixtures/Grainfather_Rose_IPA.xml', import.meta.url)),
  'latin1',
)

function parseOne(xml: string): Recipe {
  const { recipes, errors } = parseBeerXML(xml)
  expect(errors).toEqual([])
  expect(recipes).toHaveLength(1)
  return recipes[0]!
}

describe('exportul real Grainfather', () => {
  const recipe = parseOne(fixture)

  it('citește identitatea rețetei', () => {
    expect(recipe.name).toBe('Rose IPA')
    expect(recipe.brewer).toBe('Vlad Bicu')
    expect(recipe.type).toBe('All Grain')
    expect(recipe.date).toBe('19 Jul 25')
  })

  it('cade pe variantele EST_* când lipsesc câmpurile standard', () => {
    expect(recipe.og).toBe(1.036)
    expect(recipe.fg).toBe(1.005)
    expect(recipe.abv).toBe(4.1)
    expect(recipe.color).toBeCloseTo(4.2019, 4)
  })

  it('citește IBU (tag standard, nu EST_), metoda și caloriile', () => {
    expect(recipe.ibu).toBe(18)
    expect(recipe.ibuMethod).toBe('Tinseth')
    expect(recipe.calories).toBe(117)
  })

  it('tratează BOIL_SIZE=0 ca absent, nu ca zero', () => {
    expect(recipe.boilSize).toBeNull()
    expect(recipe.batchSize).toBe(23)
    expect(recipe.boilTime).toBe(60)
    expect(recipe.efficiency).toBe(72)
  })

  it('tratează tagurile goale auto-închise ca string gol', () => {
    expect(recipe.notes).toBe('')
    expect(recipe.yeasts[0]!.type).toBe('')
    expect(recipe.yeasts[0]!.laboratory).toBe('')
    expect(recipe.yeasts[0]!.productId).toBe('')
  })

  it('compune codul de stil din CATEGORY_NUMBER + STYLE_LETTER', () => {
    expect(recipe.style).not.toBeNull()
    expect(recipe.style!.name).toBe('Specialty IPA')
    expect(recipe.style!.category).toBe('21B')
    expect(recipe.style!.guide).toBe('BJCP')
  })

  it('citește toate fermentabilele', () => {
    expect(recipe.fermentables).toHaveLength(6)
    expect(recipe.fermentables[0]!.name).toBe('Pilsner')
    expect(recipe.fermentables[0]!.amount).toBe(2.5)
    expect(recipe.fermentables[0]!.color).toBe(1.7)
    const total = recipe.fermentables.reduce((sum, f) => sum + f.amount, 0)
    expect(total).toBeCloseTo(4.06, 5)
  })

  it('separă hameiul pe categorii de USE și citește temperatura de hop stand', () => {
    expect(recipe.hops).toHaveLength(7)

    const boil = recipe.hops.filter((h) => h.use === 'Boil')
    const stand = recipe.hops.filter((h) => h.use === 'Hop Stand')
    const dry = recipe.hops.filter((h) => h.use === 'Dry Hop')
    expect(boil).toHaveLength(2)
    expect(stand).toHaveLength(2)
    expect(dry).toHaveLength(3)

    expect(stand.every((h) => h.temperature === 90)).toBe(true)
    expect(boil.every((h) => h.temperature === null)).toBe(true)
    expect(dry.every((h) => h.time === 4320)).toBe(true)
    expect(boil[0]!.alpha).toBe(5.5)
    expect(boil[0]!.form).toBe('Pellet')
  })

  it('citește drojdia inclusiv AMOUNT_IS_WEIGHT', () => {
    expect(recipe.yeasts).toHaveLength(1)
    const yeast = recipe.yeasts[0]!
    expect(yeast.name).toBe('Lallemand (LalBrew) Wit Belgian')
    expect(yeast.attenuation).toBe(80)
    expect(yeast.amount).toBe(2)
    expect(yeast.amountIsWeight).toBe(false)
    expect(yeast.form).toBe('Other')
  })

  it('citește miscs cu USE variat și preferă DISPLAY_AMOUNT', () => {
    expect(recipe.miscs).toHaveLength(3)
    const rose = recipe.miscs.find((m) => m.name === 'Rose petals')!
    expect(rose.use).toBe('Secondary')
    expect(rose.displayAmount).toBe('50 g')
    expect(rose.time).toBe(4320)
    expect(recipe.miscs.filter((m) => m.use === 'Boil')).toHaveLength(2)
  })

  it('citește plămădirea, chiar dacă MASH nu are NAME', () => {
    expect(recipe.mashSteps).toHaveLength(1)
    expect(recipe.mashSteps[0]!.stepTemp).toBe(65)
    expect(recipe.mashSteps[0]!.stepTime).toBe(75)
    expect(recipe.mashName).toBe('')
  })

  it('citește datele de fermentare', () => {
    expect(recipe.fermentation).toEqual({ stages: 1, primaryAge: 14, primaryTemp: 20 })
  })
})

describe('exportul real Brewfather', () => {
  const recipe = parseOne(
    readFileSync(
      fileURLToPath(
        new URL('../../fixtures/Brewfather_BeerXML_ElderflowerAle_20261008.xml', import.meta.url),
      ),
      'utf8',
    ),
  )

  it('decodează referințele numerice (&#32; &#40; &#45;)', () => {
    expect(recipe.name).toBe('Elderflower Ale')
    expect(recipe.type).toBe('All Grain')
    expect(recipe.brewer).toBe('Bicu Vlad')
    expect(recipe.fermentables.map((f) => f.name)).toEqual([
      'Pale Malt',
      'Caramunich III',
      'Carafa I',
    ])
    expect(recipe.miscs[0]!.name).toBe('Elderflower (umbels)')
    expect(recipe.yeasts[0]!.name).toBe('London English-Style ESB')
    expect(recipe.yeasts[0]!.laboratory).toBe('Lallemand (LalBrew)')
  })

  it('ignoră stilul-placeholder "Unknown"', () => {
    expect(recipe.style).toBeNull()
  })

  it('citește valorile cu unitate lipită ("9.1 SRM", "4.33 %")', () => {
    expect(recipe.color).toBe(9.1)
    expect(recipe.og).toBe(1.045)
    expect(recipe.fg).toBe(1.012)
    expect(recipe.abv).toBe(4.33)
    expect(recipe.ibu).toBe(53.8)
  })
})

describe('variante de structură', () => {
  const bare = `<?xml version="1.0"?>
    <RECIPE><NAME>Fără wrapper</NAME><BATCH_SIZE>20</BATCH_SIZE></RECIPE>`

  it('acceptă <RECIPE> fără wrapper <RECIPES>', () => {
    const recipe = parseOne(bare)
    expect(recipe.name).toBe('Fără wrapper')
    expect(recipe.batchSize).toBe(20)
  })

  it('acceptă mai multe rețete în același fișier', () => {
    const { recipes, errors } = parseBeerXML(`<?xml version="1.0"?>
      <RECIPES>
        <RECIPE><NAME>Prima</NAME></RECIPE>
        <RECIPE><NAME>A doua</NAME></RECIPE>
      </RECIPES>`)
    expect(errors).toEqual([])
    expect(recipes.map((r) => r.name)).toEqual(['Prima', 'A doua'])
  })

  it('păstrează rețetele valide și raportează doar pe cea coruptă', () => {
    const { recipes, errors } = parseBeerXML(`<?xml version="1.0"?>
      <RECIPES>
        <RECIPE><NAME>Bună</NAME></RECIPE>
        <RECIPE><BATCH_SIZE>20</BATCH_SIZE></RECIPE>
      </RECIPES>`)
    expect(recipes.map((r) => r.name)).toEqual(['Bună'])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('#2')
  })

  it('acceptă <n> ca alias pentru <NAME>', () => {
    const recipe = parseOne(`<?xml version="1.0"?>
      <RECIPES><RECIPE>
        <n>Nume scurt</n>
        <HOPS><HOP><n>Saaz</n><USE>Boil</USE></HOP></HOPS>
      </RECIPE></RECIPES>`)
    expect(recipe.name).toBe('Nume scurt')
    expect(recipe.hops[0]!.name).toBe('Saaz')
  })

  it('acceptă un singur copil într-o colecție', () => {
    const recipe = parseOne(`<?xml version="1.0"?>
      <RECIPE><NAME>Una</NAME>
        <FERMENTABLES><FERMENTABLE><NAME>Pilsner</NAME><AMOUNT>3</AMOUNT></FERMENTABLE></FERMENTABLES>
      </RECIPE>`)
    expect(recipe.fermentables).toHaveLength(1)
    expect(recipe.fermentables[0]!.name).toBe('Pilsner')
  })

  it('convertește culoarea declarată în EBC în SRM', () => {
    const recipe = parseOne('<RECIPE><NAME>Ebc</NAME><EST_COLOR>19.7 EBC</EST_COLOR></RECIPE>')
    expect(recipe.color).toBeCloseTo(10, 6)
  })

  it('calculează ABV din OG/FG când lipsește', () => {
    const recipe = parseOne(`<?xml version="1.0"?>
      <RECIPE><NAME>Fără ABV</NAME><OG>1.050</OG><FG>1.010</FG></RECIPE>`)
    expect(recipe.abv).toBeCloseTo(5.25, 2)
  })

  it('ignoră colecțiile goale auto-închise', () => {
    const recipe = parseOne(`<?xml version="1.0"?>
      <RECIPE><NAME>Goale</NAME><HOPS/><MISCS/><FERMENTABLES/></RECIPE>`)
    expect(recipe.hops).toEqual([])
    expect(recipe.miscs).toEqual([])
    expect(recipe.fermentables).toEqual([])
    expect(recipe.style).toBeNull()
    expect(recipe.fermentation).toBeNull()
  })
})

describe('erori', () => {
  it('respinge un fișier care nu e XML', () => {
    const { recipes, errors } = parseBeerXML('nu sunt xml, sunt doar text')
    expect(recipes).toEqual([])
    expect(errors).toHaveLength(1)
  })

  it('respinge XML valid fără rețete', () => {
    const { recipes, errors } = parseBeerXML('<?xml version="1.0"?><ALTCEVA><X>1</X></ALTCEVA>')
    expect(recipes).toEqual([])
    expect(errors[0]).toContain('RECIPE')
  })

  it('respinge un fișier gol', () => {
    expect(parseBeerXML('   ').errors).toHaveLength(1)
  })
})

describe('decodare', () => {
  function encodeLatin1(text: string): ArrayBuffer {
    const bytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i)
    return bytes.buffer
  }

  it('decodează diacritice după encoding-ul declarat în prolog', () => {
    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?><RECIPE><NAME>Bere Rosé</NAME></RECIPE>`
    const recipe = parseOne(decodeRecipeBuffer(encodeLatin1(xml)))
    expect(recipe.name).toBe('Bere Rosé')
  })

  it('decodează UTF-8 când prologul îl declară', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><RECIPE><NAME>Bere Rosé</NAME></RECIPE>`
    const buffer = new TextEncoder().encode(xml).buffer as ArrayBuffer
    expect(parseOne(decodeRecipeBuffer(buffer)).name).toBe('Bere Rosé')
  })

  it('cade pe UTF-8 când encoding-ul declarat e necunoscut', () => {
    const xml = `<?xml version="1.0" encoding="NU-EXISTA-8"?><RECIPE><NAME>Bere Rosé</NAME></RECIPE>`
    const buffer = new TextEncoder().encode(xml).buffer as ArrayBuffer
    expect(parseOne(decodeRecipeBuffer(buffer)).name).toBe('Bere Rosé')
  })
})
