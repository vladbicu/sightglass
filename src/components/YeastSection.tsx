import { t, term } from '../i18n'
import { formatMass, formatNumber } from '../lib/format'
import type { Yeast } from '../lib/types'
import { Section } from './Section'

/**
 * The spec says a non-weight AMOUNT is a volume in litres, but sources write
 * "2" meaning two sachets. Rather than print a unit that would be wrong either
 * way, a non-weight amount is shown bare against the yeast's form.
 */
function amountLabel(yeast: Yeast): string {
  if (yeast.amount === null) return ''
  if (yeast.amountIsWeight) return formatMass(yeast.amount)
  return yeast.form
    ? `${formatNumber(yeast.amount, 0)} × ${term(yeast.form)}`
    : formatNumber(yeast.amount, 0)
}

export function YeastSection({ yeasts }: { yeasts: Yeast[] }) {
  if (yeasts.length === 0) return null

  return (
    <Section title={t().yeast(yeasts.length)}>
      <div className="grid gap-4 lg:grid-cols-2">
        {yeasts.map((yeast, i) => {
          const meta = [yeast.laboratory, yeast.productId, term(yeast.type)]
            .filter(Boolean)
            .join(' · ')
          return (
            <div key={`${yeast.name}-${i}`} className="panel px-6 py-5">
              <p className="text-[1.25rem] leading-tight font-semibold">{yeast.name}</p>
              {meta && <p className="text-cream-faint mt-1 text-[0.95rem]">{meta}</p>}

              <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
                {amountLabel(yeast) && (
                  <div>
                    <p className="num text-[1.6rem] leading-none">{amountLabel(yeast)}</p>
                    <p className="stat-label mt-2">{t().amount}</p>
                  </div>
                )}
                {yeast.attenuation !== null && (
                  <div>
                    <p className="num text-copper-bright text-[1.6rem] leading-none">
                      {formatNumber(yeast.attenuation)}%
                    </p>
                    <p className="stat-label mt-2">{t().attenuation}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
