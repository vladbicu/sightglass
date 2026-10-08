import type { Hop } from './types'

/**
 * Tinseth IBU from the boil additions, for formats that name the method but
 * never write the figure (Brewfather's BeerJSON export). Volume is the batch
 * size, so it lands a few IBU below apps that use the post-boil kettle volume.
 * Only boil and first-wort charges count; whirlpool and dry hops are ignored.
 */
export function tinsethIbu(hops: Hop[], og: number | null, volumeL: number | null): number | null {
  if (og === null || volumeL === null || volumeL <= 0) return null

  const bigness = 1.65 * 0.000125 ** (og - 1)
  let total = 0
  let counted = false

  for (const hop of hops) {
    const use = hop.use.toLowerCase()
    if (use !== 'boil' && use !== 'first wort') continue
    if (hop.alpha === null || hop.time === null) continue
    const utilisation = (bigness * (1 - Math.exp(-0.04 * hop.time))) / 4.15
    const alphaMg = (hop.alpha / 100) * hop.amount * 1_000_000
    total += (utilisation * alphaMg) / volumeL
    counted = true
  }

  return counted ? total : null
}
