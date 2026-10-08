import { afterEach, describe, expect, it } from 'vitest'
import { formatDuration } from '../lib/format'
import { setLocale, t, term } from '.'

afterEach(() => setLocale('en'))

describe('plurale', () => {
  it('româna pune „de” de la 20 în sus', () => {
    setLocale('ro')
    expect(t().days(1)).toBe('1 zi')
    expect(t().days(3)).toBe('3 zile')
    expect(t().days(19)).toBe('19 zile')
    expect(t().days(20)).toBe('20 de zile')
    expect(t().days(101)).toBe('101 zile')
    expect(t().days(120)).toBe('120 de zile')
    expect(t().beers(21)).toBe('21 de beri')
  })

  it('franceza păstrează singularul sub 2', () => {
    setLocale('fr')
    expect(t().days(1.5)).toBe('1.5 jour')
    expect(t().days(2)).toBe('2 jours')
  })

  it('formatDuration urmează limba curentă', () => {
    setLocale('de')
    expect(formatDuration(4320)).toBe('3 Tage')
    expect(formatDuration(60)).toBe('60 min')
  })
})

describe('valorile din fișier', () => {
  it('se traduc doar când sunt cunoscute, indiferent de majuscule', () => {
    setLocale('de')
    expect(term('Dry Hop')).toBe('Hopfenstopfen')
    expect(term('dry hop')).toBe('Hopfenstopfen')
    expect(term('Mystery Use')).toBe('Mystery Use')
  })

  it('rămân cum sunt scrise în engleză', () => {
    setLocale('en')
    expect(term('Dry Hop')).toBe('Dry Hop')
  })
})
