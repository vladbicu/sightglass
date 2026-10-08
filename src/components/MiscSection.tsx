import { t, term } from '../i18n'
import { formatDuration } from '../lib/format'
import { groupInOrder } from '../lib/group'
import type { Misc } from '../lib/types'
import { Section } from './Section'

export function MiscSection({ miscs }: { miscs: Misc[] }) {
  if (miscs.length === 0) return null

  // Grouped by USE because a boil addition and a secondary addition happen days
  // apart — listing them together would be misleading on brew day.
  const groups = groupInOrder(miscs, (misc) => misc.use)

  return (
    <Section title={t().additions}>
      <div className="space-y-8">
        {groups.map(([use, groupMiscs]) => (
          <div key={use}>
            <h3 className="eyebrow mb-3">{use ? term(use) : t().otherAdditions}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupMiscs.map((misc, i) => (
                <div key={`${misc.name}-${i}`} className="panel px-5 py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[1.15rem] font-semibold">{misc.name}</span>
                    <span className="num text-copper-bright text-[1.15rem]">
                      {misc.displayAmount}
                    </span>
                  </div>
                  <p className="text-cream-faint mt-1 text-[0.9rem]">
                    {[term(misc.type), formatDuration(misc.time)].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
