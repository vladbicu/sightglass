import { t, term } from '../i18n'
import { formatDuration, formatNumber } from '../lib/format'
import type { MashStep } from '../lib/types'
import { Section } from './Section'

export function MashSection({ steps, mashName }: { steps: MashStep[]; mashName: string }) {
  if (steps.length === 0) return null

  const totalTime = steps.reduce((sum, s) => sum + (s.stepTime ?? 0), 0)

  return (
    <Section
      title={t().mash}
      // mashName is empty in Grainfather exports, so the total carries the header.
      aside={[mashName, formatDuration(totalTime)].filter(Boolean).join(' · ')}
    >
      <ol className="relative">
        {steps.map((step, i) => {
          const last = i === steps.length - 1
          // Many exporters set NAME to the same word as TYPE ("Temperature");
          // showing it twice would just be noise.
          const label = step.name && step.name !== step.type ? step.name : term(step.type)

          return (
            <li key={`${step.name}-${i}`} className="relative flex gap-6 pb-8 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="bg-copper border-oak-deep z-10 mt-2 h-4 w-4 shrink-0 rounded-full border-2" />
                {!last && <span className="bg-line-strong w-[2px] flex-1" />}
              </div>

              <div className="flex flex-1 flex-wrap items-baseline gap-x-8 gap-y-2 pb-2">
                <p className="num text-[2.25rem] leading-none font-medium">
                  {step.stepTemp !== null ? formatNumber(step.stepTemp) : '—'}
                  <span className="stat-unit">°C</span>
                </p>
                <p className="num text-cream-dim text-[1.5rem] leading-none">
                  {formatDuration(step.stepTime)}
                </p>
                {label && <p className="text-cream-faint text-[1.05rem]">{label}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
