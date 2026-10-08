import { t } from '../i18n'

/** Drops trailing zeros so 2.50 reads "2.5" but 4.06 stays "4.06". */
function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

/**
 * BeerXML stores every mass in kg, which makes hop and misc additions read as
 * "0.015 kg". Anything under a kilo is shown in grams instead.
 */
export function formatMass(kg: number | null): string {
  if (kg === null || !Number.isFinite(kg)) return ''
  if (kg === 0) return '0 g'
  if (kg < 1) return `${trimZeros((kg * 1000).toFixed(1))} g`
  return `${trimZeros(kg.toFixed(2))} kg`
}

/**
 * Dry hops and secondary additions carry TIME in minutes (4320 = 3 days), which
 * is unreadable at a distance. Anything a day or longer is shown in days.
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return ''
  if (minutes >= 1440) return t().days(minutes / 1440)
  return `${trimZeros(minutes.toFixed(0))} min`
}

export function formatGravity(g: number | null): string {
  return g === null || !Number.isFinite(g) ? '' : g.toFixed(3)
}

export function formatNumber(n: number | null, decimals = 1): string {
  return n === null || !Number.isFinite(n) ? '' : trimZeros(n.toFixed(decimals))
}
