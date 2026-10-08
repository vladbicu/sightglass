import { t, term } from '../i18n'
import { formatMass, formatNumber } from '../lib/format'
import { srmToRgb } from '../lib/srm'
import type { Fermentable } from '../lib/types'
import { Section } from './Section'

export function FermentablesSection({ fermentables }: { fermentables: Fermentable[] }) {
  if (fermentables.length === 0) return null
  const m = t()

  const total = fermentables.reduce((sum, f) => sum + f.amount, 0)
  const share = (f: Fermentable) => (total > 0 ? (f.amount / total) * 100 : 0)

  return (
    <Section title={m.fermentables} aside={m.total(formatMass(total))}>
      {total > 0 && (
        <div className="mb-7 flex h-7 w-full overflow-hidden rounded-sm">
          {fermentables.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{ width: `${share(f)}%`, backgroundColor: srmToRgb(f.color) }}
              title={`${f.name} — ${formatNumber(share(f))}%`}
            />
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table min-w-[560px]">
          <thead>
            <tr>
              <th>{m.colFermentable}</th>
              <th>{m.colType}</th>
              <th className="text-right">{m.colColor}</th>
              <th className="text-right">{m.colAmount}</th>
              <th className="w-[6rem] text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {fermentables.map((f, i) => (
              <tr key={`${f.name}-${i}`}>
                <td className="font-medium">
                  <span className="flex items-center gap-3">
                    <span
                      className="inline-block h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: srmToRgb(f.color) }}
                    />
                    {f.name}
                  </span>
                </td>
                <td className="text-cream-dim">{term(f.type)}</td>
                <td className="num text-cream-dim text-right">
                  {f.color !== null ? `${formatNumber(f.color)} °L` : '—'}
                </td>
                <td className="num text-right">{formatMass(f.amount)}</td>
                <td className="num text-copper-bright text-right font-medium">
                  {formatNumber(share(f))}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
