import { useMemo } from 'react'
import { getLocale, t, term } from '../i18n'
import { formatDuration, formatMass, formatNumber } from '../lib/format'
import { groupInOrder } from '../lib/group'
import { hopSchedule, totalHopMass } from '../lib/hopSchedule'
import { fermentationLabel, readings, subtitle } from '../lib/recipeSummary'
import { srmToRgb } from '../lib/srm'
import type { Recipe } from '../lib/types'
import { useFitToScreen } from '../lib/useFitToScreen'
import type { Theme } from '../lib/useTheme'
import type { ViewMode } from '../lib/useViewMode'
import { AppSwitcher } from './AppSwitcher'
import { LanguageSelect } from './LanguageSelect'
import { Mark } from './Mark'
import { ThemeToggle } from './ThemeToggle'
import { ViewToggle } from './ViewToggle'

/** Each block avoids being split across columns by the multi-column layout. */
function Block({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <div className="border-line mb-2.5 flex items-baseline justify-between gap-3 border-b pb-1.5">
        <h2 className="eyebrow">{title}</h2>
        {aside && <span className="num text-cream-faint text-[0.8rem]">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Row({ name, meta, value }: { name: string; meta?: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-[3px]">
      <span className="min-w-0 truncate text-[1rem] leading-tight">
        {name}
        {meta && <span className="text-cream-faint ml-2 text-[0.85rem]">{meta}</span>}
      </span>
      <span className="num shrink-0 text-[1rem]">{value}</span>
    </li>
  )
}

interface CondensedTicketProps {
  recipe: Recipe
  onReset: () => void
  position: { index: number; total: number; onNext: () => void } | null
  theme: Theme
  onToggleTheme: () => void
  view: ViewMode
  onToggleView: () => void
}

/**
 * The whole recipe on one screen, for brew day on a cast television where
 * scrolling means walking back to the laptop.
 *
 * The body is a CSS multi-column container rather than a fixed grid: hop bills
 * are the part that varies (a NEIPA can carry a boil charge, a whirlpool and two
 * dry hop charges, where the grain bill rarely passes seven malts), and column
 * balancing absorbs that without any layout code. Whatever still overflows is
 * handled by scaling the whole thing down to fit.
 */
export function CondensedTicket({
  recipe,
  onReset,
  position,
  theme,
  onToggleTheme,
  view,
  onToggleView,
}: CondensedTicketProps) {
  const m = t()
  // The locale is part of the key: a language switch changes every label's width.
  const locale = getLocale()
  const fitKey = useMemo(() => ({ recipe, locale }), [recipe, locale])
  const { containerRef, contentRef, scale } = useFitToScreen(fitKey)

  const stats = readings(recipe)
  const fermentation = fermentationLabel(recipe)
  const { boil, rest } = hopSchedule(recipe.hops)
  const grainTotal = recipe.fermentables.reduce((sum, f) => sum + f.amount, 0)
  const miscGroups = groupInOrder(recipe.miscs, (misc) => misc.use)

  return (
    // No page scroll is possible here: the viewport is the frame.
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 px-6 pt-4 pb-2">
        <div className="mr-auto">
          <AppSwitcher current="recipe" compact />
        </div>
        {position && (
          <>
            <span className="num text-cream-faint text-[0.9rem]">
              {m.recipeOf(position.index + 1, position.total)}
            </span>
            <button
              type="button"
              onClick={position.onNext}
              className="border-line-strong text-cream cursor-pointer rounded border px-4 py-2 text-[0.9rem] font-medium"
            >
              {m.next}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onReset}
          className="border-line-strong text-cream-dim cursor-pointer rounded border px-4 py-2 text-[0.9rem] font-medium"
        >
          {m.loadAnother}
        </button>
        <ViewToggle view={view} onToggle={onToggleView} />
        <LanguageSelect />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 px-[10%] pb-5">
        <div
          ref={contentRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          className="mx-auto w-full max-w-[1600px]"
        >
          <header className="mb-5 flex items-stretch gap-4">
            <div
              className="w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: srmToRgb(recipe.color) }}
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-baseline gap-4">
                <h1 className="display-title text-[3.25rem] leading-none">{recipe.name}</h1>
                <span className="h-7 w-7 self-center opacity-70">
                  <Mark ink="var(--cream-faint)" fill="none" />
                </span>
              </div>
              {subtitle(recipe) && (
                <p className="text-copper-bright mt-1.5 text-[1.05rem]">{subtitle(recipe)}</p>
              )}
            </div>
          </header>

          <div className="border-line mb-6 flex flex-wrap items-end gap-x-9 gap-y-3 border-y py-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p
                  className={`num text-[2.4rem] leading-none font-medium ${
                    stat.accent ? 'text-copper-bright' : ''
                  }`}
                >
                  {stat.value}
                  {stat.unit && <span className="stat-unit">{stat.unit}</span>}
                </p>
                <p className="stat-label mt-1.5 text-[0.7rem]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="columns-3 gap-9">
            <Block title={m.fermentables} aside={formatMass(grainTotal)}>
              {grainTotal > 0 && (
                <div className="mb-3 flex h-3 w-full overflow-hidden rounded-sm">
                  {recipe.fermentables.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      style={{
                        width: `${(f.amount / grainTotal) * 100}%`,
                        backgroundColor: srmToRgb(f.color),
                      }}
                    />
                  ))}
                </div>
              )}
              <ul>
                {recipe.fermentables.map((f, i) => (
                  <Row
                    key={`${f.name}-${i}`}
                    name={f.name}
                    value={`${formatMass(f.amount)}  ·  ${formatNumber(
                      grainTotal > 0 ? (f.amount / grainTotal) * 100 : 0,
                    )}%`}
                  />
                ))}
              </ul>
            </Block>

            {(boil.length > 0 || rest.length > 0) && (
              <Block title={m.hops} aside={formatMass(totalHopMass(recipe.hops))}>
                {[...boil, ...rest].map((group) => (
                  <div key={group.key} className="mb-2.5 break-inside-avoid last:mb-0">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className={
                          group.mono
                            ? 'num text-copper-bright text-[1.05rem] font-medium'
                            : 'text-copper-bright text-[1.05rem] font-semibold'
                        }
                      >
                        {group.title}
                      </span>
                      {group.detail && (
                        <span className="num text-cream-faint text-[0.85rem]">{group.detail}</span>
                      )}
                    </div>
                    <ul className="mt-0.5 pl-3">
                      {group.hops.map((hop, i) => (
                        <Row key={`${hop.name}-${i}`} name={hop.name} value={formatMass(hop.amount)} />
                      ))}
                    </ul>
                  </div>
                ))}
              </Block>
            )}

            {recipe.mashSteps.length > 0 && (
              <Block
                title={m.mash}
                aside={formatDuration(recipe.mashSteps.reduce((s, m) => s + (m.stepTime ?? 0), 0))}
              >
                <ul>
                  {recipe.mashSteps.map((step, i) => (
                    <Row
                      key={`${step.name}-${i}`}
                      name={step.name && step.name !== step.type ? step.name : term(step.type)}
                      value={`${
                        step.stepTemp !== null ? `${formatNumber(step.stepTemp)} °C` : '—'
                      }  ·  ${formatDuration(step.stepTime)}`}
                    />
                  ))}
                </ul>
              </Block>
            )}

            {recipe.yeasts.length > 0 && (
              <Block title={m.yeast(recipe.yeasts.length)}>
                <ul>
                  {recipe.yeasts.map((yeast, i) => (
                    <Row
                      key={`${yeast.name}-${i}`}
                      name={yeast.name}
                      value={
                        yeast.attenuation !== null ? m.attenuationShort(formatNumber(yeast.attenuation)) : ''
                      }
                    />
                  ))}
                </ul>
              </Block>
            )}

            {miscGroups.length > 0 && (
              <Block title={m.additions}>
                {miscGroups.map(([use, groupMiscs]) => (
                  <div key={use} className="mb-2 break-inside-avoid last:mb-0">
                    <span className="text-copper-bright text-[1rem] font-semibold">
                      {use ? term(use) : m.otherAdditions}
                    </span>
                    <ul className="mt-0.5 pl-3">
                      {groupMiscs.map((misc, i) => (
                        <Row
                          key={`${misc.name}-${i}`}
                          name={misc.name}
                          meta={formatDuration(misc.time)}
                          value={misc.displayAmount}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </Block>
            )}

            {(recipe.ibuMethod || fermentation || recipe.brewer) && (
              <Block title={m.details}>
                <ul className="text-cream-dim text-[0.95rem]">
                  {recipe.brewer && <li className="py-[3px]">{recipe.brewer}</li>}
                  {recipe.date && <li className="num py-[3px]">{recipe.date}</li>}
                  {recipe.ibuMethod && <li className="py-[3px]">{m.ibuBy(recipe.ibuMethod)}</li>}
                  {fermentation && <li className="py-[3px]">{m.fermentationLine(fermentation)}</li>}
                </ul>
              </Block>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
