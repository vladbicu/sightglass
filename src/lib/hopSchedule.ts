import { t, term } from '../i18n'
import { formatDuration, formatNumber } from './format'
import { groupInOrder } from './group'
import type { Hop } from './types'

/** Additions that happen during the boil, grouped by the minute they go in. */
const BOIL_USES = new Set(['boil', 'first wort'])

export interface HopGroupData {
  key: string
  /** "60 min" for boil charges, the USE ("Dry Hop") for everything else. */
  title: string
  /** Temperature and/or timing shared by the whole group. */
  detail: string
  /** Boil groups are titled by a duration, so they get the figure treatment. */
  mono: boolean
  hops: Hop[]
}

/**
 * Splits a hop bill into the blocks both views render.
 *
 * Non-boil additions are keyed by USE *and* time, not USE alone: a recipe can
 * carry two dry hop charges on different days, and grouping by USE alone would
 * merge them under whichever timing happened to come first, silently losing the
 * second.
 */
export function hopSchedule(hops: Hop[]): { boil: HopGroupData[]; rest: HopGroupData[] } {
  const inBoil = hops.filter((h) => BOIL_USES.has(h.use.toLowerCase()))
  const rest = hops.filter((h) => !BOIL_USES.has(h.use.toLowerCase()))

  // Boil additions read as a countdown: the longest charge first, flameout
  // last. Anything without a time sorts to the end rather than jumping ahead.
  const boil = groupInOrder(inBoil, (h) => String(h.time ?? 0))
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([time, groupHops]) => ({
      key: `boil-${time}`,
      title: formatDuration(Number(time)),
      detail: '',
      mono: true,
      hops: groupHops,
    }))

  const restGroups = groupInOrder(rest, (h) => `${h.use}|${h.time ?? ''}`).map(
    ([key, groupHops]) => {
      const first = groupHops[0]!
      // A hop stand shares one temperature across the group.
      const temp = groupHops.find((h) => h.temperature !== null)?.temperature ?? null
      return {
        key: `rest-${key}`,
        title: first.use ? term(first.use) : t().otherAdditions,
        detail: [temp !== null ? `${formatNumber(temp)} °C` : '', formatDuration(first.time)]
          .filter(Boolean)
          .join(' · '),
        mono: false,
        hops: groupHops,
      }
    },
  )

  return { boil, rest: restGroups }
}

export function totalHopMass(hops: Hop[]): number {
  return hops.reduce((sum, h) => sum + h.amount, 0)
}
