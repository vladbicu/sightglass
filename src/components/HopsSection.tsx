import { t, term } from '../i18n'
import { formatDuration, formatMass, formatNumber } from '../lib/format'
import { hopSchedule, totalHopMass } from '../lib/hopSchedule'
import type { Hop } from '../lib/types'
import { Section } from './Section'

function hopMeta(hop: Hop): string {
  return [
    term(hop.form),
    hop.alpha !== null ? `${formatNumber(hop.alpha)}% AA` : '',
    // Only worth naming when it differs from the group it sits in.
    hop.use.toLowerCase() === 'first wort' ? term(hop.use) : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

interface HopGroupProps {
  title: string
  /** Timing or temperature shared by the whole group. */
  detail?: string
  /** Boil groups are titled by a duration, so they get the figure treatment. */
  mono?: boolean
  hops: Hop[]
}

/**
 * One block per moment of addition. Every hop that goes in at the same time
 * lives in the same block, which is what makes this immune to the collisions
 * the old horizontal timeline had when two additions shared a minute.
 */
function HopGroup({ title, detail, mono, hops }: HopGroupProps) {
  return (
    <div className="panel flex flex-col px-6 py-5">
      <div className="border-line flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-4">
        <span
          className={
            mono
              ? 'num text-copper-bright text-[1.75rem] leading-none'
              : 'text-[1.35rem] leading-none font-semibold'
          }
        >
          {title}
        </span>
        {detail && <span className="num text-cream-faint text-[0.95rem]">{detail}</span>}
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {hops.map((hop, i) => {
          const meta = hopMeta(hop)
          return (
            <li key={`${hop.name}-${i}`} className="flex items-baseline justify-between gap-5">
              <span className="min-w-0">
                <span className="block text-[1.15rem] leading-tight font-semibold">{hop.name}</span>
                {meta && <span className="text-cream-faint block text-[0.9rem]">{meta}</span>}
              </span>
              <span className="num shrink-0 text-[1.2rem]">{formatMass(hop.amount)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function HopsSection({ hops, boilTime }: { hops: Hop[]; boilTime: number | null }) {
  if (hops.length === 0) return null

  const { boil: boilGroups, rest: restGroups } = hopSchedule(hops)
  const m = t()

  return (
    <Section title={m.hops} aside={m.total(formatMass(totalHopMass(hops)))}>
      {boilGroups.length > 0 && (
        <div className="mb-9">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="eyebrow">{m.boil}</h3>
            {boilTime !== null && boilTime > 0 && (
              <span className="num text-cream-faint text-[0.95rem]">
                {m.total(formatDuration(boilTime))}
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boilGroups.map((group) => (
              <HopGroup key={group.key} title={group.title} mono hops={group.hops} />
            ))}
          </div>
        </div>
      )}

      {restGroups.length > 0 && (
        <div>
          <h3 className="eyebrow mb-3">{m.afterBoil}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restGroups.map((group) => (
              <HopGroup
                key={group.key}
                title={group.title}
                detail={group.detail}
                hops={group.hops}
              />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
